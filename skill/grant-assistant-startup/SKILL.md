---
name: grant-assistant-startup
description: "Use this skill to install the Grant Assistant for a nonprofit from a completed Organization Seed Template - building their Airtable base (master model), ingesting their grants/funders/restrictions as the dedup baseline, generating their five org-tuned skills (prospect-scan, grant-scoring, airtable-write, audit-log, grant-writing), and verifying the install. Trigger for 'install the grant assistant', 'set up the grant pipeline for an organization', 'run the startup skill', 'onboard this organization', or a filled seed template; also for re-runs against an existing install (reconcile mode). Also handles explicit upgrade requests against an existing older install - trigger for 'upgrade my grant assistant', 'add the grant-writing skill', 'update this install' (Step 7, Upgrade mode - explicit request only, never automatic). Blank template bundled at assets/Org-Seed-Template-BLANK.md - hand it to the user if they haven't filled one out yet."
---

# Grant Assistant — Startup / Installer Skill (v1.1, master model)

This skill turns a completed **Organization Seed Template** into a working Grant Assistant install: one Airtable base (master model), the org's portfolio loaded as a dedup baseline, and five generated operating skills (prospect-scan, grant-scoring, airtable-write, audit-log, grant-writing) tuned to the org. It also upgrades an existing older install when explicitly asked (Step 7).

**The core design: method vs. judgment.** The five generated skills carry *method only* — the universal scan → classify → score → pushback → write → audit loop, verify-before-scoring, flag-gaps-never-invent, and the operator gate. Everything org-specific (stage posture, award bands, fit criteria, durable rules, loan posture, eligibility traps, geography, voice) is *judgment*, and it lives in the org's **Our Org Profile** table, which the generated skills read live at runtime. Install once; the org evolves its profile in Airtable and skill behavior follows without regeneration.

**The operator gate is a Stage check.** Skills write only Grant Master rows at Stage = Possible. The human operator promotes by flipping Stage and linking a context row. No staging automation exists or should be built.

If the user has no filled template yet, give them `assets/Org-Seed-Template-BLANK.md` and stop until it comes back filled.

---

## Before you start — preconditions (halt on any failure)

1. **A filled seed template** is provided. Ten ★REQUIRED fields must be non-blank: A5 stage posture, D1 search geography, E1 programs with maturity, I1 operating budget, I3 award bands, M1 funding priority order, M2 fit criteria, M4 durable rules, M5 loan posture, M6 recurring eligibility traps. If any is blank, STOP and name the exact field for the org to fill. Do not install on guessed defaults — a wrong default silently mis-scores every future opportunity.
2. **Airtable is connected.** If Airtable tools are unavailable, stop: connect in Settings → Connectors.
3. **Workspace access (hard precondition, learned live).** Call `list_workspaces` and confirm at least one workspace with `create` permission. A connector can be connected yet return an empty workspace list if it was scoped to individual bases only. If empty, STOP and have the user widen the connector's Airtable scope to the workspace / all resources and reconnect. There is no field-by-field fallback (see Build). Also note: a base created outside the connector's scope 403s until explicitly shared in — "base not found" plus a recently created base usually means a scope gap, not a missing base.
4. **First install vs. reconcile vs. upgrade.** Search existing bases for the template's N2 base name.
   - Not found → fresh install, proceed with Steps 1–5.
   - Found, and the user's request is a normal re-run (new template answers, routine sync) → **Reconcile mode (Step 6)**.
   - Found, and the user explicitly asked to upgrade (e.g., "upgrade to v1", "add the grant-writing skill", "update this install") → **Upgrade mode (Step 7)**.
   - **Upgrade mode never runs on its own.** Finding an existing base is never by itself a reason to add v1 features — only an explicit request triggers Step 7. A routine reconcile against a v0 base proceeds exactly as it always has, untouched by version.

---

## Step 1 — Parse the template into an install plan

