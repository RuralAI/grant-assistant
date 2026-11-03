# Grant Assistant v2 — Airtable provisioning and v1.x migration contract
Status: implementation proposal, 2026-11-03. Approved direction: fresh v2 base plus controlled migration; no in-place remediation. This document is NOT authorization to provision, migrate, cut over, or retire any base.

## Evidence and boundaries
- Development: `develop/v2-cross-platform-storage`, portable-field-contract.md and current Airtable adapter.
- Legacy canonical installer: `release-1.2.0:skills/grant-assistant-startup/table-schema.mjs`; the human-readable `docs/airtable-schema.md` is not a substitute for the machine source.
- Live reference: BTM Southwest `appDPxIz5AH19OxTK`, profile Installer Version `v1.1`; read-only inspected 2026-11-03. 10 tables / 54 records: Grant Master 18, Donor Master 17, Search Audit 7, Our Org Profile 1, Active Grants 1, Portfolio 0, Watchlist 1, Archive 9, Active Donors 0, Donor Restriction Log 0.
- **Observed drift:** live `Pipeline Priority` options are High/Medium/Low versus installer Now/Next/Later; live `Search Audit Log.Cycle Date` is date versus installer text; live `Our Org Profile.Operating Budget` is currency versus installer text. Several operator-table primary labels and option sets also differ. Never classify a base as stock solely from Installer Version. Compare actual schema against versioned installer and produce an exception report.
- Preserve `release-1.2.0`; no production changes.

## Provisioning contract v2 (proposed)
1. Require explicit destination workspace selection, operator confirmation, and unique proposed base name. Never infer workspace from first available base.
2. Create four required physical collections: `Organization Profiles`, `Organizations`, `Grants`, `Search Audit`. These implement logical collections `organization_profile`, `organizations`, `grants`, `search_audit` from `portable-field-contract.md`. Physical labels are presentation, logical names are the stable contract.
3. Each table has a writable text primary display field (profile_name, name, title, audit_label). Store separate immutable logical UUID text fields `profile_id`, `organization_id`, `grant_id`, `run_id`. Do not use Airtable record IDs as portable identities.
4. Provision every required logical field in `portable-field-contract.md` with an explicit codec and physical field ID mapping. Use Airtable singleLineText for IDs/text, multilineText for JSON arrays/objects, date for ISO dates, dateTime for timestamps, number/currency for decimals, singleSelect for enums, checkbox only for known booleans (blank remains unknown). URLs use url. Use JSON text initially for arrays to match existing codec support; no implicit link-field support.
5. Core controlled values: grant stage possible/active/awarded/watchlist/archived; eligibility eligible/ineligible/conditional/unknown; readiness ready/needs_work/unknown; search mode discovery/scoring/maintenance. Normalize values through the adapter; display labels may differ but must map bijectively.
6. Optional collections (`organization_grant_roles`, `funder_restrictions`, `search_profiles`) are enabled only when needed, with separate versioned definitions and logical UUID fields. Grant-specific roles and restrictions must not be collapsed into permanent organization attributes.
7. **Destination-native discovery:** identify installations by inspecting accessible bases and their actual schemas. Record base ID and field mappings in the application's connection configuration as needed; no standalone journal, lock directory, or mandatory metadata table. An optional destination-native version stamp is permitted only if inspection cannot reliably determine compatibility.
8. Installation is staged: inspect workspace and candidate bases -> preview plan -> operator approval -> create base once -> metadata preflight -> synthetic smoke tests -> acceptance. If create outcome is uncertain, stop, rediscover bases, and present matching candidates for manual reconciliation; never automatically issue a second create. Never delete or overwrite existing data.
9. The current adapter requires preflight schema and trusted authorization callback, and only supports text/json/number/boolean/date/timestamp/select codecs. It does not provision bases or handle Airtable multipleRecordLinks. Provisioning is a separate module. Its read-before-write check is not an atomic compare-and-swap; concurrent writes need conflict handling.

