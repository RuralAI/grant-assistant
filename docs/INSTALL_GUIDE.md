# Grant Assistant — Comprehensive Install Guide

This is the full runbook for installing the Grant Assistant for a nonprofit organization. It reflects the validated production install (CRAI) and the first commercial install (Boys to Men, July 2026), including every failure mode observed live and how to avoid it.

**Time budget:** ~15 minutes of install-thread runtime once the template is filled. Observed usage: roughly 100–130k tokens for the install prompt on a full template. Filling the template well is the real work — budget 1–2 hours with the person who knows the org's grants history.

---

## Phase 0 — Prerequisites

| Requirement | Detail |
|---|---|
| Claude account | A plan that supports **skills** and the **Airtable connector**, run in a Claude **Project**. Use a top-tier model for the install thread (the commercial install used the flagship model). |
| Airtable account | Free tier works for the install; the org's record volume may warrant a paid plan later. |
| The installer skill | `skill/grant-assistant-startup.skill` from this repo. |
| A filled seed template | `template/Org_Seed_Template_BLANK.md`, completed by the org. |
| The right human | Someone who knows the org's grant history (active grants, past funders, restrictions) and its honest stage. |

---

## Phase 1 — Accounts and the connector (the two key steps)

The first commercial install confirmed these two steps are where installs succeed or fail:

**1. Set up both accounts first.** Create (or confirm) the org's Claude account and Airtable account before anything else. Do this in the org's own accounts — the base and the skills belong to them.

**2. Link Airtable in Claude, then grant Claude FULL access in Airtable.** In Claude: Settings → Connectors → Airtable → connect. During Airtable's authorization step, grant access to the **entire workspace / all resources** — not individual bases.

Why this matters (observed live, twice):
- Base creation requires a workspace ID. A connector scoped to individual bases returns an **empty workspace list**, and the installer will halt at its precondition check with instructions to widen the scope.
- Airtable connector access is an **allowlist**. Even a base you create by hand is invisible to Claude (403) until it's explicitly shared into the connector's scope. Full workspace access avoids the whole class of problem.
- If the org prefers narrower standing access, widen for the install and narrow afterward — the installed skills only need access to the one base that gets created.

---

## Phase 2 — Install the startup skill

1. In the org's Claude account, add `grant-assistant-startup.skill` (upload the file; use the **Save skill** action on the file card, or your workspace's skill-management flow).
2. If any older version of this skill exists under the same name, **uninstall it first**. Saving over an existing name may NOT replace the old version — this failure was observed live and it is silent until something misbehaves.

---

## Phase 3 — Fill the seed template

Give the org `template/Org_Seed_Template_BLANK.md`. Every field has an instruction and a real example. Sections:

- **A–G**: identity, mission, problem framing, geography and populations, programs (with honest maturity tags), team, partnerships.
- **H — the dedup baseline (most important for data quality)**: H1 active grants *with recurrence cycles and next-open dates*, H2 known prospects, H3 awarded/historical grants, **H4 the funder/donor list (paste from the CRM export)**, **H5 funder restrictions**. Everything listed here becomes Airtable records; anything omitted is a hole the scan can fall into later (it may re-surface a funder the org already evaluated).
- **I — financials**: budget and award bands. Bands should reflect what a *strong-fit* grant looks like for this org, derived from its real budget.
- **J–K**: sourced evidence and voice rules.
- **M — the judgment layer**: funding priority order, fit criteria, durable rules, loan posture, recurring eligibility traps. This is what makes the skills behave like *this org* rather than a generic tool.
- **N — install config**: connector confirmation (with workspace access), base name, operator.

**The ten ★REQUIRED fields** (A5 stage posture, D1 search geography, E1 programs with maturity, I1 budget, I3 award bands, M1 priority order, M2 fit criteria, M4 durable rules, M5 loan posture, M6 eligibility traps) are hard gates. The install halts and names any that are blank — by design. Filling them honestly matters more than filling them impressively: the stage posture in particular bounds what every future proposal draft may claim.

Two coaching notes for the template session:
- **Recurring eligibility traps (M6)**: every org has at least one — "funders that exclude orgs under 3 years old," "companion-animal funders that exclude equine," "programs that exclude fiscally sponsored orgs." Push past a vague answer; this field prevents the most expensive class of wasted application.
- **Honest stage (A5)**: a mature org SHOULD claim its audited financials and track record; a young org must not. The system reads whatever is written here and enforces it everywhere.

---

## Phase 4 — Run the install

