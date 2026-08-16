"""What the public hiring-signals feed is allowed to contain.

`build_signals.py` publishes firm names to a page anyone can read, so the three
rules in its docstring are not style preferences — breaking one either
republishes a firm that asked to be removed or gives away the tier the sheet
deliberately withholds. Each rule gets a test that fails if the SQL stops
enforcing it.

Run: python3 -m pytest scripts/test_build_signals.py
"""
import json
import sqlite3
import sys
from datetime import date, timedelta
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
import build_signals  # noqa: E402

TODAY = date.today()
RECENT = (TODAY - timedelta(days=3)).isoformat()
STALE = (TODAY - timedelta(days=400)).isoformat()

SCHEMA = """
CREATE TABLE firms (
  company_number TEXT PRIMARY KEY, name TEXT, sectors TEXT, city TEXT,
  website TEXT, careers_url TEXT, score INTEGER, postcode TEXT,
  careers_page_hash TEXT
);
CREATE TABLE signals (
  signal_id INTEGER PRIMARY KEY AUTOINCREMENT, company_number TEXT,
  signal_type TEXT, observed_at TEXT
);
CREATE TABLE suppressions (company_number TEXT PRIMARY KEY);
"""


def add_firm(con, number, *, name="Example Capital Ltd", score=5,
             careers_url="https://example.com/careers", postcode="EC1A 1AA",
             hashed=True, observed_at=RECENT, signal_type="careers_page_changed"):
    con.execute(
        "INSERT INTO firms (company_number, name, sectors, city, website, "
        "careers_url, score, postcode, careers_page_hash) "
        "VALUES (?,?,?,?,?,?,?,?,?)",
        (number, name, "M&A / advisory", "London", "https://example.com",
         careers_url, score, postcode, "abc123" if hashed else None))
    if observed_at is not None:
        con.execute("INSERT INTO signals (company_number, signal_type, observed_at) "
                    "VALUES (?,?,?)", (number, signal_type, observed_at))


@pytest.fixture
def db(tmp_path, monkeypatch):
    """A scout.db stand-in, wired into the module under test."""
    path = tmp_path / "scout.db"
    con = sqlite3.connect(path)
    con.executescript(SCHEMA)
    monkeypatch.setattr(build_signals, "SCOUT_DB", path)
    monkeypatch.setattr(build_signals, "SIGNALS_FILE", tmp_path / "signals.json")
    yield con
    con.close()


def published_names(max_score=6, window_days=90, limit=60):
    return [c["name"] for c in
            build_signals.fetch_changes(window_days, max_score, limit)]


def test_a_suppressed_firm_never_reaches_the_feed(db):
    """The rule the whole removal route depends on.

    A firm that asked to be removed must not reappear because a new public
    surface was built. This is the test that would have caught C-5's promise
    being quietly broken by a later feature.
    """
    add_firm(db, "111", name="Stays Listed Ltd")
    add_firm(db, "222", name="Asked To Be Removed Ltd")
    db.execute("INSERT INTO suppressions (company_number) VALUES ('222')")
    db.commit()

    assert published_names() == ["Stays Listed"]


def test_firms_above_the_free_tier_cap_are_withheld_but_counted(db):
    """The score cap, and the honesty of saying it was applied."""
    add_firm(db, "111", name="Free Tier Ltd", score=6)
    add_firm(db, "222", name="Held Back Ltd", score=8)
    db.commit()

    assert published_names(max_score=6) == ["Free Tier"]
    counts = build_signals.fetch_counts(90, 6)
    assert counts["changedCount"] == 2
    assert counts["publishableCount"] == 1
    # The page prints this number. If it silently read 0, the shorter list
    # would look like the whole truth.
    assert counts["withheldCount"] == 1


