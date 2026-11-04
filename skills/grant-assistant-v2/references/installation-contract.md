# Grant Assistant v2 installation contract

Authoritative field definitions: `src/v2/airtable-provisioning.mjs`, function `buildAirtableProvisioningPlan`. Four collections: `organization_profile` (Organization Profiles, 24 fields, `profile_id`); `organizations` (Organizations, 10 fields, `organization_id`); `grants` (Grants, 29 fields, `grant_id`); `search_audit` (Search Audit, 21 fields, `run_id`). Total 84 fields for new v2.1 test installations. Existing 83-field destinations require explicit review and non-destructive approval before adding review_status.

## Installation gates
- Ask for provider choice and approved destination (Airtable workspace or Google Drive folder).
- Discover existing candidate before creating. Inspect exact names, columns, and types where supported.
- Show planned changes and request explicit approval.
- Create or reconnect, never create duplicates on an uncertain response.
- Verify all four collections and all 84 fields, record canonical destination URL, and state test limits.
- For Sheets, header text is a compatibility check, not full enforcement of Airtable data types; JSON, dates, numeric and select rules must be enforced by the logical adapter.
- No production migration or grant import during installation.
- Keep secrets in platform credentials/authorized runtime, never in public repository, conversation, or spreadsheet.

## Acceptance matrix
Airtable: actual credentialed CLI reconnect; schema inspect; synthetic CRUD; cleanup.
Google: real authenticated HTTP client or explicit connector path; schema inspect; synthetic CRUD; cleanup; row reorder and duplicate safety.
Both: ChatGPT and Claude entrypoint discovery, permission prompt, provider selection, approve-before-write, readable failure and retry guidance.

## Current implementation caveats
`src/v2/google-sheets-connection.mjs` is a transport-level integration, **not yet equivalent** to the full `createAirtableAdapter` normalization and protected-field authorization semantics. Its authorize callback must be supplied by trusted code. Do not claim parity until validator/codec tests are implemented.
`src/v2/google-sheets-row-transport.mjs` currently uses row locators with identity checks; concurrent edits between check and write remain a risk. For Friday, use a disposable sheet and avoid concurrent editors. The live connector smoke test previously exercised the Google Drive connector, not the repository OAuth client.

## Review status addition (2026-11-04)
Grants.review_status is a single-select with exact choices Pending Review, Approved, Rejected, Needs Research. It is separate from stage, and agents cannot change existing human decisions. Inspect existing 83-field installations before any migration; never silently alter a destination. Read review-workflow.md for discovery and approval semantics.
