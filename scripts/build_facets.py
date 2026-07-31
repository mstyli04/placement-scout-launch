#!/usr/bin/env python3
"""Build aggregate sector x region facet pages data (W-6).

Reads scout.db READ-ONLY. Writes landing/src/data/facets.json: one row per
sector x region combination with a genuine, non-trivial firm count (>=
MIN_COUNT), each carrying real aggregate stats only — no per-firm data, so
this is safe to publish regardless of score/suppression status, same as
write_region_density_file().

A firm can carry more than one sector (scout's `sectors` column is a
comma-joined list), so it can appear in more than one facet's count — the
counts here answer "how many firms work in this sector, in this region",
not a disjoint partition of the 73k total.

Usage: python3 scripts/build_facets.py
"""
import json
import re
import sqlite3
import sys
from collections import Counter
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_customer_sheet import (  # noqa: E402
    PIPELINE_REPO, POSTCODE_AREA_TO_REGION, REGION_ORDER, postcode_area,
)

SCOUT_DB = PIPELINE_REPO / "data" / "scout.db"
FACETS_FILE = Path(__file__).resolve().parent.parent / "landing" / "src" / "data" / "facets.json"
OVERVIEW_FILE = Path(__file__).resolve().parent.parent / "landing" / "src" / "data" / "overview.json"

# Below this, a combo is too thin to carry "genuine aggregate substance"
# (W-6's own words) and risks being exactly the kind of scaled/thin content
# W-7 exists to avoid — leave it out rather than publish a near-empty page.
MIN_COUNT = 5

SECTOR_SLUGS = {
    "M&A / advisory": "ma-advisory",
    "Asset & wealth mgmt": "asset-wealth",
    "PE / VC": "pe-vc",
    "Quant / trading / fintech": "quant-trading",
}

COHORT_BOUNDS = [
    ("under_2y", 0, 2),
    ("2_5y", 2, 5),
    ("5_10y", 5, 10),
    ("10_20y", 10, 20),
    ("20y_plus", 20, None),
]


def region_slug(region: str) -> str:
    return region.lower().replace(" ", "-")


def age_years(incorporated: str, today: date) -> float:
    y, m, d = (int(x) for x in incorporated.split("-"))
    days = (today - date(y, m, d)).days
    return days / 365.25


def cohort_for(age: float) -> str:
    for key, lo, hi in COHORT_BOUNDS:
        if age >= lo and (hi is None or age < hi):
            return key
    return COHORT_BOUNDS[-1][0]


def median(values: list[float]) -> float:
    s = sorted(values)
    n = len(s)
    mid = n // 2
    return s[mid] if n % 2 else (s[mid - 1] + s[mid]) / 2


def build_facets() -> list[dict]:
    con = sqlite3.connect(f"file:{SCOUT_DB}?mode=ro", uri=True)
    rows = con.execute(
        "SELECT sectors, postcode, incorporated, website, careers_url FROM firms "
        "WHERE company_number NOT IN (SELECT company_number FROM suppressions)"
    ).fetchall()
    con.close()

    today = date.today()
    # (sector_label, region) -> accumulators
    ages: dict[tuple, list[float]] = {}
    cohorts: dict[tuple, Counter] = {}
    counts: Counter = Counter()
    website_counts: Counter = Counter()
    careers_counts: Counter = Counter()

    for sectors_str, postcode, incorporated, website, careers_url in rows:
        region = POSTCODE_AREA_TO_REGION.get(postcode_area(postcode))
        if not region:
            continue
        sectors = {s.strip() for s in (sectors_str or "").split(",") if s.strip()}
        age = age_years(incorporated, today) if incorporated else None
        for sector in sectors:
            key = (sector, region)
            counts[key] += 1
            if website:
                website_counts[key] += 1
                if careers_url:
                    careers_counts[key] += 1
            if age is not None:
                ages.setdefault(key, []).append(age)
                cohorts.setdefault(key, Counter())[cohort_for(age)] += 1

    facets = []
    for (sector, region), count in counts.items():
        if count < MIN_COUNT or sector not in SECTOR_SLUGS:
            continue
        w = website_counts[(sector, region)]
        c = careers_counts[(sector, region)]
        facets.append({
            "sectorKey": SECTOR_SLUGS[sector],
            "sectorLabel": sector,
            "regionKey": region_slug(region),
            "regionLabel": region,
            "count": count,
            "medianAgeYears": round(median(ages[(sector, region)]), 1),
            "websiteCount": w,
            "careersCount": c,
            "careersSharePct": round(100 * c / w, 1) if w else None,
            "cohorts": {key: cohorts[(sector, region)].get(key, 0) for key, _, _ in COHORT_BOUNDS},
        })

    facets.sort(key=lambda f: (-f["count"], f["sectorLabel"], f["regionLabel"]))
    return facets