def test_matching_the_sheets_cap_would_empty_this_page(db):
    """Why this feed's cap is 6 while the public sheet's is 3.

    The sheet dropped to 0-3 on 15 Aug 2026 to reserve a paid tier, and the
    obvious tidy-up is to make this feed agree. It must not: a
    careers_page_changed signal is worth +3 points in score(), so a firm
    cannot both have one and score below 4. Capping here at 3 publishes
    nothing, for ever — an empty page rather than a smaller one.

    If this test starts failing because scoring changed, re-derive the right
    cap from the real distribution before touching the workflow.
    """
    add_firm(db, "111", name="Signal Firm Ltd", score=5)
    add_firm(db, "222", name="Other Signal Firm Ltd", score=8)
    db.commit()

    assert published_names(max_score=6) == ["Signal Firm"]
    assert published_names(max_score=3) == []

    counts = build_signals.fetch_counts(90, 3)
    assert counts["changedCount"] == 2
    assert counts["publishableCount"] == 0
    assert counts["withheldCount"] == 2


def test_a_firm_with_no_careers_page_is_not_listed(db):
    """True by construction today — the signal comes from hashing that page —
    but the feed links to the URL, so a row without one would render a link to
    nowhere if a future signal type arrives without it."""
    add_firm(db, "111", name="Has A Careers Page Ltd")
    add_firm(db, "222", name="No Careers Page Ltd", careers_url="")
    add_firm(db, "333", name="Null Careers Page Ltd", careers_url=None)
    db.commit()

    assert published_names() == ["Has A Careers Page"]


def test_signals_outside_the_window_are_excluded(db):
    add_firm(db, "111", name="Changed Recently Ltd", observed_at=RECENT)
    add_firm(db, "222", name="Changed Long Ago Ltd", observed_at=STALE)
    db.commit()

    assert published_names(window_days=90) == ["Changed Recently"]
    # ...and the window is a real parameter, not a hardcoded 90.
    assert sorted(published_names(window_days=500)) == [
        "Changed Long Ago", "Changed Recently"]


def test_only_careers_page_changes_are_published(db):
    """The feed names one signal type. A future type must be opted in, not
    swept in — its evidence may not be publishable on the same terms."""
    add_firm(db, "111", name="Careers Page Ltd", signal_type="careers_page_changed")
    add_firm(db, "222", name="Some Other Signal Ltd", signal_type="hypothetical_future")
    db.commit()

    assert published_names() == ["Careers Page"]


def test_a_firm_that_changed_twice_appears_once_with_its_latest_date(db):
    add_firm(db, "111", name="Changed Twice Ltd", observed_at=STALE)
    db.execute("INSERT INTO signals (company_number, signal_type, observed_at) "
               "VALUES ('111','careers_page_changed',?)", (RECENT,))
    db.commit()

    changes = build_signals.fetch_changes(500, 6, 60)
    assert len(changes) == 1
    assert changes[0]["observedAt"] == RECENT


def test_the_watch_list_counts_hashed_pages_and_ignores_suppressed_ones(db):
    """`watchedCount` is the headline number on the page, so it has to mean
    what it says: pages actually being re-checked, minus anyone who left."""
    add_firm(db, "111", hashed=True)
    add_firm(db, "222", hashed=True)
    add_firm(db, "333", hashed=False)
    add_firm(db, "444", hashed=True)
    db.execute("INSERT INTO suppressions (company_number) VALUES ('444')")
    db.commit()

    assert build_signals.fetch_counts(90, 6)["watchedCount"] == 2


def test_the_limit_keeps_the_feed_a_sample_not_the_database(db):
    for i in range(10):
        add_firm(db, str(i), name=f"Firm {i} Ltd")
    db.commit()

    assert len(build_signals.fetch_changes(90, 6, 4)) == 4


def test_the_written_file_carries_no_firm_above_the_cap(db, monkeypatch):
    """End-to-end through main(), which is what CI actually runs."""
    add_firm(db, "111", name="Free Tier Ltd", score=4)
    add_firm(db, "222", name="Held Back Ltd", score=9)
    db.commit()
    monkeypatch.setattr(sys, "argv", ["build_signals.py"])

    build_signals.main()

    payload = json.loads(build_signals.SIGNALS_FILE.read_text())
    assert [c["name"] for c in payload["changes"]] == ["Free Tier"]
    assert payload["withheldCount"] == 1
    assert all(c["score"] <= payload["maxScore"] for c in payload["changes"])


