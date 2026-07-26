#!/usr/bin/env python3
"""Build the customer-facing Placement Scout database sheet.

Reads scout.db READ-ONLY (never touches Styli's working pipeline or its
sheet). Creates a brand-new Google Sheet via the existing service account,
shares it "Anyone with the link: Viewer", and writes the curated columns
agreed in docs/2026-07-18-concierge-mvp-design.md:

    name, sector, city, website, careers page, FCA-authorised flag (+ link
    to the register), incorporation year.

The internal quality score is used to select which firms make the cut
(--min-score/--max-score) but is deliberately NOT shown to signups — the
top-scoring firms (score > max-score) are held back for a future paid
tier, and showing the raw number would tip off which firms are which.

contact_email is included ONLY when the local part is a role/corporate
inbox (careers@, info@, etc — scout.enrich.ROLE_RANK), never a personal
scraped address, per the spec's GDPR/licensing note.

Usage: python3 scripts/build_customer_sheet.py [--dry-run]
"""
import argparse
import json
import os
import re
import sqlite3
import sys
from collections import Counter
from pathlib import Path

# Defaults to the local dev convention (both repos side-by-side under the
# home directory); CI sets PIPELINE_REPO to wherever it checked out
# placement-scout, since that won't be under a literal home directory there.
PIPELINE_REPO = Path(os.environ.get("PIPELINE_REPO", str(Path.home() / "placement-scout")))

sys.path.insert(0, str(PIPELINE_REPO))
from scout.outreach import display_name  # noqa: E402 — reuse acronym-fix logic

SCOUT_DB = PIPELINE_REPO / "data" / "scout.db"
SERVICE_ACCOUNT_JSON = PIPELINE_REPO / "secrets" / "service-account.json"
SHEET_TITLE = "Placement Scout — Firm Database"
FRESHNESS_FILE = Path(__file__).resolve().parent.parent / "landing" / "src" / "data" / "freshness.json"

# Mirrors scout.enrich.ROLE_RANK — role/corporate inboxes only, never a
# scraped personal address.
ROLE_RANK = ["careers", "recruitment", "recruiting", "recruit", "jobs", "hr",
             "talent", "internships", "placements", "people", "info",
             "enquiries", "enquiry", "contact", "hello", "office", "admin",
             "mail"]

HEADERS = ["Firm", "Sector", "City", "Website", "Careers page",
           "FCA authorised", "FCA register", "Contact", "Incorporated"]

REGION_DENSITY_FILE = (Path(__file__).resolve().parent.parent / "landing" / "src"
                       / "data" / "region-density.json")

# UK postcode area -> broad postal region, for the regional density map
# (W-12). "London" here means the strict postal-London area codes only
# (E, EC, N, NW, SE, SW, W, WC) — Greater London boroughs like Harrow (HA)
# or Croydon (CR) are postally part of the South East grouping, matching
# standard postal-region conventions, not the Greater London admin boundary.
# 4 area codes seen in the data (C, DB, SU, WI) aren't real UK postcode
# areas — data artifacts, most likely malformed/foreign addresses — and are
# deliberately left unmapped so they're excluded from the map rather than
# guessed at.
POSTCODE_AREA_TO_REGION = {
    # London
    "E": "London", "EC": "London", "N": "London", "NW": "London",
    "SE": "London", "SW": "London", "W": "London", "WC": "London",
    # South East (incl. Outer London postal areas)
    "BN": "South East", "BR": "South East", "CR": "South East",
    "CT": "South East", "DA": "South East", "EN": "South East",
    "GU": "South East", "HA": "South East", "IG": "South East",
    "KT": "South East", "ME": "South East", "OX": "South East",
    "PO": "South East", "RG": "South East", "RH": "South East",
    "RM": "South East", "SL": "South East", "SM": "South East",
    "SO": "South East", "TN": "South East", "TW": "South East",
    "UB": "South East",
    # East of England
    "AL": "East of England", "CB": "East of England", "CM": "East of England",
    "CO": "East of England", "HP": "East of England", "IP": "East of England",
    "LU": "East of England", "MK": "East of England", "NR": "East of England",
    "PE": "East of England", "SG": "East of England", "SS": "East of England",
    "WD": "East of England",
    # South West
    "BA": "South West", "BH": "South West", "BS": "South West",
    "DT": "South West", "EX": "South West", "GL": "South West",
    "PL": "South West", "SN": "South West", "SP": "South West",
    "TA": "South West", "TQ": "South West", "TR": "South West",
    # West Midlands
    "B": "West Midlands", "CV": "West Midlands", "DY": "West Midlands",
    "HR": "West Midlands", "ST": "West Midlands", "SY": "West Midlands",
    "TF": "West Midlands", "WR": "West Midlands", "WS": "West Midlands",
    "WV": "West Midlands",
    # East Midlands
    "DE": "East Midlands", "LE": "East Midlands", "LN": "East Midlands",
    "NG": "East Midlands", "NN": "East Midlands",
    # Yorkshire and the Humber
    "BD": "Yorkshire", "DN": "Yorkshire", "HD": "Yorkshire", "HG": "Yorkshire",
    "HU": "Yorkshire", "HX": "Yorkshire", "LS": "Yorkshire", "S": "Yorkshire",
    "WF": "Yorkshire", "YO": "Yorkshire",
    # North West
    "BB": "North West", "BL": "North West", "CA": "North West",
    "CH": "North West", "CW": "North West", "FY": "North West",
    "L": "North West", "LA": "North West", "M": "North West",
    "OL": "North West", "PR": "North West", "SK": "North West",
    "WA": "North West", "WN": "North West",
    # North East
    "DH": "North East", "DL": "North East", "NE": "North East",
    "SR": "North East", "TS": "North East",
    # Wales
    "CF": "Wales", "LD": "Wales", "LL": "Wales", "NP": "Wales", "SA": "Wales",
    # Scotland
    "AB": "Scotland", "DD": "Scotland", "DG": "Scotland", "EH": "Scotland",
    "FK": "Scotland", "G": "Scotland", "HS": "Scotland", "IV": "Scotland",
    "KA": "Scotland", "KW": "Scotland", "KY": "Scotland", "ML": "Scotland",
    "PA": "Scotland", "PH": "Scotland", "TD": "Scotland", "ZE": "Scotland",
    # Northern Ireland
    "BT": "Northern Ireland",
}

