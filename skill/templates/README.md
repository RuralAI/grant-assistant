# Skill Templates

These are the **canonical, org-agnostic source bodies** for the five operating skills the installer generates: `grant-scoring`, `prospect-scan`, `airtable-write`, `audit-log`, `grant-writing`.

## Why this folder exists

Before this folder existed, the installer's Step 4 said "generate from the validated full-fidelity production skill set" — but that set only existed as prior conversation history, not as a committed artifact. A fresh Claude session with no memory of that history had nothing to actually generate from. These five files close that gap: they are the real, versioned source the installer copies and retargets for every new organization.

## The templating convention

**These templates reference every table and field by its canonical name — never by a hardcoded ID.** For example, a template says:

> Read **Stage Posture** from Org Profile.

It never says:

> Read `fldXXXXXXXXXXXXXXX` (some opaque generated ID).

When the installer (Step 4 of `grant-assistant-startup/SKILL.md`) generates a skill for a specific org, it:

1. Takes one of these template files as-is.
2. Replaces the placeholder header block (base ID, base name, org name/slug) with that org's real values, captured during Step 2 of the install.
3. Leaves every table/field **name** reference exactly as written — the generated skill still says "Stage Posture," "Grant Master," "Fit Score," etc. The generated skill's own write discipline (see the airtable-write template) requires re-reading live schema before every write, so it resolves names to IDs at runtime rather than trusting any ID baked in at generation time.
4. Where a template illustrates a rule with an example (e.g., "an early-stage org may not claim audited financials"), that example is generic and instructive — it is never copied as if it were this org's actual judgment. The org's actual judgment always comes from its own Org Profile, read live.

This is deliberately **not** a `{{TOKEN}}` find-and-replace scheme. Generation is done by an LLM reading the template and the org's field map together — asking it to substitute names for the right table/field is more robust than asking it to find and replace literal tokens, and it keeps these template files readable as documentation in their own right.

## Zero-leakage rule

No template file may contain any specific organization's name, base ID, table ID, field ID, judgment values (award bands, durable rules, geography, etc.), or illustrative examples drawn from a real org's actual data. Every example in these files is either clearly hypothetical or written at the level of "a mature org may..." / "an early-stage org may not..." — a pattern, not a fact about any real organization.

## Files

| File | Generates |
|---|---|
| `grant-scoring.template.md` | `<org-slug>-grant-scoring` |
| `prospect-scan.template.md` | `<org-slug>-prospect-scan` |
| `airtable-write.template.md` | `<org-slug>-airtable-write` (also bundles a retargeted `references/field_map.md`) |
| `audit-log.template.md` | `<org-slug>-audit-log` |
| `grant-writing.template.md` | `<org-slug>-grant-writing` |

## Versioning

These templates change only when the *method* changes — a new downgrade rule, a new write-discipline lesson, a schema-level addition. They should version in lockstep with `grant-assistant-startup/SKILL.md`'s own version number, since the two are read together at generation time. See `CONTRIBUTING.md` at the repo root for the change-and-repackage process.
