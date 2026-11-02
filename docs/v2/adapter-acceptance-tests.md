# Grant Assistant v2 — storage adapter acceptance matrix
Status: test specification; no adapter implemented yet.

Run identical fixtures against an isolated Airtable test base and isolated Google Sheets workbook. No production records.

| ID | Fixture / operation | Expected outcome |
|---|---|---|
| A01 | Create organization profile with all 15 intake answers, conditional blanks | Both adapters round-trip equivalent normalized values |
| A02 | Save grant with verified source ID and URL | Stable grant_id, provenance, dates and values survive |
| A03 | Re-ingest same source ID | No duplicate; safe update only |
| A04 | Same program URL, different cycle | Distinct opportunity when verified |
| A05 | Different grants sharing a funder URL | No false dedup |
| A06 | Low fit score, no hard barrier | Grant retained and visible with explanation |
| A07 | Hard ineligibility supported by primary source | Mark ineligible, log evidence, do not auto-archive |
| A08 | Temporary funder restriction with expiry | Retain grant; conditional restriction displayed |
| A09 | Unknown requirement | eligibility_status=unknown, verification task retained |
| A10 | Distinct named search profiles | Each run and grant records correct profile |
| A11 | Two consecutive scans with overlapping queries | Audit records coverage and carry-forward accurately |
| A12 | Post-run summary counts | Match audit identified/added/scored/deferred counts |
| A13 | Agent tries to promote possible to active | Rejected; human-only stage transition |
| A14 | Existing operator note changed during scan | No overwrite or silent loss |
| A15 | Sheets row reorder / Airtable record ID changes | Logical IDs and relationships remain intact |
| A16 | Multiple organizations on one grant in different roles | Roles remain grant-specific and evidence linked |
| A17 | Optional writing reference missing | Discovery and scoring still function |
| A18 | Federal search, missing SAM registration | Grant remains visible with readiness note |
| A19 | Missing source URL during preliminary discovery | Hold as unverified lead; do not claim verified opportunity |
| A20 | User excludes loans | No loan recommendation in grants-only search |

Evidence for each run: fixture ID, adapter, input, normalized output, diff, pass/fail, any manual review. Compare semantic equivalence, not identical provider-specific IDs. Test no-write preview before live migration.

## Implementation blocks
1. Freeze provisional field names and define serialization/deserialization rules.
2. Implement storage-neutral validation and normalization.
3. Implement Airtable adapter and isolated fixture tests.
4. Implement Sheets adapter and the same fixture tests.
5. Add parity and concurrency tests; review navigation UX separately.
6. Integrate installer only after contract and adapters pass.
