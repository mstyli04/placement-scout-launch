"""What a public firm profile page is allowed to contain, and what it must admit.

`build_profiles.py` publishes one indexable page per firm, naming the firm and
stating a set of regulatory claims about it. Two kinds of mistake matter here
and nothing else in the repo would catch either:

* publishing a firm that is not already published elsewhere — a suppressed
  firm, or one above the free tier's score cap;
* publishing a claim whose provenance is wrong — an invented date, or a silent
  blank where "we have not re-checked this" is the truth.

Each rule gets a test that fails if the SQL or the fallback stops enforcing it.

Run: python3 -m pytest scripts/test_build_profiles.py
"""
import json
import sqlite3
import sys
from datetime import date, timedelta
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
import build_profiles  # noqa: E402

TODAY = date.today()
RECENT = (TODAY - timedelta(days=3)).isoformat()

SCHEMA = """
CREATE TABLE firms (
  company_number TEXT PRIMARY KEY, name TEXT NOT NULL, sectors TEXT DEFAULT '',
  is_london INTEGER DEFAULT 0, city TEXT DEFAULT '', boutique_signal TEXT DEFAULT '',
  website TEXT DEFAULT '', careers_url TEXT DEFAULT '', contact_email TEXT DEFAULT '',
  score INTEGER DEFAULT 0, incorporated TEXT DEFAULT '', fca_frn TEXT DEFAULT '',
  fca_status TEXT DEFAULT '', last_checked TEXT DEFAULT '', postcode TEXT DEFAULT ''
);
CREATE TABLE signals (
  signal_id INTEGER PRIMARY KEY AUTOINCREMENT, company_number TEXT NOT NULL,
  signal_type TEXT NOT NULL, observed_at TEXT NOT NULL,
  evidence_url TEXT NOT NULL DEFAULT '', raw_snippet TEXT NOT NULL DEFAULT '',
  weight INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE field_observations (
  company_number TEXT NOT NULL, field_name TEXT NOT NULL, observed_at TEXT NOT NULL,
  source_url TEXT NOT NULL, PRIMARY KEY (company_number, field_name)
);
CREATE TABLE suppressions (
  company_number TEXT PRIMARY KEY, reason TEXT DEFAULT '', added_at TEXT DEFAULT ''
);
"""

CH_URL = "https://find-and-update.company-information.service.gov.uk/company/{}"
FCA_URL = "https://register.fca.org.uk/s/search?predefined=Firm&q={}"


def add_firm(con, number, *, name="Example Capital Ltd", score=2,
             website="https://example.com", last_checked="2026-07-26",
             postcode="EC1A 1AA", contact_email="careers@example.com",
             city="London", incorporated="2015-04-01", fca_frn="",
             fca_status="", boutique_signal="small advisory"):
    con.execute(
        "INSERT INTO firms (company_number, name, sectors, is_london, city, "
        "boutique_signal, website, careers_url, contact_email, score, "
        "incorporated, fca_frn, fca_status, last_checked, postcode) "
        "VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
        (number, name, "M&A / advisory", 1, city, boutique_signal, website,
         "https://example.com/careers", contact_email, score, incorporated,
         fca_frn, fca_status, last_checked, postcode))


def observe(con, number, field, observed_at="2026-07-16", source_url=None):
    con.execute(
        "INSERT INTO field_observations (company_number, field_name, observed_at, source_url) "
        "VALUES (?,?,?,?)",
        (number, field, observed_at, source_url or CH_URL.format(number)))


@pytest.fixture
def db(tmp_path, monkeypatch):
    """A scout.db stand-in, wired into the module under test."""
    path = tmp_path / "scout.db"
    con = sqlite3.connect(path)
    con.executescript(SCHEMA)
    monkeypatch.setattr(build_profiles, "SCOUT_DB", path)
    monkeypatch.setattr(build_profiles, "PROFILES_FILE", tmp_path / "profiles.json")
    monkeypatch.setattr(build_profiles, "PROFILE_INDEX_FILE", tmp_path / "profile-index.json")
    monkeypatch.setattr(build_profiles, "SIGNALS_FILE", tmp_path / "signals.json")
    monkeypatch.setattr(build_profiles, "FACETS_FILE", tmp_path / "facets.json")
    yield con
    con.close()


