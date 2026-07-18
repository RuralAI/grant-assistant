---
name: grant-assistant-startup
description: "Use this skill to install the Grant Assistant for a nonprofit organization from a completed Organization Seed Template - building their Airtable base (master model), ingesting their existing grants, funders, and restrictions as the dedup baseline, generating their four org-tuned operating skills, and verifying the install. Trigger it when a user says 'install the grant assistant', 'set up the grant pipeline for an organization', 'run the startup skill', 'onboard this organization', or provides a filled seed template, and also for re-runs against an existing install (reconcile mode). The blank template is bundled at assets/Org_Seed_Template_BLANK.md - hand it to the user if they haven't filled one out yet."
---

# Grant Assistant — Startup / Installer Skill (v0.2, master model)

This skill turns a completed **Organization Seed Template** into a working Grant Assistant install: one Airtable base (master model), the org's portfolio loaded as a dedup baseline, and four generated operating skills (prospect-scan, grant-scoring, airtable-write, audit-log) tuned to the org.

**The core design: method vs. judgment.** The four generated skills carry *method only* — the universal scan → classify → score → pushback → write → audit loop, verify-before-scoring, flag-gaps-never-invent, and the operator gate. Everything org-specific (stage posture, award bands, fit criteria, durable rules, loan posture, eligibility traps, geography, voice) is *judgment*, and it lives in the org's **Org Profile** table, which the generated skills read live at runtime. Install once; the org evolves its profile in Airtable and skill behavior follows without regeneration.

**The operator gate is a Stage check.** Skills write only Grant Master rows at Stage = Possible. The human operator promotes by flipping Stage and linking a context row. No staging automation exists or should be built.

If the user has no filled template yet, give them `assets/Org_Seed_Template_BLANK.md` and stop until it comes back filled.

---

## Before you start — preconditions (halt on any failure)

1. **A filled seed template** is provided. Ten ★REQUIRED fields must be non-blank: A5 stage posture, D1 search geography, E1 programs with maturity, I1 operating budget, I3 award bands, M1 funding priority order, M2 fit criteria, M4 durable rules, M5 loan posture, M6 recurring eligibility traps. If any is blank, STOP and name the exact field for the org to fill. Do not install on guessed defaults — a wrong default silently mis-scores every future opportunity.
2. **Airtable is connected.** If Airtable tools are unavailable, stop: connect in Settings → Connectors.
3. **Workspace access (hard precondition, learned live).** Call `list_workspaces` and confirm at least one workspace with `create` permission. A connector can be connected yet return an empty workspace list if it was scoped to individual bases only. If empty, STOP and have the user widen the connector's Airtable scope to the workspace / all resources and reconnect. There is no field-by-field fallback (see Build). Also note: a base created outside the connector's scope 403s until explicitly shared in — "base not found" plus a recently created base usually means a scope gap, not a missing base.
4. **First install vs. reconcile.** Search existing bases for the template's N2 base name. If found, switch to Reconcile mode (Step 6) instead of creating a duplicate.

---

## Step 1 — Parse the template into an install plan

Extract and echo back to the user before building:
- **Identity block**: legal name, incorporation status, fiscal sponsor + EIN, org age/stage.
- **Judgment layer** (→ Org Profile fields): stage posture; operating budget + growth target; award bands (min/max + edge note + capital exception); funding priority order; fit criteria + anchors; readiness criteria; durable rules; loan posture; recurring eligibility traps; eligibility nuances; partner sufficiency; search geography (tiered); populations; anchor institutions; programs + maturity tags; mission; problem statement; voice rules; boilerplate.
- **Ingest data** (→ Grant Master / Donor Master / context tables): H1 active grants (with cycle + next-open dates), H2 prospects, H3 awarded/historical, H4 funder/donor list, H5 funder restrictions.
- **Install config**: base name (N2), operator (N3).

