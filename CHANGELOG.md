# Changelog

All notable changes to the Grant Assistant. Format follows [Keep a Changelog](https://keepachangelog.com/): every release heading carries an **Operator impact** line stating what, if anything, you need to reinstall. The top version heading is this pilot's version of record; the same number is stamped under the H1 of every skill.

Versions before 1.2.0 predate SemVer here and were labeled v0.2/v1.0/v1.1; they are renumbered below for continuity. Operator impact lines on those entries were written retroactively.

## [Unreleased]

- 2.0.0 planned: adjacency field + three scan modes (standard / adjacency / donor), scoring show-your-work output, and any schema alignment items batched with them.

## [1.2.0] - 2026-08-05

**Operator impact:** Reinstall: optional (grant-assistant-startup only, if you keep the installer saved). No schema changes; no operating-skill behavior changes; existing installs are unaffected.

Repository restructure to CRAI's pilot conventions, plus one real runtime bug fixed by the restructure itself.

### Added
- **Step 0 in the installer (degrade, never halt):** the installer checks which bundled files actually reached the environment and routes around anything missing, provisioning from a new **Appendix A** field reference inside SKILL.md when necessary. It no longer assumes its helper files installed.
- **Appendix A:** a complete human-readable field reference (all ten tables, every field, exact option strings, the link pass, the write scope) inside the installer's SKILL.md, kept in lockstep with `table-schema.mjs`.
- **`skills/grant-assistant-startup/table-schema.mjs`:** the base schema as code, single canonical copy inside the skill folder.
- **Version stamps** (`**Version:** 1.2.0 · Center for Rural AI`) under the H1 of the installer and all five skill templates, flowing into every generated skill.
- **Repo-read install path in the README:** point Claude at this public repository and ask it to install; the release-asset download is the fallback for environments without web access.
- **Seed template: opening data warning and closing pre-flight checklist.** Also fixed a stale line that still said the installer generates "four" operating skills (five since v1.0).
- **New docs:** `docs/getting-started.md` (replacing INSTALL_GUIDE.md), `docs/pre-flight-checklist.md`, `docs/airtable-schema.md`, `docs/what-this-does-not-do.md`, `docs/versioning.md`.

### Changed
- **Repository layout**: `skills/` (source folders) and `install/` (packaged `.skill` files people actually install); docs reorganized as above. The skill keeps its existing name (`grant-assistant-startup`) deliberately: renaming it would force every operator to hunt stale copies, and the test that matters is operator cost.
- **The five operating-skill templates and the blank seed template are now bundled inside the installer skill folder** (`templates/`, `seed-template.md`), so they exist at runtime. The public repo remains the freshness source when reachable.
- **House style applied repo-wide:** no em dashes anywhere except LICENSE/NOTICE (a skill's prose is a prompt; punctuation leaks into customer-facing output).
- **CHANGELOG reformatted** to Keep a Changelog with required Operator impact lines; versions renumbered to SemVer.
- **Versioning model:** the version of record is this file's top heading (no npm tooling in this repo; conventions are checked by CRAI's review skill before merge). Deployment stamp semantics unchanged.

### Fixed
- **A repo path is not a runtime path:** the v1.1 installer's Step 4 generated skills "from the templates committed at `skill/templates/`", a path that does not exist inside a saved `.skill` file. A cold environment running only the saved installer could not have completed Step 4. The templates are now bundled inside the skill folder, with the repo as an optional freshness source. (This failure mode was first observed on an earlier CRAI pilot; both live installs here predated the templates folder and never hit it.)

## [1.1.0] - 2026-07-25 (released as "v1.1")

**Operator impact:** Reinstall all five skills after an explicit upgrade run (the release renames tables, and skills resolve fields by name). No data migration; expect to re-file any rows at the removed `Withdrawn` stage and any Active Grants rows on the old four statuses. Retroactive note: written after the fact for continuity.

### Added
- **Watchlist** table and Grant Master `Stage` option, with six statuses, Next Review Date, and a "What Would Need to Change" field. Mirrors Active/Awarded/Archived structurally.
- **Multi-profile support** via a `Profile Name` field: skills default to the first profile row and state which they used; a named profile that does not exist halts with the available names listed.
- Six new **Application Status** options on Active Grants (Pre-Award) (four to eight), walking the LOI-to-proposal sequence with three terminal signposts.
- FAQ: per-stage views best practice; multi-profile guidance; version-mismatch recovery including the Claude-to-Omni bulk-change handoff.

### Changed
- Table renames (breaking): `Org Profile` to `Our Org Profile`; `Portfolio` to `Portfolio (Post-Award)`; `Active Grants` to `Active Grants (Pre-Award)`. IDs preserved; names are what skills resolve by, hence the reinstall.
- `Withdrawn` removed as a Stage; it is an Archive disposition reason.
- Ten tables, six context links (was nine and five).
- Upgrade mode rewritten with three-state version detection and two data-safety rules: never delete a select option live records still use; never auto-map ambiguous status values.

### Fixed
- Invalid YAML frontmatter in all five templates (unquoted `{{org-slug}}` parsed as a YAML flow mapping).
- Orphaned filename references in the install guide (underscored template filename).

## [1.0.0] - 2026-07-24 (released as "v1.0")

**Operator impact:** Reinstall: none required for existing v0 installs; upgrade available on explicit request to add the grant-writing skill. Retroactive note.

### Added
- **Grant-writing skill** (fifth skill): drafts LOIs, narratives, and application answers; gates on Stage = Active; builds a claims inventory (CLAIMABLE / CLAIMABLE WITH FRAMING / GAP); reads scoring pushback as a writing input; never submits or sends anything.
- **`Installer Version` deployment stamp** on the profile table; absence from the schema (not blankness) signals a pre-versioning base.
- **Upgrade mode** (explicit trigger only, never automatic).
- **`skill/templates/`:** the five generated skills' canonical sources committed to the repo rather than living in conversation history.
- Apache 2.0 LICENSE, NOTICE, CONTRIBUTING.md, this changelog.

### Changed
- README rewritten for non-technical readers; maintainer content moved to CONTRIBUTING.md; practical usage guidance replaced raw token figures.

### Fixed
- Repo-wide filename mismatch (underscored vs. hyphenated seed template name).
- Generated skills' Priority option set corrected to the five options that exist in a live base, caught by an end-to-end test before any bad write.

## [0.2.0] - 2026-07 (released as "v0.2", pre-versioning beta)

**Operator impact:** n/a (initial public release). Retroactive note.

### Added
- Initial public release: the master-model schema (Grant Master / Donor Master, `Stage` as lifecycle and operator write-gate, operator-only context tables linked via a post-create pass); the installer skill built around one `create_base` call, validated against live connector constraints (workspace access, base-scope allowlists, no API `autoNumber`, funder-name dedup, unsearchable date fields); the four original thin skills reading judgment live from the profile table; the blank seed template with worked examples and ★ required fields; install guide and README.
- First production install (Center for Rural AI) and first commercial install (July 2026), both feeding corrections back before this release.
