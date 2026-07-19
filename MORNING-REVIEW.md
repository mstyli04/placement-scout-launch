# ☀️ Morning review — Placement Scout launch draft

Everything below was built overnight in this folder only. **Nothing was committed to git,
deployed, or changed in any of your existing projects** (your placement-scout pipeline, sheet,
and data are untouched — I only *read* scout.db for honest numbers).

## Look at these, in order

1. **The landing page draft** → open **http://localhost:5174**
   (If the server isn't running: `cd ~/placement-scout-launch/landing && npm run dev -- --port 5174`)
   Meridian design system, real data claims, real example firms in the preview table.
   **Updated 19 Jul per your decision: the product is FREE** — the pricing card is now a
   free-access card with one `TODO(styli)` placeholder: the email-capture wiring
   (`src/components/sections/pricing.tsx`).

2. **The design spec** → `docs/2026-07-18-concierge-mvp-design.md`
   The concierge-MVP plan, updated for the free model: success criterion is now 100 signups
   in 4 weeks + ≥40% digest open rate (instead of paying customers), no Stripe anywhere,
   and the remaining open decisions are name, sheet-vs-page, sender address, and email tool.

3. **The legal/data note** (inside the spec) — researched overnight:
   - Companies House = Open Government Licence → commercial reuse fine with attribution (added to footer).
   - FCA register = free API is lookup-oriented; bulk redistribution formally goes through the paid
     Register Extract Service (it has a "reseller" tier). Draft mitigates by showing only a derived
     "FCA-authorised ✓" flag + link-outs, not register records. Commercial precedent exists (TOVO).
     Action item before charging: email the FCA RES team to confirm.
   - Product excludes scraped personal emails (GDPR) — corporate channels only.

4. **Supporting drafts** in `docs/`:
   - `weekly-email-template.md` — the "new firms this week" retention email
   - `launch-content-drafts.md` — LinkedIn/TikTok/society distribution posts, ready to adapt
   - `outreach-playbook-outline.md` — outline for the playbook you'd write (~1 evening)

## Honest numbers used everywhere (from scout.db, 18 Jul)

73,080 scanned · 15,792 FCA-authorised · ~1,140 firms scoring ≥4 ("1,100+ curated") ·
8,144 with websites · 1,189 with careers pages.

## What I did NOT do (deliberately)

- No Stripe account, no payments, no deploy, no domain — real-world/spending actions are yours.
- No customer-facing sheet yet — needs your call on sheet vs. web page (spec, open decision #3).
- No git commits anywhere, per your instruction.

## If you like it, the critical path is

Stripe link → customer sheet → deploy landing to Vercel → first LinkedIn post. That's one weekend.
If you don't like parts of it — everything here is a draft; tear it up freely.
