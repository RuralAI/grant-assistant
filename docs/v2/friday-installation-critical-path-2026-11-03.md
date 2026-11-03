# Friday installation critical path — 2026-11-03

## Goal and timebox
Tuesday development; pause later today for Supabase grant-intelligence table design. Friday user installation is the acceptance milestone. This is not a production migration.

## Settled decisions
- One portable Grant Assistant v2 logical contract; Airtable and Google Sheets are alternative storage providers.
- ChatGPT is the interaction surface, not a third database. Drive locates/owns the native Sheet; Sheets holds the four logical collections.
- Existing nonprofit v1.1 base stays untouched. No installer journals, locks, or speculative schema expansion.
- Human-owned grant stage and operator notes require operator authorization; source lineage and audit history remain intact.

## Work completed
- Airtable disposable base appC8hCEmhYdFxumE: four tables, 83 fields; live CRUD and cleanup passed.
- Inspection-first installer explicit base-ID reconnection; 89 automated tests passed as of CI run 41654054103.
- New src/v2/google-sheets-row-transport.mjs and tests provide a dependency-injected transport for read/append/update of worksheets with header checks. This is a transport foundation, not yet a Google-authenticated end-to-end adapter.
- Old journal/exclusive-lock modules remain; remove only after dependency/reference audit.

## Google Sheets implementation contract
- One native spreadsheet with tabs Organization Profiles, Organizations, Grants, Search Audit.
- Header row is the exact logical field name list from the existing v2 provisioning plan.
- Use logical IDs profile_id, organization_id, grant_id, run_id. Provider row numbers are *not* durable identities: edits that insert, delete or reorder rows can invalidate row-number locators. Friday installer must either prohibit structural row edits during writes and verify logical ID at update, or resolve row by logical ID on every write. Prefer the latter.
- Serialize array/object fields as JSON text; parse on read; preserve ISO dates and numbers. Do not treat Sheets formatting as authoritative type enforcement.
- Discovery: inspect existing named spreadsheet and tabs first; explicit selection or create-once; no destructive repair. Verify headers before writes.
- Google Sheets connector and OAuth scope/permissions must be tested with the user's actual intended installation account.

## ChatGPT integration contract
- ChatGPT-facing commands: inspect destination; connect chosen Airtable/Google Sheets installation; read/update organization profile; discover/score grants; review candidates; operator-authorized promotion; append search audit.
- A thin tool boundary should expose storage-neutral list/get/upsert and source retrieval, with explicit operator authorization. ChatGPT should not be given direct unrestricted write authority.
- For Friday, use a controlled GPT/ChatGPT workflow or connected tools with a guided prompt; do not promise a packaged one-click installer or a custom GPT Action unless its authenticated endpoint is actually deployed and tested.
- Separate grant intelligence source corpus in Supabase from user-owned storage; no Supabase schema writes until the later planned design review and approval.

## Acceptance gates before Friday
1. Run CI after Sheets transport changes.
2. Resolve row-number update hazard, add tests for reordering and duplicates.
3. Implement Google API transport and create/reuse/verify flow; test on disposable native Sheet.
4. Wire the existing v2 validators and authorization into Sheets; run equivalent synthetic CRUD, dedupe, audit tests.
5. Run an actual credentialed Airtable CLI reconnect without creating another base.
6. Run ChatGPT-driven happy path: profile -> discovery -> candidate grant -> operator review -> audit, on both destinations if feasible.
7. Write a one-page installation/runbook with recovery steps; freeze features Thursday for Friday test.

## Scope cut if time tight
Prioritize one successful Google Sheets path and a guided ChatGPT experience over automation polish. No v1.1 migration, no live grant applications, no unnecessary schema fields.
