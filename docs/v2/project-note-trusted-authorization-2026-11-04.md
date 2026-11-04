# Grant Assistant v2 — trusted authorization checkpoint
Date: 2026-11-04
Branch: develop/v2-cross-platform-storage
Status: Sheets authorization hardening committed; CI verification pending.

## Evidence
- GitHub Actions 41877678030 passed on eb4349a7 (adapter protection baseline).
- Reviewed the five canonical CRAI skill entrypoints and field map; manifest SHA-256 comparison and standalone ZIP packaging remain pending.
- Identified a privilege escalation risk: Google Sheets previously treated caller-supplied context.actor=operator as sufficient to bypass human-review restrictions.

## Change
- Google Sheets connection now derives operator permission from the result of its trusted authorize callback. A boolean true authorizes a write but does not confer operator privilege. A structured result with actor=operator from the trusted callback confers operator capability. Callers cannot self-assert via context.actor.
- Added regression C07 to reject an untrusted caller's operator label.
- Commit 2d9e05ad (implementation), 737edb26 (test).
- This is not a complete authentication system: the host must supply a trustworthy authorize callback bound to a verified human and approved action.

## Open gate
- Airtable adapter still accepts caller-provided actor=operator with authorize returning true; this is a separate privilege boundary requiring consistent remediation and regression coverage before four-platform acceptance.
- Run CI for 737edb26 or descendant and inspect logs.
- Verify exact SHA-256 source provenance, validate/package the skill, and test both destination providers.
- No changes to production main or live destination records.
