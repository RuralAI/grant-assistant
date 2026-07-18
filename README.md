# Grant Assistant — Installer & Seed Template

A repeatable, installable grant-pipeline system for nonprofits, built on Claude + Airtable. An organization fills out one seed template, runs one startup skill, and gets a working environment in about 15 minutes: an Airtable base (master model), their existing grants/funders/restrictions loaded as a deduplication baseline, and four org-tuned operating skills that discover, score, write, and audit grant opportunities.

**Status:** v0.2 — validated in production (CRAI) and in a first commercial install (Boys to Men, July 2026).

---

## How it works

**Method vs. judgment.** The four generated operating skills carry *method only* — the universal loop: scan → classify → score → honest pushback → write → audit, with verify-before-scoring and flag-gaps-never-invent. Everything org-specific — stage posture, award-size bands, fit criteria, durable rules, loan posture, recurring eligibility traps, geography, voice — is *judgment*, and it lives in the org's **Org Profile** table in Airtable. Skills read it live at runtime. Install once; the org evolves its profile in Airtable and skill behavior follows without regenerating anything.

**The master model.** One **Grant Master** table holds every grant at every lifecycle stage; a **Stage** field (Possible / Active / Awarded / Archived / Withdrawn) carries the lifecycle. **Donor Master** mirrors it for funders. Five operator-only context tables (Active Grants, Portfolio, Archive, Active Donors, Donor Restriction Log) hold stage-specific working fields and link back to the masters. Deduplication is a single table read.

**The operator gate is human, permanently.** Skills create and update Grant Master rows only at Stage = Possible. A person promotes a grant by flipping its Stage and linking a working row. No staging automation exists, by design.

## What an install produces

- An Airtable base with nine tables, built in one pass with proper record links
- The org's portfolio, funder list, and funder restrictions ingested with honest provenance (the dedup baseline)
- A populated Org Profile — the org's judgment layer, editable in Airtable forever after
- Four packaged operating skills, tuned to the org's base: `<org>-prospect-scan`, `<org>-grant-scoring`, `<org>-airtable-write`, `<org>-audit-log`
- An install audit entry recording exactly what was built and ingested

## Repository layout

```
grant-assistant/
├── README.md                  ← you are here
├── docs/
│   └── INSTALL_GUIDE.md       ← the comprehensive install runbook (start here)
├── skill/
│   ├── grant-assistant-startup.skill      ← packaged installer, save into Claude
│   └── grant-assistant-startup/           ← unpacked source (for review/maintenance)
│       ├── SKILL.md
│       └── assets/
│           └── Org_Seed_Template_BLANK.md ← template bundled inside the skill
└── template/
    └── Org_Seed_Template_BLANK.md         ← the entry form an org fills out
```

## Quick start (validated runbook)

1. **Accounts**: the org needs a Claude account (a plan with skills + the Airtable connector) and an Airtable account.
2. **Connect Airtable to Claude — with full/workspace access.** This is the critical step: base creation requires workspace-level scope. A connection scoped to individual bases will halt the install at the first check.
3. **Save the installer**: add `skill/grant-assistant-startup.skill` to Claude as a skill.
4. **Fill the seed template** (`template/Org_Seed_Template_BLANK.md`). Ten ★REQUIRED fields must be complete — the install halts and names any that are blank.
5. **Run it** in a new Claude Project thread, template attached:
   > *Invoke the grant-assistant-startup skill and read the attached seed document for context.*

Expect roughly **15 minutes** and on the order of **100–130k tokens** for a typical install (observed in the first commercial run). The thread ends with a verification report and the four org skills presented for install.

Full details, verification checklist, and troubleshooting: **[docs/INSTALL_GUIDE.md](docs/INSTALL_GUIDE.md)**.

## Design principles (the short version)

1. Method lives in skills; judgment lives in the org's data, read live.
2. Halt over guess — a blank required field stops the install; a wrong default silently mis-scores forever.
3. The human operator stays in the middle: pursuit, promotion, budgets, and submission are never automated.
4. Flag gaps, never invent — no fabricated metrics, partners, budgets, or eligibility.
5. Honest audit trails — every cycle logs what actually happened, including what wasn't covered.
6. Live schema always wins — skills re-read Airtable before every write; snapshots are conveniences, not truth.

## Maintaining this repo

- The unpacked skill (`skill/grant-assistant-startup/`) is the source of truth. After editing `SKILL.md` or the bundled template, repackage to a fresh `.skill` and commit both.
- Keep `template/Org_Seed_Template_BLANK.md` and the copy inside `skill/.../assets/` in sync — the skill hands its bundled copy to users who arrive without one.
- Version notes belong at the top of `SKILL.md`; breaking schema changes (table/field/option definitions) warrant a version bump and a reconcile-mode note, since already-installed orgs read those exact option strings.
