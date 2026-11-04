---
name: grant-assistant-v2
description: Install or reconnect Grant Assistant v2 from the RuralAI public repository in Claude or ChatGPT, selecting Airtable or Google Sheets storage, inspecting destination schemas, obtaining explicit approval, and verifying the four-collection grant workflow.
---

# Grant Assistant v2 installation

Use the v2 contract, not the legacy v1.1 nonprofit installer. Read [installation-contract.md](references/installation-contract.md) before taking actions. For grant discovery, review, and audit behavior, read [review-workflow.md](references/review-workflow.md).

1. Confirm that the user wants a new installation or a reconnection, and ask: **Would you like to install Grant Assistant with Airtable or Google Drive (Google Sheets)?**
2. Identify which platform tools and authorized connector scopes are actually available. A public repository URL alone does not grant connector permissions or execute scripts. If capabilities are missing, explain exactly what the user must connect; never request pasted tokens.
3. Inspect the chosen destination first. Find any existing compatible installation and verify the four collections and exact field headers against `src/v2/airtable-provisioning.mjs`. Do not treat a same-name but incompatible database as reusable.
4. Present an inspection report, intended changes, destination location, and any missing permissions. **Request explicit user approval before creating or changing anything.** Never silently repair an incompatible installation.
5. Airtable: use the inspection-first v2 installer in `src/v2/airtable-install-cli.mjs` only when its required runtime and authenticated Airtable API are available. Otherwise use equivalent authorized connector operations with the same plan and verification gates; disclose which path was used.
6. Google Drive: create or select one native Google spreadsheet in the approved Drive folder, with tabs Organization Profiles, Organizations, Grants, Search Audit. Populate header rows from the v2 provisioning plan, not a hand-maintained copy. Use `src/v2/google-sheets-connection.mjs` and `src/v2/google-sheets-http.mjs` only where the authenticated Node runtime is available. A connector-driven installation is acceptable only after exact live header readback.
7. Verify 4 collections / 84 fields for a new v2.1 test installation; pre-existing 83-field installations require an explicit non-destructive migration plan and approval, logical ID mappings, and no duplicate installation. Report the destination URL and what was actually tested. Do not seed real grants or make unauthorized pipeline decisions.
8. Offer a synthetic CRUD smoke test in the disposable installation with separate user authorization. Verify cleanup. A connector smoke test is **not** proof that the repository OAuth runtime worked.

Never modify an existing v1.1 nonprofit installation by default. Preserve operator-controlled stage and notes. Never claim a ChatGPT or Claude skill was automatically installed just because its repository file was read.
