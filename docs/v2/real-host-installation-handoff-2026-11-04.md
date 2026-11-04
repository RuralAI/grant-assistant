# Grant Assistant v2 — real-host installation handoff
Date: 2026-11-04
Branch: develop/v2-cross-platform-storage
Status: Engineering gate, NOT live acceptance or release approval

## Verified baseline
GitHub Actions run 41910913780 at ae16728e5e1897ad602b8e6537448811c19d2c94 passed 122/122 storage-neutral tests. This proves synthetic binding, generation and registration orchestration only. It does not prove an authenticated ChatGPT or Claude skill import or an operating storage-write runtime.

## Required host capability contract
The host must provide all of the following, and each must be demonstrated independently:
1. A supported installation/import operation that registers a complete skill directory (SKILL.md, agents/openai.yaml and references/storage-binding.json) for the intended ChatGPT or Claude user/workspace. A GitHub file read is not an installation.
2. An authoritative post-install skill listing or discovery operation. A callback returning true without checking the platform is not verification.
3. An authenticated Airtable or Google Sheets runtime able to inspect live destination schema, call the approved v2 adapters, enforce trusted authorization and read back mutations. The generated SKILL.md alone cannot execute Node modules.
4. Human approval for destination changes, skill registration and synthetic CRUD, separately; no unapproved writes or operator-field changes.
5. A recorded cleanup and reconciliation procedure for disposable test records.

## Installer orchestration
- Inspect candidate destination and permissions without writing; detect 83-field legacy schema and stop for explicit non-destructive migration approval.
- Provision/reconcile exactly four collections and 84 fields only after approval; read back physical IDs, types, headers and select options.
- Generate destination-specific binding and five complete skills. Validate manifest hashes and recheck schema fingerprint.
- Call prepareSkillInstallation with real host-backed approve/register/verify functions; if host lacks these, return BLOCKED with the generated bundle for manual supported import. Never inject success callbacks or label a downloaded package INSTALLED.
- Verify every imported skill is discoverable in a fresh session; exercise its authorized adapter path with synthetic fixtures and readback. Do not treat connector-only CRUD as repository CLI/OAuth verification.
- Test duplicate rerun, human review_status preservation, protected stage/operator_notes, audit append-only, partial failures, and cleanup.
- Capture per-platform evidence under docs/v2/four-platform-acceptance-protocol-2026-11-04.md; four-platform release remains blocked until T1-T4 pass against the same pinned commit.

## Current implementation gap
src/v2/skill-registration.mjs delegates registration/discovery to caller-provided callbacks. No verified platform-specific callback implementation or authenticated end-to-end skill-to-adapter execution exists in the pinned baseline. The added tests/v2-skill-registration-host-gates.test.mjs checks negative/fail-closed paths, not a real platform. Do not equate a green CI run with live readiness.

## Next integration decision
Identify the supported ChatGPT and Claude skill import/discovery interfaces in the target runtime, and whether the authenticated Node adapter can be hosted or must be replaced by connector-native operations with equivalent preflight, ownership and readback gates. Do not assume either platform exposes a public programmatic skill registration API. No production writes or main merge.
