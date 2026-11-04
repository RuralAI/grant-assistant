# Grant Assistant v2 — cross-repository grounding and test plan
Date: 2026-11-04
Status: Grounding complete; implementation and fresh-session acceptance pending
Development branch: develop/v2-cross-platform-storage
Production boundary: do not modify or merge main without explicit release approval.

## Two workstreams
1. RuralAI/crai-skill-library (private): canonical CRAI-specific grant intelligence skills: prospect scan, grant scoring, Airtable write, audit log, grant writing. Do not assume these production-CRAI write rules apply to arbitrary nonprofit installations.
2. RuralAI/grant-assistant: portable installer, four-collection data contract, Airtable/Google Sheets adapters, Claude/ChatGPT entrypoints, acceptance testing. All implementation changes belong on develop/v2-cross-platform-storage.

## Verified repository state
- Existing v2 skill entrypoint: skills/grant-assistant-v2/SKILL.md; AGENTS.md and CLAUDE.md route installation.
- V2 storage implementation under src/v2 and tests under tests/.
- Existing v2 contract: Organization Profiles 24, Organizations 10, Grants 28, Search Audit 21 = 83 fields.
- Disposable Airtable base and native Google workbook previously verified through connectors; connector tests do not prove repository OAuth/CLI runtime.
- 2026-11-04 ChatGPT Google Sheets pilot added Grants.review_status (29th Grants column) and tested discovery, audit, and exact-match repeatability. This is not yet incorporated into the repository contract. Proposed revised count: 84, subject to compatibility review.
- Skill library v2 README and SOURCE-MANIFEST.json say source transfer pending, although v2 skill files are now present. Verify content hashes and update documentation only after confirmation.

## Next implementation sequence
1. Reconcile the five canonical v2 skill sources and their current provenance; identify portable logic versus CRAI-specific production assumptions.
2. Update shared operating/review instructions and decide how to add review_status without destructive migration or accidental overwrites.
3. Update provisioning schema, adapters, validation, tests, and installer verification consistently. Preserve human-controlled stage, notes, and review decisions.
4. Verify Airtable and Google Sheets parity; do not equate connector smoke tests with repository runtime tests.
5. Pin one commit and conduct four fresh-session tests: Claude/Airtable, Claude/Sheets, ChatGPT/Airtable, ChatGPT/Sheets.
6. Record failures, remediations, and evidence; seek explicit approval before any merge to main.

## Guardrails
- Inspect first, show plan, request explicit approval before destination writes.
- Test only in approved disposable installations.
- Never request pasted credentials or store secrets in GitHub.
- No production Airtable, Supabase, or main-branch writes.
- No automatic grant-stage promotion, grant application, or claim of completed human review without evidence.
- Keep project notes and test evidence on the development branch.
