---
name: {{org-slug}}-audit-log
description: "Use this skill whenever recording what happened in a {{ORG NAME}} grant-pipeline work session into the Search Audit Log table - after a prospect scan, a scoring pass, or a cleanup/maintenance round. It defines what an honest audit-log entry contains, including the distinction between a discovery scan and a maintenance cycle, and how to record coverage, stopping rationale, and carried-forward items. Trigger it whenever the user says 'log this', 'add an audit entry', 'record this round', or at the close of any scan/scoring/cleanup pass, and pair it with the airtable-write skill for the actual write."
---

# {{ORG NAME}} Audit Log Entry (master model)

The Search Audit Log is the org's paper trail - it makes each work cycle legible to the operator and lets the next session continue cleanly. Cardinal rule: **the entry must honestly reflect what actually happened, including what was NOT done.** An entry that oversells a cycle is worse than none, because the trail is what people trust.

**Production base: `{{BASE_ID}}` "{{BASE_NAME}}", table Search Audit Log.** This skill produces the entry's content; the **airtable-write** skill governs the actual write (re-read schema, field IDs, exact option strings). This skill is fixed method and needs no Our Org Profile read.

## First: classify the cycle type honestly

- **Discovery scan** - searched for NEW opportunities (the prospect-scan skill ran against live sources).
- **Scoring pass** - evaluated already-identified opportunities; "Opportunities Added" may be 0 by design.
- **Maintenance / data-management** - dedup, field alignment, enrichment, migration, verification, or an install/upgrade cycle. Not a discovery search; mark coverage accordingly.

These are the exact Search Mode option strings. Mislabeling a maintenance round as a discovery scan corrupts the trail. Say plainly which it was; if a session mixed modes, log the dominant mode and state the mix in the Coverage Summary.

## What every entry contains

- **Cycle Date** - the date the work happened.
- **Conducted By** - e.g. "Grant Assistant (prospect scan)".
- **Search Mode** - per the classification above.
- **Queries Run** - the actual searches, reproducible. "None - not a search cycle" is a valid honest value.
- **Coverage Summary** - plain-language account: which prospects/opportunities were handled; scored vs. relationship-only vs. skipped vs. blocked by the Donor Restriction Log; what was created or changed and in which tables; which source categories were Covered / Partial / Skipped / Not Attempted.
- **Stopping Rationale** - batch cap reached, scope complete, context budget. Note partial verification explicitly.
- **Total Opportunities Identified** and **Opportunities Added** - real counts. Identified counts everything surfaced; Added counts only new Grant Master rows actually created this cycle.
- **Gaps / Limitations** - the honest "what wasn't covered / still unverified / carried forward," plus named prospects not reached and recommended next-cycle actions.
- **Provenance** - a short cycle tag.

## Honesty requirements

- Record partial verification as partial; name the prospects/opportunities NOT reached rather than implying full coverage.
- Never claim any external system was updated unless a step in this session actually did it. In particular, never claim a promotion, award, archive, or Stage change - those are operator actions.
- Keep entries distinct: if two cycles happen on the same date, each entry says which it is.
- The dedup outcomes belong in the record: "found existing at Stage=Active, not re-surfaced" is a result worth logging.

## The running trail

Entries accumulate into a coherent history. Each new entry references the carried-forward items from the prior one (read the most recent entry's Gaps / Limitations before writing) so the chain stays connected and the next session sees exactly where things stand.

---

## Generation note (remove this section when producing the org's actual skill)

Replace `{{org-slug}}`, `{{ORG NAME}}`, `{{BASE_ID}}`, and `{{BASE_NAME}}` with this org's real values from the Step 2 capture.
