# Grant Assistant v2 — CI regression finding and remediation
Date: 2026-11-04
Repository: RuralAI/grant-assistant
Only branch modified: develop/v2-cross-platform-storage

## Supplied CI runs
- https://github.com/RuralAI/grant-assistant/actions/runs/41861322137 — push fc0c0aea; FAILED; 100 passed, 1 failed of 101.
- https://github.com/RuralAI/grant-assistant/actions/runs/41861332189 — push 2f063b95; FAILED; 100 passed, 1 failed of 101.
- https://github.com/RuralAI/grant-assistant/actions/runs/41861379992 — push 05d9196c; FAILED; 103 passed, 1 failed of 104.

All three failures were the same assertion in tests/v2-google-sheets-connection.test.mjs, C01: expected 83 collection headers, actual 84. The four-collection provisioning plan intentionally grew from 83 to 84 with Grants.review_status; the pre-existing test fixture retained its old field count. In the latest run, all three new review-status regression cases passed. These results do not establish end-to-end OAuth, skill installation, or live adapter parity.

## Change made
Updated C01 field-count assertion from 83 to 84 on the approved branch, commit 7c13501169db4fbd212fbbb2c07a367ee76f8a9d. No changes to the production main branch or destination databases.

## Required verification
A new GitHub Actions validation run on commit 7c13501169db4fbd212fbbb2c07a367ee76f8a9d (or descendant) must finish successfully before declaring the regression closed. Do not confuse earlier failures on old commits with failure of the corrected commit. Additional credentialed adapter, migration, installer, and fresh-session acceptance gates remain open.
