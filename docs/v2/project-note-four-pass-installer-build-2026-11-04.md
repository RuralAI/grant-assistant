# Grant Assistant v2 — one-shot four-pass engineering authorization
Date: 2026-11-04
Owner instruction: complete all four engineering passes before inviting human final installation testing. No routine human intervention needed for branch-only code, tests, documentation, or synthetic local fixtures.

## Approved objective
Installer must (1) inspect and provision approved destination with four collections / 84 fields, (2) read back actual provider identities and generate verified per-installation mappings, (3) generate five fully functional portable operating skills (Prospect Scan, Grant Scoring, Storage Write, Grant Writing, Audit Log), (4) install/register or explicitly mark blocked on platforms that lack an authorized import path, and (5) validate integrated synthetic workflow before the four-platform user acceptance.

## Passes
1. Derive portable skill contracts from canonical CRAI skills without importing CRAI-specific 95-field production mapping.
2. Airtable: bind actual base/table/field IDs. Sheets: bind spreadsheet/sheet ID, exact headers and indexes with schema fingerprint; reject drift, stale locators, ambiguous identities and concurrent edits.
3. Deterministic generation, validation and packaging of all five skills; platform-specific import and discoverability verification; fail closed when unavailable.
4. Unit, integration and synthetic end-to-end tests; explicit evidence of approval, review field protection, dedup, audit, writing output and cleanup.

## Guardrails
Branch develop/v2-cross-platform-storage only. No production main, canonical skill-library main, production Airtable/Google Sheets or external deployment. Existing disposable destinations must not be mutated without separate specific approval. Credentialed four-platform final testing remains a human gate. Green CI for 9cae2852 validates adapters only; old bootstrap ZIP is not a complete installer.

## Acceptance condition
No release-ready claim until five generated skills, verified provider bindings, supported installation/registration, and integrated synthetic flow all pass. Record partial results and blockers accurately.
