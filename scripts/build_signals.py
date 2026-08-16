#!/usr/bin/env python3
"""Build the public hiring-signals feed. Writes landing/src/data/signals.json.

Reads scout.db READ-ONLY.

The pipeline has recorded `careers_page_changed` signals since D-2/D-4 and
nothing outside the internal sheet has ever shown them. This publishes the
feed: which firms' careers pages changed recently, and how many pages are
being watched to find that out. It is the one thing the tool does that a
static directory cannot, so it is worth being visible.

Three rules govern what may appear here, and all three are enforced in SQL
rather than trusted to the caller:

* **Suppressed firms never appear.** Same clause as every other publisher in
  this repo. A firm that asked to be removed must not reappear because a new
  surface was added.
* **A score cap applies**, but no longer the sheet's. The sheet moved to 0-3
  on 15 Aug 2026 to reserve a larger paid tier; this feed stayed at 0-6 on
  purpose. A careers-page signal is worth +3, so every firm that has one
  scores 5 or 8 — matching the sheet's new cap here would publish an empty
  page permanently rather than a shorter one. What the cap still buys is that
  the very top of the range is never named, and the page says how many were
  withheld — a number, never a name.
* **Only firms with a careers page.** True by construction (the signal comes
  from hashing that page), asserted anyway so it stays true if the signal
  types grow.

The window here is 90 days, not the sheet's 30. They answer different
questions: the sheet's column flags a firm as currently worth contacting,
this page is a feed of what has moved lately and needs enough history to look
like one. Both numbers are stated wherever they are shown.
"""
import argparse
import json
import sqlite3
import sys
from collections import Counter
from datetime import date, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_customer_sheet import (  # noqa: E402
    PIPELINE_REPO, POSTCODE_AREA_TO_REGION, display_name, postcode_area,
)

SCOUT_DB = PIPELINE_REPO / "data" / "scout.db"
SIGNALS_FILE = (Path(__file__).resolve().parent.parent / "landing" / "src"
                / "data" / "signals.json")

SIGNAL_TYPE = "careers_page_changed"
WINDOW_DAYS = 90
MAX_SCORE = 6
# The feed is a sample of what moved, not a second copy of the database. It
# grows by roughly the number of watched pages that change each night, so
# without a ceiling this page would eventually become the free dataset.
DEFAULT_LIMIT = 60


def fetch_changes(window_days: int, max_score: int, limit: int) -> list[dict]:
    con = sqlite3.connect(f"file:{SCOUT_DB}?mode=ro", uri=True)
    con.row_factory = sqlite3.Row
    cutoff = (date.today() - timedelta(days=window_days)).isoformat()
    rows = con.execute("""
        SELECT f.company_number, f.name, f.city, f.postcode, f.sectors,
               f.score, f.careers_url, MAX(s.observed_at) AS observed_at
        FROM signals s
        JOIN firms f USING (company_number)
        WHERE s.signal_type = ?
          AND s.observed_at >= ?
          AND f.score <= ?
          AND f.careers_url IS NOT NULL AND f.careers_url != ''
          AND f.company_number NOT IN (SELECT company_number FROM suppressions)
        GROUP BY f.company_number
        ORDER BY observed_at DESC, f.score DESC, f.name ASC
        LIMIT ?
    """, (SIGNAL_TYPE, cutoff, max_score, limit)).fetchall()
    con.close()

    return [{
        # Carried so a later build can check this entry against the
        # suppression list and recognise it as the same firm. Public register
        # data, and the page does not render it.
        "companyNumber": r["company_number"],
        "name": display_name(r["name"]),
        "city": r["city"] or "",
        "region": POSTCODE_AREA_TO_REGION.get(postcode_area(r["postcode"]), ""),
        "sectors": [s.strip() for s in (r["sectors"] or "").split(",") if s.strip()],
        "score": r["score"],
        "careersUrl": r["careers_url"],
        "observedAt": r["observed_at"],
    } for r in rows]


def published_changes() -> list[dict]:
    """Whatever the last build published. Missing or unreadable is not an
    error — the first run has nothing to read."""
    if not SIGNALS_FILE.exists():
        return []
    try:
        return json.loads(SIGNALS_FILE.read_text()).get("changes", []) or []
    except (OSError, json.JSONDecodeError):
        return []


def suppressed_numbers() -> set[str]:
    con = sqlite3.connect(f"file:{SCOUT_DB}?mode=ro", uri=True)
    rows = con.execute("SELECT company_number FROM suppressions").fetchall()
    con.close()
    return {r[0] for r in rows}


def merge_changes(current: list[dict], window_days: int, max_score: int,
                  suppressed: set[str], limit: int) -> list[dict]:
    """The published feed, accumulated rather than rebuilt.

    A careers page that changed on 7 August changed on 7 August permanently.
    Rebuilding this file from scratch each night made published history a
    property of whichever database happened to run — which is how a CI
    database with no signals of its own came to write an empty feed over a
    populated one.

    So the feed accumulates, under three rules that still bite retroactively:
    the window still expires old entries, and the suppression list and score
    cap are re-applied to everything on every build, including entries this
    database has never seen. A removal request must reach back into history,
    or it only covers firms discovered after it was made.

    Where both sources know a firm, the live database wins — it holds the
    fresher observation, and a stale published copy must not shadow it.
    """
    cutoff = (date.today() - timedelta(days=window_days)).isoformat()
    merged: dict[str, dict] = {}

    for entry in published_changes() + list(current):
        number = entry.get("companyNumber")
        if not number:
            # Published before company numbers were stored. It cannot be
            # checked against the suppression list, and unverifiable is not
            # the same as allowed.
            continue
        # `current` is appended second, so it overwrites the published copy.
        merged[number] = entry

    kept = [e for e in merged.values()
            if e.get("observedAt", "") >= cutoff
            and e.get("score", 0) <= max_score
            and e["companyNumber"] not in suppressed]

    kept.sort(key=lambda e: (e.get("observedAt", ""), e.get("score", 0),
                             e.get("name", "")), reverse=True)
    return kept[:limit]


