# Grant Assistant v2 — Phase 1 foundation (working contract)
Status: proposed implementation contract for review; not a production release. Date: 2026-11-02.

## Product boundary
Free, portable, organization-owned Grant Assistant for solo nonprofit grant writers. Support Airtable and Google Sheets through equivalent logical data contracts. Grant Intelligence is a separate CRAI-hosted commercial product; do not connect tenant data to a shared corpus by default. Grants-first discovery: exclude loans by default.

## Minimum logical records (not mandatory physical tables)
- Organization profile: organization identity, issue areas, HQ and search geographies, beneficiaries, applicant status, fiscal sponsor (conditional), SAM.gov/UEI readiness (conditional), founding year, audited-financial years, annual budget, funding preferences, restrictions, partner references, eligibility barriers, program summaries/maturity, award range, optional search expansions.
- Grant Master: durable source identifier/URL, title, funder organization, opportunity/cycle, deadlines, geography, award range, requirements, eligibility status and evidence, fit score and rationale, readiness, search profile used, discovery date, stage, next action, operator notes, last verified date.
- Organization Master: organization name, canonical website, roles (funder, partner, applicant, subrecipient, contractor, vendor), public contact details when appropriate, source/provenance; roles on particular grants must be stored on a relationship rather than treated as permanent organizational type.
- Search audit: run identifier/time, profile, queries and source categories, sources actually checked, found/scored/triaged counts, excluded and deferred reasons, gaps, stopping rationale, next searches, and carried-forward items.
- Optional: program search profiles, organization-grant roles, writing reference document. Avoid additional mandatory tables until needed.

## Behavioral contract
1. Broad discovery uses issue areas, geography, beneficiaries, optional expanded terms; user-requested program-specific scans are allowed and explicitly labeled.
2. Verify against primary funder sources before claiming eligibility or deadlines. Unknown is not ineligible.
3. Separate hard eligibility barriers, temporary restrictions, fit ranking, and readiness. Never silently discard solely for a low aggregate score or outside preferred award band.
4. Restricted funders remain visible with restriction reason and expiry when known. Human decides pursuit and stage promotion; agents write only to permitted candidate stages.
5. Every scan attributes its search profile, reports where it looked, what was triaged, gaps and next search recommendations, and logs the cycle. At chat start surface upcoming deadlines from available records.
6. Preserve source identity and URL, avoid duplicate grants across scans and cycles, and do not invent organizational evidence.
7. Writing references (EIN, staffing, approved narratives, statistics) are optional and not required for grant discovery. Do not store sensitive beneficiary data.

## Storage portability
Logical field names, stable IDs, explicit controlled values and reproducible audit entries are shared. Airtable record IDs and Google Sheets row numbers are adapter-specific, never the sole source identity. Implement read/write/dedup operations behind storage-specific adapters; test the same scenario in each. Do not promise equivalent UI navigation until demonstrated.

## Acceptance tests
- Low-fit but eligible opportunity stays visible.
- Temporary funder restriction is displayed, not silently dropped.
- Missing primary-source requirement produces unknown/verify flag.
- Same opportunity found twice does not duplicate.
- Distinct search profiles are attributed correctly.
- Post-run summary reconciles with audit counts.
- A grant cannot be promoted by the agent without human action.
- Airtable and Sheets represent the same logical record and audit trail.

## Open decisions
Exact minimum field list and controlled vocabularies; whether search profiles require a separate table; partner role storage; exact UX/navigation in Sheets; onboarding conditional logic; how to migrate existing installations. Jackson's feedback and technical review required before finalization.