def build(**over):
    kwargs = {"min_score": 0, "max_score": 3, "limit": 100}
    kwargs.update(over)
    return build_profiles.build_profiles(**kwargs)


def names(**over):
    return sorted(p["name"] for p in build(**over))


def field_of(profile, field_name):
    return next(f for f in profile["fields"] if f["field"] == field_name)


# --------------------------------------------------------------------------
# Selection: who gets a page at all.

def test_the_free_sheets_firms_get_a_page(db):
    """Selection mirrors build_customer_sheet.py: in the score band, has a
    website, not suppressed. A firm already named on the free sheet is already
    public, which is the whole licence for this page type."""
    add_firm(db, "111", name="On The Sheet Ltd", score=3)
    add_firm(db, "222", name="Above The Cap Ltd", score=6)
    add_firm(db, "333", name="No Website Ltd", score=2, website="")
    db.commit()

    assert names() == ["On The Sheet"]


def test_a_suppressed_firm_never_gets_a_page(db):
    """The rule the whole removal route depends on.

    build_customer_sheet.py bypasses scout/db.py and once shipped without this
    clause. A prerendered, indexable page is the worst possible surface to
    repeat that on, so the exclusion is asserted here rather than assumed to be
    inherited from the sheet.
    """
    add_firm(db, "111", name="Stays Listed Ltd")
    add_firm(db, "222", name="Asked To Be Removed Ltd")
    db.execute("INSERT INTO suppressions (company_number, added_at) VALUES ('222','2026-08-01')")
    db.commit()

    assert names() == ["Stays Listed"]


def test_a_suppressed_firm_in_the_signals_feed_still_gets_no_page(db):
    """The signals half of the union has its own path into this script, so it
    needs its own proof that the suppression list still bites. A firm can be in
    a published feed file and suppressed afterwards."""
    add_firm(db, "999", name="Signalled Then Removed Ltd", score=8)
    db.execute("INSERT INTO suppressions (company_number, added_at) VALUES ('999','2026-08-01')")
    db.commit()
    build_profiles.SIGNALS_FILE.write_text(json.dumps(
        {"changes": [{"companyNumber": "999", "name": "Signalled Then Removed"}]}))

    assert names() == []


def test_firms_in_the_signals_feed_get_a_page_even_above_the_sheet_cap(db):
    """The union's reason for existing. A careers-page signal is worth +3, so
    every firm in the feed scores 5 or 8 — above the sheet's 0-3 band. Their
    names are already published on /signals/, and those entries currently dead
    end; this is what they link to."""
    add_firm(db, "111", name="On The Sheet Ltd", score=2)
    add_firm(db, "999", name="In The Feed Ltd", score=8)
    db.commit()
    build_profiles.SIGNALS_FILE.write_text(json.dumps(
        {"changes": [{"companyNumber": "999", "name": "In The Feed"}]}))

    assert names() == ["In The Feed", "On The Sheet"]


def test_a_feed_entry_this_database_has_never_seen_is_skipped_not_invented(db):
    """signals.json accumulates history beyond what any one database holds. A
    profile page is built entirely from firms rows, so a number with no row
    has nothing to say — skip it rather than render a page of blanks."""
    add_firm(db, "111", name="Known Ltd")
    db.commit()
    build_profiles.SIGNALS_FILE.write_text(json.dumps(
        {"changes": [{"companyNumber": "404404", "name": "Never Seen Ltd"}]}))

    assert names() == ["Known"]


def test_the_sheets_row_limit_bounds_the_sheet_half(db):
    """These pages exist because the sheet published those firms. Publishing
    more of them than the sheet does would make this the free dataset."""
    for i in range(10):
        add_firm(db, f"{i:06d}", name=f"Firm {i} Ltd", score=3)
    db.commit()

    assert len(build(limit=4)) == 4


# --------------------------------------------------------------------------
# What a page may say about a firm.

