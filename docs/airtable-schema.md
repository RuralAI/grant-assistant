# Airtable schema reference

The full schema of a Grant Assistant base, human-readable. The canonical machine-readable source is [`skills/grant-assistant-startup/table-schema.mjs`](../skills/grant-assistant-startup/table-schema.mjs); the installer's Appendix A renders the same content for runtime use. The three change together.

For what each table is *for*, which are safe to customize, and how views work, read [AIRTABLE_FAQ.md](AIRTABLE_FAQ.md); this page is the dry reference.

**Ten tables.** Four are the engine (skills read/write them; don't restructure): Grant Master, Donor Master, Search Audit Log, Our Org Profile. Six are operator-only and safe to customize: Active Grants (Pre-Award), Portfolio (Post-Award), Watchlist, Archive, Active Donors, Donor Restriction Log.

**Write scope (what skills may write; everything else is operator-only):**

| Table | Skill write scope |
| --- | --- |
| Grant Master | CREATE and UPDATE only rows at Stage = Possible |
| Donor Master | CREATE new funders discovered by a scan |
| Search Audit Log | CREATE one entry per work cycle |

**The lifecycle:** one row per grant in Grant Master; its `Stage` (Possible / Active / Awarded / Watchlist / Archived) is both the lifecycle and the operator gate. Promotion = the operator adds a context row in the matching table, links it to the master record, and flips Stage. There is no Withdrawn stage: a withdrawn grant is Archived with reason "Withdrawn."

**Record links (added by the installer's link pass; Airtable auto-creates the inverse on each master):**

| Context table | Link field | Links to |
| --- | --- | --- |
| Active Grants (Pre-Award) | Grant | Grant Master |
| Portfolio (Post-Award) | Grant | Grant Master |
| Watchlist | Grant | Grant Master |
| Archive | Grant | Grant Master |
| Active Donors | Donor | Donor Master |
| Donor Restriction Log | Donor | Donor Master |

## Field listing by table

Exact single-select option strings matter: the skills match them verbatim. If a write ever fails on a select value, the live schema wins.

### Grant Master
Grant Name (text, primary) · Stage (select: Possible / Active / Awarded / Watchlist / Archived) · Funder (text) · Website (url) · Restricted vs. Unrestricted (select: Unrestricted (General Operating Potential) / Restricted (Program / Project Specific) / Capacity-Building / Capital / Other / Unknown) · Project / Program Area (text) · Geography (free text) · Funding Amount Min, Max (currency) · Match Required (select: Yes / No / Unknown) · Match Details (long text) · Application Close Date (date, ISO) · Cycle / Recurrence (select: One-time / Annual / Multi-year / Rolling) · Next Cycle Opens (date) · Pipeline Priority (select: Now / Next / Later; operator-only) · Fit Score (number, 0-20) · Fit Level (select: High Fit / Medium Fit / Low Fit) · Readiness (select: Actionable / Needs Eligibility Confirmation / Not Ready This Cycle / Blocked by Eligibility) · Priority (select, exactly five: High Priority / Medium Priority / High Fit / Needs Readiness Confirmation / Watchlist / Future Fit / Reject) · Scoring Notes / Pushback (long text) · Notes (long text) · Provenance (text)

### Donor Master
Donor Name (text, primary) · Category / Type (select: Private Foundation / Community Foundation / Corporate / Government - Federal / Government - State / Government - Local / Civic / Service Organization / Individual / Family / Other) · Website (url) · Owner (text) · Notes (long text)

### Search Audit Log
Cycle Date (text, primary) · Conducted By (text) · Search Mode (select: Discovery scan / Scoring pass / Maintenance / data-management) · Queries Run · Coverage Summary · Stopping Rationale (long text) · Total Opportunities Identified, Opportunities Added (number) · Gaps / Limitations (long text) · Provenance (text)

### Our Org Profile (judgment layer + deployment stamp; operator edits content, never restructure)
Profile Name (text, primary) · Installer Version (text; absence from schema = pre-versioning base) · Legal Name · Incorporation Status · Fiscal Sponsor + EIN · Org Age / Stage (text) · Stage Posture ★ · Operating Budget ★ · Growth Target · Award Band Strong Min ★, Max ★ (currency) · Award Band Edge Note · Capital Exception · Funding Priority Order ★ · Fit Criteria + Anchors ★ · Readiness Criteria · Durable Rules ★ · Loan Posture ★ (select: Exclude outright / Case-by-case - flag for board) · Recurring Eligibility Traps ★ · Eligibility Nuances · Partner Sufficiency · Search Geography ★ · Populations Served · Anchor Institutions · Programs + Maturity ★ · Mission · Problem Statement · Voice Rules · Boilerplate (long text unless noted)

★ = required; skills halt at runtime if blank.

### Active Grants (Pre-Award), operator-only
Work Item (text, primary) · Grant (link) · Owner (text) · Internal Deadline (date) · Application Status (select: Researching / Preparing LOI / LOI Submitted - Awaiting Decision / Preparing Full Proposal / Full Proposal Submitted - Awaiting Decision / Awarded - In Portfolio / Declined - In Archive / Withdrawn - In Archive) · Work Notes (long text)

### Portfolio (Post-Award), operator-only
Award Item (text, primary) · Grant (link) · Award Date (date) · Award Amount (currency) · Reporting Due (date) · Grant Status (select: Active - Year 1 / Active - Year 2 / Active - Year 3 / Closed) · Management Notes (long text)

### Watchlist, operator-only
Watch Item (text, primary) · Grant (link) · Watchlist Status (select: Awaiting Next Cycle / Not Yet Eligible / Low Priority / Emerging Fit / Relationship Needed / Monitoring) · Next Review Date (date) · What Would Need to Change (long text) · Watchlist Notes (long text)

### Archive, operator-only
Archive Item (text, primary) · Grant (link) · Archive Reason / Status (select: Rejected - Not a Fit / Rejected - Ineligible / Not Awarded / Withdrawn / Other) · Date Archived (date) · Disposition Notes (long text)

### Active Donors, operator-only
Relationship Item (text, primary) · Donor (link) · Relationship Owner (text) · Relationship Stage (select: Prospect / Cultivating / Active Funder / Lapsed) · Last Contact (date) · Relationship Notes (long text)

### Donor Restriction Log, operator-only (the scan reads this; restricted funders are never surfaced)
Restriction Item (text, primary) · Donor (link) · Restriction Type (text) · Restricted Program (text) · Flag Language (long text) · Status (select: Active / Expired) · Restricted Until (date)

## Field types deliberately avoided

Formula, rollup, and lookup fields (the connector cannot reliably create them, and they're read-only, which breaks writes); autoNumber (not creatable through the API; operators may add one in the Airtable UI).