Extract and echo back to the user before building:
- **Identity block**: legal name, incorporation status, fiscal sponsor + EIN, org age/stage.
- **Judgment layer** (→ Our Org Profile fields): stage posture; operating budget + growth target; award bands (min/max + edge note + capital exception); funding priority order; fit criteria + anchors; readiness criteria; durable rules; loan posture; recurring eligibility traps; eligibility nuances; partner sufficiency; search geography (tiered); populations; anchor institutions; programs + maturity tags; mission; problem statement; voice rules; boilerplate.
- **Ingest data** (→ Grant Master / Donor Master / context tables): H1 active grants (with cycle + next-open dates), H2 prospects, H3 awarded/historical, H4 funder/donor list, H5 funder restrictions.
- **Install config**: base name (N2), operator (N3).

Derivation rules (never copy another org's values):
- **Award bands come from the template**, sanity-checked against budget (I1). If bands look inconsistent with budget (e.g., min > 50% of budget), query the user rather than silently adjusting.
- **Stage posture is read, not assumed.** A mature org MAY claim audited financials and multi-year outcomes; an early-stage org may not. The posture text governs; carry it verbatim into Our Org Profile.
- **Loan posture is org-configurable**: "Exclude outright" or "Case-by-case - flag for board."
- **Recurring eligibility traps are first-class**: every org has at least one (species scope, fiscal-sponsor exclusions, minimum-age rules). If M6 is vague, probe for the concrete trap before install.

---

## Step 2 — Build the base (master model, one create_base call + a link pass)

### The lifecycle the base implements

```
scan writes -> Grant Master (Stage = Possible) -> operator flips Stage + links a context row
                 Stage = Active    -> Active Grants (Pre-Award) row (working fields)
                 Stage = Awarded   -> Portfolio (Post-Award) row (award management)
                 Stage = Watchlist -> Watchlist row (why-not-now + next review)
                 Stage = Archived  -> Archive row (disposition)
```

**Grant Master** holds ALL core grant data for every stage — one row per grant, scoring output included, no duplicated master data. **Donor Master** mirrors it for funders. Five **operator-only context tables** (Active Grants (Pre-Award), Portfolio (Post-Award), Archive, Active Donors, Donor Restriction Log) hold only stage-specific working fields and link back to their master via `multipleRecordLinks`. Dedup is ONE table read: search Grant Master by funder name; Stage tells the scan everything.

### Build sequence (validated live)

1. **One `create_base` call, all ten tables with full field definitions.** Do NOT create an empty base and add tables afterward — the connector may lack a usable path for it, field-by-field building can't set primary fields, and single-call builds set primaries and exact select options correctly. Tables: Grant Master, Donor Master, Search Audit Log, Our Org Profile, Active Grants (Pre-Award), Portfolio (Post-Award), Watchlist, Archive, Active Donors, Donor Restriction Log.
2. **Link pass**: for each of the six context tables, `create_field` a `multipleRecordLinks` field pointing at its master — four to Grant Master (Active Grants (Pre-Award), Portfolio (Post-Award), Watchlist, Archive) and two to Donor Master (Active Donors, Donor Restriction Log), via `linkedTableId`. Airtable auto-creates the inverse field on the master — capture both IDs. Links cannot reliably be defined inside the single create call; this post-create pass is the validated path.
3. **Capture every generated table/field/option ID from the create responses** into the org's `references/field_map.md` (see Step 4). The create response is authoritative at build time; generated skills re-read live schema before every write thereafter.

### Schema specifics (exact option strings; generated skills depend on them)

- Grant Master **Stage**: Possible / Active / Awarded / Watchlist / Archived. (No "Withdrawn" stage — a withdrawn grant is Stage = Archived with an Archive context row reasoned "Withdrawn".) **Skills set only "Possible"**; every other Stage is an operator action.
- **Restricted vs. Unrestricted**: Unrestricted (General Operating Potential) / Restricted (Program / Project Specific) / Capacity-Building / Capital / Other / Unknown.
- **Match Required**: Yes / No / Unknown. **Fit Level**: High Fit / Medium Fit / Low Fit.
- **Readiness**: Actionable / Needs Eligibility Confirmation / Not Ready This Cycle / Blocked by Eligibility.
- **Priority — exactly FIVE options** (verified against production drift 2026-07-15): High Priority / Medium Priority / High Fit / Needs Readiness Confirmation / Watchlist / Future Fit / Reject. Do not add "High Fit / Not Ready This Cycle" or plain "Watchlist"; the scoring synthesis maps a high-fit-but-not-ready outcome to "Watchlist / Future Fit".
- Grant Master fields: Grant Name (primary), Stage, Funder, Website, Restricted vs. Unrestricted, Project/Program Area, Geography (**free text** — never impose another org's geography vocabulary), Funding Amount Min/Max (currency), Match Required, Match Details, Application Close Date (date/iso), Cycle/Recurrence (One-time / Annual / Multi-year / Rolling), Next Cycle Opens (date/iso), Pipeline Priority (operator-only select), Fit Score (number /20), Fit Level, Readiness, Priority, Scoring Notes / Pushback (multiline), Notes, Provenance.
- Donor Master: Donor Name (primary), Category / Type (select — seed options from the org's H4 funder types), Website, Owner, Notes.
- Search Audit Log: Cycle Date, Conducted By, Search Mode (Discovery scan / Scoring pass / Maintenance / data-management), Queries Run, Coverage Summary, Stopping Rationale, Total Opportunities Identified, Opportunities Added, Gaps / Limitations, Provenance.
- Our Org Profile (operator-edits, skills read): **Profile Name** (text, primary — a short label like "Main" or "Equine Program"; see below), **Installer Version** (text — set to "v1.1" on every fresh install; see below), Legal Name, Incorporation Status, Fiscal Sponsor + EIN, Org Age / Stage, Stage Posture, Operating Budget, Growth Target, Award Band Strong Min / Max, Award Band Edge Note, Capital Exception, Funding Priority Order, Fit Criteria + Anchors, Readiness Criteria, Durable Rules, Loan Posture (Exclude outright / Case-by-case - flag for board), Recurring Eligibility Traps, Eligibility Nuances, Partner Sufficiency, Search Geography, Populations Served, Anchor Institutions, Programs + Maturity, Mission, Problem Statement, Voice Rules, Boilerplate.

**Why Profile Name exists (multi-profile support).** Our Org Profile may hold more than one row. An org might keep separate profiles for distinct divisions or programs, for a fiscally sponsored project versus its parent, or for testing how a different posture changes scoring — and may work from different profiles in different chat sessions. Profile Name is the short label the generated skills match on when the user names a profile explicitly. The skills' protocol is: default to the **first row** and say which one was used; if the user names a profile, match it against Profile Name; if a named profile doesn't exist, halt and list what's available rather than silently falling back. Set Profile Name on the row created at install (e.g. "Main"); the operator adds further rows as needed.

**Why Installer Version exists.** It is the one field that makes a base self-describing to future installer runs, instead of forcing every future run to infer version indirectly (counting skills, checking for fields that may or may not exist). A base built by this installer always has this field, set to the installer version that built or last upgraded it (currently "v1.1"). A base built by the earlier v0 installer will have **no such field at all** — not blank, absent from the schema entirely. That absence is the unambiguous signal Step 7 (Upgrade mode) checks for. Once a v0 base is upgraded, this field is added and set, and the base is self-describing from then on — no future run needs to infer anything again.
- Context tables carry ONLY stage-specific fields plus the master link:
  - **Active Grants (Pre-Award)**: Grant (link), Owner, Internal Deadline, **Application Status** (Researching / Preparing LOI / LOI Submitted - Awaiting Decision / Preparing Full Proposal / Full Proposal Submitted - Awaiting Decision / Awarded - In Portfolio / Declined - In Archive / Withdrawn - In Archive), Work Notes. The three terminal statuses are pointers: they record what became of a pursuit while the authoritative state lives in Grant Master's Stage plus the destination context row.
  - **Portfolio (Post-Award)**: Grant (link), Award Date, Award Amount, Reporting Due, Grant Status (Active - Year 1 / Active - Year 2 / Active - Year 3 / Closed), Management Notes.
  - **Watchlist**: Grant (link), **Watchlist Status** (Awaiting Next Cycle / Not Yet Eligible / Low Priority / Emerging Fit / Relationship Needed / Monitoring), Next Review Date (date/iso), What Would Need to Change (multiline), Watchlist Notes (multiline).
  - **Archive**: Grant (link), Archive Reason / Status (Rejected - Not a Fit / Rejected - Ineligible / Not Awarded / Withdrawn / Other), Date Archived, Disposition Notes.
  - **Active Donors**: Donor (link), Relationship Owner, Relationship Stage (Prospect / Cultivating / Active Funder / Lapsed), Last Contact, Relationship Notes.
  - **Donor Restriction Log**: Donor (link), Restriction Type, Restricted Program, Flag Language, Status (Active / Expired), Restricted Until.

### API constraints (learned live — design around them)

- **`autoNumber` cannot be created via the API.** Do not include it in create calls. If the operator wants display keys on context tables, they add them in the Airtable UI after install; the record links are the real relationship.
- **`search_records` is AND-across-terms within single fields** — dedup must search by funder name alone, then inspect returned records. Never include date fields in a search's `fields` list (422).
- **`update_records_for_table` takes `"id"` per record object, not `"recordId"`.**

---

## Step 3 — Ingest the portfolio (the dedup baseline)

**Masters first, then linked context rows.** Install time is the ONE moment this skill writes context tables — it is executing the operator's own template answers. After install, context tables are operator-only forever.

1. **Donor Master**: every funder from H4 (and every funder implied by H1–H3 grants), with category and website.
2. **Grant Master**: every grant from H1/H2/H3, one row each, with Stage set honestly — H1 actives → Active; H2 prospects → Possible; H3 awarded/completed → Awarded or Archived. Carry Cycle/Recurrence and Next Cycle Opens for anything recurring — this is what lets the scan recognize a reopening held grant instead of re-surfacing it.
3. **Context rows, linked**: an Active Grants (Pre-Award) row per Stage=Active grant (linked to its master row); a Portfolio (Post-Award) row per Awarded; an Archive row per Archived; an Active Donors row per current funder; a **Donor Restriction Log row per H5 restriction** (type, flag language, status, end date), linked to its Donor Master row.
4. **Provenance** on every ingested row: "Install ingest from seed template <date>".
5. **Completeness over subset**: ingest EVERYTHING the template lists. A partial baseline means the scan can re-surface funders the org already evaluated (this exact gap occurred in the CRAI migration and had to be flagged in every subsequent audit entry). If the org's list is too large for one session, ingest in batches until complete and record any remainder explicitly in the install audit entry.

If the org has data the template didn't capture (a CRM export, a spreadsheet), ask for it now rather than installing a thin baseline.

---

## Step 4 — Generate the five operating skills

Generate from the **canonical templates committed at `skill/templates/`** in this repo (`grant-scoring.template.md`, `prospect-scan.template.md`, `airtable-write.template.md`, `audit-log.template.md`, `grant-writing.template.md`) — these are the real, versioned source, not a tacit reference to a prior session. See `skill/templates/README.md` for the full templating convention; in short:

- Every template references tables and fields **by name**, never by hardcoded ID — the generated skill still says "Stage Posture," "Grant Master," etc. verbatim. Only the header placeholders (`{{org-slug}}`, `{{ORG NAME}}`, `{{BASE_ID}}`, `{{BASE_NAME}}`) get substituted with this org's real values from the Step 2 capture.
- **Zero leakage**: no other org's IDs, names, geography, bands, rules, or examples may appear in the output — verify mechanically (grep the generated files for any other org's identifiers; the FCAS test proved this audit catches leaks).
- Skill names: `<org-slug>-grant-scoring`, `<org-slug>-prospect-scan`, `<org-slug>-airtable-write`, `<org-slug>-audit-log`, `<org-slug>-grant-writing`.
- The airtable-write skill bundles `references/field_map.md` — the full ID snapshot from Step 2, marked "live schema always wins."
- The skills carry method only and read the judgment layer live from Our Org Profile, with **halt-on-missing**: if a required profile field is blank at runtime, the skill stops and names the field.
- **Package each as a `.skill` file** (skill folder with SKILL.md [+ references/] → packaging script → `.skill`), and present them for install. Warn the user about the two install pitfalls observed live: (a) saving a skill under a name that already exists may NOT replace the old one — uninstall the old version first; (b) leftover older skills with similar names create trigger ambiguity — remove them.

The **grant-writing** skill (new in v1) is generated the same way as the other four, from `skill/templates/grant-writing.template.md`. Its method in brief: it gates on **Stage = Active** (promotion is the pursuit decision, mirroring the write skill's Stage = Possible gate in reverse); it reads Our Org Profile's Stage Posture, Programs + Maturity, and Voice Rules plus the target grant's Scoring Notes / Pushback, and must not contradict the pushback; it builds a **claims inventory** (CLAIMABLE / CLAIMABLE WITH FRAMING / GAP) before drafting a word, so unverifiable claims become visible placeholders rather than invented evidence; and it never writes to Airtable or submits anything. See the template file for the full, generation-ready method.

---

## Step 5 — Verify the install (no live scan; one honest audit entry)

Run the E2E verification pattern (validated in production):
1. **Static audit**: every table/field ID referenced by the generated skills exists in the live schema; the org's base ID appears in all five; no foreign base IDs outside explicit warnings. Confirm all ten tables exist and all six context-table links resolve bidirectionally.
2. **Our Org Profile read**: all ten required judgment fields populated — the halt check passes. Confirm **Installer Version** = "v1.1" and **Profile Name** were written.
3. **Dedup path**: pick an ingested funder; `search_records` Grant Master by funder name; read the row's Stage; confirm the correct scan decision follows.
4. **Write-scope filter**: filter Grant Master by Stage = Possible (option ID from Step 2); confirm exactly the Possible rows return.
5. **Restriction read**: Donor Restriction Log reads cleanly (rows from H5, or empty).
6. **Grant-writing gate check**: if any grant was ingested at Stage = Active, confirm the grant-writing skill's description correctly identifies it as draftable; confirm a Stage = Possible grant is correctly identified as NOT draftable (name it, don't actually generate a draft during verification).
7. **Write path**: write ONE Search Audit Log entry recording the install — Search Mode "Maintenance / data-management", honest coverage (what was ingested, counts per Stage, restrictions seeded), and any remainder or known gaps. This entry is the write test.
8. **Install-integrity check** (after the user saves the skills): read the installed skills' text and confirm each references this org's base — catching the stale-name-collision case where an old same-named skill silently survived.

Report results to the user check by check. Any failure: fix and re-verify before handing over.

---

## Step 6 — Reconcile mode (re-run against an existing install)

When the base already exists: never create a duplicate base and never blindly overwrite.
1. Read the live schema and the Our Org Profile row; diff against the template.
2. Template changed → propose the specific Our Org Profile field updates; apply on confirmation (this is the one post-install moment the installer edits Our Org Profile, as the operator's agent).
3. New H1–H5 entries → ingest the deltas (masters first, then links), dedup-checking by funder name before each create.
4. Schema drift found (renamed fields, changed options) → update the generated skills' field_map and repackage; remind the user to re-save (uninstall old first).
5. Write a Maintenance audit entry describing exactly what the reconcile changed.

---

## Step 7 — Upgrade mode (explicit trigger only)

**This mode never runs on its own.** Finding an existing base during the precondition check is never sufficient reason to enter this mode — only an explicit request is ("upgrade to v1.1", "add the grant-writing skill", "update this install"). A normal reconcile run against an older base proceeds via Step 6, untouched, forever, unless the user explicitly asks for an upgrade.

### 1. Detect the version

Read the Our Org Profile / Org Profile table **schema** (not just the row). Note that the table itself may be named either way depending on vintage — check both.

- **No `Installer Version` field anywhere in the schema** → a **v0** (pre-versioning) install. Apply the v0→v1.1 delta: everything in both lists below.
- **`Installer Version` = "v1.0"** → apply the v1.0→v1.1 delta (list B only).
- **`Installer Version` = "v1.1"** → already current. Report the version and ask what specifically the user wants changed; do not blind-re-upgrade.

### 2. Enumerate the delta and confirm before changing anything

**List A — v0 only (skipped for a v1.0 base):**
- Add the `Installer Version` field to the profile table.
- Generate, package, and present the **grant-writing skill** (Step 4).

**List B — all upgrades to v1.1:**
- Add the **`Profile Name`** field to the profile table; set it on the existing row (suggest "Main").
- **Rename tables**: `Org Profile` → `Our Org Profile`; `Portfolio` → `Portfolio (Post-Award)`; `Active Grants` → `Active Grants (Pre-Award)`. Airtable renames preserve table and field IDs, so no data moves and no links break.
- **Grant Master `Stage`**: add the `Watchlist` option.
- **Create the `Watchlist` table** (fields per Step 2) and add its `multipleRecordLinks` field to Grant Master.
- **Active Grants (Pre-Award) `Application Status`**: add the eight v1.1 options.
- Set `Installer Version` to "v1.1".

### 3. Two data-safety checks that must run before touching options

**Check for rows at `Stage = Withdrawn`.** v1.1 has no Withdrawn stage. Query Grant Master first. If any rows use it, do NOT remove the option — report the affected rows and ask the operator to re-file them (Stage = Archived plus an Archive context row reasoned "Withdrawn"). Only once no rows reference it may the option be removed, and leaving it in place indefinitely is an acceptable outcome. Never delete a select option that live records still use.

**Do not auto-map old `Application Status` values.** The old four (Drafting / Internal Review / Submitted / Awaiting Decision) don't carry the LOI-versus-full-proposal distinction the new eight are built around, so every mapping would be a guess. **Add** the new options alongside the old ones, leave existing rows untouched, and tell the operator to re-file them as they go. Do not remove the old options while any row still uses them.

### 4. Apply only the confirmed items

Never touch Grant Master or Donor Master **data**. Renames and additive option/field/table changes are the whole scope. Nothing is deleted.

### 5. Regenerate ALL FIVE skills — this upgrade is not additive-only

Because the table renames change names the generated skills resolve fields by, **every installed skill must be regenerated and re-presented**, not just the new one. This differs from the v0→v1 upgrade, which was purely additive. Re-read the live schema first (never trust the original install's captured IDs), regenerate all five from `skill/templates/`, repackage, and present them with the usual two install-pitfall warnings (uninstall the same-named old version first; remove leftovers to avoid trigger ambiguity).

### 6. Write a Maintenance audit entry

Describe exactly what was upgraded, including anything deliberately left alone — e.g. "v1.0 → v1.1: renamed three tables; added Profile Name and Watchlist stage; created Watchlist table; added eight Application Status options (old four retained, 3 rows still using them); regenerated all five skills." The base's own history should show when and how it crossed the version line, and what remains for the operator to re-file.

---

## What this skill must never do

- Install on guessed defaults or skip a blank ★REQUIRED field.
- Copy any source org's judgment values, IDs, or examples into another org's skills or profile.
- Create staging automation, flip a Stage, or promote a grant — the operator gate is human, permanently.
- Write context tables after install (install-time ingest and explicit reconcile deltas are the only exceptions).
- Claim an external system was updated when it wasn't; every install/reconcile ends with an honest audit entry.
- Delete records or bases. Retirement is the operator renaming with a "- RETIRE" suffix; generated skills carry retired-base IDs only as do-not-touch warnings.
- Enter Upgrade mode (Step 7) without an explicit request — an existing base found during preconditions defaults to Reconcile mode (Step 6), never to an unsolicited upgrade.
- Touch Grant Master or Donor Master **data** during an upgrade — Step 7 changes schema (renames, added fields/options/tables) and regenerates skills; it never edits, moves, or deletes records.
- Delete a select option that live records still use — check first, report the affected rows, and let the operator re-file them (see Step 7's data-safety checks).
- Auto-map old option values onto a new option set when the mapping is ambiguous — add the new options, leave existing rows alone, and tell the operator what needs re-filing.
- Set `Stage = Watchlist` (or any Stage other than Possible). A watchlist outcome is a Priority recommendation on a Stage = Possible row; filing it under the Watchlist stage is the operator's action.

---

## Decisions log (validated through the CRAI production install + E2E test)

1. Method vs. judgment separation; thin skills read Our Org Profile live at runtime ("install once").
2. Halt-on-missing for required judgment fields — at install AND at every skill runtime.
3. Master model: Grant Master + Donor Master hold all core data; Stage field is the lifecycle AND the operator gate; context tables hold only stage-specific fields, linked via multipleRecordLinks (post-create pass, auto-inverse).
4. Workspace access is a hard install precondition; connector base-scope is an allowlist (new bases 403 until shared in).
5. One create_base call for the schema; autoNumber is not API-creatable; Geography stays free text.
6. Dedup by funder name alone; no date fields in search field lists; update calls use "id".
7. Priority has exactly five options; high-fit-but-not-ready synthesizes to "Watchlist / Future Fit".
8. Ingest is masters-first-then-links, complete rather than subset, with honest provenance and an install audit entry.
9. Generated skills ship as .skill packages; same-name saves may not replace — uninstall first, then verify installed text post-save.
10. Every cycle of any kind ends with an honest Search Audit Log entry; a migration/install is a Maintenance cycle, never a Discovery scan.
11. **(v1)** A base is version-self-describing via the Our Org Profile **Installer Version** field; its absence (not blankness) is the unambiguous signal of a pre-versioning v0 install.
12. **(v1)** Upgrading an existing install is explicit-trigger-only, never automatic on discovering an existing base — a routine reconcile against a v0 base is unaffected by the existence of v1.
13. **(v1)** The grant-writing skill gates on Stage = Active (promotion is the pursuit decision, same principle as the write-skill's Stage = Possible gate in reverse); it reads the scoring skill's pushback as a writing input and must not contradict it; its claims inventory (CLAIMABLE / CLAIMABLE WITH FRAMING / GAP) is the mechanism that keeps drafts from over-claiming.
14. **(v1)** All five generated skills are produced from templates committed at `skill/templates/`, not from tacit prior-session memory — a fresh Claude session with no history of this project can run Step 4 correctly by reading the repo alone. Templates reference tables/fields by name, never by hardcoded ID, so generation substitutes only the org header placeholders.
15. **(v1.1)** Table names carry their lifecycle position explicitly (`Active Grants (Pre-Award)`, `Portfolio (Post-Award)`, `Our Org Profile`) so the base reads like grant-management software rather than a schema.
16. **(v1.1)** `Watchlist` is a full lifecycle stage with its own context table and six statuses, mirroring Active/Awarded/Archived. Skills still write **only** at Stage = Possible; a watchlist outcome is a Priority recommendation the operator acts on. The write gate was deliberately not widened.
17. **(v1.1)** `Withdrawn` is no longer a Stage — it's an Archive disposition reason, so a withdrawn grant lands at Stage = Archived with an Archive row reasoned "Withdrawn". Existing rows using the old Stage are re-filed by the operator, never auto-migrated.
18. **(v1.1)** Our Org Profile supports **multiple rows**, selected by a `Profile Name` label. Skills default to the first row and say which they used; an explicitly named profile that doesn't exist causes a halt, never a silent fallback to the default — different profiles carry different judgment.
19. **(v1.1)** An upgrade involving table renames is **not additive-only**: because skills resolve fields by name, all five must be regenerated. Renames are still data-safe (Airtable preserves IDs through a rename).
