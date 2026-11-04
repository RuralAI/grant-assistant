# Grant Assistant — Installer & Seed Template

A grant-pipeline system for nonprofits, built on Claude + Airtable. Your organization fills out one seed document, runs one installer, and in about 15 minutes has a working system: a grants database, your existing grants and funders already loaded, and four custom Claude skills that find, evaluate, record, and log grant opportunities for you.

**Status:** v1.1 is the current documented Claude + Airtable installation. **Grant Assistant v2 is under development** for ChatGPT or Claude with Airtable or Google Sheets. The v2 installer is not yet certified for public production installation.

---

## Understanding the next-generation installer (v2 — in development)

**You do not need to know how to code to use Grant Assistant.** The project has two complementary parts: plain-English **skills** that explain the tasks the AI should perform, and small JavaScript **modules** that carry out repeatable checks and installation steps consistently.

The v1.1 installation instructions below remain available for existing users. **Do not treat the v2 development files as a finished installer.** v2 is being tested for four combinations: ChatGPT + Airtable, ChatGPT + Google Sheets, Claude + Airtable, and Claude + Google Sheets.

### What is an `.mjs` file?

An `.mjs` file is a JavaScript module: a small piece of program code that can be run by **Node.js**, a program for running JavaScript outside a web browser. You generally do **not** need to open, edit, or run these files yourself.

- **`SKILL.md` files** are instructions written for the AI assistant. They explain what to do, when to ask permission, and what good results look like.
- **`src/v2/*.mjs` files** are the implementation. They handle precise tasks such as checking the database layout, detecting older installations, preparing an organization profile, and checking that installed skills point to the right destination.
- **`tests/*.test.mjs` files** are automated checks. They deliberately try expected and unexpected situations to catch mistakes before a release. They are **not** installed for end users.
- **`.github/workflows/`** contains GitHub Actions automation, which can run those checks when the project changes.

A simple analogy: the **skill is the instruction manual**, the **source code is the machinery**, and the **tests are the safety inspection**. Keeping all three in the public repository lets anyone inspect how the system is supposed to work and how we check it.

### What happens during a v2 installation?

1. The installer checks whether this is a **new installation**, an **existing v2 installation**, an **older legacy installation**, or an **incomplete installation**. It does not silently replace an older system.
2. It gathers up to **15 organization-onboarding answers**; existing users should be able to reuse known answers rather than start over.
3. With approval, it creates or verifies **four storage collections**: Organization Profiles, Organizations, Grants, and Search Audit.
4. It prepares and binds **five operating skills**: prospect scan, scoring, storage write, grant writing, and audit log.
5. It verifies what was actually created and installed. If a platform cannot install or discover skills automatically, the installer must say so rather than claim success.

**Important:** Downloading or reading this repository does not by itself execute JavaScript, authorize access to Airtable or Google Sheets, or install a skill in ChatGPT or Claude. Those steps require supported tools and permissions. The full v2 workflow is still being engineered and tested.

### Guide to the v2 code

| Folder or file | What it does in everyday language |
|---|---|
| `skills/grant-assistant-v2/SKILL.md` | The plain-English instructions that guide the installer |
| `src/v2/full-install-orchestrator.mjs` | Coordinates the installation steps and approvals |
| `src/v2/installation-detection.mjs` | Recognizes new, existing, partial, and legacy setups |
| `src/v2/organization-intake.mjs` | Checks the 15 onboarding answers and prepares an organization profile |
| `src/v2/airtable-provisioning.mjs` | Describes the Airtable tables and fields the system needs |
| `src/v2/installation-bindings.mjs` | Matches the system's field names to the actual storage location |
| `src/v2/skill-registration.mjs` | Checks the process for registering and verifying operating skills |
| `tests/` | Holds automated tests to protect existing behavior when the project changes |
| `docs/v2/` | Holds design decisions, onboarding guidance, and engineering handoff notes |

**Why keep the tests after launch?** A future improvement to scoring, onboarding, or storage could accidentally break something that already works. Keeping tests in the GitHub repository lets maintainers check for those regressions. They do not need to be part of the end-user installation package.

**For current v1.1 users:** Continue with the instructions below until the v2 migration process has been tested and approved. The next-generation installer is intended to preserve existing records and human decisions, not overwrite them.

---

## What you get after installing (current v1.1)

- **A grants database in your Airtable** — every grant you're tracking, at every stage, in one place
- **Your history preloaded** — your active grants, past awards, funder list, and any funder restrictions, so the system never re-pitches you something you already know about
- **Four custom skills in your Claude** — one that searches for new opportunities, one that scores how well each fits *your* organization, one that records results safely, and one that keeps an honest log of every work session
- **You stay in charge** — the system finds and recommends; a person on your team always decides what to actually pursue

## Quick start (current v1.1 — Claude + Airtable)

**Step 1: Download this repository.**
Click the green **Code** button at the top of this page, select **Download ZIP**, and extract the folder on your computer.

**Step 2: Check prerequisites.**
- A Claude account (Pro, Team, or Enterprise) with permission to add custom skills and connect integrations.
- An Airtable account (Free for 14 days shifting to paid monthly or annual).

