---
name: "{{org-slug}}-prospect-scan"
description: "Use this skill when running a funding-discovery or prospect scan for {{ORG NAME}} - searching for grant opportunities, scanning donor prospects, looking for funders the org should pursue, or doing a 'find me grants' / 'what funding is out there' pass. It encodes the prioritized, geographic-search-enabled, verify-then-score, honestly-logged scan procedure, including how to handle prospects that turn out to be relationship-only rather than open grants, reads the org's search geography, funding priorities, and eligibility traps live from Our Org Profile, dedups against the single Grant Master table by Stage, and writes discovered opportunities to Grant Master at Stage = Possible via the airtable-write skill. Trigger it whenever the task is discovery (finding new opportunities) as opposed to scoring one already-identified opportunity, and pair it with the grant-scoring and airtable-write skills."
---

# {{ORG NAME}} Prospect Scan (thin / live-read, master model)

This skill runs a funding-discovery pass producing a small number of genuinely-verified, scored opportunities plus an honest record of what was and wasn't covered. Conservative by design: a few real, well-verified opportunities beat a long list of thin entries. Quality and honesty over volume. A human reviews and decides pursuit; this scan surfaces, scores, and recommends.

**Production base: `{{BASE_ID}}` "{{BASE_NAME}}".** Do NOT read from or write to any base whose name carries a "- RETIRE" suffix.

**This skill carries method only.** The org's geography, priorities, populations, and eligibility traps live in **Our Org Profile** and are read at runtime.

---

## Step 0 - Select and read the judgment layer from Our Org Profile (first, every time)

### Which profile to use (multi-profile support)

The **Our Org Profile** table may hold one row or several - an org may keep separate profiles for distinct divisions, programs, or fiscal-sponsor arrangements, and may work from different profiles in different chat sessions.

- **Default**: if the user has not named a profile, use the **first row** in the table, and **state which profile you used** (by its Profile Name) in your output, so the user can correct you if it wasn't the one they intended.
- **Explicit**: if the user names a profile ("use the Equine Program profile", "score this against our fiscal-sponsor profile"), match it against the **Profile Name** field and use that row.
- **Not found**: if the named profile matches no Profile Name, STOP and list the available Profile Names. Do not fall back to the first row - different profiles carry different judgment, and guessing produces a confidently wrong result.
- **Never merge across profiles.** One profile governs one piece of work.

### What to load

From the selected profile row, load: **Search Geography**, **Funding Priority Order**, **Populations Served**, **Programs + Maturity**, **Recurring Eligibility Traps**, **Stage Posture**.

**Halt-on-missing:** if the table is unreadable or any of these is blank, STOP and name the field. Do not scan on guessed defaults.

---

## Step 1 - Choose your scan pathway and prioritize

Two pathways, combinable in a session:
- **Prospect-list pass**: work the team's funder-prospect list; verify and sort in yield order.
- **Active database search**: query approved sources (Step 2) with geographic + keyword inputs.

Order by realistic yield, applying the Funding Priority Order from Our Org Profile:
1. **Recurring / relationship funders due to reopen** - funders the org already holds or has applied to (check Grant Master, Step 3). Relationship and eligibility already proven.
2. **Local / regional funders** in the primary geography that name the org's mission areas.
3. **National funders with genuine open calls** aligned to the org's mission - weighted by Stage Posture (an early-stage org's realistic yield clusters in small local funders and mission-specific programs; do not over-invest in funders whose gates the org fails).
4. **Deprioritize / log-don't-chase**: invitation-only mega-foundations, funders outside the org's eligible geography, civic-club charitable gifts that are not applied-for grants, and funds still in formation.

State which prospects/sources you are targeting and why, so the audit log reflects deliberate choices.

---

## Step 2 - Query with geographic-tiered inputs (active search pathway)

Use the tiered terms from Our Org Profile's Search Geography, combined with issue-area keywords drawn from Populations Served and Programs + Maturity.

### Approved search sources (starting-point checklist, not exhaustive - update per the org's sector as it proves useful)

- **Sector-specific funders**: foundations and programs whose stated focus matches the org's Populations Served / Programs + Maturity.
- **State / regional**: the org's state economic development or grants office, regional community foundations, local funders named in Search Geography.
- **Federal**: Grants.gov and the federal agencies relevant to the org's sector (e.g. USDA Rural Development, Dept. of Education, Dept. of Labor, EDA, NTIA - whichever apply).
- **Foundation databases**: Candid / Foundation Directory Online, GrantWatch, or similar, if the org subscribes.

When a funder looks relevant, fetch and read the full opportunity page and any linked RFP/guidelines. Database summaries alone are not sufficient; verify specifics against primary sources before trusting them.

---

## Step 3 - Check the dedup baseline + Donor Restriction Log (read-only)

Before passing any prospect to verification or scoring, check what the org already holds, has dispositioned, or is restricted from. The master model makes this ONE grants read: **Grant Master**, where the **Stage** field tells you everything. Also read **Donor Restriction Log** and **Donor Master**.

