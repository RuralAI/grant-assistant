# Grant Assistant v2 — connector-first installation and acceptance
Status: development; not certified. Use branch `develop/v2-cross-platform-storage` pinned to a commit SHA. No production or v1.1 changes.

## End-user entry
1. In ChatGPT or Claude, connect GitHub and either Airtable or Google Drive using the platform's normal connector authorization. No pasted tokens, GitHub Actions secrets, CLI, or independent OAuth configuration.
2. Ask the assistant: "Install Grant Assistant v2 from RuralAI/grant-assistant, branch develop/v2-cross-platform-storage at commit <SHA>, using [Airtable / Google Sheets]. Read AGENTS.md or CLAUDE.md and skills/grant-assistant-v2/SKILL.md. Inspect first; do not create or modify anything until I approve."
3. Assistant confirms repository branch/commit, connector capabilities, destination workspace/folder, and whether a platform-supported skill import/discovery operation exists. Repository access is not skill installation.
4. Inspect existing destinations. Present exact plan, 4 collections/84 fields, select options, expected source identities, permissions and existing-data safeguards. Require explicit approval before creation or modification.
5. Execute using connected platform tools where available; read back physical table/field IDs (Airtable) or spreadsheet/sheet IDs and ordered headers (Sheets). Never fabricate or infer physical bindings.
6. Generate five destination-bound skill packages from verified bindings: grant-prospect-scan, grant-scoring, grant-storage-write, grant-writing, grant-audit-log. Use a supported host import/install mechanism; verify each skill independently through host discovery. If no supported import mechanism exists, report BLOCKED and provide a package for supported manual import. Do not label skills INSTALLED merely because their files are readable.
7. Request separate authorization for synthetic CRUD and cleanup. Use a uniquely marked fixture, read back each write, check logical-ID deduplication and refusal of unauthorized edits to stage, review_status and operator_notes. Audit must be append-only. Verify cleanup and report residual fixtures.

## Connector-native execution contract
- Platform connector authentication is the runtime authorization; do not export or reuse connector credentials.
- Before every write, verify destination identity, expected schema and field types/options where exposed, logical IDs and current values. Abort on drift, missing connector permission or ambiguous identity.
- Preserve canonical source ID and URL. Reconcile grants by source_system + source_record_id, otherwise canonical URL + opportunity_cycle. Do not deduplicate on title alone.
- Enforce human-owned stage, review_status and operator_notes; only a genuinely verified operator action can change them. Ordinary assistant approval is not evidence of elevated operator authority. Preserve human decisions during reconciliation.
- Sheets: validate types, enums and normalization in the skill workflow or supported adapter; exact headers alone are insufficient. Do not use stale row numbers; resolve identity immediately before write. Concurrent edits can race: stop on conflict.
- Airtable: use verified base/table/field IDs; preserve field types, select choices and linked-record semantics. No production migration.
- If the host cannot enforce a required invariant, mark that operation BLOCKED rather than silently bypassing the Node adapter.
- Always distinguish connector-executed verification from repository Node HTTP/CLI verification.

## Acceptance evidence (per host and provider)
Record pinned SHA, actual import/discovery mechanism, destination URL, approved changes, 4/84 schema readback, skill discovery (five independently), synthetic create/read/update, forbidden update refusal, deduplication, audit, cleanup, defects and PASS/BLOCKED/FAIL/NOT TESTED. Test independently in fresh ChatGPT+Airtable, ChatGPT+Sheets, Claude+Airtable and Claude+Sheets sessions. A passing repository unit test is not host acceptance.

## Engineering boundary
GitHub Actions run deterministic code/contract tests. Credentialed GitHub Actions Google/Airtable workflows are optional developer diagnostics and never a prerequisite for end-user installation. Preserve existing Node modules as developer/runtime options; never claim they ran when the platform connector performed operations. No merge to main or release certification before four host/provider acceptance tests and human approval.
