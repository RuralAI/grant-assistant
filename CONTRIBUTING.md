# Contributing & Maintaining

This file is for the team maintaining the Grant Assistant — not for organizations installing it. If you're here to install, see [docs/INSTALL_GUIDE.md](docs/INSTALL_GUIDE.md).

## Repo layout and source of truth

- **`skill/grant-assistant-startup/`** (the unpacked folder) is the source of truth. Edit `SKILL.md` and the bundled template here; review changes in PRs against these files.
- **`skill/grant-assistant-startup.skill`** is the packaged artifact users actually save into Claude. After any edit to the unpacked folder, repackage and commit **both** together — never let them drift.
- **`template/Org_Seed_Template_BLANK.md`** and the copy inside `skill/grant-assistant-startup/assets/` must stay in sync. The installer hands its bundled copy to users who arrive without one, so a template edit that only lands in one place will fork the form.

## Repackaging after an edit

Packaging is done in a Claude session with the skill-creator tooling available: ask Claude to repackage the skill folder into a `.skill` file (the packaging script validates frontmatter — note that the `description` field cannot contain angle brackets). Verify the new `.skill` unzips to exactly the contents of the unpacked folder before committing.

## Versioning and changes that affect installed orgs

- Version notes live at the top of `SKILL.md`.
- **Breaking changes** are anything that alters the Airtable schema the generated skills depend on: table definitions, field names/types, or single-select **option strings** (installed orgs' skills match those strings exactly). A breaking change warrants a version bump and a note in the install guide's reconcile section, since already-installed orgs need a reconcile run to pick it up.
- Non-breaking prose/clarity edits can ship freely.

## Keeping the install guide alive

The two sections of `docs/INSTALL_GUIDE.md` most worth maintaining are **Phase 5 (verification)** and the **troubleshooting table**. House rule from how this project was built: every entry in the troubleshooting table is something that actually happened during a real install — no speculative failure modes. When you hit something new during an install, add the row in the same PR as any fix.

## Suggested next additions

- `CHANGELOG.md` at root once skill revisions start landing, so installed orgs can tell whether a change warrants a reconcile run.
- Screenshots for the install guide (see `docs/images/SCREENSHOTS_NEEDED.md` for the capture list).

## License and contributions

This project is licensed under the Apache License 2.0 (see [LICENSE](LICENSE)). Per Section 5 of the license, contributions you intentionally submit for inclusion are accepted under the same license, with no additional terms.