def build_overview() -> dict:
    """Whole-dataset aggregates for the /explore/ overview (W-15) — same
    shape of stat as a single facet, just not sliced by sector/region."""
    con = sqlite3.connect(f"file:{SCOUT_DB}?mode=ro", uri=True)
    rows = con.execute(
        "SELECT sectors, incorporated, website, careers_url FROM firms "
        "WHERE company_number NOT IN (SELECT company_number FROM suppressions)"
    ).fetchall()
    signal_count = con.execute("SELECT COUNT(*) FROM signals").fetchone()[0]
    con.close()

    today = date.today()
    ages: list[float] = []
    cohorts: Counter = Counter()
    sector_totals: Counter = Counter()
    website_count = 0
    careers_count = 0

    for sectors_str, incorporated, website, careers_url in rows:
        for sector in {s.strip() for s in (sectors_str or "").split(",") if s.strip()}:
            if sector in SECTOR_SLUGS:
                sector_totals[sector] += 1
        if incorporated:
            age = age_years(incorporated, today)
            ages.append(age)
            cohorts[cohort_for(age)] += 1
        if website:
            website_count += 1
            if careers_url:
                careers_count += 1

    return {
        "totalFirms": len(rows),
        "sectorMix": [
            {"sectorLabel": label, "count": sector_totals[label]}
            for label in sorted(sector_totals, key=lambda s: -sector_totals[s])
        ],
        "medianAgeYears": round(median(ages), 1) if ages else None,
        "cohorts": {key: cohorts.get(key, 0) for key, _, _ in COHORT_BOUNDS},
        "websiteCount": website_count,
        "careersCount": careers_count,
        "careersSharePct": round(100 * careers_count / website_count, 1) if website_count else None,
        "signalCount": signal_count,
    }


def main() -> None:
    facets = build_facets()
    FACETS_FILE.parent.mkdir(parents=True, exist_ok=True)
    FACETS_FILE.write_text(json.dumps(facets, indent=2) + "\n")
    total_firms = sum(f["count"] for f in facets)
    print(f"Wrote {FACETS_FILE}")
    print(f"{len(facets)} facet pages (sector x region combos with >= {MIN_COUNT} firms), "
          f"covering {total_firms} firm-sector-region rows")
    print("Sectors included:", sorted({f["sectorLabel"] for f in facets}))
    print("Regions included:", sorted({f["regionLabel"] for f in facets}))
    all_regions = set(REGION_ORDER)
    covered_regions = {f["regionLabel"] for f in facets}
    if all_regions - covered_regions:
        print(f"Regions with NO facet page (all combos < {MIN_COUNT} firms): "
              f"{sorted(all_regions - covered_regions)}")

    overview = build_overview()
    OVERVIEW_FILE.write_text(json.dumps(overview, indent=2) + "\n")
    print(f"Wrote {OVERVIEW_FILE} ({overview['totalFirms']} firms, "
          f"{overview['signalCount']} hiring signals recorded)")


if __name__ == "__main__":
    main()
