# Grant Assistant v2 — human review and discovery workflow

## Separation of authority
The assistant may research, classify eligibility, score fit, reconcile duplicates and append audit evidence. It must not independently approve or reject a grant, promote stage, edit operator notes, or submit an application. Review Status and Stage are independent.

Review Status choices (exact case): `Pending Review`, `Approved`, `Rejected`, `Needs Research`.
- Pending Review: ready for human triage, without implying eligibility or readiness.
- Approved: a human approved further evaluation or pursuit, **not** application submission.
- Rejected: a human chose not to pursue; retain source evidence and record.
- Needs Research: missing or conflicting evidence prevents a human decision.

New records default to Needs Research when no review status is supplied. Only a human-authorized workflow may change Review Status. Automated patch validation rejects changes to review_status, stage, operator_notes and grant_id.

## Research sequence
1. Load the explicitly selected organization profile and preserve the source and profile identity.
2. Discover opportunities from authoritative funder sources; record canonical URLs, observed cycles, verification date, and uncertainty.
3. Separate eligibility, fit, readiness, stage, and review status. Fiscal sponsorship must be verified funder-by-funder; unknown is not eligible.
4. Reconcile using source system and source record ID; otherwise normalized canonical URL and opportunity cycle. Ambiguity requires review, not overwrite.
5. Prepare a no-write preview, with counts, evidence, unresolved eligibility, and duplicate disposition.
6. Obtain explicit approval for candidate writes into the authorized destination. Preserve human-owned fields on updates.
7. Append a truthful Search Audit entry, verify destination readback, and report any incomplete operations.

## Pilot provenance and limitations
The 2026-11-04 ChatGPT native Google Sheets pilot demonstrated discovery writes, Search Audit readback, a separate Review Status dropdown, and exact-match reconciliation. It did **not** establish synonym-aware deduplication, automated recurrence, authenticated repository OAuth runtime, or completed end-to-end human-decision persistence. Do not overclaim these gates.

## Skill-library boundary
RuralAI/crai-skill-library is the canonical source of the five CRAI-specific v2 operating skills. Their research and evidence practices may inform this portable contract. Their consolidated CRAI production Airtable field map and stage-dependent writing behavior must not be installed into another organization's database by default.