**Search by funder name alone, then inspect the returned records.** `search_records` matches all query terms (AND) within individual fields, and funder and program names live in separate fields - a combined query like "PetSmart Spay Neuter" returns nothing even when the record exists. Search on the funder name (the stable identifier), then read each returned record's Grant Name, Stage, and Pipeline Priority to decide the case. Never dedup on a combined funder+program string. Do not include date fields in a `search_records` fields list (unsearchable type; the call errors) - read dates from the returned record via `list_records_for_table`.

- **Stage = Active or Awarded** -> held or in-flight; not a new discovery. Do not re-surface.
- **Stage = Possible** -> already in the pipeline; do not duplicate. If your scan found materially new information (a new deadline, changed amount), UPDATE the existing record via the airtable-write skill.
- **Stage = Watchlist** -> parked deliberately by the operator; not a new discovery. If your scan found its blocking condition has changed (a cycle reopened, an eligibility gate cleared), note that for the operator rather than creating a new row.
- **Stage = Archived** -> already dispositioned (including grants that were withdrawn - Archive carries the reason); do not resurface unless materially changed. If it genuinely reopened or changed, note that it was previously archived and why.
- **Donor Restriction Log**: if the prospect's funder matches an entry with Status = Active, it is restricted - record the restriction type and flag language, mark ineligible, and do NOT pass it to scoring. If Restricted Until has passed, note it as possibly-stale for the operator rather than treating it as active.

---

## Step 4 - Verify each prospect against its primary source

Find and read the funder's own page or official notice. Confirm: does an open application exist right now (a past deadline means closed, not "urgent")? Eligibility (entity type, geography, org age), award size, deadline/cycle status, match requirement, and every gate named in Our Org Profile's **Recurring Eligibility Traps**.

Reject at this stage, without scoring, if: geography explicitly excludes the org's location; a Recurring Eligibility Trap is triggered; the applicant must be an entity type the org is not and cannot partner into; it is a loan/debt instrument (route to the scoring skill's Loan Posture handling); or the application is closed.

Do NOT reject on gates the Stage Posture says the org clears - read the posture rather than assuming.

---

## Step 5 - Sort each prospect into one of three outcomes

- **Genuine open opportunity** -> score with the grant-scoring skill (full output: Fit /20, level, readiness, priority, downgrade layers, pushback), then write via the airtable-write skill to **Grant Master at Stage = Possible**, and write the funder to **Donor Master** (name + category + website) if not already present. Leave the context-table links (Active Grants (Pre-Award) / Portfolio (Post-Award) / Watchlist / Archive) and Pipeline Priority empty - the operator promotes.
- **Relationship-only / no open application** (invitation-based, institutional foundation funding its own parent, fund still in formation) -> do NOT create a Grant Master opportunity. Note it as a relationship-build finding in the scan output and audit log, including any partnership value. The funder may still be recorded in Donor Master for relationship tracking, at the operator's discretion.
- **Ineligible / structural misfit** (geography-locked, trap-triggered, wrong entity type, restricted, loan) -> note briefly; track as sector intelligence only if useful. Never manufacture an opportunity to pad the count.

A scored opportunity whose Priority comes out as `Watchlist / Future Fit` still gets written at **Stage = Possible** like any other - the recommendation lives in the Priority and Scoring Notes fields. Filing it under `Stage = Watchlist` with a Watchlist context row is the operator's action, never the scan's.

---

## Step 6 - Cap the batch; protect quality

Scan a reviewable batch (~6-8 prospects / a handful of scored opportunities), then stop. Verification is context-heavy; pushing for volume degrades later entries. Log prospects not reached as next-cycle items. A partial, honest pass is expected, not a shortfall.

---

## Step 7 - Check for duplicates before writing

Before creating any Grant Master or Donor Master record, `search_records` on the **funder name** (per Step 3's search discipline), then check the returned records' Grant Name and Stage. If a matching record exists, do not re-create it - update it if the scan found new material facts.

---

## Step 8 - Always write an audit-log entry

Every scan ends with a Search Audit Log entry (use the audit-log skill; the write goes through the airtable-write skill). Record which prospects were searched, the queries run, which were scored vs. relationship-only vs. skipped (including any blocked by the Donor Restriction Log), the stopping rationale, and named prospects still unscanned. The honest "what wasn't covered" is as important as the finds.

---

## Honest expectations

Yield scales with Stage Posture. An early-stage org's realistic yield clusters in small local funders, mission-specific programs, and relationship-build targets; large federal and legacy-foundation gates (audited financials, multi-year outcomes) are real blockers until the org matures. Verify before trusting, and report relationship-only or ineligible findings plainly rather than forcing opportunities to a target number.

---

## Generation note (remove this section when producing the org's actual skill)

Replace `{{org-slug}}`, `{{ORG NAME}}`, `{{BASE_ID}}`, and `{{BASE_NAME}}` with this org's real values from the Step 2 capture. Populate the "Approved search sources" list in Step 2 with sources relevant to this org's actual sector, drawn from its Programs + Maturity and Populations Served - do not carry over another org's source list verbatim.
