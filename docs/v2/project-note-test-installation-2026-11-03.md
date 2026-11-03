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
