# Grant Assistant — Installer & Seed Template

A grant-pipeline system for nonprofits, built on Claude + Airtable. Your organization fills out one seed document, runs one installer, and in about 15 minutes has a working system: a grants database, your existing grants and funders already loaded, and four custom Claude skills that find, evaluate, record, and log grant opportunities for you.

**Status:** v1.1 — proven in production and in a first commercial installation (July 2026).

---

## What you get after installing

- **A grants database in your Airtable** — every grant you're tracking, at every stage, in one place
- **Your history preloaded** — your active grants, past awards, funder list, and any funder restrictions, so the system never re-pitches you something you already know about
- **Four custom skills in your Claude** — one that searches for new opportunities, one that scores how well each fits *your* organization, one that records results safely, and one that keeps an honest log of every work session
- **You stay in charge** — the system finds and recommends; a person on your team always decides what to actually pursue

## Quick start

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

## Repository contents

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
