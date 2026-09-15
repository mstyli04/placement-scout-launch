#!/usr/bin/env python3
"""Build the public per-firm profile pages data. Writes landing/src/data/profiles.json.

Reads scout.db READ-ONLY, same as build_facets.py and build_signals.py.

One page per firm, where every fact states where it came from and when it was
actually observed. The existing public surfaces state a single site-wide
"last updated" date and let it stand for every claim on every page; that date
is when the *build* ran. This file carries a provenance record per field —
{value, source, sourceUrl, observedAt} read from `field_observations` — so
"observed 16 Jul 2026" means Companies House or the FCA was really read that
day, and a field nobody has re-read says so in its own words.

WHO GETS A PAGE. Firms already named on the free public sheet (score 0-3,
has a website, the same selection build_customer_sheet.py makes) UNION firms
already named in the published signals feed, MINUS anyone in `suppressions`.
Both halves of that union are already public; this page type may not be the
first place a firm's name appears. The signals half is what makes the union
worth having: a careers_page_changed signal is worth +3 points, so every firm
in the feed scores 5 or 8 and none of them are on the sheet.

The suppression exclusion is applied HERE, in this script's own SQL, on both
halves. build_customer_sheet.py bypasses scout/db.py and once shipped without
that clause; a prerendered, indexable page is the worst surface to repeat it
on, and "it inherits the sheet's rules" is not a mechanism.

WHAT IS DELIBERATELY NOT PUBLISHED: `contact_email`. The free sheet keeps it —
the sheet is behind an email signup and a link that can be withdrawn. A
prerendered page indexed by search engines is a scrape target, and a role
inbox harvested off it cannot be un-harvested. This is a decision, not an
oversight; please do not "fix" it.

Usage: python3 scripts/build_profiles.py [--limit N] [--force]
"""
import argparse
import json
import re
import sqlite3
import sys
from datetime import date
from pathlib import Path
from urllib.parse import urlsplit

sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_customer_sheet import (  # noqa: E402
    PIPELINE_REPO, POSTCODE_AREA_TO_REGION, display_name, postcode_area,
)
from build_facets import SECTOR_SLUGS, region_slug  # noqa: E402

DATA_DIR = Path(__file__).resolve().parent.parent / "landing" / "src" / "data"
SCOUT_DB = PIPELINE_REPO / "data" / "scout.db"
PROFILES_FILE = DATA_DIR / "profiles.json"
# company number -> slug, so /signals/ can link its entries to their profile
# without inlining the whole of profiles.json into the signals bundle.
PROFILE_INDEX_FILE = DATA_DIR / "profile-index.json"
SIGNALS_FILE = DATA_DIR / "signals.json"
FACETS_FILE = DATA_DIR / "facets.json"

# Mirrors the nightly workflow's `--limit 100 --min-score 0 --max-score 3`.
# If those drift apart, this page type starts publishing the tier the sheet
# deliberately withholds — test_module_defaults_match_the_free_sheet() is the
# tripwire.
SHEET_MIN_SCORE = 0
SHEET_MAX_SCORE = 3
SHEET_LIMIT = 100

# The regulatory fields that `scout.db.set_regulatory_field` records
# provenance for (D-14). Order is the order they appear in the page's
# provenance table; the list is the page's contract, so a field stays on the
# page when it is empty rather than vanishing and making coverage look better
# than it is.
PROVENANCE_FIELDS = [
    ("is_london", "Registered in London"),
    ("city", "Registered office city"),
    ("postcode", "Registered office postcode"),
    ("boutique_signal", "Boutique classification"),
    ("incorporated", "Incorporated"),
    ("fca_frn", "FCA firm reference number"),
    ("fca_status", "FCA authorisation status"),
    ("website", "Website"),
]

SOURCE_NAMES = {
    "find-and-update.company-information.service.gov.uk": "Companies House",
    "register.fca.org.uk": "FCA Register",
}

CH_COMPANY_URL = "https://find-and-update.company-information.service.gov.uk/company/{}"
FCA_REGISTER_URL = "https://register.fca.org.uk/s/search?predefined=Firm&q={}"

