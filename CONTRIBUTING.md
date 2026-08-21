# Contributing & Maintaining

This file is for the team maintaining the Grant Assistant, not for organizations installing it. If you're here to install, see [docs/getting-started.md](docs/getting-started.md).

Conventions below are checked by **CRAI's review skill, run against each branch before merge**; there is no tracking code, npm toolchain, or test suite in this repo by design.

## Repo layout and source of truth

- **`skills/grant-assistant-startup/`** is the source of truth for the installer AND for the five generated skills (its `templates/` subfolder). Everything a skill needs at runtime is bundled inside this folder: `SKILL.md`, `table-schema.mjs`, `seed-template.md`, `templates/`. **A repo path is not a runtime path**; if a skill needs a file, it lives in the skill folder.
- **`install/grant-assistant-startup.skill`** is the packaged copy people actually install. After any edit to the skill folder, repackage and commit both together; never let them drift.
- **`template/Org-Seed-Template-BLANK.md`** and the bundled copy at `skills/grant-assistant-startup/seed-template.md` are the same document in two places and must not drift. Edit both in the same change. (The repo copy is what the README links; the bundled copy is what the installer reads at runtime.)
- **`skills/grant-assistant-startup/table-schema.mjs`** is the canonical schema, and **Appendix A** of the installer's SKILL.md is its human-readable rendering; the two change together, always. `docs/airtable-schema.md` is the operator-facing rendering and changes with them.
- Filename gotcha that has bitten twice: the seed template filename is **hyphenated** (`Org-Seed-Template-BLANK.md`). Copy it, don't retype it.

## Versioning (no npm; the changelog is the version of record)

- The current version is the **top version heading in CHANGELOG.md**. The same number is stamped under the H1 of the installer's SKILL.md and every template: `**Version:** X.Y.Z · Center for Rural AI`. Stamps are hand-maintained; matching them to the changelog is one of the pre-merge review checks.
- SemVer meanings, in operator terms (full definitions in [docs/versioning.md](docs/versioning.md)): **MAJOR** = any schema change (older bases don't have it; existing deployments need an upgrade run); **MINOR** = new capability, ignoring it is safe; **PATCH** = fix, reinstall only if you hit the described problem. Highest level in a mixed release wins.
- Every release heading carries an `**Operator impact:** Reinstall: ...` line, first thing under the heading. If a release can't be described in one such line, it is probably two releases.
- Upgrades stay **explicit-trigger-only and additive**; the data-safety rules live in the installer's Step 7 and are non-negotiable.

## The templating convention (applies to `templates/`)

Templates reference tables and fields **by name**, never by hardcoded ID. Generation substitutes only four header placeholders: `{{org-slug}}`, `{{ORG NAME}}`, `{{BASE_ID}}`, `{{BASE_NAME}}`. Always **quote** a frontmatter value containing `{{ }}` (unquoted braces are invalid YAML and break GitHub's rendering). Zero leakage: no real organization's name, IDs, judgment values, or data in any template, including examples; sweep for them before committing (this check has caught real leaks twice).

## House style

No em dashes anywhere except LICENSE and NOTICE (canonical third-party text). A skill's prose is a prompt; punctuation teaches the model style that leaks into customer output. Use a colon, a semicolon, or parentheses.

## Packaging

Done in a Claude session: repackage the skill folder into a `.skill` zip (folder as top-level entry) into `install/`. Frontmatter constraints hit in practice: description max 1024 characters, no angle brackets. Verify the archive unzips to exactly the folder contents before committing.

## Workflow for landing changes

Branch from `main`, commit to the branch, open a PR, run the review skill against the branch, merge (squash preferred; browser-upload commits carry no information), delete the branch, and for releases: tag `vX.Y.Z`, publish a GitHub Release with the changelog section as the body, and **attach `install/*.skill` as release assets** (that attachment is what makes this behave like an installer for non-technical operators).

## Keeping the docs alive

House rule, unchanged since v0: every entry in the troubleshooting table (docs/getting-started.md) is something that actually happened during a real install. When you hit something new, add the row in the same PR as the fix.

## License and contributions

Apache License 2.0 (see [LICENSE](LICENSE)). Per its Section 5, contributions you intentionally submit are accepted under the same license, no additional terms.
