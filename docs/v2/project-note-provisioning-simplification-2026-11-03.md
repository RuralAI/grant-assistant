# Project note — Grant Assistant v2 provisioning simplification
Date: 2026-11-03
Status: Approved architectural direction; implementation validation ongoing
Branch: develop/v2-cross-platform-storage

## Decision and rationale
The team explicitly reversed the earlier local-journal/exclusive-lock installation approach. That approach introduced an installation host, persistent filesystem management, lock ownership, recovery journal, and cryptographic plan approval beyond the user experience required for a disposable, destination-native Grant Assistant installation. Keep installation as simple as creating an Airtable base or Google Sheet.

## Approved behavior
- User selects storage and destination; inspect existing candidate installations and their actual schemas before creation.
- Reuse an existing compatible installation. If incompatible, duplicate, or inaccessible, stop and request review. Do not repair, delete, or overwrite automatically.
- If absent, preview and obtain explicit approval, create once, verify schema, and report the resulting connection configuration.
- On uncertain creation result, do not blindly retry. Rediscover and reconcile manually; a base name alone is not a unique identifier.
- Retain schema verification, versioned portable field contracts, and protections for user-owned data.
- Keep migration from BTM Southwest v1.1 separately authorized and strictly read-only until migration approval.
- No required local journal, lock directory, distributed coordinator, or mandatory installation manifest table.
- Concurrent independent installers cannot be guaranteed exactly-once without coordination; v2 accepts explicit conflict handling rather than additional infrastructure.

## Implementation status at decision
- New inspection-first installer: src/v2/airtable-install-inspection-first.mjs.
- Six added tests; CI run 41651242248 passed 84/84.
- Earlier journal/lock implementation remains temporarily as superseded experimental code pending reference audit and removal.
- Disposable target: CRAI Databases workspace wspEeRdxeAzjfuqN6; Grant Assistant v2 — Test, four core tables.
- No test base provisioned at time of this note. No legacy nonprofit source modifications.

## Validation / acceptance
1. Verify workspace-scoped discovery and ambiguous candidate handling.
2. Ensure schema inspection validates field names, types, select options, and physical IDs.
3. Test no-write reuse, incompatible candidates, uncertain create, and unauthorized create.
4. Remove unused journal/lock code after verifying references.
5. Run final CI and read-only Airtable preflight; create test base only via verified installer path.

This note supersedes the journal-first direction and is not a change to the existing nonprofit data or production installation.
