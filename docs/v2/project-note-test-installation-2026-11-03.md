# Grant Assistant v2 — disposable Airtable installation test
Date: 2026-11-03
Status: base created and schema verified; functional smoke tests pending
Workspace: CRAI Databases (wspEeRdxeAzjfuqN6)
Base: Grant Assistant v2 — Test (appC8hCEmhYdFxumE)
URL: https://airtable.com/appC8hCEmhYdFxumE
Branch: develop/v2-cross-platform-storage

## Execution
- Account-wide Airtable discovery returned no matching test base before creation; workspace creation access confirmed.
- Created one disposable base using connected Airtable create operation with field definitions derived from src/v2/airtable-provisioning.mjs.
- This used the same provisioning schema, but did **not** execute the repository CLI end-to-end; do not represent it as a CLI acceptance test.
- Tables and field counts: Organization Profiles 24, Organizations 10, Grants 28, Search Audit 21; 83 total.
- Read back actual tables and detailed field schema, verifying expected names, types, field counts, and all four single-select option lists. Result: PASS.
- CI run 41652024591 passed 86/86 tests for the simplified installer and other storage-neutral components.
- No legacy BTM Southwest base writes, migration, cutover, or production modifications.

## Remaining acceptance
- Exercise CLI preview and create/reuse behavior with a credentialed runtime (do not create a second test base).
- Synthetic create/read/update/delete tests in disposable base, with cleanup and reconciliation.
- Confirm workspace identity for existing-installation reuse; Airtable account-wide list may not return workspaceId.
- Audit/remove unused journal/exclusive-lock modules only after checking references and tests.
- Do not declare complete production readiness until these checks pass.

## Live synthetic CRUD smoke test — PASS
- Base appC8hCEmhYdFxumE; Grants table tblUkTd6VlZaknEWB.
- Before test: zero grant records.
- Created synthetic grant with logical ID smoke-20261103-01, stage possible, fit score 42.
- Read verified same record and score.
- Updated fit score to 84 and stage to watchlist; readback verified both.
- Deleted synthetic record recPWno666tZRzv7V; confirmed zero remaining Grants records.
- No production or nonprofit source writes. No synthetic record remains.

## Reconnection caveat
- The account-wide Airtable base listing omits workspaceId. The CLI's strict automatic reuse requires verified workspace identity and therefore currently stops for review on a matching base without that identity.
- The live test base was successfully discovered and inspected through connected Airtable tools, but a credentialed CLI end-to-end reconnection test was **not** performed. Do not claim it passed.
- A narrow resolution is needed: verified workspace membership or explicit operator selection of the discovered base ID, while maintaining protection against cross-workspace accidental reuse.

## Reconnection remediation — 2026-11-03
- Added explicit --base-id selection to the installer CLI for matching existing bases when account-wide metadata omits workspace membership.
- Requires both an exact discovered base ID and the same selectedBaseId in approval; verifies schema before reconnecting. Refuses replacement creation when a selected base is absent.
- Added three negative/positive tests for selected-base reconnection. CI run 41654054103: 89/89 passed.
- This is a simulated reconnection test against the actual provisioning plan, not a credentialed execution of the CLI against Airtable. The existing live base was inspected with the connected Airtable tools and its CRUD smoke test passed.
- No further live bases or records were created by this remediation.