def test_the_contact_email_is_never_published(db):
    """Deliberate, and the reason is in build_profiles.py's header comment: the
    free sheet is gated behind an email signup, a prerendered page is not. This
    test exists so the omission reads as a decision, not an oversight anyone
    should 'fix'."""
    add_firm(db, "111", contact_email="careers@example.com")
    db.commit()

    blob = json.dumps(build()[0])
    assert "careers@example.com" not in blob
    assert "contactEmail" not in blob


def test_a_mailto_careers_route_is_not_published_as_a_link(db):
    """`careers_url` holds a mailto: address for 22 firms and a tel: for 8 —
    enrichment falls back to a contact route when a firm has no careers page.
    Publishing those would put the contact email on an indexable page through
    the back door, defeating the one exclusion this page type promises."""
    add_firm(db, "111", name="Email Only Ltd")
    db.execute("UPDATE firms SET careers_url = 'mailto:careers@example.com' "
               "WHERE company_number = '111'")
    db.commit()

    profile = build()[0]
    assert profile["careersUrl"] is None
    assert "careers@example.com" not in json.dumps(profile)


def test_a_tel_careers_route_is_not_published_either(db):
    add_firm(db, "111")
    db.execute("UPDATE firms SET careers_url = 'tel:+442071234567' "
               "WHERE company_number = '111'")
    db.commit()

    assert build()[0]["careersUrl"] is None


def test_a_bare_hostname_website_becomes_an_absolute_link(db):
    """`website` is a bare hostname for most firms that have one. Rendered as
    an href unchanged it is a RELATIVE link — /explore/firm/<slug>/example.co.uk
    — broken on every page it appears on."""
    add_firm(db, "111", website="example.co.uk")
    db.commit()

    website = field_of(build()[0], "website")
    assert website["value"] == "example.co.uk"
    assert website["href"] == "https://example.co.uk"


def test_a_website_that_already_has_a_scheme_is_left_alone(db):
    add_firm(db, "111", website="http://example.co.uk/about")
    db.commit()

    assert field_of(build()[0], "website")["href"] == "http://example.co.uk/about"


def test_a_website_that_is_not_an_address_gets_no_link_at_all(db):
    """Two rows in the live database are scraping debris ("www.http...",
    "s https..."). Shown as text, never as a link to nowhere."""
    add_firm(db, "111", website="s https://example.com")
    db.commit()

    website = field_of(build()[0], "website")
    assert website["value"] == "s https://example.com"
    assert website["href"] is None


def test_only_the_website_field_is_ever_given_a_link(db):
    """An href on a postcode or an FCA status would be an invitation to render
    one, and there is nowhere honest for it to point."""
    add_firm(db, "111")
    db.commit()

    assert [f["field"] for f in build()[0]["fields"] if f["href"]] == ["website"]


def test_the_url_is_keyed_on_the_company_number_not_the_name(db):
    """A display name changes; a company number does not. The number leads so
    the URL survives a rename and a signal ageing out of the feed."""
    add_firm(db, "01234567", name="Example Capital LLP")
    db.commit()

    assert build()[0]["slug"] == "01234567-example-capital"


def test_a_name_that_slugifies_to_nothing_still_gets_a_usable_url(db):
    add_firm(db, "01234567", name="&&& Ltd")
    db.commit()

    assert build()[0]["slug"] == "01234567"


# --------------------------------------------------------------------------
# Provenance: the point of the page.

def test_an_observed_field_carries_the_date_it_was_really_read(db):
    """Not the date the build ran. The whole claim of this page type is that
    "observed" means observed."""
    add_firm(db, "111", city="London", last_checked="2026-09-01")
    observe(db, "111", "city", observed_at="2026-07-16")
    db.commit()

    city = field_of(build()[0], "city")
    assert city["value"] == "London"
    assert city["observedAt"] == "2026-07-16"
    assert city["source"] == "Companies House"
    assert city["sourceUrl"] == CH_URL.format("111")
    assert city["note"] is None


def test_an_fca_observation_is_attributed_to_the_fca_not_companies_house(db):
    add_firm(db, "111", fca_frn="123456", fca_status="Authorised")
    observe(db, "111", "fca_status", source_url=FCA_URL.format("123456"))
    db.commit()

    status = field_of(build()[0], "fca_status")
    assert status["source"] == "FCA Register"
    assert status["sourceUrl"] == FCA_URL.format("123456")