REGION_ORDER = ["Scotland", "Northern Ireland", "North East", "North West",
               "Yorkshire", "Wales", "West Midlands", "East Midlands",
               "East of England", "South West", "South East", "London"]


def is_role_email(email: str) -> bool:
    """Exact match only — "careers.london@" or "jobs.sarah@" can't be told
    apart by string shape alone (department variant vs. a named alias), so
    for a public exposure gate we only trust an unqualified role inbox."""
    if not email or "@" not in email:
        return False
    local = email.split("@", 1)[0].lower()
    return local in ROLE_RANK


def fetch_firms(limit: int, min_score: int, max_score: int) -> list[dict]:
    con = sqlite3.connect(f"file:{SCOUT_DB}?mode=ro", uri=True)
    con.row_factory = sqlite3.Row
    cur = con.cursor()
    cur.execute("""
        SELECT name, sectors, city, website, careers_url, contact_email,
               score, incorporated, fca_status, fca_frn
        FROM firms
        WHERE score >= ? AND score <= ? AND website != ''
          AND company_number NOT IN (SELECT company_number FROM suppressions)
        ORDER BY score DESC, name ASC
        LIMIT ?
    """, (min_score, max_score, limit))
    rows = [dict(r) for r in cur.fetchall()]
    con.close()
    return rows


def postcode_area(postcode: str) -> str:
    m = re.match(r"^([A-Z]{1,2})", (postcode or "").strip().upper())
    return m.group(1) if m else ""


def write_region_density_file() -> dict[str, int]:
    """Aggregate counts across the WHOLE dataset (not just the 100-firm
    public sheet subset) by broad UK region, for the regional density map
    (W-12). Aggregate counts only — no per-firm data — so this is safe to
    publish regardless of score/suppression status."""
    con = sqlite3.connect(f"file:{SCOUT_DB}?mode=ro", uri=True)
    postcodes = [r[0] for r in con.execute(
        "SELECT postcode FROM firms WHERE postcode != '' "
        "AND company_number NOT IN (SELECT company_number FROM suppressions)")]
    con.close()
    counts = Counter()
    for pc in postcodes:
        region = POSTCODE_AREA_TO_REGION.get(postcode_area(pc))
        if region:
            counts[region] += 1
    result = {region: counts.get(region, 0) for region in REGION_ORDER}
    REGION_DENSITY_FILE.parent.mkdir(parents=True, exist_ok=True)
    REGION_DENSITY_FILE.write_text(json.dumps(result, indent=2) + "\n")
    return result