Derivation rules (never copy another org's values):
- **Award bands come from the template**, sanity-checked against budget (I1). If bands look inconsistent with budget (e.g., min > 50% of budget), query the user rather than silently adjusting.
- **Stage posture is read, not assumed.** A mature org MAY claim audited financials and multi-year outcomes; an early-stage org may not. The posture text governs; carry it verbatim into Org Profile.
- **Loan posture is org-configurable**: "Exclude outright" or "Case-by-case - flag for board."
- **Recurring eligibility traps are first-class**: every org has at least one (species scope, fiscal-sponsor exclusions, minimum-age rules). If M6 is vague, probe for the concrete trap before install.

---

## Step 2 — Build the base (master model, one create_base call + a link pass)

### The lifecycle the base implements

```
scan writes -> Grant Master (Stage = Possible) -> operator flips Stage + links a context row
                 Stage = Active   -> Active Grants row (working fields)
                 Stage = Awarded  -> Portfolio row (award management)
                 Stage = Archived -> Archive row (disposition)
```

**Grant Master** holds ALL core grant data for every stage — one row per grant, scoring output included, no duplicated master data. **Donor Master** mirrors it for funders. Five **operator-only context tables** (Active Grants, Portfolio, Archive, Active Donors, Donor Restriction Log) hold only stage-specific working fields and link back to their master via `multipleRecordLinks`. Dedup is ONE table read: search Grant Master by funder name; Stage tells the scan everything.

### Build sequence (validated live)

1. **One `create_base` call, all nine tables with full field definitions.** Do NOT create an empty base and add tables afterward — the connector may lack a usable path for it, field-by-field building can't set primary fields, and single-call builds set primaries and exact select options correctly. Tables: Grant Master, Donor Master, Search Audit Log, Org Profile, Active Grants, Portfolio, Archive, Active Donors, Donor Restriction Log.
2. **Link pass**: for each of the five context tables, `create_field` a `multipleRecordLinks` field pointing at its master (`linkedTableId`). Airtable auto-creates the inverse field on the master — capture both IDs. Links cannot reliably be defined inside the single create call; this post-create pass is the validated path.
3. **Capture every generated table/field/option ID from the create responses** into the org's `references/field_map.md` (see Step 4). The create response is authoritative at build time; generated skills re-read live schema before every write thereafter.

### Schema specifics (exact option strings; generated skills depend on them)

- Grant Master **Stage**: Possible / Active / Awarded / Archived / Withdrawn.
- **Restricted vs. Unrestricted**: Unrestricted (General Operating Potential) / Restricted (Program / Project Specific) / Capacity-Building / Capital / Other / Unknown.
- **Match Required**: Yes / No / Unknown. **Fit Level**: High Fit / Medium Fit / Low Fit.
- **Readiness**: Actionable / Needs Eligibility Confirmation / Not Ready This Cycle / Blocked by Eligibility.
- **Priority — exactly FIVE options** (verified against production drift 2026-07-15): High Priority / Medium Priority / High Fit / Needs Readiness Confirmation / Watchlist / Future Fit / Reject. Do not add "High Fit / Not Ready This Cycle" or plain "Watchlist"; the scoring synthesis maps a high-fit-but-not-ready outcome to "Watchlist / Future Fit".
- Grant Master fields: Grant Name (primary), Stage, Funder, Website, Restricted vs. Unrestricted, Project/Program Area, Geography (**free text** — never impose another org's geography vocabulary), Funding Amount Min/Max (currency), Match Required, Match Details, Application Close Date (date/iso), Cycle/Recurrence (One-time / Annual / Multi-year / Rolling), Next Cycle Opens (date/iso), Pipeline Priority (operator-only select), Fit Score (number /20), Fit Level, Readiness, Priority, Scoring Notes / Pushback (multiline), Notes, Provenance.
- Donor Master: Donor Name (primary), Category / Type (select — seed options from the org's H4 funder types), Website, Owner, Notes.
- Search Audit Log: Cycle Date, Conducted By, Search Mode (Discovery scan / Scoring pass / Maintenance / data-management), Queries Run, Coverage Summary, Stopping Rationale, Total Opportunities Identified, Opportunities Added, Gaps / Limitations, Provenance.
- Org Profile (single row; operator-edits, skills read): Legal Name, Incorporation Status, Fiscal Sponsor + EIN, Org Age / Stage, Stage Posture, Operating Budget, Growth Target, Award Band Strong Min / Max, Award Band Edge Note, Capital Exception, Funding Priority Order, Fit Criteria + Anchors, Readiness Criteria, Durable Rules, Loan Posture (Exclude outright / Case-by-case - flag for board), Recurring Eligibility Traps, Eligibility Nuances, Partner Sufficiency, Search Geography, Populations Served, Anchor Institutions, Programs + Maturity, Mission, Problem Statement, Voice Rules, Boilerplate.
- Context tables carry ONLY stage-specific fields plus the master link (e.g., Active Grants: Owner, Internal Deadline, Application Status, Work Notes; Portfolio: Award Date, Award Amount, Reporting Due, Grant Status, Management Notes; Archive: Archive Reason / Status, Date Archived, Disposition Notes; Active Donors: Relationship Owner, Relationship Stage, Last Contact, Relationship Notes; Donor Restriction Log: Restriction Type, Restricted Program, Flag Language, Status Active/Expired, Restricted Until).

### API constraints (learned live — design around them)

- **`autoNumber` cannot be created via the API.** Do not include it in create calls. If the operator wants display keys on context tables, they add them in the Airtable UI after install; the record links are the real relationship.
- **`search_records` is AND-across-terms within single fields** — dedup must search by funder name alone, then inspect returned records. Never include date fields in a search's `fields` list (422).
- **`update_records_for_table` takes `"id"` per record object, not `"recordId"`.**

---

## Step 3 — Ingest the portfolio (the dedup baseline)

**Masters first, then linked context rows.** Install time is the ONE moment this skill writes context tables — it is executing the operator's own template answers. After install, context tables are operator-only forever.

1. **Donor Master**: every funder from H4 (and every funder implied by H1–H3 grants), with category and website.
2. **Grant Master**: every grant from H1/H2/H3, one row each, with Stage set honestly — H1 actives → Active; H2 prospects → Possible; H3 awarded/completed → Awarded or Archived. Carry Cycle/Recurrence and Next Cycle Opens for anything recurring — this is what lets the scan recognize a reopening held grant instead of re-surfacing it.
3. **Context rows, linked**: an Active Grants row per Stage=Active grant (linked to its master row); a Portfolio row per Awarded; an Archive row per Archived; an Active Donors row per current funder; a **Donor Restriction Log row per H5 restriction** (type, flag language, status, end date), linked to its Donor Master row.
4. **Provenance** on every ingested row: "Install ingest from seed template <date>".
5. **Completeness over subset**: ingest EVERYTHING the template lists. A partial baseline means the scan can re-surface funders the org already evaluated (this exact gap occurred in the CRAI migration and had to be flagged in every subsequent audit entry). If the org's list is too large for one session, ingest in batches until complete and record any remainder explicitly in the install audit entry.

If the org has data the template didn't capture (a CRM export, a spreadsheet), ask for it now rather than installing a thin baseline.

---

## Step 4 — Generate the four operating skills

Generate from the **validated full-fidelity production skill set** (grant-scoring, prospect-scan, airtable-write, audit-log — the master-model versions), retargeted to this org:

- Replace every base ID, table ID, field ID, and option ID with THIS org's, from the Step 2 capture. **Zero leakage**: no other org's IDs, names, geography, bands, rules, or examples may appear — verify mechanically (grep the generated files for the source org's identifiers; the FCAS test proved this audit catches leaks).
- Skill names: `<org-slug>-grant-scoring`, `<org-slug>-prospect-scan`, `<org-slug>-airtable-write`, `<org-slug>-audit-log`.
- The airtable-write skill bundles `references/field_map.md` — the full ID snapshot from Step 2, marked "live schema always wins."
- The skills carry method only and read the judgment layer live from Org Profile, with **halt-on-missing**: if a required profile field is blank at runtime, the skill stops and names the field.
- **Package each as a `.skill` file** (skill folder with SKILL.md [+ references/] → packaging script → `.skill`), and present them for install. Warn the user about the two install pitfalls observed live: (a) saving a skill under a name that already exists may NOT replace the old one — uninstall the old version first; (b) leftover older skills with similar names create trigger ambiguity — remove them.

---

## Step 5 — Verify the install (no live scan; one honest audit entry)

Run the E2E verification pattern (validated in production):
1. **Static audit**: every table/field ID referenced by the generated skills exists in the live schema; the org's base ID appears in all four; no foreign base IDs outside explicit warnings.
2. **Org Profile read**: all ten required judgment fields populated — the halt check passes.
3. **Dedup path**: pick an ingested funder; `search_records` Grant Master by funder name; read the row's Stage; confirm the correct scan decision follows.
4. **Write-scope filter**: filter Grant Master by Stage = Possible (option ID from Step 2); confirm exactly the Possible rows return.
5. **Restriction read**: Donor Restriction Log reads cleanly (rows from H5, or empty).
6. **Write path**: write ONE Search Audit Log entry recording the install — Search Mode "Maintenance / data-management", honest coverage (what was ingested, counts per Stage, restrictions seeded), and any remainder or known gaps. This entry is the write test.
7. **Install-integrity check** (after the user saves the skills): read the installed skills' text and confirm each references this org's base — catching the stale-name-collision case where an old same-named skill silently survived.

Report results to the user check by check. Any failure: fix and re-verify before handing over.

---

## Step 6 — Reconcile mode (re-run against an existing install)

When the base already exists: never create a duplicate base and never blindly overwrite.
1. Read the live schema and the Org Profile row; diff against the template.
2. Template changed → propose the specific Org Profile field updates; apply on confirmation (this is the one post-install moment the installer edits Org Profile, as the operator's agent).
3. New H1–H5 entries → ingest the deltas (masters first, then links), dedup-checking by funder name before each create.
4. Schema drift found (renamed fields, changed options) → update the generated skills' field_map and repackage; remind the user to re-save (uninstall old first).
5. Write a Maintenance audit entry describing exactly what the reconcile changed.

---

## What this skill must never do

- Install on guessed defaults or skip a blank ★REQUIRED field.
- Copy any source org's judgment values, IDs, or examples into another org's skills or profile.
- Create staging automation, flip a Stage, or promote a grant — the operator gate is human, permanently.
- Write context tables after install (install-time ingest and explicit reconcile deltas are the only exceptions).
- Claim an external system was updated when it wasn't; every install/reconcile ends with an honest audit entry.
- Delete records or bases. Retirement is the operator renaming with a "- RETIRE" suffix; generated skills carry retired-base IDs only as do-not-touch warnings.

---

## Decisions log (validated through the CRAI production install + E2E test)

1. Method vs. judgment separation; thin skills read Org Profile live at runtime ("install once").
2. Halt-on-missing for required judgment fields — at install AND at every skill runtime.
3. Master model: Grant Master + Donor Master hold all core data; Stage field is the lifecycle AND the operator gate; context tables hold only stage-specific fields, linked via multipleRecordLinks (post-create pass, auto-inverse).
4. Workspace access is a hard install precondition; connector base-scope is an allowlist (new bases 403 until shared in).
5. One create_base call for the schema; autoNumber is not API-creatable; Geography stays free text.
6. Dedup by funder name alone; no date fields in search field lists; update calls use "id".
7. Priority has exactly five options; high-fit-but-not-ready synthesizes to "Watchlist / Future Fit".
8. Ingest is masters-first-then-links, complete rather than subset, with honest provenance and an install audit entry.
9. Generated skills ship as .skill packages; same-name saves may not replace — uninstall first, then verify installed text post-save.
10. Every cycle of any kind ends with an honest Search Audit Log entry; a migration/install is a Maintenance cycle, never a Discovery scan.