**Step 3: Connect Airtable to Claude.**
In Claude, connect your Airtable integration. **Important:** select **Full / Workspace Access** so Claude can automatically build your new base. In addition, in Claude go to Customize > Connectors > Airtable and update tool permissions to match how you like to work in Claude.

**Step 4: Load the installer skill.**
Import the installer file (`skill/grant-assistant-startup.skill`) into your Claude custom skills.

**Step 5: Fill out your seed document.**
Open `template/Org-Seed-Template-BLANK.md` and complete it — especially the 10 required fields marked with ★. Every question includes instructions and a real example.

**Step 6: Run the installer.**
Start a new thread in Claude, attach your filled-out template, and run:

> Invoke the grant-assistant-startup skill and read the attached seed document for context.

⏱️ **What to expect:** The setup takes about 15 minutes. Claude will build your database, import your history, and give you 4 custom operating skills when finished. One setup session uses a good portion of a day's Claude usage on a Pro plan — start it when you haven't already been using Claude heavily, and it will finish comfortably in one sitting.

📖 **Full step-by-step walkthrough & troubleshooting:** see [docs/INSTALL_GUIDE.md](docs/INSTALL_GUIDE.md).

🗂️ **Want to understand or customize your Airtable base?** See [docs/AIRTABLE_FAQ.md](docs/AIRTABLE_FAQ.md) — a plain-language walkthrough of every table and field, which parts are safe to reshape, and hands-on exercises to try.

## A note on sensitive information

Your Grant Assistant base is a standard Airtable base. This project does not add encryption, field-level redaction, or access tiers on top of it — whatever protection your data has is what you configure in Airtable and in your own organization's practices.

**Keep out of the base:** Social Security or national ID numbers, bank and payment account details, donor payment card information, health information, immigration status, and personally identifying information about the individuals your programs serve. The same applies to what you paste into Claude chats when drafting — if it shouldn't be in the base, it shouldn't be in the chat.

The base is built for information that is *institutional* rather than personal: funder guidelines and deadlines, award amounts, your own organization's facts and program descriptions, and internal notes on pursuit strategy.

**Two fields attract sensitive detail more than the rest, so watch them:**

- **Donor Restriction Log → Flag Language.** The reason a funder is off-limits can involve candid relationship history. Record what your team actually needs, and keep it professional enough to survive being read by someone who wasn't in the original conversation.
- **Active Donors → Relationship Notes.** Same principle.

**What you control, and should check periodically:**

- **Who is invited to the base, and at what permission level.** Airtable's own sharing settings are the real access control here.
- **Shared view links.** Airtable can generate a publicly accessible link to any view. Anyone with that URL can see the data in it, with no login required. This is the most common way a base leaks. Audit your shared links and delete any you don't actively need.
- **The Airtable connector's scope in Claude.** Broad workspace access is required to *install*; you can narrow it afterward.

If your organization handles regulated data, or is subject to data requirements from a funder, grantor, or regulator, review Airtable's security documentation and your own policies before entering anything that falls under them. This project makes no compliance claims and provides no data-protection guarantees.

## How it works (the short version)

**Your judgment lives in your data, not in the software.** Everything specific to your organization — what sizes of grants fit you, what you can honestly claim, which funders to avoid, your non-negotiable rules — lives in an **Org Profile** table in your own Airtable. The skills read it every time they run. When your organization grows or changes, you edit that table, and the system's behavior follows. No reinstall.

**One master list, one gatekeeper.** All grants live in one table with a **Stage** marker (Possible → Active → Awarded, or Archived). The skills may only add and update grants at the "Possible" stage. Moving a grant forward is always done by a person on your team.

**Honest by design.** The system verifies opportunities against the funder's own website before scoring, flags information gaps instead of inventing facts, and ends every work session with a log entry that says what it did — and what it didn't get to.

## Repository contents (v1.1 overview; v2 folders described above)

```
grant-assistant/
├── README.md                  ← you are here
├── LICENSE                    ← Apache 2.0 license
├── NOTICE                     ← copyright notice
├── CONTRIBUTING.md            ← for the team maintaining this repo
├── CHANGELOG.md               ← what shipped in each version
├── docs/
│   ├── INSTALL_GUIDE.md       ← the full install walkthrough (start here)
│   ├── AIRTABLE_FAQ.md        ← table/field reference + customization guide
│   └── images/                ← screenshots for the guide
├── skill/
│   ├── grant-assistant-startup.skill      ← the installer you load into Claude
│   └── grant-assistant-startup/           ← its source, for review
└── template/
    └── Org-Seed-Template-BLANK.md         ← the seed document your org fills out
```

## License

This project is licensed under the [Apache License 2.0](LICENSE) — a permissive open-source license. In plain terms: you may use, modify, and share this freely (including commercially), as long as you keep the license and copyright notices with it and note any changes you make. It comes with no warranty. See the [LICENSE](LICENSE) file for the full terms and [NOTICE](NOTICE) for the copyright.