def write_freshness_file() -> str:
    """Record when the underlying company data was actually last checked
    (MAX(last_checked), set on every firm during a census/FCA refresh pass) —
    the site's "last updated" claim must trace back to this, not a hardcoded
    cadence claim (W-4)."""
    con = sqlite3.connect(f"file:{SCOUT_DB}?mode=ro", uri=True)
    last_checked = con.execute("SELECT MAX(last_checked) FROM firms").fetchone()[0]
    con.close()
    FRESHNESS_FILE.parent.mkdir(parents=True, exist_ok=True)
    FRESHNESS_FILE.write_text(json.dumps({"last_updated": last_checked}, indent=2) + "\n")
    return last_checked


def firm_to_row(f: dict) -> list[str]:
    authorised = f["fca_status"] == "Authorised"
    fca_link = (f"https://register.fca.org.uk/s/search?predefined=Firm&q={f['fca_frn']}"
                if f["fca_frn"] else "")
    year = f["incorporated"][:4] if f["incorporated"] else ""
    contact = f["contact_email"] if is_role_email(f["contact_email"]) else ""
    return [
        display_name(f["name"]),
        f["sectors"],
        f.get("city", ""),
        f["website"],
        f.get("careers_url", ""),
        "Yes" if authorised else "",
        fca_link,
        contact,
        year,
    ]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true",
                        help="Build rows and print a summary, don't touch Google Sheets")
    parser.add_argument("--sheet-id",
                        help="ID of an existing sheet Styli created and shared Editor with "
                             "the service account (bare service accounts have no Drive quota "
                             "of their own, so create() doesn't work)")
    parser.add_argument("--limit", type=int, default=100,
                        help="Top N firms by score to include (default: 100)")
    parser.add_argument("--min-score", type=int, default=4,
                        help="Minimum score to include (default: 4)")
    parser.add_argument("--max-score", type=int, default=6,
                        help="Maximum score to include (default: 6) — firms scoring "
                             "above this are held back for a future paid tier")
    parser.add_argument("--min-rows", type=int, default=50,
                        help="Refuse to touch the live sheet if fewer than this many "
                             "firms qualify (default: 50) — a suspiciously small result "
                             "is far more likely a bug (e.g. the underlying data hasn't "
                             "finished refreshing yet) than a real change, and the sheet "
                             "must never be silently gutted by a bad run")
    args = parser.parse_args()

    firms = fetch_firms(args.limit, args.min_score, args.max_score)
    rows = [firm_to_row(f) for f in firms]
    with_contact = sum(1 for r in rows if r[7])
    print(f"{len(rows)} firms (score {args.min_score}-{args.max_score}, has website, "
          f"top {args.limit}) -> customer sheet")
    print(f"{with_contact} of those include a role-based contact email")

    last_updated = write_freshness_file()
    print(f"Wrote {FRESHNESS_FILE} (last_updated={last_updated})")

    region_counts = write_region_density_file()
    print(f"Wrote {REGION_DENSITY_FILE} ({sum(region_counts.values())} firms mapped "
          f"across {len(region_counts)} regions)")

    if args.dry_run:
        print("\n--dry-run: not creating a sheet. Sample rows:")
        for r in rows[:3]:
            print(r)
        return

    if not args.sheet_id:
        print("\nNo --sheet-id given. Create a blank Google Sheet in your own Drive, share it "
              "Editor with scout-484@scout-502607.iam.gserviceaccount.com, then rerun with "
              "--sheet-id <the ID from its URL>.")
        return

    if len(rows) < args.min_rows:
        print(f"\nREFUSING to touch the live sheet: only {len(rows)} firms qualified, "
              f"below --min-rows={args.min_rows}. Leaving the existing sheet untouched. "
              f"This is almost always a sign the underlying data isn't ready yet (e.g. a "
              f"fresh/still-bootstrapping database), not a real drop in real firms — "
              f"investigate before overriding with a lower --min-rows.")
        sys.exit(1)

    import gspread
    gc = gspread.service_account(filename=str(SERVICE_ACCOUNT_JSON))
    sh = gc.open_by_key(args.sheet_id)
    sh.update_title(SHEET_TITLE)
    ws = sh.sheet1
    ws.clear()  # drop any stale rows left over from a previous, larger write
    ws.update(values=[HEADERS] + rows, range_name="A1")
    ws.freeze(rows=1)
    ws.format("A1:I1", {"textFormat": {"bold": True}})
    try:
        sh.share(None, perm_type="anyone", role="reader")
    except Exception as e:
        print(f"Couldn't set public sharing automatically ({e}) — set it manually: "
              "Share -> General access -> Anyone with the link -> Viewer.")

    print(f"\nWrote {len(rows)} firms to: {sh.title}")
    print(f"URL: {sh.url}")


if __name__ == "__main__":
    main()
