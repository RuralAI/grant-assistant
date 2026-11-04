# Grant Assistant v2 — canonical skill parity verification
Date: 2026-11-04
Verification source: RuralAI/crai-skill-library/main/skills/grant-assistant/v2, five SKILL.md files.
CI: run 41909109300 failed 1/121 due to index-based test selecting Grant Scoring rather than Storage Write; corrected in 7b7220c6f8361bb8cbe6df5da4a0744307b6d23b; CI run 41909840335 completed SUCCESS.

## Canonical method findings
- Prospect Scan: nine search lanes, two-tier source verification, per-lane reporting, partner pathway, donor/prospect registry, duplicate and restriction checks, honest audit.
- Scoring: primary-source verification, funding-type classification, objective fit /20, separate readiness and effort estimate, partner pathway, visible downgrade layers and pushback.
- Airtable Write: authoritative physical field IDs, live schema, five field write classes, exact select values, funder-first dedup, no automation/formula writes, human stage gate, archive-not-delete.
- Writing: requires human Stage=Active pursuit gate, existing draft lookup, claims inventory, profile voice rules, review and source-linked draft handoff.
- Audit: per-lane scoreboard, discovery/scoring/maintenance classification, triaged versus scored, adjacent registry, stopping rationale, carried-forward items.

## Portable v2 gaps
- Current generated Prospect Scan does not specify nine configurable lanes, tiered verification evidence and per-lane scoreboard.
- Current Scoring uses /100 weighting but no /20 compatibility, effort estimate, downgrade/partner pathway methodology.
- Current Storage Write binds IDs and protects human fields but does not yet implement complete CRAI five-class semantics; must adapt to the 84-field portable schema rather than copying 95-field production mapping.
- Current Writing allows draft preparation without enforcing an equivalent explicit human pursuit authorization gate; needs existing-draft reconciliation and claims inventory.
- Current Audit lacks per-lane detail model beyond generic fields, and must not claim exact parity when 21-field portable schema cannot represent every canonical dimension separately.

## Recommendation
Treat canonical methods as the behavioral baseline and adapt to portable v2 fields and explicit human authority; record unsupported semantics in audit JSON fields only where schema allows. Keep source-specific CRAI production IDs and field map out of portable installations. Do not claim full parity or final acceptance until these gaps are resolved.

## Registration reality
prepareSkillInstallation accepts trusted injected register/verify callbacks and correctly blocks without them. No actual ChatGPT/Claude skill-import mechanism has been proven. Mock success is not live installation evidence.

## Release state
BLOCKED pending actual registration support, full skill parity, integrated end-to-end synthetic run and credentialed destination acceptance.