# Below this share of what is already published, a rebuild is treated as a
# broken database rather than a real collapse — see the guard in main().
MIN_RETAIN_RATIO = 0.5

MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
          "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

# A hostname, with or without a scheme. Deliberately strict: everything that
# reaches web_url() is scraped, and the two failure modes it guards against
# are both real rows in the live database.
HOSTNAME = re.compile(r"^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$", re.I)


def web_url(raw: str | None) -> str | None:
    """A value safe to render as an outbound link, or None.

    Two things this stops, both found in the live database rather than
    imagined:

    * `careers_url` holds a `mailto:` address for 22 firms and a `tel:` for 8
      — the enrichment falls back to a contact route when a firm has no
      careers page. Publishing those as links would put the contact email on
      an indexable page through the back door, which is the one thing this
      page type is explicitly not allowed to do.
    * `website` is a bare hostname for 6,894 of the 8,142 firms that have one.
      Rendered as an href that is a RELATIVE link: /explore/firm/<slug>/
      example.co.uk, a broken link on every page it appears on.
    """
    value = (raw or "").strip()
    if not value:
        return None
    lowered = value.lower()
    if lowered.startswith(("http://", "https://")):
        return value
    if ":" in value.split("/", 1)[0]:
        # Some other scheme — mailto:, tel:, anything future. Not a web page,
        # and not ours to publish.
        return None
    host = value.split("/", 1)[0]
    return f"https://{value}" if HOSTNAME.match(host) else None


def format_date(iso_date: str) -> str:
    """Matches landing/src/lib/utils.ts's formatDate, from the string parts —
    no timezone can shift a plain calendar date by a day here either."""
    year, month, day = iso_date.split("-")
    return f"{int(day)} {MONTHS[int(month) - 1]} {year}"


def name_slug(name: str) -> str:
    return re.sub(r"-+", "-", re.sub(r"[^a-z0-9]+", "-", name.lower())).strip("-")[:60]


def slug_for(company_number: str, name: str) -> str:
    """`<company-number>-<name-slug>`.

    The number leads, and is the half that identifies the page: a display name
    changes and a signal ages out of the feed, but 01234567 is 01234567 for as
    long as the company exists. A name that slugifies to nothing (initials,
    punctuation) still gets a working URL rather than a trailing hyphen.
    """
    slug = name_slug(display_name(name))
    return f"{company_number}-{slug}" if slug else company_number


def source_name(url: str) -> str:
    host = urlsplit(url).netloc.lower()
    return SOURCE_NAMES.get(host, host or "recorded source")


def feed_numbers() -> set[str]:
    """Company numbers already named in the published signals feed.

    Read from the published file rather than re-derived from `signals`,
    because the file is the authority on what has actually been published —
    it accumulates history no single database holds, and the rule this script
    obeys is "already public", not "publishable".
    """
    if not SIGNALS_FILE.exists():
        return set()
    try:
        changes = json.loads(SIGNALS_FILE.read_text()).get("changes", []) or []
    except (OSError, json.JSONDecodeError):
        return set()
    return {c["companyNumber"] for c in changes if c.get("companyNumber")}


def load_facets() -> list[dict]:
    if not FACETS_FILE.exists():
        return []
    try:
        return json.loads(FACETS_FILE.read_text())
    except (OSError, json.JSONDecodeError):
        return []


def facet_link(facets: list[dict], sectors: list[str], region: str) -> dict | None:
    """The firm's own sector x region aggregate page, when one exists.

    Only combos with >= MIN_COUNT firms get a facet page, so a firm in a thin
    combo has no parent page to point at — a link to a 404 is worse than no
    link.
    """
    if not region:
        return None
    key = region_slug(region)
    for sector in sectors:
        slug = SECTOR_SLUGS.get(sector)
        if not slug:
            continue
        for f in facets:
            if f["sectorKey"] == slug and f["regionKey"] == key:
                return {"sectorKey": slug, "sectorLabel": f["sectorLabel"],
                        "regionKey": key, "regionLabel": f["regionLabel"],
                        "count": f["count"]}
    return None


