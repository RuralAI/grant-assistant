# Grant Assistant v2 — operational skill expansion checkpoint
Date: 2026-11-04
Status: DEVELOPMENT IN PROGRESS; final acceptance BLOCKED.

## Architectural priority
The five operating skills are a first-class product deliverable, equal in importance to cross-platform ChatGPT support and Google Sheets support. They must expand research/source discovery, scoring, writing and governance behavior rather than merely reproduce legacy CRAI prompts.

## Implemented on develop/v2-cross-platform-storage
- Expanded generated Prospect Scan, Scoring, Storage Write, Grant Writing and Audit Log instructions with actionable workflows, evidence, authority, review and provider-specific constraints (61e92bc).
- Added approval-gated skill-registration orchestrator requiring actual host registration and subsequent discoverability verification. No host capability => BLOCKED, never false success (33d331c).
- Added synthetic registration tests for approval refusal, missing host capability, successful injected mock registration, discovery failure, schema drift and five workflow contents (e122f66).
- CI passed for 61e92bc and 33d331c; e122f66 test run queued when checked.

## Remaining critical gaps
- Source-by-source semantic review and actual parity/expansion of canonical CRAI skill library content.
- A real supported Claude/ChatGPT skill import/registration implementation, not injected mock callbacks.
- Full installer orchestrator: actual destination provisioning, authoritative readback, skill generation, registration and rollback/retry.
- Credentialed Sheets normalization/concurrency parity, and actual end-to-end grant workflow including drafting, source validation, audit and cleanup.
- Human four-platform acceptance and production release approval.

Do not equate unit/mock registration success with real skill installation. No production writes.
