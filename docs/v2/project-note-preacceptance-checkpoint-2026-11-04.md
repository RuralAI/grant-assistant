# Grant Assistant v2 — pre-acceptance preparation checkpoint
Date: 2026-11-04
Branch: develop/v2-cross-platform-storage
Status: Preparation in progress; not certified ready for four fresh-session tests.

## Completed on branch
- Shared 84-field contract includes Grants.review_status.
- Normalization and agent-patch protection added for review_status.
- Human-review workflow and installation contract updated.
- Regression tests authored for review_status.
- Four-platform acceptance protocol created.
- AGENTS.md and CLAUDE.md now explicitly require the development branch, a pinned commit, and review of the test protocol.

## Validation limitations
- Repository files and existing tests were inspected via the GitHub connector.
- No full Node test run has been observed for these commits. The available GitHub connector does not expose a workflow-dispatch action and the active container cannot reach GitHub, so do not label the tests passing.
- No authenticated repository CLI or Google OAuth execution has been observed.
- No new Airtable/Google destination was provisioned or migrated.
- Skill-library source manifests and exact SHA-256 comparison remain to be reconciled.
- Provider adapter end-to-end parity and 83-to-84 non-destructive migration are not yet demonstrated.

## Human gates
- Approval for each disposable destination creation/migration and synthetic CRUD.
- Four fresh-session runs with the same pinned commit.
- Explicit separate approval before merging into main.

## Next engineering tasks
1. Obtain a runnable checkout or CI workflow result for Node tests; resolve failures and record exact results.
2. Validate both provider adapters, protected-field behavior and schema compatibility in isolated fixtures.
3. Verify canonical CRAI skill source hashes and document portable-vs-CRAI-specific boundaries.
4. Package and validate the complete v2 installer skill; verify platform installation mechanics.
5. Freeze commit and hand off four-test protocol.