def field_record(field: str, label: str, row: sqlite3.Row,
                 observation: dict | None) -> dict:
    """One row of the page's provenance table.

    `note` is the honest fallback and carries the whole weight of the page's
    claim. With an observation there is nothing to explain, so it is None.
    Without one, the field says when the value was *recorded* and admits it
    has not been re-read since — and if the database does not know that
    either, it says that instead of borrowing today's date.
    """
    raw = row[field]
    if field == "is_london":
        value = "Yes" if raw else "No"
    else:
        value = (str(raw).strip() or None) if raw is not None else None

    # Only the website field is a link. The rest are plain values, and an
    # href on them would be an invitation to render one.
    href = web_url(value) if field == "website" else None

    if observation:
        return {
            "field": field,
            "label": label,
            "value": value,
            "href": href,
            "source": source_name(observation["source_url"]),
            "sourceUrl": observation["source_url"],
            "observedAt": observation["observed_at"],
            "note": None,
        }

    last_checked = (row["last_checked"] or "").strip()
    note = (f"recorded {format_date(last_checked)}, not re-verified since"
            if last_checked else
            "recorded before this database tracked check dates")
    return {"field": field, "label": label, "value": value, "href": href,
            "source": None, "sourceUrl": None, "observedAt": None, "note": note}


def build_profiles(min_score: int = SHEET_MIN_SCORE, max_score: int = SHEET_MAX_SCORE,
                   limit: int = SHEET_LIMIT) -> list[dict]:
    numbers = feed_numbers()
    placeholders = ",".join("?" * len(numbers))
    con = sqlite3.connect(f"file:{SCOUT_DB}?mode=ro", uri=True)
    con.row_factory = sqlite3.Row

    # Both halves of the union carry the suppression clause, and so does the
    # outer query. Belt and braces on purpose: this is the one rule whose
    # failure is irreversible once a page is indexed.
    rows = con.execute(f"""
        WITH sheet AS (
            SELECT company_number FROM firms
            WHERE score >= ? AND score <= ? AND website != ''
              AND company_number NOT IN (SELECT company_number FROM suppressions)
            ORDER BY score DESC, name ASC
            LIMIT ?
        )
        SELECT f.company_number, f.name, f.sectors, f.is_london, f.city,
               f.boutique_signal, f.website, f.careers_url, f.incorporated,
               f.fca_frn, f.fca_status, f.last_checked, f.postcode
        FROM firms f
        WHERE (f.company_number IN (SELECT company_number FROM sheet)
               {f"OR f.company_number IN ({placeholders})" if numbers else ""})
          AND f.company_number NOT IN (SELECT company_number FROM suppressions)
        ORDER BY f.name ASC
    """, (min_score, max_score, limit, *sorted(numbers))).fetchall()

    observations: dict[tuple[str, str], dict] = {}
    signals: dict[str, list[dict]] = {}
    if rows:
        keys = [r["company_number"] for r in rows]
        marks = ",".join("?" * len(keys))
        for o in con.execute(
                f"SELECT company_number, field_name, observed_at, source_url "
                f"FROM field_observations WHERE company_number IN ({marks})", keys):
            observations[(o["company_number"], o["field_name"])] = dict(o)
        for s in con.execute(
                f"SELECT company_number, signal_type, observed_at, evidence_url, "
                f"raw_snippet FROM signals WHERE company_number IN ({marks}) "
                f"ORDER BY observed_at DESC, signal_id DESC", keys):
            signals.setdefault(s["company_number"], []).append({
                "type": s["signal_type"],
                "observedAt": s["observed_at"],
                "evidenceUrl": s["evidence_url"] or None,
                "snippet": s["raw_snippet"] or None,
            })
    con.close()

    facets = load_facets()
    profiles = []
    for row in rows:
        number = row["company_number"]
        sectors = [s.strip() for s in (row["sectors"] or "").split(",") if s.strip()]
        region = POSTCODE_AREA_TO_REGION.get(postcode_area(row["postcode"]), "")
        profiles.append({
            "companyNumber": number,
            "slug": slug_for(number, row["name"]),
            "name": display_name(row["name"]),
            "sectors": sectors,
            "city": row["city"] or "",
            "region": region,
            "careersUrl": web_url(row["careers_url"]),
            "companiesHouseUrl": CH_COMPANY_URL.format(number),
            "fcaUrl": FCA_REGISTER_URL.format(row["fca_frn"]) if row["fca_frn"] else None,
            "facet": facet_link(facets, sectors, region),
            "fields": [field_record(field, label, row, observations.get((number, field)))
                       for field, label in PROVENANCE_FIELDS],
            "signals": signals.get(number, []),
        })
    return profiles


