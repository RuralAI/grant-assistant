# Contributing & Maintaining

This file is for the team maintaining the Grant Assistant — not for organizations installing it. If you're here to install, see [docs/INSTALL_GUIDE.md](docs/INSTALL_GUIDE.md).

See [CHANGELOG.md](CHANGELOG.md) for what's shipped in each version.

## Repo layout and source of truth

- **`skill/grant-assistant-startup/`** (the unpacked folder) is the source of truth for the installer itself. Edit `SKILL.md` and the bundled template here; review changes in PRs against these files.
- **`skill/templates/`** is the source of truth for the five *generated* skills (grant-scoring, prospect-scan, airtable-write, audit-log, grant-writing). These are not tacit knowledge from a prior conversation — they are the real, committed method the installer's Step 4 copies and retargets for each org. If you're changing what a generated skill does (a new scoring rule, a new write-discipline lesson), edit the template file here, not just the installer's description of it.
- **`skill/grant-assistant-startup.skill`** is the packaged artifact users actually save into Claude. After any edit to the unpacked folder, repackage and commit **both** together — never let them drift.
- **`template/Org-Seed-Template-BLANK.md`** and the copy inside `skill/grant-assistant-startup/assets/` must stay in sync. The installer hands its bundled copy to users who arrive without one, so a template edit that only lands in one place will fork the form.

  ⚠️ **Filename note:** the actual file is hyphenated (`Org-Seed-Template-BLANK.md`), not underscored. An earlier upload renamed it and several docs referenced the old underscored name for a while — that's been fixed everywhere as of v1.0, but if you're writing new docs or code, copy the filename exactly rather than retyping it, since this class of mismatch is easy to reintroduce silently.

## The templating convention (applies to everything in `skill/templates/`)

Templates reference every Airtable table and field **by name**, never by a hardcoded ID (`Stage Posture`, not `fldXXXXXXXXXXXXXXX`). Generation only substitutes four header placeholders per file: `{{org-slug}}`, `{{ORG NAME}}`, `{{BASE_ID}}`, `{{BASE_NAME}}`. See `skill/templates/README.md` for the full rationale. When editing or adding a template:

- Never hardcode a real organization's name, base ID, table/field ID, or judgment values (award bands, geography, durable rules, etc.) anywhere in the file, including in illustrative examples. Use obviously-fake placeholders for examples (an ID like `fldXXXXXXXXXXXXXXX`, a name like "the org").
- After any edit, run a zero-leakage grep across `skill/templates/` for any real org name or ID pattern before committing (a specific org's name, any `app…`/`tbl…`/`fld…` 14-character ID, any specific org's town/geography). This project has caught real leaks this way twice already — it's a cheap check worth keeping as a habit, not a one-time cleanup.

## Repackaging after an edit

Packaging is done in a Claude session with the skill-creator tooling available: ask Claude to repackage the skill folder into a `.skill` file (the packaging script validates frontmatter — note that the `description` field cannot contain angle brackets, and has a **1024-character limit**; both limits have been hit in practice, so check length before committing a frontmatter edit). Verify the new `.skill` unzips to exactly the contents of the unpacked folder before committing.

## Versioning and changes that affect installed orgs

- Version notes live at the top of `skill/grant-assistant-startup/SKILL.md`, and every release gets an entry in `CHANGELOG.md`.
- **Breaking changes** are anything that alters the Airtable schema the generated skills depend on: table definitions, field names/types, or single-select **option strings** (installed orgs' skills match those strings exactly). A breaking change warrants a version bump, a `CHANGELOG.md` entry, and a note in the install guide's reconcile section, since already-installed orgs need a reconcile run to pick it up.
- **A schema addition that a v0 install won't have** (like v1's `Installer Version` field on Org Profile) needs an explicit **Upgrade mode** entry in the installer — see Step 7 of `SKILL.md`. Enumerate exactly what the upgrade adds, and keep upgrades **additive and explicit-trigger-only**: the installer must never modify an existing install just because it found one. A routine reconcile run against an older install should be completely unaffected by the existence of a newer version, unless the user explicitly asks to upgrade.
- Non-breaking prose/clarity edits can ship freely, no version bump needed.

## Keeping the install guide alive

The two sections of `docs/INSTALL_GUIDE.md` most worth maintaining are **Phase 5 (verification)** and the **troubleshooting table**. House rule from how this project was built: every entry in the troubleshooting table is something that actually happened during a real install — no speculative failure modes. When you hit something new during an install, add the row in the same PR as any fix.

## Workflow for landing changes (current practice)

The repo is public and changes land via pull request. In practice, the team has been doing this through GitHub's web UI rather than `git push` from a local machine, because of local git-credential friction (HTTPS password auth is deprecated by GitHub, and `gh auth login` has had intermittent failures from at least one team member's environment). Until that's sorted out for everyone, this is a perfectly fine way to contribute:

1. Create a branch from `main` using GitHub's branch dropdown, or `git checkout -b <branch-name>` locally if your git auth works.
2. Make changes directly in the GitHub web UI (**Add file → Upload files**, or **Add file → Create new file** for the first file in a brand-new folder — GitHub's uploader can't create an empty folder on its own, so the first file in a new directory needs to be created this way with the folder path typed into the filename box), committing directly to your branch each time (never to `main`).
3. Open a pull request comparing your branch against `main` once your changes are complete.
4. If your local git *does* authenticate cleanly (SSH keys, or `gh auth login` with a working browser handoff), the normal `git apply` / `git push` flow works identically — there's nothing branch- or repo-specific blocking it, it's purely an auth setup issue on some machines.

Whichever path you use, verify the diff before opening the PR: GitHub's **Compare** view (or `git diff` locally) should show only the files you meant to touch.

## License and contributions

This project is licensed under the Apache License 2.0 (see [LICENSE](LICENSE)). Per Section 5 of the license, contributions you intentionally submit for inclusion are accepted under the same license, with no additional terms.
