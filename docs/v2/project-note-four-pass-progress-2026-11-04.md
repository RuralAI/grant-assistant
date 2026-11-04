# Grant Assistant v2 — four-pass build checkpoint
Date: 2026-11-04
Status: PARTIAL ENGINEERING COMPLETE; NOT READY FOR FINAL ACCEPTANCE.

## Implemented on development branch
- Decision/project note: docs/v2/project-note-four-pass-installer-build-2026-11-04.md.
- src/v2/installation-bindings.mjs: derives 84-field Airtable physical field/table IDs and Sheets sheet IDs/header positions; schema fingerprints and drift checks.
- tests/v2-installation-bindings.test.mjs: binding count, ID drift, header reorder and duplicate sheet ID.
- src/v2/operating-skill-generator.mjs: deterministic generation of five skill directories, each with SKILL.md, agents/openai.yaml, destination binding JSON and SHA-256 manifest.
- tests/v2-operating-skill-generator.test.mjs: five outputs, deterministic hashes, tamper detection, unbound rejection.
- CI success on e2a84670; run for 20ea3d3e pending at time of note.

## Not yet complete — release blockers
1. Generated skill instructions are minimal scaffolds, NOT full portable implementations derived from five canonical CRAI operational skills.
2. No full installer orchestration yet: storage provisioning -> live ID readback -> generator -> approved skill registration -> discoverability verification.
3. Google Sheets still lacks full Airtable-equivalent normalization/codecs and stronger concurrency safety.
4. No supported automated Claude/ChatGPT skill import path verified; must fail closed and require platform-supported user import.
5. No integrated synthetic workflow proving actual research, scoring, writes, drafting, audit, retries and cleanup.
6. Canonical CRAI skill source SHA-256 provenance still pending.

Do not invite final acceptance until all blockers close. Do not claim generated scaffolds are installed functional skills. No production writes or main merges.
