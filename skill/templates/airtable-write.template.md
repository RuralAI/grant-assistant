---
name: {{org-slug}}-airtable-write
description: "Use this skill BEFORE any write to the {{ORG NAME}} Grant Pipeline (Master Model) base ({{BASE_ID}}) - any create_records_for_table, update_records_for_table, update_field, create_field, create_table, or delete call against it. This is the production base. Skills write ONLY to Grant Master rows at Stage = Possible, to Donor Master (new funders), and to Search Audit Log. Grant Master rows at any other Stage, and the operator context tables (Active Grants (Pre-Award), Portfolio (Post-Award), Watchlist, Archive, Active Donors, Donor Restriction Log) and Our Org Profile, are off-limits to writes - the operator promotes and dispositions manually by flipping Stage and linking context rows. This skill encodes the write discipline (re-read live schema first, never write computed fields, exact option strings, funder-name dedup, no orphaned data) plus the base/table/field map. Trigger it whenever the task writes a scanned grant or donor, logs an audit cycle, or edits any record in this base - even if the user just says 'add this to Airtable.'"
---

# {{ORG NAME}} Grant Pipeline (Master Model) - Write Discipline

This skill governs every write to the production base **`{{BASE_ID}}` "{{BASE_NAME}}"**. There is one production base. The operator provides the decision gate by flipping a grant's **Stage** and manually linking context rows - so **the operator gate is a STAGE CHECK, not a table wall, and no staging automation exists or should be attempted.**

**Retired bases - never touch:** any base whose name carries a "- RETIRE" suffix. If a task references one, stop and confirm with the operator.

## The workflow this base implements

```
scan writes -> Grant Master (Stage = Possible) -> operator flips Stage + links a context row
                    Stage = Active    -> Active Grants (Pre-Award) context row (work fields)
                    Stage = Awarded   -> Portfolio (Post-Award) context row (award management)
                    Stage = Watchlist -> Watchlist context row (why-not-now + review date)
                    Stage = Archived  -> Archive context row (disposition)
```

Grant Master holds ALL core grant data (identity, funder, amounts, cycle info, scoring output) for every lifecycle stage - one row per grant, no duplicated master data. The context tables hold only stage-specific working fields and link back via `multipleRecordLinks`. Donor Master mirrors this for funders, with Active Donors and Donor Restriction Log as its context tables.

## Write scope (exact)

**Skills WRITE ONLY:**
1. **Grant Master** - CREATE new rows only at **Stage = Possible**. UPDATE only rows still at Stage = Possible. The moment the operator advances a row past Possible, it leaves the skills' write scope entirely.
2. **Donor Master** - create new funders discovered by a scan (Donor Name, Category / Type, Website); the operator enriches.
3. **Search Audit Log** - one entry per cycle.

**Skills NEVER write:** Grant Master rows at any Stage other than Possible (Active / Awarded / Watchlist / Archived); **Active Grants (Pre-Award)**; **Portfolio (Post-Award)**; **Watchlist**; **Archive**; **Active Donors**; **Donor Restriction Log**; **Our Org Profile** (read-only living seed). Skills READ Grant Master (all stages), Donor Restriction Log, and Our Org Profile for dedup, restriction checks, and judgment.

**On Watchlist specifically:** the scoring skill may recommend a watchlist outcome via the Priority field (`Watchlist / Future Fit`), but it writes that recommendation onto a row at **Stage = Possible**. Moving a grant to `Stage = Watchlist` and creating its Watchlist context row is an **operator action** - the same gate that governs Active, Awarded, and Archived. Never set Stage = Watchlist.

## Grant Master writable fields

