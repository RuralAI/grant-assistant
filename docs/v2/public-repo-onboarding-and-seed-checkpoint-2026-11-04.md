# Grant Assistant v2 — onboarding and public-repository installer contract
Date: 2026-11-04
Status: Implementation checkpoint; not live installation acceptance

## User experience to preserve
An operator in a fresh Claude or ChatGPT session points to the public RuralAI/grant-assistant repository, reads the platform-specific AGENTS.md or CLAUDE.md and v2 installer skill, chooses Airtable or Google Sheets, completes a progressive organization seed interview, approves a reviewed installation plan, creates/reconciles four collections (84 fields), imports five bound skills, and can subsequently run discovery -> scoring -> authorized storage -> audit, with grant writing available after human pursuit approval. Never treat reading the repository as executing or installing its code.

## Fifteen-question baseline
Canonical source: docs/v2/onboarding-map.md (Jackson working baseline dated 2026-11-02). Subjects: (1) issue areas, (2) search geography and headquarters, (3) beneficiaries, (4) applicant type, (5) fiscal sponsor when applicable, (6) SAM/UEI for federal search, (7) founding/audit history, (8) budget, (9) funding preferences and loan exclusions, (10) restricted funders, (11) partners and roles, (12) eligibility barriers, (13) programs and maturity, (14) preferred award band, (15) optional discovery terms. Collect identity/profile name and ID as installer metadata, not additional numbered judgment questions. Accept source documents as candidate evidence but require confirmation; never silently invent profile judgments.

## Seed template lifecycle
- Start from a blank, versioned v2 organization seed template; ask progressively and accept partial answers.
- Keep unknowns explicit. Conditional questions do not universally halt installation; they may block particular scans, eligibility conclusions or scoring.
- Validate the draft with src/v2/organization-intake.mjs and show the user a seed preview and warnings. The module intentionally does not write to a provider.
- The human approves profile values and destination changes separately. The installer must persist/read back Organization Profiles and preserve selected profile_id for all later skills.
- Legacy v1.1 skill/grant-assistant-startup/assets/Org-Seed-Template-BLANK.md and its ten hard-required judgments are NOT the v2 15-question template. Do not direct new v2 users to complete all 43/44 legacy prompts.
- Partner and restricted-funder responses may require explicit reviewed Organizations entries or contextual notes; the v2 84-field contract does not automatically create separate role/restriction tables.

## Remaining implementation gaps
1. Wire seed collection, validation, approval, persistence and readback into full-install-orchestrator.mjs. Current src/v2/organization-intake.mjs only validates/previews; no user-facing guided interview or actual profile seeding is implemented yet.
2. Ship a blank versioned v2 seed template with the bootstrap skill; avoid confusing it with legacy v1.1.
3. Provide a supported real ChatGPT and Claude skill import/discovery path or a clearly blocked manual import handoff; do not fabricate host callbacks.
4. Execute authenticated adapter calls in the host or an authorized runner and verify full scan/scoring/storage/audit, protected human fields, duplicate rerun and cleanup.
5. Run CI and then four fresh-session acceptance tests against one pinned commit before release.

No production destination, main branch or canonical skill library changes authorized by this checkpoint.
