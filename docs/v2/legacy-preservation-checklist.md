# Legacy release-1.2.0 preservation checklist
Branch: release-1.2.0; reviewed against develop/v2-cross-platform-storage on 2026-11-02.
Status: preservation inventory, not permission to delete.

## Carry forward
- Five operating methods: prospect scan, scoring, write, audit, writing.
- Runtime separation of method from organization-specific judgment; profile selection must be explicit.
- Human stage-promotion gate, explicit upgrade consent, primary-source verification, no invented evidence.
- Audit cycle classification, queries, coverage, stopping rationale, uncovered sources and carried-forward items.
- Separate objective fit from qualitative readiness, but correct low-score automatic exclusion.
- Installation lessons: connector workspace scope, existing-install detection, safe reconciliation, complete dedup baseline, fallback for missing bundled assets, field-name/schema verification, and post-install validation.
- Documentation: getting-started, pre-flight, what-this-does-not-do, versioning, Airtable FAQ and schema, changelog.
- Security boundary: no beneficiary PII, payment details, or invented compliance assurances.

## Replace rather than port unchanged
- Ten-table Airtable-only master model and hard-coded option sets.
- Old ten-required-field onboarding and loan posture.
- Claude-only packaging and installation assumptions.
- Any instructions that assume an Airtable-only UI or always use the first profile.

## Retirement gate
[ ] Verify each preserved behavior has a v2 test or specification.
[ ] Validate cross-platform installer and audit behavior.
[ ] Preserve a stable tag or commit reference for 1.2.0.
[ ] Confirm no unique files or assets are required for current installs.
[ ] Obtain explicit approval to delete release-1.2.0.
No deletion or merge is authorized by this checklist.
