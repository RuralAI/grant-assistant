# Grant Assistant v2 — portable skill packaging and acceptance candidate
Date: 2026-11-04
Branch: develop/v2-cross-platform-storage

## Evidence
- GitHub Actions run 41892510322 succeeded on 9cae28528723f01b501f276d2ee8b50eafdb257b, including the cross-provider authorization regression suite.
- Installer skill documentation aligned to the 84-field v2 review-draft contract and current Sheets adapter limitations in commits dd0660db and 1500abcf.
- A local portable skill.zip was assembled from the four skill files on branch commit 1500abcf9cb3d6d8f3f3e7f6857f2bdf93da7d3e and passed the skill-creator package_skill.py validator and ZIP integrity check.
- Local ZIP SHA-256: 2987ae906c295fd409f99864d1e53ffe8251ee3a18d8cafa224c0a17df9f54e0. Package contains SKILL.md, agents/openai.yaml, references/installation-contract.md, references/review-workflow.md.

## Proposed acceptance pin
Use 1500abcf9cb3d6d8f3f3e7f6857f2bdf93da7d3e as the source snapshot for initial installation acceptance, subject to a GitHub Actions run on this exact commit or descendant. Last observed green run is on the earlier 9cae2852 commit; the two later commits are documentation-only.

## Explicitly outstanding
- Four fresh sessions: Claude/Airtable, Claude/Google Sheets, ChatGPT/Airtable, ChatGPT/Google Sheets.
- Credentialed installation, human-approved disposable synthetic CRUD and cleanup, provider parity, OAuth runtime.
- Byte-level SHA-256 comparison of six CRAI-specific canonical skill-library sources against SOURCE-MANIFEST.json; stale status fields in canonical library are not altered.
- No changes to production main, production CRAI Grant Pipeline, or existing destinations.
