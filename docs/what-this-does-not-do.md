# What this system does not do

Deliberate boundaries, written down so nobody has to discover them by surprise. Every one of these is a design decision, not a missing feature.

## It never acts externally on your behalf

- **It never submits a grant application**, to any portal, ever. Drafts end with: "This is a draft for human review. Nothing has been submitted, sent, or represented to the funder."
- **It never contacts a funder**: no emails, no forms, no outreach.
- **It never makes commitments**: no partner commitments, no budget commitments, no program promises.

## It never decides what you pursue

- Skills create and update grants only at **Stage = Possible**. Moving a grant forward (Active, Awarded, Watchlist, Archived) is always a person's action in Airtable. There is no automation that promotes, and none should be added.
- A "watchlist" scoring outcome is a *recommendation* written on a Possible row; filing it under the Watchlist stage is your call.
- Upgrades to your install never happen automatically. Finding an older base never triggers one; only your explicit request does.

## It never invents facts

- No invented metrics, outcomes, partners, budgets, program maturity, legal status, or funder relationships. Gaps are flagged as gaps: the writing skill marks them visibly in drafts (`[GAP - needs: X]`) rather than papering over them.
- Opportunities are verified against the funder's own materials before scoring; unverifiable details are marked as needing confirmation, not assumed.
- Every work session ends with an honest audit entry including what was NOT covered.

## It does not manage your money, compliance, or people

- No budgeting, accounting, or financial management; award amounts in the base are records, not books.
- No compliance claims of any kind: the base is a standard Airtable base with no added encryption, redaction, or access tiers (see the README's "Your data" section).
- No HR, board, program-delivery, or beneficiary data management; personally identifying information about the people you serve does not belong in this system at all.

## It does not replace your grant professional

It reduces discovery and first-pass burden, keeps honest records, and drafts grounded starting text. Judgment about what to pursue, what to promise, and what to submit stays with your team; the system is built to make that judgment better informed, not to exercise it.
