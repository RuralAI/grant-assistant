# Grant Assistant

A grant-pipeline system for nonprofits, built on Claude + Airtable. Your organization fills out one seed document (or answers an interview), runs one installer, and in about 15 minutes has a working system: a grants database, your existing grants and funders already loaded, and five custom Claude skills that find, evaluate, record, log, and help draft grant opportunities.

**Status:** 1.2.0. Proven in production and in a first commercial installation (July 2026). A Center for Rural AI pilot.

## What you get after installing

- **A grants database in your Airtable**: every grant you're tracking, at every stage, in one place
- **Your history preloaded**: active grants, past awards, funder list, and funder restrictions, so the system never re-pitches something you already know about
- **Five custom skills in your Claude**: one that searches for new opportunities, one that scores how well each fits *your* organization, one that records results safely, one that keeps an honest log of every work session, and one that drafts grant application materials for grants you've decided to pursue
- **You stay in charge**: the system finds and recommends; a person on your team always decides what to pursue, and nothing is ever submitted or sent by the system

## Requirements

- A **Claude account** (Pro, Team, or Enterprise) with permission to add custom skills and connect integrations. One install uses a good portion of a day's usage on a Pro plan, so start it fresh.
- An **Airtable account** (Free or Paid), connected to Claude with **Full / Workspace access**. This is the step installs fail on: base creation needs workspace-level scope, and a connection limited to individual bases will stop the install at its first check. You can narrow the scope back down after installing.
- About **15 minutes** for the install itself, plus 1-2 hours beforehand with the person who knows your grants history, filling out the seed document.

## Quick start

**Step 1: Get the installer.** Two ways, easiest first:

- **Point Claude at this repository.** In a Claude chat, paste this repo's URL and say: *"Read this repository and install the Grant Assistant."* Claude reads the installer and templates directly from GitHub; nothing to download. (Requires web access in your Claude environment.)
- **Or download from the latest release.** Grab `grant-assistant-startup.skill` from [the latest release](../../releases/latest) and add it to your Claude custom skills. Use this path if your environment can't fetch from the web, or if you want the installer saved permanently as a skill.

**Step 2: Fill out your seed document.** Open [`template/Org-Seed-Template-BLANK.md`](template/Org-Seed-Template-BLANK.md) and complete it, especially the ten fields marked ★. Every question includes instructions and a worked example. Don't want to fill out a document? Skip it; the installer will interview you through the same questions live.

**Step 3: Run the install.** Start a new Claude chat, attach your filled seed document, and say:

> Invoke the grant-assistant-startup skill and read the attached seed document for context.

⏱️ **What to expect:** about 15 minutes. Claude builds your database, imports your history, verifies its work check by check, and hands you five skills to save. It tells you the next step when it finishes.

📖 **Full walkthrough & troubleshooting:** [docs/getting-started.md](docs/getting-started.md) · **Check before you start:** [docs/pre-flight-checklist.md](docs/pre-flight-checklist.md)

## What this does not do

The short version: it never submits, sends, or commits to anything; a person always decides what to pursue; and it flags gaps rather than inventing facts. The full list, worth reading before you rely on the system: [docs/what-this-does-not-do.md](docs/what-this-does-not-do.md).

## Your data

Your Grant Assistant base is a standard Airtable base. This project adds no encryption, redaction, or access tiers on top of it; whatever protection your data has is what you configure in Airtable and in your own practices.

**Keep out of the base (and out of Claude chats):** Social Security or national ID numbers, bank and payment details, donor payment card information, health information, immigration status, and personally identifying information about the individuals your programs serve. The base is built for *institutional* information: funder guidelines, deadlines, award amounts, your organization's facts, internal strategy notes.

**Two fields attract sensitive detail more than the rest:** the Donor Restriction Log's *Flag Language* (why a funder is off-limits can involve candid relationship history) and Active Donors' *Relationship Notes*. Write what your team needs, professionally enough to survive being read outside the original conversation.

**What you control and should check periodically:** who is invited to the base and at what permission level; **shared view links** (Airtable can generate publicly accessible links to a view; anyone with the URL sees that data with no login, and this is the most common way a base leaks; audit and delete unused ones); and the Airtable connector's scope in Claude.

If your organization handles regulated data or is subject to a funder's or regulator's data requirements, review Airtable's security documentation and your own policies first. This project makes no compliance claims.

## Reference docs

| Doc | What it's for |
| --- | --- |
| [docs/getting-started.md](docs/getting-started.md) | The full install runbook: every step, every observed failure mode |
| [docs/pre-flight-checklist.md](docs/pre-flight-checklist.md) | What to confirm before running the install |
| [docs/AIRTABLE_FAQ.md](docs/AIRTABLE_FAQ.md) | Every table and field explained; what's safe to customize; views vs. fields; version-mismatch recovery |
| [docs/airtable-schema.md](docs/airtable-schema.md) | The full schema reference, human-readable |
| [docs/what-this-does-not-do.md](docs/what-this-does-not-do.md) | The system's deliberate boundaries |
| [docs/versioning.md](docs/versioning.md) | How releases work and how to tell if you're up to date |
| [CHANGELOG.md](CHANGELOG.md) | What shipped in each version, with the operator impact of each |

## For maintainers

See [CONTRIBUTING.md](CONTRIBUTING.md). The short version: the unpacked skill folder under `skills/` is the source of truth; `install/` holds the packaged copies people actually install; the seed template exists in two places that must not drift; conventions are checked by CRAI's review skill against each branch before merge, not by tracking code in this repo.

### House style

No em dashes, anywhere: not in skills, docs, or anything a skill writes into a customer's base or documents. A skill's prose is a prompt, and punctuation teaches the model style that leaks into customer-facing output. Use a colon, a semicolon, or parentheses. (LICENSE and NOTICE are exempt: canonical third-party text is reproduced verbatim.)

## License

Licensed under the [Apache License 2.0](LICENSE): use, modify, and share freely (including commercially), keep the license and copyright notices, note your changes. No warranty. Copyright in [NOTICE](NOTICE).
