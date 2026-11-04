# Grant Assistant v2 — Claude repository entrypoint

For a user requesting Grant Assistant v2 installation, read `skills/grant-assistant-v2/SKILL.md` and its installation contract. Ask whether to use Airtable or Google Drive (Google Sheets). Inspect, show plan, request approval, install/reconnect, and verify. Do not use the legacy v1.1 installer for v2. A repository link alone is not a runtime or a skill installation; the user may need to import the skill and connect provider tools.

## v2 development testing boundary
For pre-release tests, use only `develop/v2-cross-platform-storage` at an explicitly recorded commit SHA. Never fetch the default `main` branch for a v2 test. Read `docs/v2/four-platform-acceptance-protocol-2026-11-04.md` and `skills/grant-assistant-v2/references/review-workflow.md` before any destination writes. The CRAI-specific research skills live in the private `RuralAI/crai-skill-library`; their production Airtable write mapping is not a portable installation schema. Report missing access or unsupported installation capability rather than claiming success. Do not merge or deploy production.
