# Getting started: the full install runbook

This is the complete walkthrough for installing the Grant Assistant for a nonprofit organization. It reflects two live installs (CRAI production and a first commercial install, July 2026), and every failure mode listed in the troubleshooting table actually happened; none are speculative.

**Time budget:** ~15 minutes of install runtime once the seed document is filled. One install uses a good portion of a day's Claude usage on a Pro plan, so start it fresh. Filling the seed document well is the real work: budget 1-2 hours with the person who knows the org's grants history.

Before anything else, work through [pre-flight-checklist.md](pre-flight-checklist.md).

## Phase 1: accounts and the connector (where installs succeed or fail)

**1. Set up both accounts first.** The org's own Claude account (Pro, Team, or Enterprise, able to add custom skills and connect integrations) and the org's own Airtable account. The base and skills belong to them.

**2. Link Airtable in Claude, then grant Claude FULL access in Airtable.** In Claude: Settings, then Connectors, then Airtable. During Airtable's authorization step, grant access to the **entire workspace (all resources)**, not individual bases.

Why this matters (observed live, more than once): building your database requires Claude to have access to your whole Airtable workspace. If Claude was only given access to specific bases, the installer stops right away and tells you to widen that access. And even a base you create by hand is invisible to Claude until it's shared into whatever access you gave it. Full workspace access avoids the entire class of problem; you can narrow it back down after installing.

## Phase 2: get the installer

Two paths; use the first when you can.

**Path A (preferred): point Claude at the public repo.** In a new chat, paste `https://github.com/RuralAI/grant-assistant` and say: *"Read this repository and install the Grant Assistant; here is our seed document."* Claude reads the installer, the schema, and the skill templates directly from GitHub. Nothing to download, and you always get the current release.

**Path B: install the packaged skill.** Download `grant-assistant-startup.skill` from the [latest release](../../releases/latest) and add it to Claude's custom skills. Use this when your environment can't fetch from the web, or when you want the installer saved permanently. If an older version of the skill is already installed, **uninstall it first**: saving over an existing name has been observed NOT to replace the old copy.

## Phase 3: fill the seed document

Give the org [`template/Org-Seed-Template-BLANK.md`](../template/Org-Seed-Template-BLANK.md). Every field has an instruction and a worked example. The ten ★ REQUIRED fields are hard gates: the install halts and names any that are blank, by design.

Coaching notes for the session, from live installs:

- **Recurring eligibility traps (M6):** every org has at least one ("funders that exclude orgs under 3 years old," "programs that exclude fiscally sponsored orgs"). Push past a vague answer; this field prevents the most expensive class of wasted application.
- **Honest stage (A5):** a mature org SHOULD claim its audited financials and track record; a young org must not. The system enforces whatever is written here, everywhere, forever.
- **The grants history (H1-H5) is the dedup baseline.** Everything listed becomes Airtable records; anything omitted is a hole the scan can fall into later (it may re-pitch a funder the org already evaluated). Paste from the CRM export if one exists.
- **No document? No problem.** The installer interviews the operator live through the same questions. The document is faster if the answers need research; the interview is faster if one person holds them all.

## Phase 4: run the install

1. In the org's Claude account, create a Project (e.g., "Boys to Men - Grant Assistant").
2. Start a new thread. Attach the filled seed document (or say you'd rather be interviewed).
3. Prompt (validated verbatim):

   > Invoke the grant-assistant-startup skill and read the attached seed document for context.

4. The installer will state what's about to happen and wait for your go-ahead, then: check preconditions (halting with instructions if any fail), echo back its parsed install plan, build the ten-table base in one pass plus the record links, ingest the full H1-H5 baseline with honest lifecycle stages, generate the five org-tuned skills, verify its work check by check, and write one honest install entry to the Search Audit Log.
5. **Save all five generated skills** from their file cards, in the same sitting.
6. The installer ends by naming your next step (normally: run your first prospect scan).

## Phase 5: verify (the installer runs these; confirm you saw them pass)

1. All ten tables exist with expected fields; all six record links resolve both directions.
2. Our Org Profile has one row, all ten required judgment fields populated, `Installer Version` and `Profile Name` written.
3. Dedup path: a funder-name search finds an ingested grant and its Stage reads correctly.
4. The write gate gates: filtering Grant Master by Stage = Possible returns exactly the prospect rows.
5. The Donor Restriction Log reads cleanly.
6. The grant-writing gate: an Active grant is draftable, a Possible grant is not.
7. The install audit entry exists in the Search Audit Log.
8. After you save the skills: ask in a fresh thread, *"Which Airtable base does the grant scoring skill use?"* The answer must be the new base. This catches a stale same-named skill that silently survived.

Then run one small live test: *"Run a prospect scan."* Expect a modest honest batch (the skills cap around 6-8 prospects), records landing at Stage = Possible only, and an audit entry at the end.

## Phase 6: operator handoff

Walk the operator (seed document N3) through their side:

- **The pipeline lives in Grant Master.** Discoveries arrive at Stage = Possible with scores and honest pushback in Scoring Notes.
- **Promotion is theirs alone:** pursue a grant by adding an Active Grants (Pre-Award) row, linking it to the master record, and flipping the master's Stage to Active. Awarded: Portfolio (Post-Award) row + Stage = Awarded. Parked: Watchlist row + Stage = Watchlist. Dead: Archive row + Stage = Archived. Skills never do this.
- **Our Org Profile is theirs to evolve.** Budget grows, a program matures, a restriction appears: update the table and every skill follows, live, no reinstall.
- **The Search Audit Log is the paper trail**, including what was NOT covered each cycle.
- For customizing views and fields safely: [AIRTABLE_FAQ.md](AIRTABLE_FAQ.md).

## Troubleshooting (every row happened in a real install)

| Symptom | Cause | Fix |
| --- | --- | --- |
| Install stops: "no workspace with create permission" | Connector scoped to specific bases, not the workspace | In Airtable, widen Claude's connection to Full / Workspace access; reconnect; re-run |
| Claude can't find a base you can see in Airtable | That base isn't in Claude's access scope | Share it into the connection, or use Full / Workspace access |
| Install halts naming a seed-document field | A ★ REQUIRED field is blank | Fill the named field; re-run. Never ask the installer to guess |
| A saved skill behaves like an older version | Same-name save did not replace the old skill | Uninstall the old skill entirely, then save the new one; re-run the "which base" question |
| Two similar skills both trigger, or the wrong one does | Legacy skills installed alongside new ones | Remove the old set; keep exactly one skill per role |
| Scan re-pitches a funder the org already knows | The H-section baseline was incomplete at install | Add the missing grants/funders via a reconcile run |
| A write fails on a select value | Option string doesn't exactly match the live schema | The write skill re-reads live schema and retries with an exact option; options are never created |
| A skill stops, naming a table or field it can't find | Version mismatch between skills and base | See the FAQ's "version mismatches" section, including the Claude-to-Omni bulk-change handoff |
| The installer says a bundled file is missing | Only SKILL.md installed | It proceeds from its Appendix A anyway; re-upload the `.skill` afterwards |

## Re-runs, upgrades, retirement

Re-running the installer against an existing base does not duplicate it: at the current version it reconciles (additive only: syncs template changes, ingests new history, reports drift); at an older version it reports what it found and what an upgrade would do, and **upgrades only on your explicit request**. Never delete a base: retire by renaming with a "- RETIRE" suffix.