def test_an_empty_result_does_not_blank_a_populated_file(db, monkeypatch):
    """The 16 Aug 2026 near-miss: CI's own database has no signal history, so
    the nightly wrote a zero-row signals.json over one holding 49 and reported
    success. The page survived only because the deploy step happened to crash.
    """
    build_signals.SIGNALS_FILE.write_text(json.dumps({
        "changes": [{"name": "Already Published Ltd", "score": 5}],
        "publishableCount": 1,
    }) + "\n")
    # No firms added: the database is empty, so there is nothing to publish.
    monkeypatch.setattr(sys, "argv", ["build_signals.py"])

    build_signals.main()

    payload = json.loads(build_signals.SIGNALS_FILE.read_text())
    assert [c["name"] for c in payload["changes"]] == ["Already Published Ltd"]


def test_an_empty_result_still_writes_when_there_is_nothing_to_protect(db, monkeypatch):
    """The guard must not become a reason the file never appears at all."""
    assert not build_signals.SIGNALS_FILE.exists()
    monkeypatch.setattr(sys, "argv", ["build_signals.py"])

    build_signals.main()

    payload = json.loads(build_signals.SIGNALS_FILE.read_text())
    assert payload["changes"] == []


def test_the_guard_refuses_to_write_a_file_that_breaks_the_cap(db, monkeypatch):
    """The assertion in main() is the last line of defence if the SQL is
    edited badly. Simulate exactly that: a fetch that returns an over-cap firm.
    """
    add_firm(db, "111", name="Should Not Ship Ltd", score=9)
    db.commit()
    monkeypatch.setattr(build_signals, "fetch_changes",
                        lambda *_: [{"name": "Should Not Ship", "score": 9}])
    monkeypatch.setattr(sys, "argv", ["build_signals.py"])

    with pytest.raises(SystemExit) as excinfo:
        build_signals.main()
    assert "REFUSING to write" in str(excinfo.value)
    assert not build_signals.SIGNALS_FILE.exists()


def test_module_defaults_match_the_public_sheet():
    """The sheet publishes score 0-6. If these drift apart, one surface gives
    away what the other withholds — and nothing else would notice.

    Deliberately takes no `db` fixture and reloads nothing: this asserts the
    shipped constant, and a reload here would reset the paths the other tests
    monkeypatch.
    """
    assert build_signals.MAX_SCORE == 6
    assert build_signals.SIGNAL_TYPE == "careers_page_changed"


# --------------------------------------------------------------------------
# The feed accumulates. A careers page that changed on 7 August changed on 7
# August permanently, but signals.json was rebuilt from scratch every night —
# so whichever database happened to run decided the whole of published
# history. CI has its own scout.db with no signal history at all, which is how
# a nightly came to write an empty feed over a populated one.

def published(**over):
    base = {"companyNumber": "111", "name": "Historic Ltd", "city": "London",
            "region": "London", "sectors": ["M&A / advisory"], "score": 5,
            "careersUrl": "https://historic.example/careers",
            "observedAt": RECENT}
    base.update(over)
    return base


def test_history_survives_a_database_that_never_saw_it(db):
    """The 16 Aug failure, as a test. A database with no signals of its own
    must not erase what has already been published."""
    build_signals.SIGNALS_FILE.write_text(json.dumps(
        {"changes": [published()]}) + "\n")

    merged = build_signals.merge_changes(
        current=[], window_days=90, max_score=6, suppressed=set(), limit=60)

    assert [c["name"] for c in merged] == ["Historic Ltd"]


