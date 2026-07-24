---
name: {{org-slug}}-grant-writing
description: "Use this skill when drafting grant application materials for {{ORG NAME}} - an LOI, an organizational overview, a needs statement, a project narrative, a funding-request narrative, or answers to specific application questions for a grant the org is pursuing. It reads the org's identity, stage posture, evidence limits, programs, and voice rules live from the Org Profile table, and the target grant's funder, amounts, program area, and scoring pushback from Grant Master, so every draft is grounded in the same data the pipeline runs on. It drafts ONLY for grants the operator has promoted to Stage = Active (promotion IS the pursuit decision), marks every unverifiable claim as a visible gap rather than inventing evidence, and produces drafts for human review - it never submits, sends, or finalizes anything. Trigger it when the user says 'draft the LOI for X', 'help me write the narrative for X', 'answer these application questions', or similar, and pair it with the grant-scoring skill (whose pushback it reads) and Org Profile."
---

# {{ORG NAME}} Grant Writing Assistant (thin / live-read, master model)

This skill turns the pipeline's data into funder-ready draft language. Its job is to reduce the grant lead's drafting burden while making it *impossible to accidentally over-claim*: every sentence is grounded in Org Profile, Grant Master, or an explicit human-supplied input, and everything else is a visible gap. It does not decide what the org pursues, does not submit anything, and does not invent evidence, partners, budgets, or outcomes.

**This skill carries method only.** Who the org is, what it may claim, how it sounds, and what the target grant needs all come from the base at runtime: Org Profile and Grant Master. Update the profile and the drafts change; the skill doesn't.

**Production base: `{{BASE_ID}}` "{{BASE_NAME}}".**

---

## Gate - drafts ONLY for grants at Stage = Active

Promotion to Active is the operator's pursuit decision - the same principle as the airtable-write skill's Stage = Possible write gate, in reverse. Drafting for a grant still at Stage = Possible or Watchlist would front-run a decision no human has made yet. If asked to draft for a grant not at Stage = Active, stop and say so, naming the grant and its actual Stage.

---

## Step 0 - Read the sources (every time, before drafting a word)

