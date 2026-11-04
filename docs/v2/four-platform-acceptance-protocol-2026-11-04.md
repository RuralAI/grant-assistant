# Grant Assistant v2 — four fresh-session acceptance protocol
Status: prepared, NOT executed
Branch: develop/v2-cross-platform-storage
Production main: prohibited during testing

## Preflight
1. Select one branch commit SHA and record it in each test. Never use an unpinned default-branch URL.
2. Confirm the operator has access to the selected branch and the required destination connector. Reading a GitHub file is not the same as installing a skill.
3. Select an approved disposable Airtable workspace/base or Google Drive folder/workbook. Inspect existing candidates before proposing changes.
4. Confirm expected contract version and field count. New contract has four collections and 84 fields; pre-existing 83-field destinations require an explicitly approved non-destructive field addition. Do not auto-migrate.
5. Require an explicit approval prompt before any destination creation or mutation.

## Matrix
| Test | Runtime | Destination | Result |
|---|---|---|---|
| T1 | Fresh Claude | Airtable | NOT RUN |
| T2 | Fresh Claude | Google Sheets | NOT RUN |
| T3 | Fresh ChatGPT | Airtable | NOT RUN |
| T4 | Fresh ChatGPT | Google Sheets | NOT RUN |

## Common test script
1. Open a completely fresh conversation and provide the exact branch and pinned commit.
2. Ask the assistant to load AGENTS.md (ChatGPT) or CLAUDE.md (Claude), then skills/grant-assistant-v2/SKILL.md and its references. Observe whether the platform actually supports importing/installing the skill; record the actual method used.
3. Select destination. Confirm authorized access and discover candidate installation. Inspect without writing.
4. Capture proposed changes, identity, schema differences, approval prompt. Approve only the disposable destination.
5. Install/reconnect; read back all four collections and 84 fields. Verify review_status select choices.
6. With separate approval, create a synthetic opportunity; read it back; update agent-owned fit_score; verify protected stage, operator_notes, and review_status cannot be changed by an agent patch.
7. Test a human-authorized review-status change and verify that subsequent research reconciliation preserves it.
8. Repeat the synthetic opportunity ingestion; verify no duplicate and correct audit counts.
9. Delete synthetic fixtures with explicit approval; verify cleanup.
10. Record exact runtime, connector path, commit SHA, destination URL/ID, actions, outputs, failure modes, and cleanup evidence.

## Stop conditions
- No connector permission or no supported skill import path: BLOCKED, not PASS.
- Wrong/missing field or incompatible existing installation: BLOCKED pending approved migration.
- Unknown duplicate identity, row reorder conflict, concurrent write, or changed human field: STOP, no overwrite.
- No repository runtime exercised: report connector-only PASS separately from CLI/OAuth acceptance.
- Do not merge main until all four pass against the same commit and the human release owner approves.

## Evidence record
For each test capture: test ID, pinned commit, runtime and version, destination, install mechanism, preflight, schema verification, synthetic CRUD, review protection, dedup, audit, cleanup, defects, PASS/FAIL/BLOCKED, reviewer and date.
