---
name: grant-assistant-startup
description: "Use this skill to install the Grant Assistant for a nonprofit from a completed Organization Seed Template or a live interview - building their Airtable base (master model), ingesting their grants/funders/restrictions as the dedup baseline, generating their five org-tuned skills (prospect-scan, grant-scoring, airtable-write, audit-log, grant-writing), and verifying the install. Trigger for 'install the grant assistant', 'set up the grant pipeline', 'run the startup skill', 'onboard this organization', or a filled seed template; also for re-runs against an existing install (reconcile mode). Also handles explicit upgrade requests against an older install - trigger for 'upgrade my grant assistant', 'add the grant-writing skill', 'update this install' (Step 7, explicit request only, never automatic). Bundled: seed-template.md (blank form), templates/ (the five skill sources), table-schema.mjs (the base schema). Step 0 routes around any bundled file that did not install."
---

# Grant Assistant - Startup / Installer Skill

**Version:** 1.2.0 · Center for Rural AI

This skill turns a completed **Organization Seed Template** (or a live interview) into a working Grant Assistant install: one Airtable base (master model), the org's portfolio loaded as a dedup baseline, and five generated operating skills tuned to the org. It also upgrades an existing older install when explicitly asked (Step 7).

**The core design: method vs. judgment.** The five generated skills carry *method only*: the universal scan, classify, score, pushback, write, audit loop, verify-before-scoring, flag-gaps-never-invent, and the operator gate. Everything org-specific (stage posture, award bands, fit criteria, durable rules, loan posture, eligibility traps, geography, voice) is *judgment*, and it lives in the org's **Our Org Profile** table, which the generated skills read live at runtime. Install once; the org evolves its profile in Airtable and skill behavior follows without regeneration.

**The operator gate is a Stage check.** Skills write only Grant Master rows at Stage = Possible. The human operator promotes by flipping Stage and linking a context row. No staging automation exists or should be built.

---

## Step 0 - Check what you can actually reach, then route

Before anything else, check which bundled files are available in this skill's folder:

- `table-schema.mjs` - the canonical base schema (ten tables, exact option strings, link pass)
- `seed-template.md` - the blank seed document, for orgs that arrive without one
- `templates/` - the five operating-skill sources this installer generates from
- Whether code execution is available in this conversation

Then route:

| What is available | What to do |
| --- | --- |
| Everything | Normal path. Build from `table-schema.mjs`; generate from `templates/`. |
| Files present, no code execution | Read `table-schema.mjs` as text (it is readable prose-with-structure) or provision from **Appendix A** below, field by field. |
| Some bundled files missing | Use what is present; provision from **Appendix A** for anything missing; generate skills from the public repo copies (see below) or Appendix A knowledge. Tell the operator which files did not install and that they should re-upload the `.skill` file afterwards. |
| Only this SKILL.md reached you | Provision from **Appendix A**. Same message to the operator. |

**Do not stop, and do not guess field names.** An installer that halts at Step 0 because a helper file is missing fails the one job it has. Appendix A exists so that neither halting nor guessing is ever necessary.

**Never substitute another skill's files.** A different pilot's `table-schema.mjs` builds an unrelated base. If a file does not match the shape this skill expects, it is the wrong file; use Appendix A instead.

**Freshness source:** the public repo at `https://github.com/RuralAI/grant-assistant` holds the current copies of everything bundled here. If web access is available and the operator wants the very latest templates, read them from the repo's `skills/grant-assistant-startup/templates/`; the bundled copies are the always-works fallback. A repo path is never a substitute for the bundled files at runtime - it is a freshness upgrade when reachable.

---

## Before you start - preconditions (work through in order)

