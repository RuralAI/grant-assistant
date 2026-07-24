# Changelog

All notable changes to the Grant Assistant installer, generated skills, and seed template are recorded here. Dates reflect when a change was validated/shipped, not necessarily when a PR was opened.

This project does not yet follow strict [Semantic Versioning](https://semver.org/) — version numbers here track the installer's own `SKILL.md` header (e.g. "v1.0"). See `CONTRIBUTING.md` for what counts as a breaking change and when a version bump is warranted.

## [Unreleased]

- Airtable FAQ (in progress) — table-by-table field/metadata reference, the reasoning behind each operator-only context table (Portfolio, Active Grants, Archive, Active Donors, Donor Restriction Log), and guidance for building custom views and simple automations on top of an installed base without touching Grant Master or Donor Master.

## [1.0] — 2026-07-24

**Headline changes:** a fifth generated skill (grant-writing), a version-aware installer that can explicitly upgrade an existing v0 install, and the five generated skills' method moved from tacit conversation history into committed, versioned template files.

### Added
- **`skill/templates/`** — canonical, org-agnostic source files for all five generated skills (`grant-scoring.template.md`, `prospect-scan.template.md`, `airtable-write.template.md`, `audit-log.template.md`, `grant-writing.template.md`) plus a `README.md` explaining the by-name templating convention. Previously the installer's Step 4 generated these from "the validated full-fidelity production skill set" — a phrase that only meant something in the context of prior conversation history. A fresh Claude session with no memory of this project can now run the installer correctly from the repo alone.
- **Grant-writing skill** (`<org-slug>-grant-writing`) — the fifth operating skill. Drafts LOIs, narratives, and application answers grounded in Org Profile and Grant Master data. Gates on Stage = Active (promotion is the pursuit decision); reads the scoring skill's honest pushback as a writing input and must not contradict it; builds a claims inventory (CLAIMABLE / CLAIMABLE WITH FRAMING / GAP) before drafting so unverifiable claims become visible placeholders instead of invented evidence; never writes to Airtable or submits anything.
- **`Installer Version` field** on Org Profile — makes a base self-describing to future installer runs. A v1 base has this field set to "v1.0"; its *absence from the schema* (not blankness) is the signal that a base predates versioning (a "v0" install).
- **Step 7 — Upgrade mode** in the installer, for bringing an existing v0 (four-skill) install to v1. Adds the `Installer Version` field and generates/presents the grant-writing skill. **Explicit-trigger-only** — finding an existing base during normal preconditions never triggers an upgrade on its own; only a direct request does ("upgrade to v1," "add the grant-writing skill"). A routine reconcile run against a v0 base is unaffected by v1's existence unless the user asks.
- **`LICENSE`** (Apache License 2.0, canonical text) and **`NOTICE`** at repo root.
- **`CONTRIBUTING.md`** — maintainer documentation, split out of `README.md` (see Changed).
- **`docs/images/`** and `SCREENSHOTS_NEEDED.md` — a capture checklist for six install-flow screenshots referenced in `INSTALL_GUIDE.md`.
- **This file.**

### Changed
- Installer version bumped **v0.2 → v1.0** in `skill/grant-assistant-startup/SKILL.md`.
- Frontmatter description and Step 4 updated throughout for five skills instead of four.
- Precondition logic (Step "Before you start," item 4) now routes to one of three outcomes explicitly: fresh install, Reconcile mode (Step 6, unchanged behavior), or Upgrade mode (Step 7, new) — with a hard rule that only an explicit request can select Upgrade mode.
- Step 5 (install verification) gained a sixth check: confirming the grant-writing skill's Stage = Active gate is correctly wired, and that `Installer Version` was written.
- **`README.md`** rewritten for a non-technical audience: plain-language Quick Start (download → prerequisites → connect → load skill → fill template → run), jargon (e.g. raw token-usage figures) replaced with practical guidance ("uses a good portion of a day's Claude usage on a Pro plan"), and the maintainer-facing "Maintaining this repo" section removed (see below).
- **"Maintaining this repo" content moved out of `README.md` into `CONTRIBUTING.md`**, which now also documents: the `skill/templates/` source-of-truth split, the zero-leakage check habit, the frontmatter 1024-character/no-angle-brackets packaging limits (both hit in practice), the versioning rules for schema-breaking vs. non-breaking changes, and the team's current PR workflow (see below).
- **`docs/INSTALL_GUIDE.md`**: added inline screenshot references at the six key steps; softened two troubleshooting-table explanations (workspace access, connector 403s) to plain, non-developer language; token-usage note reworded to a practical Claude-usage-budget description.
- **Filename mismatch fixed repo-wide**: the bundled/standalone seed template file is actually named `Org-Seed-Template-BLANK.md` (hyphenated), but `SKILL.md`, `README.md`, and `INSTALL_GUIDE.md` all still referenced an underscored `Org_Seed_Template_BLANK.md` left over from an earlier rename that was never fully reconciled. All references now match the real filename.
- **Contributor workflow documented as it's actually practiced**: PRs currently land via GitHub's web-upload UI rather than `git push`, due to git-credential friction on at least one team machine (deprecated HTTPS password auth; intermittent `gh auth login` browser-handoff failures). `CONTRIBUTING.md` now describes this path explicitly rather than assuming a frictionless local git setup.

### Fixed
- The five generated skills' Priority field option set corrected to the five options that actually exist in a live base (`High Priority`, `Medium Priority`, `High Fit / Needs Readiness Confirmation`, `Watchlist / Future Fit`, `Reject`) — earlier packaged skills and the bundled field-map reference listed two nonexistent options (`High Fit / Not Ready This Cycle`, plain `Watchlist`) that a live end-to-end test caught before any bad write occurred.
- Write-skill error-recovery table gained a documented fix for `update_records_for_table` requiring `"id"` (not `"recordId"`) per record object — found live during the same test.

## [0.2] — 2026-07 (pre-versioning "beta")

The last version built before this changelog existed; reconstructed here from the repo's own history and documentation for continuity. Numbered "v0.2" in `SKILL.md`'s own header at the time, though no machine-readable version marker existed anywhere in an installed base — closing that gap was v1.0's main job.

### Added
- Initial public release: the master-model Airtable schema (Grant Master / Donor Master as canonical tables with a `Stage` field driving both the grant lifecycle and the operator write-gate; five operator-only context tables — Active Grants, Portfolio, Archive, Active Donors, Donor Restriction Log — linked back via `multipleRecordLinks`).
- The installer skill (`grant-assistant-startup`), built around a single `create_base` call plus a post-create linking pass, validated live against real connector constraints (workspace-access requirements, the base-sharing allowlist, no API-creatable `autoNumber`, funder-name-only dedup, unsearchable date fields in `search_records`).
- The four original generated skills: grant-scoring, prospect-scan, airtable-write, audit-log — "thin," reading an org's judgment (stage posture, award bands, fit criteria, durable rules, loan posture, eligibility traps) live from an **Org Profile** table rather than having it baked in.
- The blank seed template (`Org-Seed-Template-BLANK.md`), with instructions and worked examples per field and ten ★-required fields that halt the install if left blank.
- `docs/INSTALL_GUIDE.md`, `README.md`.
- First production install (Center for Rural AI) and first commercial install (July 2026), both of which fed corrections back into the installer and templates before this release.

---

*Entries above [1.0] were written retrospectively when this file was introduced. Going forward, add an `[Unreleased]` entry as you work and move it under a version heading when that version ships — see `CONTRIBUTING.md`.*