*(Full ID snapshot for this org: `references/field_map.md` in this skill, captured at generation time from the org's live schema. Live schema always wins - re-read it before every write; this snapshot is a convenience, not a source of truth.)*

Factual: Grant Name (primary, writable text) | Stage (set "Possible" only) | Funder | Website | Restricted vs. Unrestricted | Project / Program Area | Geography (free text) | Funding Amount Min | Max | Match Required | Notes | Provenance.

Scoring (from the grant-scoring skill): Fit Score (number 0-20) | Fit Level | Readiness | Priority | Scoring Notes / Pushback.

Leave for the operator: Pipeline Priority; the four link fields (Active Grants (Pre-Award) / Portfolio (Post-Award) / Watchlist / Archive).

Donor Master: Donor Name | Category / Type | Website. Leave Owner, Notes, and the two link fields for the operator.

## The non-negotiable sequence (every write)

1. **Re-read the live schema first.** Call `get_table_schema` for the target table immediately before writing. Do NOT trust a cached ID snapshot, memory, or an earlier read - assume drift. If snapshot and live disagree, live wins.
2. **Confirm base and table.** Target only Grant Master (Stage=Possible), Donor Master, or Search Audit Log in this org's production base. If a task seems to need any other write - a Stage flip, a context-table row, an Our Org Profile edit - STOP: that is an operator action.
3. **For updates: confirm Stage = Possible on the target row before touching it.** Read the row; if Stage is anything else, stop and flag for the operator.
4. **Map each value by field ID and exact option string** against the just-read schema; confirm the field is in write-scope.
5. **Write**, preferring a single batched call.
6. **Report** what was written and that it is queued for the operator's review/promotion. Never claim a Stage change, promotion, award, or archive happened - those are operator actions.

## Rule 1 - Never write computed fields
Skip any autoNumber, formula, rollup, count, lookup, createdTime, lastModifiedTime. (Grant Name and Donor Name are writable text primaries; Fit Score is a plain number and IS writable.)

## Rule 2 - Use the EXACT option string
- Stage: Possible / Active / Awarded / Watchlist / Archived (skills set only "Possible"). Note there is no "Withdrawn" stage - a withdrawn grant is Stage = Archived with an Archive context row reasoned "Withdrawn".
- Restricted vs. Unrestricted: Unrestricted (General Operating Potential) / Restricted (Program / Project Specific) / Capacity-Building / Capital / Other / Unknown.
- Match Required: Yes / No / Unknown.
- Fit Level: High Fit / Medium Fit / Low Fit.
- Readiness: Actionable / Needs Eligibility Confirmation / Not Ready This Cycle / Blocked by Eligibility.
- Priority: High Priority / Medium Priority / High Fit / Needs Readiness Confirmation / Watchlist / Future Fit / Reject. (Exactly five options - do not add a sixth or seventh; map any high-fit-but-not-ready synthesis to "Watchlist / Future Fit".)
If a write returns `Insufficient permissions to create new select option "X"`, "X" is not an exact existing option - re-read the schema and match a real one. Do NOT create options.

## Rule 3 - Dedup by funder name before creating
`search_records` on the funder name alone (AND-across-terms within single fields means combined funder+program queries miss), then inspect the returned records' Grant Name and Stage. Update rather than duplicate. Never include date fields in a search's fields list (unsearchable type errors the whole call) - read dates from the record afterward.

## Rule 4 - Write by field ID
Copied from the live schema, never hand-typed. Every `fld` ID is 17 characters.

## Rule 5 - Don't orphan, don't duplicate
Leave the context-table link fields and Pipeline Priority empty on create - the operator populates them on promotion. When creating a Donor Master funder for a new Grant Master opportunity, do it in the same cycle so neither is orphaned.

## Rule 6 - Archive, never delete
Non-destructive is the standing rule. Do not `delete_records_for_table`. Retiring a Possible record is an operator action (Stage flip to Archived + Archive context row) - flag it for the operator rather than deleting or moving it. Hard-delete only on explicit, specific human go-ahead.

## When a write fails
- `field is computed` -> Rule 1; remove that field.
- `Insufficient permissions to create new select option "X"` -> Rule 2; match the live schema.
- `Unknown field name` / `Could not find a field` -> schema changed or ID typo; re-read the schema.
- `Field ID must start with "fld" and be 17 characters` -> typo in the ID.
- `unsupported by search` (422) -> Rule 3; remove date/unsearchable fields from the search fields list.
- `array of up to 50 record objects, each with an "id"` (422 on update) -> update calls take `"id"` per record object, not `"recordId"`.
After any failure, re-read the live schema before retrying.

---

## Generation note (remove this section when producing the org's actual skill)

Replace `{{org-slug}}`, `{{ORG NAME}}`, `{{BASE_ID}}`, and `{{BASE_NAME}}` with this org's real values. Generate `references/field_map.md` from this org's actual `create_base` response (Step 2 of the installer) - every table ID, field ID, and option ID, for all nine tables, not just the ones summarized above. Zero leakage: no other org's IDs may appear anywhere in the generated skill or its bundled reference.