1. **A seed document or a live interview.** If the operator attached a filled template, read it now. If not, interview them live using the questions in `seed-template.md` (or Appendix A's required-fields list if the bundle is missing). Interviewing is the default fallback; never insist on the document. Either way, ten ★ REQUIRED fields must end up answered: A5 stage posture, D1 search geography, E1 programs with maturity, I1 operating budget, I3 award bands, M1 funding priority order, M2 fit criteria, M4 durable rules, M5 loan posture, M6 recurring eligibility traps. If any is blank, STOP and ask for that exact field. Do not install on guessed defaults: a wrong default silently mis-scores every future opportunity.
2. **Airtable is connected.** If Airtable tools are unavailable, stop: connect in Settings, then Connectors.
3. **Workspace access (hard precondition, learned live).** Call `list_workspaces` and confirm at least one workspace with `create` permission. A connector can be connected yet return an empty workspace list if it was scoped to individual bases only. If empty, STOP and have the operator widen the connector's Airtable scope to the workspace (all resources) and reconnect. Also note: a base created outside the connector's scope returns permission errors until explicitly shared in; "base not found" plus a recently created base usually means a scope gap, not a missing base.
4. **Existing-install check - routes the entire run.** Search existing bases for the seed document's N2 base name (and for any base whose Our Org Profile / Org Profile table carries an `Installer Version` field). Route to exactly one mode:

   | What you find | Mode |
   | --- | --- |
   | No base | **Fresh install** (Steps 1-5) |
   | A base whose `Installer Version` matches this skill's version | **Reconcile** (Step 6) |
   | A base with an older `Installer Version`, or none in its schema | Requires **Upgrade**, but see the hard rule |

   **The hard rule: finding an older base never triggers an upgrade on its own.** Only a direct request does ("upgrade my grant assistant", "add the grant-writing skill"). A routine run against an older base reports what it found, says what an upgrade would do, and waits. An operator who asked for a routine check did not consent to regenerated skills and changed options.

---

## Set expectations, then wait for a go-ahead

Before provisioning anything, state in practical terms: this takes about 15 minutes; it uses a good portion of a day's Claude usage on a Pro plan, so it is best started fresh; what will exist when it finishes (the base, the loaded portfolio, five skills to save); and that the operator stays in charge - the system finds and recommends, a person decides. Then wait for a clear go-ahead. Never begin on an ambiguous answer.

---

## Step 1 - Parse the template (or interview answers) into an install plan

Extract and echo back to the operator before building:

- **Identity block**: legal name, incorporation status, fiscal sponsor + EIN, org age/stage.
- **Judgment layer** (to Our Org Profile fields): stage posture; operating budget + growth target; award bands (min/max + edge note + capital exception); funding priority order; fit criteria + anchors; readiness criteria; durable rules; loan posture; recurring eligibility traps; eligibility nuances; partner sufficiency; search geography (tiered); populations; anchor institutions; programs + maturity tags; mission; problem statement; voice rules; boilerplate.
- **Ingest data**: H1 active grants (with cycle + next-open dates), H2 prospects, H3 awarded/historical, H4 funder/donor list, H5 funder restrictions.
- **Install config**: base name (N2), operator (N3).

Derivation rules (never copy another org's values): award bands come from the template, sanity-checked against budget (query the operator if inconsistent rather than silently adjusting); stage posture is read, not assumed, and carried verbatim; loan posture is org-configurable; recurring eligibility traps are first-class - if M6 is vague, probe for the concrete trap before install.

---

## Step 2 - Build the base (one create_base call, then a link pass)

The full schema (ten tables, every field, exact option strings) is canonical in `table-schema.mjs` and rendered human-readable in **Appendix A**. The lifecycle it implements:

```
scan writes -> Grant Master (Stage = Possible) -> operator flips Stage + links a context row
                 Stage = Active    -> Active Grants (Pre-Award) row (working fields)
                 Stage = Awarded   -> Portfolio (Post-Award) row (award management)
                 Stage = Watchlist -> Watchlist row (why-not-now + next review)
                 Stage = Archived  -> Archive row (disposition)
```

Build sequence (validated live):

1. **One `create_base` call, all ten tables with full field definitions** from the schema. Do NOT create an empty base and add tables afterward: the connector may lack a usable path for it, field-by-field building cannot set primary fields, and single-call builds set primaries and exact select options correctly.
2. **Link pass**: add the six `multipleRecordLinks` fields per the schema's `linkPass` (four context tables to Grant Master, two to Donor Master). Airtable auto-creates the inverse field on each master; capture both IDs.
3. **Capture every generated table/field/option ID** from the create responses into the org's `references/field_map.md` (used in Step 4). The create response is authoritative at build time; generated skills re-read live schema before every write thereafter.

API constraints (learned live, design around them): `autoNumber` is not API-creatable (operators may add one in the UI); `search_records` is AND-across-terms within single fields, so dedup searches by funder name alone; never include date fields in a search's fields list (the call errors); `update_records_for_table` takes `"id"` per record object, not `"recordId"`; formula/rollup/lookup fields are avoided by design (read-only and unreliable to create).

---

## Step 3 - Ingest the portfolio (the dedup baseline)

**Masters first, then linked context rows.** Install time is the ONE moment this skill writes context tables: it is executing the operator's own template answers. After install, context tables are operator-only forever.

1. **Donor Master**: every funder from H4 (and every funder implied by H1-H3 grants), with category and website.
2. **Grant Master**: every grant from H1/H2/H3, one row each, with Stage set honestly: H1 actives to Active; H2 prospects to Possible; H3 awarded/completed to Awarded or Archived. Carry Cycle/Recurrence and Next Cycle Opens for anything recurring - this is what lets the scan recognize a reopening held grant instead of re-surfacing it.
3. **Context rows, linked**: an Active Grants (Pre-Award) row per Stage = Active grant; a Portfolio (Post-Award) row per Awarded; an Archive row per Archived; an Active Donors row per current funder; a Donor Restriction Log row per H5 restriction, linked to its Donor Master row.
4. **Our Org Profile**: one row carrying the full judgment layer, `Profile Name` set (suggest "Main"), and `Installer Version` set to this skill's version.
5. **Provenance** on every ingested row: "Install ingest from seed template <date>".
6. **Completeness over subset**: ingest EVERYTHING the template lists. A partial baseline means the scan can re-surface funders the org already evaluated. If the list is too large for one session, ingest in batches until complete and record any remainder explicitly in the install audit entry.

If the org has data the template did not capture (a CRM export, a spreadsheet), ask for it now rather than installing a thin baseline.

---

## Step 4 - Generate the five operating skills

Generate from the **bundled templates in this skill's `templates/` folder** (`grant-scoring.template.md`, `prospect-scan.template.md`, `airtable-write.template.md`, `audit-log.template.md`, `grant-writing.template.md`). These are the runtime source. When web access is available, the public repo's copies may be read instead for freshness; when neither the bundle nor the repo is reachable, say so and stop skill generation (the base install above still stands) rather than generating from memory.

Conventions (full rationale in `templates/README.md`):

- Every template references tables and fields **by name**, never by hardcoded ID. Only the header placeholders (`{{org-slug}}`, `{{ORG NAME}}`, `{{BASE_ID}}`, `{{BASE_NAME}}`) are substituted, from the Step 2 capture.
- **Zero leakage**: no other org's IDs, names, geography, bands, rules, or examples may appear in the output. Verify mechanically: search the generated files for any other org's identifiers.
- Skill names: `<org-slug>-grant-scoring`, `<org-slug>-prospect-scan`, `<org-slug>-airtable-write`, `<org-slug>-audit-log`, `<org-slug>-grant-writing`.
- The airtable-write skill bundles `references/field_map.md`: the full ID snapshot from Step 2, marked "live schema always wins."
- The skills carry method only and read the judgment layer live from Our Org Profile, with **halt-on-missing**: if a required profile field is blank at runtime, the skill stops and names the field. Multi-profile: skills default to the first profile row and state which they used; a named profile that does not exist halts with the available names listed.
- Stamp each generated SKILL.md with this installer's version line under its H1.
- **Package each as a `.skill` file** and present them for install, with the two install-pitfall warnings observed live: (a) saving a skill under a name that already exists may NOT replace the old one - uninstall the old version first; (b) leftover older skills with similar names create trigger ambiguity - remove them.

The grant-writing skill gates on **Stage = Active** (promotion is the pursuit decision), reads the scoring skill's pushback as a writing input and must not contradict it, and builds a claims inventory (CLAIMABLE / CLAIMABLE WITH FRAMING / GAP) before drafting so unverifiable claims become visible placeholders. See its template for the full method.

---

## Step 5 - Verify, report each check, then name the next step

Do not report success until each is confirmed and reported individually:

1. **Static audit**: all ten tables exist with the expected fields; all six context-table links resolve in both directions; the org's base ID appears in all five generated skills; no foreign base IDs outside explicit warnings.
2. **Our Org Profile**: one row; all ten required judgment fields populated (the halt check passes); `Installer Version` and `Profile Name` written.
3. **Dedup path**: pick an ingested funder; search Grant Master by funder name; read the row's Stage; confirm the correct scan decision follows.
4. **Write-scope filter**: filter Grant Master by Stage = Possible; confirm exactly the Possible rows return (the write gate actually gates).
5. **Restriction read**: Donor Restriction Log reads cleanly (rows from H5, or empty).
6. **Grant-writing gate check**: confirm a Stage = Active grant (if any was ingested) is identified as draftable and a Stage = Possible grant is identified as NOT draftable (name it; do not generate a draft during verification).
7. **Write path**: write ONE Search Audit Log entry recording the install: Search Mode "Maintenance / data-management", honest coverage (what was ingested, counts per Stage, restrictions seeded), and any remainder or known gaps. This entry is the write test, and it stays: it is the base's own record of its install, not junk to remove.
8. **Install-integrity check** (after the operator saves the skills): read the installed skills' text and confirm each references this org's base, catching the stale-name-collision case where an old same-named skill silently survived.

Then name the specific next skill to invoke (normally: "run a prospect scan with `<org-slug>-prospect-scan`"). An install that ends without telling the operator what to do next is not finished.

---

## Step 6 - Reconcile mode (re-run against a current-version install)

Never create a duplicate base and never blindly overwrite. **Reconcile is additive only**: add missing things, never delete, never rename, never change a type; report drift rather than correcting it.

1. Read the live schema and the Our Org Profile row(s); diff against the template.
2. Template changed: propose the specific Our Org Profile field updates; apply on confirmation (the one post-install moment the installer edits the profile, as the operator's agent).
3. New H1-H5 entries: ingest the deltas (masters first, then links), dedup-checking by funder name before each create.
4. Schema drift found (renamed fields, changed options): report it and update the generated skills' field_map; repackage; remind the operator to re-save (uninstall old first).
5. Write a Maintenance audit entry describing exactly what the reconcile changed.

---

## Step 7 - Upgrade mode (explicit trigger only)

**This mode never runs on its own.** Only a direct request enters it. A routine run against an older base proceeds via the precondition report and stops.

1. **Detect the version.** Read the profile table's **schema** (the table is named `Our Org Profile` on current bases, `Org Profile` on the oldest; check both). No `Installer Version` field anywhere in the schema means a pre-versioning (v0) install. Historical stamp values: `v1.0`, `v1.1`. Current: this skill's version. A **blank value in a field that exists** means an earlier install failed partway; say so out loud rather than treating it as fresh.
2. **Enumerate the delta and confirm before changing anything.**
   - From **v0**: add `Installer Version`; generate and present the grant-writing skill; then everything in the v1.1 delta below.
   - From **v1.0**: add `Profile Name`; rename tables (`Org Profile` to `Our Org Profile`, `Portfolio` to `Portfolio (Post-Award)`, `Active Grants` to `Active Grants (Pre-Award)`); add the `Watchlist` Stage option; create the `Watchlist` table + its link field; add the eight Application Status options.
   - From **v1.1**: schema is current; update the stamp to this version. Nothing else.
3. **Data-safety rules (non-negotiable, all learned live):**
   - **Never delete a select option that live records still use.** Check for rows at `Stage = Withdrawn` (and any old Application Status values) first; list them; let the operator re-file before any option is removed. Leaving an old option in place indefinitely is an acceptable outcome.
   - **Never auto-map old values onto a new option set.** The old four statuses do not carry the LOI-versus-proposal distinction of the new eight; every mapping would be a guess. Add the new options, leave existing rows untouched, tell the operator what needs re-filing.
   - **A rename means regenerate every skill, not only new ones.** Airtable preserves IDs through renames so no data moves, but skills resolve fields by name.
4. **Apply only the confirmed items.** Upgrades change schema (renames, added fields/options/tables) and regenerate skills; they never edit, move, or delete records.
5. **Regenerate and present all five skills** (re-read live schema first; never trust the original install's captured IDs), with the same two install-pitfall warnings.
6. **Set `Installer Version` to this skill's version** and write a Maintenance audit entry describing exactly what was upgraded, including anything deliberately left alone.

---

## What this skill must never do

- Install on guessed defaults or skip a blank ★ REQUIRED field.
- Copy any source org's judgment values, IDs, or examples into another org's skills or profile.
- Create staging automation, flip a Stage, or promote a grant: the operator gate is human, permanently.
- Write context tables after install (install-time ingest and explicit reconcile deltas are the only exceptions).
- Enter Upgrade mode without an explicit request.
- Delete a select option that live records still use, or auto-map ambiguous option values.
- Set `Stage = Watchlist` or any Stage other than Possible; a watchlist outcome is a Priority recommendation on a Possible row.
- Claim an external system was updated when it was not; every install/reconcile/upgrade ends with an honest audit entry.
- Delete records or bases. Retirement is the operator renaming with a "- RETIRE" suffix; generated skills treat retired-base IDs as do-not-touch warnings.
- Halt at Step 0 because a bundled file is missing, or guess field names instead of using Appendix A.

---

## Decisions log (validated through live installs; see CHANGELOG.md for release history)

1. Method vs. judgment separation; thin skills read Our Org Profile live at runtime ("install once").
2. Halt-on-missing for required judgment fields, at install AND at every skill runtime.
3. Master model: Grant Master + Donor Master hold all core data; Stage is the lifecycle AND the operator gate; context tables hold only stage-specific fields, linked via a post-create pass.
4. Workspace access is a hard install precondition; connector base scope is an allowlist.
5. One create_base call for the schema; autoNumber is not API-creatable; Geography stays free text.
6. Dedup by funder name alone; no date fields in search field lists; update calls use "id".
7. Priority has exactly five options; high-fit-but-not-ready synthesizes to "Watchlist / Future Fit"; a watchlist outcome never changes Stage.
8. Ingest is masters-first-then-links, complete rather than subset, with honest provenance and an install audit entry.
9. Generated skills ship as .skill packages; same-name saves may not replace (uninstall first, verify installed text post-save).
10. Every cycle ends with an honest Search Audit Log entry; an install/upgrade is a Maintenance cycle, never a Discovery scan.
11. A base is version-self-describing via `Installer Version`; absence from the schema (not blankness) signals a pre-versioning install; a blank value signals a failed install.
12. Upgrades are explicit-trigger-only; reconcile is additive-only; renames regenerate all skills.
13. Our Org Profile supports multiple rows selected by `Profile Name`; default is the first row, stated; a named profile that does not exist halts.
14. **(1.2.0)** The five skill templates, the seed template, and the schema are bundled inside this skill folder so every path works at runtime; the public repo is a freshness source, never a runtime dependency. A repo path is not a runtime path.
15. **(1.2.0)** Step 0 degrades and never halts: Appendix A makes provisioning possible from this file alone.

---

## Appendix A - Field reference (rendered from table-schema.mjs; the two must change together)

Ten tables. Exact option strings matter: generated skills match them verbatim. Skills write only where the write scope says; everything else is operator-only.

**Write scope:** Grant Master (CREATE/UPDATE rows at Stage = Possible only) · Donor Master (CREATE new funders) · Search Audit Log (CREATE one entry per cycle).

### Grant Master
| Field | Type | Options / notes |
| --- | --- | --- |
| Grant Name | singleLineText | primary |
| Stage | singleSelect | Possible / Active / Awarded / Watchlist / Archived. Skills set only Possible. No Withdrawn stage: withdrawn = Archived + Archive row reasoned Withdrawn |
| Funder | singleLineText | |
| Website | url | |
| Restricted vs. Unrestricted | singleSelect | Unrestricted (General Operating Potential) / Restricted (Program / Project Specific) / Capacity-Building / Capital / Other / Unknown |
| Project / Program Area | singleLineText | |
| Geography | singleLineText | free text; never impose a vocabulary |
| Funding Amount Min | currency | $, precision 0 |
| Funding Amount Max | currency | $, precision 0 |
| Match Required | singleSelect | Yes / No / Unknown |
| Match Details | multilineText | |
| Application Close Date | date | iso |
| Cycle / Recurrence | singleSelect | One-time / Annual / Multi-year / Rolling |
| Next Cycle Opens | date | iso |
| Pipeline Priority | singleSelect | Now / Next / Later (operator-only) |
| Fit Score | number | 0-20, precision 0 |
| Fit Level | singleSelect | High Fit / Medium Fit / Low Fit |
| Readiness | singleSelect | Actionable / Needs Eligibility Confirmation / Not Ready This Cycle / Blocked by Eligibility |
| Priority | singleSelect | High Priority / Medium Priority / High Fit / Needs Readiness Confirmation / Watchlist / Future Fit / Reject (exactly five) |
| Scoring Notes / Pushback | multilineText | |
| Notes | multilineText | |
| Provenance | singleLineText | |

### Donor Master
| Field | Type | Options / notes |
| --- | --- | --- |
| Donor Name | singleLineText | primary |
| Category / Type | singleSelect | Private Foundation / Community Foundation / Corporate / Government - Federal / Government - State / Government - Local / Civic / Service Organization / Individual / Family / Other |
| Website | url | |
| Owner | singleLineText | |
| Notes | multilineText | |

### Search Audit Log
| Field | Type | Options / notes |
| --- | --- | --- |
| Cycle Date | singleLineText | primary (date-as-text so it can be primary) |
| Conducted By | singleLineText | |
| Search Mode | singleSelect | Discovery scan / Scoring pass / Maintenance / data-management |
| Queries Run | multilineText | |
| Coverage Summary | multilineText | |
| Stopping Rationale | multilineText | |
| Total Opportunities Identified | number | precision 0 |
| Opportunities Added | number | precision 0 |
| Gaps / Limitations | multilineText | |
| Provenance | singleLineText | |

### Our Org Profile (the judgment layer + deployment stamp; operator edits, skills read)
| Field | Type | Options / notes |
| --- | --- | --- |
| Profile Name | singleLineText | primary; multi-profile selector; suggest "Main" |
| Installer Version | singleLineText | deployment stamp; absence from schema = pre-versioning base; blank = failed install; historical values v1.0, v1.1 |
| Legal Name | singleLineText | |
| Incorporation Status | singleLineText | |
| Fiscal Sponsor + EIN | singleLineText | |
| Org Age / Stage | singleLineText | |
| Stage Posture | multilineText | ★ |
| Operating Budget | singleLineText | ★ |
| Growth Target | singleLineText | |
| Award Band Strong Min | currency | ★ (with Max) |
| Award Band Strong Max | currency | ★ |
| Award Band Edge Note | multilineText | |
| Capital Exception | multilineText | |
| Funding Priority Order | multilineText | ★ |
| Fit Criteria + Anchors | multilineText | ★ |
| Readiness Criteria | multilineText | |
| Durable Rules | multilineText | ★ |
| Loan Posture | singleSelect | ★ Exclude outright / Case-by-case - flag for board |
| Recurring Eligibility Traps | multilineText | ★ |
| Eligibility Nuances | multilineText | |
| Partner Sufficiency | multilineText | |
| Search Geography | multilineText | ★ |
| Populations Served | multilineText | |
| Anchor Institutions | multilineText | |
| Programs + Maturity | multilineText | ★ |
| Mission | multilineText | |
| Problem Statement | multilineText | |
| Voice Rules | multilineText | |
| Boilerplate | multilineText | |

### Active Grants (Pre-Award) - operator-only
| Field | Type | Options / notes |
| --- | --- | --- |
| Work Item | singleLineText | primary |
| Owner | singleLineText | |
| Internal Deadline | date | iso |
| Application Status | singleSelect | Researching / Preparing LOI / LOI Submitted - Awaiting Decision / Preparing Full Proposal / Full Proposal Submitted - Awaiting Decision / Awarded - In Portfolio / Declined - In Archive / Withdrawn - In Archive |
| Work Notes | multilineText | |

### Portfolio (Post-Award) - operator-only
| Field | Type | Options / notes |
| --- | --- | --- |
| Award Item | singleLineText | primary |
| Award Date | date | iso |
| Award Amount | currency | $, precision 0 |
| Reporting Due | date | iso |
| Grant Status | singleSelect | Active - Year 1 / Active - Year 2 / Active - Year 3 / Closed |
| Management Notes | multilineText | |

### Watchlist - operator-only
| Field | Type | Options / notes |
| --- | --- | --- |
| Watch Item | singleLineText | primary |
| Watchlist Status | singleSelect | Awaiting Next Cycle / Not Yet Eligible / Low Priority / Emerging Fit / Relationship Needed / Monitoring |
| Next Review Date | date | iso |
| What Would Need to Change | multilineText | |
| Watchlist Notes | multilineText | |

### Archive - operator-only
| Field | Type | Options / notes |
| --- | --- | --- |
| Archive Item | singleLineText | primary |
| Archive Reason / Status | singleSelect | Rejected - Not a Fit / Rejected - Ineligible / Not Awarded / Withdrawn / Other |
| Date Archived | date | iso |
| Disposition Notes | multilineText | |

### Active Donors - operator-only
| Field | Type | Options / notes |
| --- | --- | --- |
| Relationship Item | singleLineText | primary |
| Relationship Owner | singleLineText | |
| Relationship Stage | singleSelect | Prospect / Cultivating / Active Funder / Lapsed |
| Last Contact | date | iso |
| Relationship Notes | multilineText | |

### Donor Restriction Log - operator-only (the scan reads this; a restricted funder is never surfaced)
| Field | Type | Options / notes |
| --- | --- | --- |
| Restriction Item | singleLineText | primary |
| Restriction Type | singleLineText | |
| Restricted Program | singleLineText | |
| Flag Language | multilineText | |
| Status | singleSelect | Active / Expired |
| Restricted Until | date | iso |

### Link pass (after create_base; inverse fields auto-created on the masters)
| Context table | Link field | Links to |
| --- | --- | --- |
| Active Grants (Pre-Award) | Grant | Grant Master |
| Portfolio (Post-Award) | Grant | Grant Master |
| Watchlist | Grant | Grant Master |
| Archive | Grant | Grant Master |
| Active Donors | Donor | Donor Master |
| Donor Restriction Log | Donor | Donor Master |