def test_the_current_database_wins_where_both_know_a_firm(db):
    """Not a blind union: if the live database has a fresher observation for a
    firm, that is the truth, and the stale published copy must not shadow it.
    """
    build_signals.SIGNALS_FILE.write_text(json.dumps(
        {"changes": [published(observedAt="2026-01-01", score=5)]}) + "\n")
    current = [published(observedAt=RECENT, score=6, name="Historic Ltd")]

    merged = build_signals.merge_changes(
        current=current, window_days=90, max_score=6, suppressed=set(), limit=60)

    assert len(merged) == 1
    assert merged[0]["observedAt"] == RECENT
    assert merged[0]["score"] == 6


def test_published_history_ages_out_of_the_window(db):
    """It is a 90-day feed. Accumulating must not quietly turn it into an
    all-time archive that only ever grows."""
    build_signals.SIGNALS_FILE.write_text(json.dumps(
        {"changes": [published(observedAt=STALE)]}) + "\n")

    merged = build_signals.merge_changes(
        current=[], window_days=90, max_score=6, suppressed=set(), limit=60)

    assert merged == []


def test_a_suppression_reaches_back_into_published_history(db):
    """C-5's promise has to apply to entries this database has never seen.
    Republishing a firm that asked to be removed, because the removal came
    after it was published, is precisely the failure the removal route exists
    to prevent.
    """
    build_signals.SIGNALS_FILE.write_text(json.dumps(
        {"changes": [published(companyNumber="111"),
                     published(companyNumber="222", name="Stays Ltd")]}) + "\n")

    merged = build_signals.merge_changes(
        current=[], window_days=90, max_score=6, suppressed={"111"}, limit=60)

    assert [c["name"] for c in merged] == ["Stays Ltd"]


def test_the_cap_reaches_back_into_published_history_too(db):
    """Lowering the cap must retire already-published firms above it, or the
    holdback only applies to firms discovered after the change."""
    build_signals.SIGNALS_FILE.write_text(json.dumps(
        {"changes": [published(score=6, name="Now Above Cap Ltd")]}) + "\n")

    merged = build_signals.merge_changes(
        current=[], window_days=90, max_score=5, suppressed=set(), limit=60)

    assert merged == []


def test_an_entry_with_no_company_number_is_dropped_not_trusted(db):
    """Entries published before company numbers were stored cannot be checked
    against the suppression list. Unverifiable is not the same as allowed —
    the only safe reading is to drop it.
    """
    legacy = published()
    del legacy["companyNumber"]
    build_signals.SIGNALS_FILE.write_text(json.dumps({"changes": [legacy]}) + "\n")

    merged = build_signals.merge_changes(
        current=[], window_days=90, max_score=6, suppressed=set(), limit=60)

    assert merged == []


def test_the_merged_feed_is_still_bounded_by_the_limit(db):
    build_signals.SIGNALS_FILE.write_text(json.dumps(
        {"changes": [published(companyNumber=str(i), name=f"Firm {i} Ltd")
                     for i in range(10)]}) + "\n")

    merged = build_signals.merge_changes(
        current=[], window_days=90, max_score=6, suppressed=set(), limit=4)

    assert len(merged) == 4


def test_the_written_file_carries_company_numbers(db, monkeypatch):
    """Without these the next merge cannot check suppression, so the feed
    would start dropping its own history."""
    add_firm(db, "111")
    db.commit()
    monkeypatch.setattr(sys, "argv", ["build_signals.py"])

    build_signals.main()

    payload = json.loads(build_signals.SIGNALS_FILE.read_text())
    assert payload["changes"][0]["companyNumber"] == "111"


def test_main_republishes_history_when_the_database_is_empty(db, monkeypatch):
    """End to end through main(), which is what CI runs: an empty database
    plus a populated file must produce a populated file."""
    build_signals.SIGNALS_FILE.write_text(json.dumps(
        {"changes": [published()]}) + "\n")
    monkeypatch.setattr(sys, "argv", ["build_signals.py"])

    build_signals.main()

    payload = json.loads(build_signals.SIGNALS_FILE.read_text())
    assert [c["name"] for c in payload["changes"]] == ["Historic Ltd"]
    assert payload["publishableCount"] == 1
