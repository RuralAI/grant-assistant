# Grant Assistant v2 — skill-library provenance and portability review
Date: 2026-11-04
Branch: develop/v2-cross-platform-storage
Status: source presence verified; exact byte-level SHA-256 verification not yet completed.

## Source inventory
Inspected private RuralAI/crai-skill-library, skills/grant-assistant/v2. All five CRAI v2 SKILL.md entrypoints are present, along with crai-airtable-write-v2/references/field_map.md:
- crai-prospect-scan-v2
- crai-grant-scoring-v2
- crai-airtable-write-v2
- crai-audit-log-v2
- crai-grant-writing-v2

The repository README and SOURCE-MANIFEST.json still claim github_source_transfer: pending and not_promoted. Those status fields are stale relative to the presence of files, but must not be changed to verified until exact byte-level SHA-256 checks against the six expected manifest hashes are performed. GitHub blob SHAs are not equivalent to SHA-256 manifest digests. Some returned string lengths differ from declared byte lengths, potentially because of UTF-8; do not infer hash mismatch from string length alone.

## Portability boundary
These five skills operate against CRAI's consolidated 95-field Grant Master and CRAI-specific production base. The portable installer in RuralAI/grant-assistant uses four logical collections and 84 fields. Reuse research principles and evidence practices, not the CRAI-specific field map, base IDs, stage automation, or production write instructions. A portable user must never be directed to the CRAI production base.

## Validation and outstanding gates
- CI run 41863124135 passed on the earlier 7c135011 contract correction.
- Newer adapter safeguard commits through eb4349a7 have queued CI runs; a green result for the current branch has not yet been observed.
- Human-review protections were added at the adapter/connection layer, but the trusted authorization callback must authenticate operator identity. Caller-supplied actor labels alone are not a security boundary.
- Fresh Claude/ChatGPT x Airtable/Sheets installs, credentialed runtime, migration, and disposable destination CRUD are pending.

## Follow-up
1. Perform byte-level SHA-256 comparison of six GitHub source files to SOURCE-MANIFEST.json; reconcile README and manifest in the canonical library with explicit authorization.
2. Validate new adapter tests on a pinned branch commit.
3. Ensure privileged operator context is derived from trusted authorization, not untrusted caller-supplied labels.
4. Validate/package installer and freeze a commit for four fresh-session tests.
No changes to the private skill library, production main, Airtable, Google Sheets, or Supabase were made by this note.