1. In the org's Claude account, create a **Project** (e.g., "Boys to Men — Grant Assistant").
2. Start a new thread. Attach the filled seed template.
3. Prompt (validated verbatim):

   > **Invoke the grant-assistant-startup skill and read the attached seed document for context.**

4. Let it run (~15 minutes typical). The installer will:
   - Check preconditions (required fields, Airtable connectivity, workspace access) and **halt with instructions** if any fail
   - Echo back its parsed install plan
   - Build the nine-table base in one `create_base` pass, then add the master↔context record links
   - Ingest the full H1–H5 baseline: grants into Grant Master with honest Stages, funders into Donor Master, working/portfolio/archive rows linked, restrictions into the Donor Restriction Log
   - Generate the four org-tuned skills, package them as `.skill` files, and present them
   - Run its verification checks and write one honest install audit entry

5. **Save the four generated skills** from their file cards when presented.

---

## Phase 5 — Verify (don't skip)

The installer runs these itself and reports results; confirm you see all of them pass:

1. **Static audit** — every table/field ID in the generated skills exists in the live base; no foreign org's IDs anywhere.
2. **Org Profile read** — all ten required judgment fields populated (the runtime halt check passes).
3. **Dedup path** — a funder-name search on Grant Master finds an ingested grant and its Stage reads correctly.
4. **Write-scope filter** — filtering Grant Master by Stage = Possible returns exactly the prospect rows.
5. **Restriction read** — the Donor Restriction Log reads cleanly (with the H5 rows, or empty).
6. **Write path** — the install audit entry itself, visible in the Search Audit Log.
7. **Install integrity (after you save the skills)** — ask in a fresh thread: *"Which Airtable base does the grant scoring skill use?"* The answer must be the new org base. This catches the silent same-name-collision case.

Then run one small live test: *"Run a prospect scan"* in a new thread. Expect a modest, honest batch (the skills cap at ~6–8 prospects), records landing at Stage = Possible only, and an audit entry at the end.

---

## Phase 6 — Operator handoff

Walk the org's operator (template N3) through their side of the system:

- **The pipeline lives in Grant Master.** New discoveries arrive at Stage = Possible with scores and honest pushback in the Scoring Notes.
- **Promotion is theirs alone**: to pursue a grant, add a row in Active Grants, link it to the master record, and flip the master's Stage to Active. Awarded → Portfolio row + Stage = Awarded. Rejected/dead → Archive row + Stage = Archived. The skills will never do this.
- **Org Profile is theirs to evolve.** Budget grows? Update it and the award bands. New program launches? Update Programs + Maturity. New funder restriction? Add a Donor Restriction Log row. The skills read all of it live — no reinstall needed.
- **The Search Audit Log is the paper trail** — every scan, scoring pass, and maintenance cycle, including what was NOT covered.

---

## Troubleshooting (every entry below was observed live)

| Symptom | Cause | Fix |
|---|---|---|
| Install halts: "no workspace with create permission" | Connector scoped to individual bases, not the workspace | In Airtable, widen the Claude connection to workspace/all resources; reconnect; re-run |
| 403 on a base you can see in Airtable | Connector allowlist doesn't include that base | Share the base into the connector's scope (or use full workspace access) |
| Install halts naming a template field | A ★REQUIRED field is blank | Fill the named field; re-run. Never ask the installer to guess |
| A saved skill behaves like an older version | Same-name save did not replace the old skill | Uninstall the old skill entirely, then save the new one; re-run the install-integrity question |
| Two similar skills both trigger (or the wrong one does) | Legacy skills left installed alongside new ones | Remove the old set; keep exactly one skill per role |
| Scan re-surfaces a funder the org already knows | The H-section baseline was incomplete at install | Add the missing grants/funders via a reconcile run; the audit log will have flagged the gap |
| A write fails on a select value | Option string doesn't exactly match the live schema | The write skill re-reads live schema and retries with an exact option; never create new options |
| Airtable base renamed | Renames don't change IDs | Nothing breaks; update the name in skill prose at the next reconcile for readability |

---

## Re-runs and maintenance (reconcile mode)

Re-running the installer against an org that already has a base does **not** create a duplicate. It diffs the template against the live Org Profile, proposes specific updates, ingests only new H-section entries (dedup-checked), repackages skills only if schema drift is found, and logs a Maintenance audit entry. Use it when the org updates its template, adds a batch of funders, or after any Airtable schema change.

**Retirement convention:** never delete a base. Rename with a `- RETIRE` suffix; generated skills treat retired-base IDs as do-not-touch warnings.
