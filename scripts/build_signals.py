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
        SELECT f.name, f.city, f.postcode, f.sectors, f.score, f.careers_url,
               MAX(s.observed_at) AS observed_at
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
        "name": display_name(r["name"]),
        "city": r["city"] or "",
        "region": POSTCODE_AREA_TO_REGION.get(postcode_area(r["postcode"]), ""),
        "sectors": [s.strip() for s in (r["sectors"] or "").split(",") if s.strip()],
        "score": r["score"],
        "careersUrl": r["careers_url"],
        "observedAt": r["observed_at"],
    } for r in rows]


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

    changes = fetch_changes(args.window_days, args.max_score, args.limit)
    counts = fetch_counts(args.window_days, args.max_score)

    # A signal for a firm scoring above the cap must never reach the file. The
    # SQL already excludes them; this is the assertion that keeps it true after
    # someone edits the query.
    over = [c for c in changes if c["score"] > args.max_score]
    if over:
        sys.exit(f"REFUSING to write: {len(over)} firm(s) above the score cap "
                 f"reached the feed, e.g. {over[0]['name']} ({over[0]['score']})")

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
