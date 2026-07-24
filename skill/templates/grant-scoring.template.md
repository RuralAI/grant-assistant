---
name: {{org-slug}}-grant-scoring
description: "Use this skill whenever evaluating or scoring a grant opportunity for {{ORG NAME}} - assessing fit, deciding pursue/watchlist/reject, rating an opportunity, or judging whether the org should apply. It scores fit objectively (/20) and readiness qualitatively, reports them separately, verifies against primary sources before scoring, applies visible downgrade layers, gives honest pushback, and reads the org's judgment layer (stage posture, award bands, fit criteria, durable rules, loan posture, eligibility traps) live from the Org Profile table so the skill never needs updating as the org evolves. Trigger it even when phrased casually ('is this grant worth it', 'should we go for this one', 'score this opportunity', 'evaluate this funder'), and apply it before writing any score into Airtable."
---

# {{ORG NAME}} Grant Scoring (thin / live-read, master model)

This skill makes grant evaluation consistent and honest. Its purpose is to protect the org's credibility and staff time by separating opportunities it can genuinely win from ones that merely sound aligned. It does not decide what the org pursues - a human does. It produces a grounded recommendation.

**This skill carries method only.** Everything specific to this org - its stage, budget bands, fit criteria, durable rules, loan stance, eligibility traps - lives in the **Org Profile** table and is read at runtime. The org updates its profile in Airtable as it grows, and this skill's behavior follows without being rewritten.

**Production base: `{{BASE_ID}}` "{{BASE_NAME}}".** Do NOT read from or write to any base whose name carries a "- RETIRE" suffix - those are retired and exist only as do-not-touch history.

Core design: **fit is scored objectively, readiness is assessed qualitatively, and the two are reported separately.** Fit determines whether an opportunity is structurally worth pursuing in principle. Readiness determines whether the org can credibly apply right now. Never collapse them into one number.

---

## Step 0 - Read the judgment layer from Org Profile (first, every time)

Read the single Org Profile record. Load:

- **Stage Posture** - what the org may and may not claim as evidence.
- **Award Band Strong Min / Max** - the size bands.
- **Fit Criteria + Anchors** - the four fit criteria and their 1/3/5 definitions.
- **Durable Rules** - the org's non-negotiables.
- **Loan Posture** - exclude vs. case-by-case-flag-for-board.
- **Recurring Eligibility Traps** - the checks to run every time.
- **Funding Priority Order**, **Programs + Maturity**, **Operating Budget**.

**Halt-on-missing.** If Org Profile is missing, unreadable, or ANY required judgment field is blank (Stage Posture, Award Bands, Fit Criteria, Durable Rules, Loan Posture, Recurring Eligibility Traps, Programs + Maturity), STOP and tell the operator exactly which field to fix. Do not score on guessed defaults - a wrong default silently mis-scores. A halt is visible and safe.

---

## Step 1 - Verify before scoring

Never score from a funder name or memory. Find the primary source (funder page or official NOFO; fetch and read it) and confirm: eligibility (entity type, geography, org-age requirements), deadline / cycle status, award size, match requirement, applicant type, and every gate named in the org's **Recurring Eligibility Traps**. If a detail cannot be verified, score it provisionally and flag exactly what needs confirmation - do not invent it.

---

## Step 2 - Classify the funding type FIRST

Classify the instrument before any scoring: Unrestricted / general operating, Capacity-building, Program / project-restricted, Capital, or Loan / repayable capital.

For a loan, apply the **Loan Posture** read from Org Profile - it may say "exclude outright" or "case-by-case, flag for board," and this skill follows whichever the org has actually set, never assuming one or the other. If excluded: classify it as a loan, do not score it on the grant rubric, reject it as a grant recommendation, and note it only as sector intelligence if useful. Rural- or mission-adjacent language does not turn a loan into a grant.

---

## Step 3 - Score the FIT criteria (objective, /20)

Use the four criteria and their 1/3/5 anchors **as defined in Org Profile's Fit Criteria + Anchors**. Score each from the funder's materials - the criteria describe the opportunity, not the org.