def fetch_counts(window_days: int, max_score: int) -> dict:
    """The context numbers around the feed.

    `withheld` is the honest half of the score cap: the page says some firms
    were held back rather than quietly showing a shorter list.
    """
    con = sqlite3.connect(f"file:{SCOUT_DB}?mode=ro", uri=True)
    cutoff = (date.today() - timedelta(days=window_days)).isoformat()
    not_suppressed = ("company_number NOT IN (SELECT company_number FROM suppressions)")

    (watched,) = con.execute(
        "SELECT COUNT(*) FROM firms WHERE careers_page_hash IS NOT NULL "
        f"AND careers_page_hash != '' AND {not_suppressed}").fetchone()
    (total_in_window,) = con.execute(
        "SELECT COUNT(DISTINCT s.company_number) FROM signals s JOIN firms f "
        "USING (company_number) WHERE s.signal_type = ? AND s.observed_at >= ? "
        f"AND f.{not_suppressed}", (SIGNAL_TYPE, cutoff)).fetchone()
    (published,) = con.execute(
        "SELECT COUNT(DISTINCT s.company_number) FROM signals s JOIN firms f "
        "USING (company_number) WHERE s.signal_type = ? AND s.observed_at >= ? "
        "AND f.score <= ? AND f.careers_url IS NOT NULL AND f.careers_url != '' "
        f"AND f.{not_suppressed}", (SIGNAL_TYPE, cutoff, max_score)).fetchone()
    con.close()

    return {
        "watchedCount": watched,
        "changedCount": total_in_window,
        "publishableCount": published,
        "withheldCount": total_in_window - published,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--window-days", type=int, default=WINDOW_DAYS)
    parser.add_argument("--max-score", type=int, default=MAX_SCORE,
                        help="Score ceiling for this feed. Independent of the "
                             "sheet's --max-score since 15 Aug 2026; lowering "
                             "it to 3 empties the page permanently, because a "
                             "careers-page signal is itself worth +3 points.")
    parser.add_argument("--limit", type=int, default=DEFAULT_LIMIT)
    args = parser.parse_args()

    current = fetch_changes(args.window_days, args.max_score, args.limit)
    counts = fetch_counts(args.window_days, args.max_score)

    # Checked against the RAW query output, before the merge. merge_changes
    # re-applies the cap and would quietly drop an over-cap firm, which is the
    # right behaviour for the file and the wrong behaviour for a broken query:
    # the point of this assertion is that a bad edit to the SQL is loud, not
    # that the bad row is swallowed somewhere downstream.
    over = [c for c in current if c["score"] > args.max_score]
    if over:
        sys.exit(f"REFUSING to write: {len(over)} firm(s) above the score cap "
                 f"reached the feed, e.g. {over[0]['name']} ({over[0]['score']})")

    changes = merge_changes(current, args.window_days, args.max_score,
                            suppressed_numbers(), args.limit)

    # The published list is the authority on how many firms are named, since
    # it can hold history this database never saw. `withheld` stays a fact
    # about the live database — it is the only source that knows what sits
    # above the cap — and `changed` is the two added together, so the three
    # numbers on the page always reconcile.
    counts["publishableCount"] = len(changes)
    counts["changedCount"] = len(changes) + counts["withheldCount"]

    # An empty result must never overwrite a populated file. On 16 Aug 2026 the
    # nightly did exactly that: CI keeps its own scout.db, that database has
    # never observed a careers-page change, and it committed a signals.json
    # with zero rows over one holding 49. The page would have gone blank with
    # nothing in the logs to say why — the run reported success.
    #
    # Zero changes is a real possible answer (a quiet 90 days), so this is not
    # an error. But it is indistinguishable from a database that simply has no
    # history yet, and between those two readings the safe one is to keep what
    # is already published and say so loudly. Exits 0 deliberately: the rest of
    # the nightly — facets, freshness, the sheet, the deploy — is unaffected
    # and should still run.
    if not changes and SIGNALS_FILE.exists():
        try:
            existing = json.loads(SIGNALS_FILE.read_text())
        except (OSError, json.JSONDecodeError):
            existing = {}
        if existing.get("changes"):
            print(f"WARNING: found 0 publishable changes but {SIGNALS_FILE.name} "
                  f"already holds {len(existing['changes'])}. Keeping the existing "
                  f"file rather than blanking the page. This database has "
                  f"{counts['watchedCount']:,} pages under watch and no recorded "
                  f"changes — if that is a fresh database rather than a quiet "
                  f"window, it needs the signal history before it can publish.")
            return

    payload = {
        "windowDays": args.window_days,
        "maxScore": args.max_score,
        **counts,
        "regionMix": dict(Counter(c["region"] for c in changes if c["region"]).most_common()),
        "changes": changes,
    }
    SIGNALS_FILE.parent.mkdir(parents=True, exist_ok=True)
    SIGNALS_FILE.write_text(json.dumps(payload, indent=2) + "\n")

    print(f"Wrote {SIGNALS_FILE}")
    print(f"{counts['watchedCount']:,} careers pages watched; "
          f"{counts['changedCount']} changed in the last {args.window_days} days; "
          f"{len(changes)} published (cap: score <= {args.max_score}, "
          f"{counts['withheldCount']} withheld above it)")


if __name__ == "__main__":
    main()
