# Versioning and releases

**How Grant Assistant releases work.**

> **Operators can skip this page.** The only thing you need is the **Operator impact** line under each release heading in [`../CHANGELOG.md`](../CHANGELOG.md), which tells you what, if anything, to reinstall.

## The problem this solves

Skills are installed by uploading a `.skill` file into Claude. Once uploaded, that copy is disconnected from this repo forever: it does not update, and nothing notifies you. So every skill carries a version, every deployment carries a version, and both have a published meaning.

## One version for the whole pilot

There is a single version per release, and its record is the **top version heading of `CHANGELOG.md`**. Every skill is stamped with it directly under its H1 (`**Version:** 1.2.0 · Center for Rural AI`), whether or not that skill changed in the release. One number answers the only question an operator asks (am I current?); the changelog's Operator impact line answers the follow-up (what do I re-upload?).

This repo carries no npm tooling; stamps are maintained by hand and checked against the changelog during pre-merge review.

## The deployment also carries the version

The skill stamp says what you *installed*. Your Airtable base says what was *built*: the installer writes `Installer Version` into **Our Org Profile** at install and updates it on upgrade. The two can legitimately disagree (you can reinstall a skill without re-running the installer), and you need both to debug anything. Semantics that matter: the **absence of the field from the schema** signals a pre-versioning base; a **blank value in a field that exists** signals an install that failed partway. Historical values: `v1.0`, `v1.1`; from this release on, plain SemVer (`1.2.0`).

## What the levels mean (in operator cost, not code size)

- **MAJOR (2.0.0):** existing deployments need work. Any schema change (new table, field, or select option: older bases don't have it and writes fail), a renamed/removed skill, or anything that changes the meaning of data already collected. Reinstall everything and follow the migration notes.
- **MINOR (1.3.0):** new capability, nothing breaks. Reinstall the skills named in the changelog to get it; ignoring the release is safe.
- **PATCH (1.2.1):** a fix or clarification. Reinstall the named skill if you hit the described problem.

When a release mixes levels, the highest wins.

## Cutting a release (maintainers)

1. Decide the level; set the new number as the top CHANGELOG heading, moving `[Unreleased]` content under it, with the date and the **Operator impact** line.
2. Update the version stamp in `skills/grant-assistant-startup/SKILL.md` and every template.
3. Repackage `install/grant-assistant-startup.skill` from the skill folder.
4. Run CRAI's review skill against the branch; merge.
5. Tag `vX.Y.Z`; publish a **GitHub Release** titled `X.Y.Z` with the changelog section as the body (Operator impact line first) and **every `install/*.skill` file attached as an asset**. The attachment is not optional; it is how a non-technical operator gets the files, and it pins a known-good installer to that exact version.

## For operators: am I up to date?

1. **What you have:** open the skill in Claude (Settings, then Skills) and read the `**Version:**` line; open your base's Our Org Profile and read `Installer Version`.
2. **What is current:** the latest GitHub Release, or the top heading in the changelog.
3. **What to do about a difference:** read the Operator impact lines of every release between the two, then re-upload the named `.skill` files from the latest release. Our field-tested practice: **uninstall the old skill first, then save the new one, then verify** (ask Claude which base the skill references). We have twice observed a same-name save that did not replace the old copy, so until a deliberate test shows otherwise, uninstall-first is the safe path and costs nothing.

Re-uploading a skill never touches your Airtable data. Only a documented schema migration does, and those are always called out in the Operator impact line.
