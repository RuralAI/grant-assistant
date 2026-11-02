# Jackson's 15-question onboarding map
Status: working baseline (2026-11-02), not final wording approval.

| # | Intake subject | Primary function | Logical destination | Condition |
|---|---|---|---|---|
| 1 | Issue areas | Discovery | profile.issue_areas | Always |
| 2 | Search geographies and HQ | Discovery/eligibility | profile.geographies, headquarters | Always |
| 3 | Beneficiary populations | Discovery | profile.beneficiaries | Always |
| 4 | Applicant type | Eligibility | profile.applicant_type | Always |
| 5 | Fiscal sponsor | Eligibility | profile.fiscal_sponsor | Only if sponsored |
| 6 | SAM.gov and UEI readiness | Eligibility | profile.federal_registration | Only if federal searches |
| 7 | Founded year and audit history | Eligibility | profile.founded_year, audited_years | Always; allow unknown |
| 8 | Operating budget | Fit/eligibility | profile.annual_budget | Always; allow unknown |
| 9 | Funding preferences/exclusions | Fit | profile.grant_preferences | Always; grants only by default |
| 10 | Restricted funders, why/until | Eligibility | organization restrictions | Optional repeating entries |
| 11 | Partners and potential roles | Eligibility | organizations and grant roles | Optional repeating entries |
| 12 | Other eligibility barriers | Eligibility | profile.other_barriers | Optional |
| 13 | Programs/projects and maturity | Fit | program profiles/summaries | Always; not broad search filters |
| 14 | Preferred award min/max | Fit | profile.award_band | Optional; suggest, obtain approval |
| 15 | Other discovery terms | Discovery | profile.extra_search_terms | Optional |

Installer must not invent missing answers. Conditional questions are not global hard stops. Legacy ten required questions do not automatically remain mandatory. Capture question source/revision in implementation tests.

Clarify: applicant legal type vs sponsorship; UEI vs active SAM registration; loan exclusion; partner roles per grant; explicit program-directed search; exact list of hard eligibility barriers.