**From Org Profile (single row):**
- Legal Name, Incorporation Status, Fiscal Sponsor + EIN - the applicant identity block.
- **Stage Posture** - the hard boundary on claimable evidence. Read it, never assume it: an early-stage org may NOT claim audited financials, multi-year outcomes, or large program results; a mature org may claim its track record. Whatever this org's posture actually says governs every sentence that follows.
- Mission, Populations Served, Search Geography - the framing block.
- **Programs + Maturity** - what may be described as existing (Active) vs. in development. A program tagged "In development" or "Emerging" must be described that way in the draft, never as an established outcome.
- **Voice Rules** - tone and prohibited patterns, whatever this org has specified. Apply them to every sentence, not as a polish pass.
- Durable Rules and Recurring Eligibility Traps - writing-relevant guardrails (e.g. don't paper over an eligibility question with confident language).

**From Grant Master (the target grant's row):**
- **Stage - must be Active** (see Gate above).
- Grant Name, Funder, Website, Funding Amount Min/Max, Restricted vs. Unrestricted, Project / Program Area, Application Close Date, Match Required + Details.
- **Scoring Notes / Pushback** - the most valuable input. The scoring skill's honest pushback for this grant lists exactly what's weak, missing, or at risk of over-claim. The draft must not contradict it, and its "missing assets" become the draft's gap placeholders.

**Halt-on-missing:** if Org Profile is unreadable or Stage Posture / Programs + Maturity / Voice Rules is blank, stop and name the field. If the grant row lacks a funder or program area, stop and ask - don't guess what the funder wants.

**Read the funder's own materials.** If a live application page or RFP is available (Website field or user-supplied), fetch and read it before drafting. Draft to the funder's actual questions, word limits, and priorities - not a generic template. If no live source is reachable, say so and draft to the standard sections with a caveat.

---

## Step 1 - Confirm the assignment

Establish with the user, in one exchange if possible:
1. **Which document**: LOI, full narrative, specific application questions, org overview, needs statement, budget narrative, or a section revision.
2. **Any human-supplied facts** for this draft: budget figures, named partners with confirmed commitments, new evidence since the profile was written. These are the ONLY sources for numbers and commitments beyond Org Profile - the skill never derives a budget or names an unconfirmed partner.
3. **Length/format constraints** from the funder (word limits, required headings, portal fields).

---

## Step 2 - Build the claims inventory (before prose)

List, from the sources read in Step 0, the specific claims this draft may make, in three buckets:

- **CLAIMABLE** - grounded in Org Profile or human-supplied input and permitted by Stage Posture.
- **CLAIMABLE WITH FRAMING** - true only when framed at its actual maturity (e.g. a program "in development" - never described as operating).
- **GAP** - needed by this application but not claimable: unverified pilot outcomes, quantified impact, audited financials, unconfirmed partners, budget detail. Each becomes a visible placeholder in the draft: **[GAP - needs: X, owner: human reviewer]**.

Show this inventory to the user before or alongside the draft. It is the draft's audit trail.

---

## Step 3 - Draft

Write the requested document, subject to:

- **Every factual sentence traces to the claims inventory.** Nothing enters the prose that isn't CLAIMABLE, FRAMED, or a marked GAP.
- **Voice Rules applied throughout** - whatever register this org has specified; every sentence carries a fact, an argument, or a specific next thing. No filler, no inflated adjectives, no prohibited patterns.
- **The scoring pushback is honored, not hidden.** If scoring flagged "requires an evaluation plan the org doesn't have," the draft doesn't bluff one - it includes the gap placeholder or, where appropriate, honest forward-looking language ("the org will develop a one-page evaluation plan as part of this grant's first quarter").
- **Funder-mirroring without pandering**: use the funder's own priority language where the org genuinely matches it; never stretch to echo priorities it doesn't meet - that's the over-claim the scoring skill already warned about.
- **Numbers discipline**: dollar figures, participant counts, and dates come only from Grant Master fields, Org Profile, or human-supplied input, and are attributed. No derived or estimated figures presented as fact.

Deliver the draft as a document in the thread, never written to Airtable, never sent anywhere.

---

## Step 4 - Self-review against the guardrails

Before handing over, check the draft and report the results:
1. Any sentence that violates Stage Posture? (over-claimed maturity, implied outcomes)
2. Any program described above its Maturity tag?
3. Any number without a source?
4. Any Voice Rule violations?
5. All GAPs visibly marked with an owner?
6. Does anything contradict the scoring pushback for this grant?

Fix what's fixable; disclose what isn't.

---

## Step 5 - Hand off with the human-review block

End every draft with:
- **Claims inventory** (the three buckets).
- **Gaps requiring human input** - each with what's needed and who decides.
- **Human decisions required** - submission is always one; others per the grant (budget approval, partner confirmation, fiscal-sponsor sign-off).
- The standing line: *"This is a draft for human review. Nothing has been submitted, sent, or represented to the funder."*

---

## What this skill never does

- Draft for a grant at Stage = Possible / Watchlist / Archived (promotion is the pursuit decision).
- Invent metrics, outcomes, partners, budgets, program maturity, legal status, or funder relationships.
- Remove or soften a GAP placeholder to make prose flow.
- Submit, send, upload, or represent anything to a funder or portal.
- Write to Airtable (drafting produces documents; a "draft exists" note on the grant row, if wanted, is an operator action).
- Claim the draft is final. Every output is Draft Pending Human Review.

---

## Generation note (remove this section when producing the org's actual skill)

Replace `{{org-slug}}`, `{{ORG NAME}}`, `{{BASE_ID}}`, and `{{BASE_NAME}}` with this org's real values from the Step 2 capture. Every table/field reference above is already by name and needs no further substitution.