def test_a_field_with_no_observation_says_so_instead_of_inventing_a_date(db):
    """The honesty fallback. Only 12 firms in the local database have
    observations at all, so this is the common case, not the edge case — and
    the wrong answer here is a page that looks freshly verified and is not."""
    add_firm(db, "111", city="London", last_checked="2026-07-26")
    db.commit()  # no field_observations row at all

    city = field_of(build()[0], "city")
    assert city["value"] == "London"
    assert city["observedAt"] is None
    assert city["sourceUrl"] is None
    assert city["note"] == "recorded 26 Jul 2026, not re-verified since"


def test_a_field_with_no_observation_and_no_last_checked_invents_nothing(db):
    """"Never invent a date" has to hold when there is no date to fall back on
    either. A firm whose row predates last_checked being populated must say it
    does not know, not borrow today's date."""
    add_firm(db, "111", city="London", last_checked="")
    db.commit()

    city = field_of(build()[0], "city")
    assert city["observedAt"] is None
    assert city["note"] == "recorded before this database tracked check dates"
    assert "2026" not in city["note"]


def test_an_empty_field_is_rendered_as_unknown_rather_than_dropped(db):
    """A silent blank reads as "not authorised". "We have no record" is a
    different claim, and the honest one."""
    add_firm(db, "111", fca_status="", fca_frn="")
    db.commit()

    status = field_of(build()[0], "fca_status")
    assert status["value"] is None
    assert status["note"] is not None


def test_every_regulatory_field_appears_on_every_profile(db):
    """The field list is the page's contract. A field quietly disappearing when
    it happens to be empty would make the page's coverage look better than it
    is."""
    add_firm(db, "111")
    db.commit()

    assert [f["field"] for f in build()[0]["fields"]] == [
        "is_london", "city", "postcode", "boutique_signal", "incorporated",
        "fca_frn", "fca_status", "website"]


def test_the_london_flag_is_published_as_a_claim_not_a_one(db):
    add_firm(db, "111")
    db.execute("UPDATE firms SET is_london = 0 WHERE company_number = '111'")
    db.commit()

    assert field_of(build()[0], "is_london")["value"] == "No"


# --------------------------------------------------------------------------
# Signal history.

def test_the_signal_history_carries_its_evidence_newest_first(db):
    add_firm(db, "111")
    db.execute("INSERT INTO signals (company_number, signal_type, observed_at, "
               "evidence_url, raw_snippet) VALUES ('111','careers_page_changed',"
               "'2026-08-07','https://example.com/careers','hash changed (a -> b)')")
    db.execute("INSERT INTO signals (company_number, signal_type, observed_at, "
               "evidence_url, raw_snippet) VALUES ('111','careers_page_changed',"
               "?,'https://example.com/careers','hash changed (b -> c)')", (RECENT,))
    db.commit()

    history = build()[0]["signals"]
    assert [s["observedAt"] for s in history] == [RECENT, "2026-08-07"]
    assert history[0]["evidenceUrl"] == "https://example.com/careers"
    assert history[0]["snippet"] == "hash changed (b -> c)"
    assert history[0]["type"] == "careers_page_changed"


def test_a_firm_with_no_signals_gets_an_empty_history_not_a_missing_key(db):
    add_firm(db, "111")
    db.commit()

    assert build()[0]["signals"] == []


# --------------------------------------------------------------------------
# The min-rows guard, copied from build_signals.py for the same reason.

def test_a_collapsed_build_does_not_overwrite_a_populated_file(db, monkeypatch):
    """CI keeps its own scout.db. On 16 Aug 2026 a database with no history of
    its own wrote an empty signals.json over one holding 49 rows and reported
    success. 150 pages vanishing from the sitemap is the same failure with a
    worse blast radius, so the guard is the same guard.
    """
    build_profiles.PROFILES_FILE.write_text(json.dumps(
        {"profiles": [{"slug": f"{i}-firm-{i}", "name": f"Firm {i}"} for i in range(100)]}) + "\n")
    add_firm(db, "111", name="Lone Survivor Ltd")
    db.commit()
    monkeypatch.setattr(sys, "argv", ["build_profiles.py"])

    build_profiles.main()  # exits 0, deliberately: the rest of the chain runs

    payload = json.loads(build_profiles.PROFILES_FILE.read_text())
    assert len(payload["profiles"]) == 100


