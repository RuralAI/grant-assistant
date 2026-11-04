# Grant Assistant v2 — full installer release blocker
Date: 2026-11-04
Decision: four-platform final acceptance is BLOCKED until the installer provisions storage AND generates, binds, installs, and verifies five operational skills.

## Required end-to-end installation
1. Inspect the explicitly approved disposable Airtable workspace or Google Drive folder and any existing compatible destination. No writes without approval.
2. Create or reconnect four collections, 84 fields, and read back authoritative provider schema and actual identifiers.
3. Emit a destination-specific binding manifest. Airtable: base ID, table IDs, field IDs, option identities where supported. Sheets: spreadsheet ID, sheet ID/title, exact header names and column indexes, logical IDs, schema fingerprint; never treat row numbers as durable identities.
4. Generate five complete portable skills: Prospect Scan, Grant Scoring, Storage Write, Grant Writing, Audit Log. Each must contain SKILL.md and agents/openai.yaml and correct installation-specific references. Preserve CRAI-specific source skills separately; do not embed production CRAI base IDs or its 95-field contract.
5. Install or register skills using an actual supported Claude or ChatGPT mechanism, then verify discoverability. If platform import cannot be performed, report BLOCKED rather than claiming installation.
6. With separate approval, run synthetic discovery -> scoring -> dedup -> authorized write -> review protection -> writing draft -> append-only audit -> readback -> cleanup. Test schema drift, stale row/locator, unauthorized operator role, retries, idempotence and partial failures.
7. Verify repeat installation/reconnect is idempotent and does not silently overwrite manually modified skill artifacts or existing data.

## Release gate
The previously packaged bootstrap skill.zip is incomplete and must not be represented as a complete installer. The four-platform acceptance protocol and any release readiness claim are suspended pending integrated generation and end-to-end verification. Existing CI passing on 9cae2852 proves unit regression only, not installer completion.

## Engineering order
A. Inventory five canonical CRAI v2 skill sources and derive portable, provider-neutral contracts.
B. Implement authoritative provider binding-manifest extraction and validation.
C. Implement five-skill deterministic generation and packaging with schema-specific Storage Write.
D. Implement platform-specific import/registration and explicit verification or documented blocked/manual gate.
E. Add end-to-end no-credential tests and credentialed disposable acceptance, then resume four-platform matrix.

No production main, canonical skill-library main, or live destination changes without explicit approval.
