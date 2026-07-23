#!/usr/bin/env python3
"""Build the customer-facing Placement Scout database sheet.

Reads scout.db READ-ONLY (never touches Styli's working pipeline or its
sheet). Creates a brand-new Google Sheet via the existing service account,
shares it "Anyone with the link: Viewer", and writes the curated columns
agreed in docs/2026-07-18-concierge-mvp-design.md:

    name, sector, city, website, careers page, FCA-authorised flag (+ link
    to the register), incorporation year, quality score.

contact_email is included ONLY when the local part is a role/corporate
inbox (careers@, info@, etc — scout.enrich.ROLE_RANK), never a personal
scraped address, per the spec's GDPR/licensing note.

Usage: python3 scripts/build_customer_sheet.py [--dry-run]
"""
import argparse
import sqlite3
import sys
from pathlib import Path

sys.path.insert(0, str(Path.home() / "placement-scout"))
from scout.outreach import display_name  # noqa: E402 — reuse acronym-fix logic

SCOUT_DB = Path.home() / "placement-scout" / "data" / "scout.db"
SERVICE_ACCOUNT_JSON = Path.home() / "placement-scout" / "secrets" / "service-account.json"
SHEET_TITLE = "Placement Scout — Firm Database"

# Mirrors scout.enrich.ROLE_RANK — role/corporate inboxes only, never a
# scraped personal address.
ROLE_RANK = ["careers", "recruitment", "recruiting", "recruit", "jobs", "hr",
             "talent", "internships", "placements", "people", "info",
             "enquiries", "enquiry", "contact", "hello", "office", "admin",
             "mail"]

HEADERS = ["Firm", "Sector", "City", "Website", "Careers page",
           "FCA authorised", "FCA register", "Contact", "Incorporated", "Score"]


def is_role_email(email: str) -> bool:
    if not email or "@" not in email:
        return False
    local = email.split("@", 1)[0].lower()
    return any(local == role or local.startswith(role + ".") or local.startswith(role + "-")
               for role in ROLE_RANK)


def fetch_firms(limit: int) -> list[dict]:
    con = sqlite3.connect(f"file:{SCOUT_DB}?mode=ro", uri=True)
    con.row_factory = sqlite3.Row
    cur = con.cursor()
    cur.execute("""
        SELECT name, sectors, city, website, careers_url, contact_email,
               score, incorporated, fca_status, fca_frn
        FROM firms
        WHERE score >= 4 AND website != ''
        ORDER BY score DESC, name ASC
        LIMIT ?
    """, (limit,))
    rows = [dict(r) for r in cur.fetchall()]
    con.close()
    return rows


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
        str(f["score"]),
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
    args = parser.parse_args()

    firms = fetch_firms(args.limit)
    rows = [firm_to_row(f) for f in firms]
    with_contact = sum(1 for r in rows if r[7])
    print(f"{len(rows)} firms (score>=4, has website, top {args.limit}) -> customer sheet")
    print(f"{with_contact} of those include a role-based contact email")

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

    import gspread
    gc = gspread.service_account(filename=str(SERVICE_ACCOUNT_JSON))
    sh = gc.open_by_key(args.sheet_id)
    sh.update_title(SHEET_TITLE)
    ws = sh.sheet1
    ws.clear()  # drop any stale rows left over from a previous, larger write
    ws.update(values=[HEADERS] + rows, range_name="A1")
    ws.freeze(rows=1)
    ws.format("A1:J1", {"textFormat": {"bold": True}})
    try:
        sh.share(None, perm_type="anyone", role="reader")
    except Exception as e:
        print(f"Couldn't set public sharing automatically ({e}) — set it manually: "
              "Share -> General access -> Anyone with the link -> Viewer.")

    print(f"\nWrote {len(rows)} firms to: {sh.title}")
    print(f"URL: {sh.url}")


if __name__ == "__main__":
    main()