def published_count() -> int:
    """How many profiles the file already holds. Missing or unreadable is not
    an error — the first run has nothing to read."""
    if not PROFILES_FILE.exists():
        return 0
    try:
        return len(json.loads(PROFILES_FILE.read_text()).get("profiles", []) or [])
    except (OSError, json.JSONDecodeError):
        return 0


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--min-score", type=int, default=SHEET_MIN_SCORE)
    parser.add_argument("--max-score", type=int, default=SHEET_MAX_SCORE)
    parser.add_argument("--limit", type=int, default=SHEET_LIMIT,
                        help="Row cap on the sheet half of the union, matching "
                             "the sheet's own --limit. Firms already named in "
                             "the signals feed are not capped by it.")
    parser.add_argument("--force", action="store_true",
                        help="Write even if the min-rows guard trips. Use when "
                             "firms really have left the selection — a genuine "
                             "suppression must be able to reach the site.")
    args = parser.parse_args()

    profiles = build_profiles(args.min_score, args.max_score, args.limit)
    existing = published_count()

    # A drastically shorter build is far more likely to be a database problem
    # than a real answer. On 16 Aug 2026 the nightly wrote a zero-row
    # signals.json over one holding 49: CI keeps its own scout.db, that
    # database had no signal history, and the run reported success. 150 pages
    # dropping out of the sitemap is the same failure with a worse blast
    # radius, because the URLs stay indexed after they stop existing.
    #
    # Exits 0 deliberately, exactly as build_signals.py does: facets, the
    # sheet and the deploy are unaffected and should still run. --force is the
    # escape hatch, so the guard can never become a reason a removal request
    # fails to reach the site.
    if existing and len(profiles) < MIN_RETAIN_RATIO * existing and not args.force:
        print(f"WARNING: built {len(profiles)} profiles but {PROFILES_FILE.name} "
              f"already holds {existing}. Keeping the existing file rather than "
              f"dropping {existing - len(profiles)} pages out of the sitemap. If "
              f"this is a real collapse — a mass suppression, a rescoring — "
              f"re-run with --force.")
        return

    payload = {
        "builtOn": date.today().isoformat(),
        "sheetScoreRange": [args.min_score, args.max_score],
        "profiles": profiles,
    }
    PROFILES_FILE.parent.mkdir(parents=True, exist_ok=True)
    PROFILES_FILE.write_text(json.dumps(payload, indent=2) + "\n")
    # Written in the same breath as the profiles, and only then: an index
    # naming a page that was not built is a link to a 404.
    PROFILE_INDEX_FILE.write_text(json.dumps(
        {p["companyNumber"]: p["slug"] for p in profiles}, indent=2) + "\n")

    observed = sum(1 for p in profiles for f in p["fields"] if f["observedAt"])
    total = sum(len(p["fields"]) for p in profiles)
    with_signals = sum(1 for p in profiles if p["signals"])
    print(f"Wrote {PROFILES_FILE}")
    print(f"{len(profiles)} firm profiles (sheet: score {args.min_score}-"
          f"{args.max_score}, limit {args.limit}; plus {len(feed_numbers())} "
          f"in the signals feed), {with_signals} carrying a signal history")
    print(f"{observed}/{total} field claims have a real observation date; the "
          f"rest fall back to the firm's last_checked date and say so")


if __name__ == "__main__":
    main()