def test_a_healthy_rebuild_still_replaces_the_file(db, monkeypatch):
    """The guard must not become a reason the file never updates again."""
    build_profiles.PROFILES_FILE.write_text(json.dumps(
        {"profiles": [{"slug": f"{i}-firm-{i}", "name": f"Firm {i}"} for i in range(10)]}) + "\n")
    for i in range(10):
        add_firm(db, f"{i:06d}", name=f"Rebuilt Firm {i} Ltd")
    db.commit()
    monkeypatch.setattr(sys, "argv", ["build_profiles.py"])

    build_profiles.main()

    payload = json.loads(build_profiles.PROFILES_FILE.read_text())
    assert len(payload["profiles"]) == 10
    assert payload["profiles"][0]["name"].startswith("Rebuilt Firm")


def test_the_first_run_writes_even_though_there_is_nothing_to_compare_against(db, monkeypatch):
    assert not build_profiles.PROFILES_FILE.exists()
    add_firm(db, "111")
    db.commit()
    monkeypatch.setattr(sys, "argv", ["build_profiles.py"])

    build_profiles.main()

    assert len(json.loads(build_profiles.PROFILES_FILE.read_text())["profiles"]) == 1


def test_a_deliberate_mass_suppression_can_still_be_forced_through(db, monkeypatch):
    """The guard protects against a broken database, not against the truth. If
    firms really did leave, --force is how the removal actually reaches the
    site — otherwise the guard would itself become a way to keep publishing a
    firm that asked to be removed."""
    build_profiles.PROFILES_FILE.write_text(json.dumps(
        {"profiles": [{"slug": f"{i}-firm-{i}"} for i in range(100)]}) + "\n")
    add_firm(db, "111", name="Lone Survivor Ltd")
    db.commit()
    monkeypatch.setattr(sys, "argv", ["build_profiles.py", "--force"])

    build_profiles.main()

    payload = json.loads(build_profiles.PROFILES_FILE.read_text())
    assert [p["name"] for p in payload["profiles"]] == ["Lone Survivor"]


def test_the_signals_link_index_only_names_pages_that_were_built(db, monkeypatch):
    """/signals/ links its entries through this index. It is written only when
    the profiles are, so a build the guard blocked cannot leave the feed
    pointing at pages that no longer exist."""
    build_profiles.PROFILES_FILE.write_text(json.dumps(
        {"profiles": [{"slug": f"{i}-firm-{i}"} for i in range(100)]}) + "\n")
    add_firm(db, "111", name="Lone Survivor Ltd")
    db.commit()
    monkeypatch.setattr(sys, "argv", ["build_profiles.py"])

    build_profiles.main()

    assert not build_profiles.PROFILE_INDEX_FILE.exists()


def test_the_signals_link_index_maps_company_numbers_to_slugs(db, monkeypatch):
    add_firm(db, "01234567", name="Example Capital LLP")
    db.commit()
    monkeypatch.setattr(sys, "argv", ["build_profiles.py"])

    build_profiles.main()

    assert json.loads(build_profiles.PROFILE_INDEX_FILE.read_text()) == {
        "01234567": "01234567-example-capital"}


def test_module_defaults_match_the_free_sheet(db):
    """If these drift from the workflow's --min-score/--max-score/--limit, this
    page type starts publishing firms the sheet withholds."""
    assert build_profiles.SHEET_MIN_SCORE == 0
    assert build_profiles.SHEET_MAX_SCORE == 3
    assert build_profiles.SHEET_LIMIT == 100


def test_a_guessed_website_is_attributed_to_the_firms_own_site(db):
    """Websites for firms the FCA does not know are guessed from the name and
    verified against the page; the page is the source, not a register."""
    add_firm(db, "111", website="https://firm.co.uk")
    observe(db, "111", "website", source_url="https://firm.co.uk")
    db.commit()

    website = field_of(build()[0], "website")
    assert website["source"] == "Firm's own website"
    assert website["sourceUrl"] == "https://firm.co.uk"
