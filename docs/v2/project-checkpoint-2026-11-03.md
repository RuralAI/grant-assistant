# Grant Assistant v2 — November 3, 2026 checkpoint

## Decision and scope
Pause installer feature development at this checkpoint. Target first-user installation rehearsal Friday, November 6. Public repository `RuralAI/grant-assistant`, working branch `develop/v2-cross-platform-storage`. Intended user flow: choose Claude or ChatGPT; load platform entrypoint/skill; choose Airtable or Google Drive (native Google Sheets); inspect existing destination; request explicit approval; create or reconnect via the four-collection v2 contract; verify; begin grant workflows. A public repository URL alone does not install a skill or grant API permissions.

## Verified
- Disposable Airtable v2 test base `appC8hCEmhYdFxumE`: four tables, 83 fields; earlier connector-level synthetic CRUD.
- Disposable native Google spreadsheet `1xOnCdCGmy4d4QrwUMm1Aqf4GfmN4R8FJ0TLlIyfkDXA`, in shared Drive folder `1iDLieJ9GiDb1yVrx4MBEHVmdqAKgA7ra`: four worksheets, 83 headers. Connector-level synthetic create/read/update/cleanup succeeded; clean header-only Grants worksheet afterward.
- Google Sheets transport, HTTP client, contract connection module and automated tests committed. Latest tested integration CI run `41658043464` succeeded.
- `skills/grant-assistant-v2/SKILL.md`, `skills/grant-assistant-v2/references/installation-contract.md`, `AGENTS.md`, `CLAUDE.md` committed to branch. These entrypoint files have NOT been independently validated or tested in fresh user sessions.

## Open acceptance gates
1. Validate/package skill and platform-specific entrypoint discovery in fresh Claude and ChatGPT sessions.
2. Credentialed Airtable installer CLI test and repository Google OAuth HTTP client test (connected Google Drive service smoke test is not proof of HTTP client runtime).
3. Google Sheets codec/normalization parity with Airtable and protected operator-owned field behavior. Authorization callback must come from trusted runtime.
4. Duplicate prevention, stale row/concurrent edit handling, reconnect behavior, failure/retry and cleanup tests.
5. Complete first-user installation rehearsal with explicit approve-before-write and no intervention from developer.

## Boundaries
No production changes, no changes to legacy v1.1 nonprofit base, no deployment/merge to main at this checkpoint. Do not claim release readiness. Keep Friday installer scope separate from grant intelligence.

## Next workstream: grant intelligence
Begin with read-only inventory and conceptual design of grant intelligence sources, evidence, source authority, provenance, refresh cadence, eligibility and fit signals. Treat Supabase as a possible intelligence corpus, not a replacement for the user's Airtable/Sheets operational grant system. Do not create Supabase schemas or write records without a separate explicit approval.