## Legacy migration contract
1. Discover source base and actual tables, fields, types, options, record counts, link targets, and installer stamp; compare to canonical versioned installer. Flag unknown versions, drift, duplicates, missing required fields, and unauthorized data. Do not write to source.
2. Generate a preview manifest containing per-table source counts, source record IDs, proposed v2 IDs, field mappings, transform rules, unmapped fields, relationships, sensitive-data exclusions, and manual review queue.
3. Mappings:
   - `Our Org Profile` -> `organization_profile`: Legal Name -> organization_name, Profile Name -> profile_name, Operating Budget -> annual_budget only if numeric/currency valid, Search Geography -> search_geographies only after structured operator confirmation. Preserve other narrative judgment fields in migration evidence until individually mapped; never hallucinate structured answers.
   - `Donor Master` -> `organizations`: Donor Name -> name, Website -> website_url, Category / Type -> organization_type with documented normalization. Owner/Notes remain private and must be explicitly authorized for migration.
   - `Grant Master` -> `grants`: Grant Name -> title, Funder -> funder_name_observed, Website -> source_url only if it is the canonical opportunity source (otherwise manual review), Application Close Date -> deadline, Funding Amount Min/Max -> award_min/max, Stage -> stage, Fit Score -> fit_score, Scoring Notes -> fit_rationale with review, Notes -> operator_notes (human-owned). Readiness is not equivalent to eligibility; do not derive eligible from fit. Generate grant_id and mark unresolved provenance/eligibility unknown.
   - `Search Audit Log` -> `search_audit`: preserve cycle date, queries, coverage, stopping rationale, counts, gaps, provenance; create run_id. Missing times/source arrays and other required v2 fields must be represented as historical/unknown or routed for review, not fabricated.
   - `Active Grants`, `Portfolio`, `Watchlist`, `Archive`, `Active Donors`, `Donor Restriction Log`: preserve all source records and source-to-target links in an export/manifest; map only into approved optional v2 collections or an explicitly designed historical operator-workflow extension. Do not drop them because they are absent from core v2.
4. Maintain source `baseId/tableId/recordId` -> v2 logical UUID -> destination Airtable record ID crosswalk, including reverse relationship mapping and source canonical URL where available. Generate UUIDs once and persist before writes; restart must reuse them.
5. Copy only approved data. Reconcile source/target counts per table, field-level checksums/normalized values, stage values, link edges, audit history, unmapped material, and exceptions. Duplicate ambiguity, invalid source URL, unknown eligibility, missing provenance, and sensitive records require review; never silently coerce.
6. Cutover is a separate operator-approved step after acceptance. Keep v1.x source authoritative throughout migration; require a final delta scan or source freeze to catch edits after preview. Activate v2 only after reconciliation. Retirement means operator-directed archival/read-only preservation, never automatic deletion.

## Acceptance gates before live integration
- P01 fresh provision creates exactly required core tables and required typed fields; schema preflight passes.
- P02 rerun discovers existing installation from destination metadata and avoids duplicate base creation; ambiguous or partial creation requires manual inspection and reconciliation, not a local journal.
- P03 unknown or incompatible field type/select choice fails closed.
- M01 all 54 BTM reference records are accounted for as migrated, retained in historical export, excluded with explicit reason, or queued for review; counts by source table reconcile.
- M02 source-to-destination ID crosswalk and six legacy context-link relationships are preserved or explicitly marked pending.
- M03 legacy drift (priority options, Cycle Date type, Operating Budget type) is detected without silent coercion.
- M04 repeated migration does not duplicate records; uncertain writes reconcile before retry.
- M05 stage promotions, operator notes, and source data remain untouched by agent writes.
- M06 historical audit missing timestamps is not fabricated; exceptions remain visible.
- M07 no source base mutation; cutover/retirement require independent approvals.
- M08 synthetic fixture migration and negative tests pass before any real nonprofit data copy.

## Open implementation decisions
- Whether a minimal destination-native version marker provides value beyond schema inspection; no separate installation-state service is required.
- Whether operator-only historical workflow rows get v2 optional tables or archival-only retention; do not silently omit.
- Required source URL behavior for historical grants lacking a canonical opportunity link (quarantine vs explicit historical exception).
- v2 field-label convention and exact optional table provisioning order.
- Authorization model for migration of donor contact details, private notes, and profile narratives.

## Simplification decision — 2026-11-03 (supersedes earlier journal design)
- Standard installation is **inspection-first and destination-native**, with no required local journal, filesystem lock, distributed coordinator, or cryptographic approval digest.
- Existing journal/exclusive-executor code is **legacy experimental implementation**, not the selected installer entrypoint. Do not invoke it in the normal user workflow. Retain temporarily for reference until its removal can be verified against callers and tests.
- The installer must never assume that absence of a matching name proves that no prior create succeeded. Ambiguous create errors always stop and require rediscovery and explicit operator resolution.
- No automatic in-place schema repair, destructive cleanup, or legacy migration. Preserve source data and require separate approval for migration writes.
- Concurrent installation requests to the same destination are not guaranteed to be serialized. Clearly warn and refuse ambiguous candidates rather than promise race-free exactly-once base creation.