For the funding-size criterion, score against the **Award Band** fields:
- Within Strong Min-Max -> strong (5).
- Near the band edges -> moderate (3).
- Far outside -> poor (1). Also check any funder-side percent-of-budget rule against Org Profile's Operating Budget (e.g., a "10% of operating budget" cap resolves which award tier the org may actually request).

Sum to a **Fit Score /20**: High Fit 16-20, Medium Fit 10-15, Low Fit <10. One-line note per criterion.

---

## Step 4 - Assess the READINESS criteria (qualitative, org-facing)

Assess: eligibility fit; deadline feasibility; partner requirements; programmatic fit; application burden.

- **Programmatic fit** scores highest when an *existing named program* (per Org Profile's Programs + Maturity) maps directly to the funded work; lower when the mapped program is tagged "In development"/"Emerging" or the org would build from scratch. Never describe a program above its maturity tag.
- **Stage-appropriate gates**: apply the Stage Posture honestly, whatever it says. An early-stage org fails audited-financials and multi-year-outcomes gates; a mature org may clear them. Read the posture rather than assuming either.

Assign a readiness label: **Actionable / Needs Eligibility Confirmation / Not Ready This Cycle / Blocked by Eligibility** (these are the exact Grant Master option strings).

---

## Step 5 - Strategic value (judgment note, not scored)

Does this build a relationship, credibility, or capability worth having even at a modest award (e.g., a funder the org will want in a future cycle)? Short note; not folded into the score.

---

## Step 6 - Synthesize fit and readiness

Report both axes, then synthesize into the Priority label (exact Grant Master options):
- High Fit + Actionable -> **High Priority**
- High Fit + Needs Confirmation -> **High Fit / Needs Readiness Confirmation**
- High Fit + Not Ready -> **Watchlist / Future Fit** (the Readiness field carries "Not Ready This Cycle"; there is no separate high-fit-not-ready Priority option)
- Medium Fit + Actionable -> **Medium Priority**
- Any fit + Blocked by Eligibility -> **Watchlist / Future Fit** (time-limited block) or **Reject** (permanent/structural)
- Low Fit -> **Watchlist / Future Fit** or **Reject**

Never let a strong fit score imply pursuit-readiness. High fit does not mean pursuit-ready; thematic alignment does not override eligibility.

---

## Step 7 - Apply the downgrade layers (visible, not automatic)

Each produces a recommended adjustment with the underlying scores still shown. The skill flags; the human decides.

- **Blocked by Eligibility** (including a Recurring Eligibility Trap hit) -> recommend Reject or Watchlist regardless of fit; show the fit score so the human can confirm the block is real.
- **Loan / repayable instrument** -> handled per Loan Posture (Step 2).
- **Match required beyond the org's capacity** -> downgrade one tier; flag the match amount explicitly.
- **Deadline under 2 weeks** -> downgrade one tier, unless rolling.

---

## Step 8 - Honest pushback

Name where the org is tempted to overstate fit, claim unverified pilot outcomes, force thematic alignment, or apply before it is ready - checked against the **Durable Rules** from Org Profile. Never violate a durable rule to make an opportunity look better. The pushback is the most valuable output and it feeds downstream: the grant-writing skill reads it and must not contradict it.

---

## What the evaluation outputs

Funding-type classification; eligibility assessment + disqualifying features (including any trap checked); the fit table with Fit Score /20 and Fit Level; the readiness label; strategic-value note; synthesized Priority; downgrade flags (condition, recommended adjustment, overridden scores); honest pushback; missing assets/evidence (flag gaps - never invent metrics, partners, budgets, outcomes, or legal status); recommended next action; human decisions required. All of it maps to Grant Master fields and is written via the airtable-write skill at Stage = Possible.

---

## Generation note (remove this section when producing the org's actual skill)

Replace `{{org-slug}}`, `{{ORG NAME}}`, `{{BASE_ID}}`, and `{{BASE_NAME}}` with this org's real values from the Step 2 capture. Every other table/field reference above is already by name and needs no substitution - the generated skill still says "Stage Posture," "Grant Master," etc. verbatim.
