# Airtable FAQ: Understanding and Customizing Your Grant Assistant Base

This guide is for you, the person running the Grant Assistant day to day — usually the grant lead or development director. You don't need to know Airtable well to use this. By the end of this document, you'll understand what every table in your base is for, which parts are safe to reshape, and you'll have actually built something yourself to prove it.

Read it once start to finish the first week you have your base, then come back to specific sections whenever you're about to make a change and want to double-check it's a safe one.

---

## The one idea that explains everything else

Your base has **ten tables**. Four of them are the *engine* — the Grant Assistant's skills read from and write to them automatically, every time they run. Six of them are *yours* — built for you to shape around how your organization actually manages its work, and no automation ever touches them.

Once that distinction is clear, almost every other question in this document answers itself.

| Table | What it's for | Can I reshape it? |
|---|---|---|
| **Grant Master** | Every grant, at every stage, in one place | No — this is the engine |
| **Donor Master** | Every funder you know about, in one place | No — this is the engine |
| **Our Org Profile** | Who your org is — the facts the skills use to judge fit | No structural changes — but you edit its *content* constantly |
| **Search Audit Log** | An automatic record of every scan and scoring session | No — this is the engine's own notebook |
| **Active Grants (Pre-Award)** | Your team's day-to-day work on grants you're pursuing | **Yes — customize freely** |
| **Portfolio (Post-Award)** | Managing grants you've actually won | **Yes — customize freely** |
| **Watchlist** | Good-fit grants you're deliberately not pursuing yet, and why | **Yes — customize freely** |
| **Archive** | A record of grants you passed on or didn't win | **Yes — customize freely** |
| **Active Donors** | Your relationship notes on current funders | **Yes — customize freely** |
| **Donor Restriction Log** | Funders you're not allowed to approach right now, and why | **Yes — customize freely** |

Keep this table in your back pocket. Everything below just fills in the "why."

---

## Part 1: The four tables that run the engine

### Why these four are different

Grant Master, Donor Master, Our Org Profile, and Search Audit Log are what your five installed skills actually read and write. The skills find data by looking for specific field names and specific option values (like the word "Possible" in a Stage field). If a field gets renamed, deleted, or its dropdown options get changed, the skill that depends on it can quietly stop working — or worse, silently misbehave — without any obvious error message.

That's the *only* reason these four are off-limits for structural changes. It has nothing to do with these tables being more important than the other six — it's that automation is watching them closely, and the other six have no automation watching them at all.

**One important distinction: "don't restructure" is not the same as "don't touch."** You will use the data in these tables all the time — reading Grant Master to see your pipeline, updating Our Org Profile as your organization grows. What you shouldn't do is add, remove, or rename *fields*, or add/remove *options* inside a dropdown field, in any of these four.

### Grant Master

**What it is:** One row per grant opportunity, covering its entire life — from the moment your prospect scan finds it, through your team pursuing it, to winning or losing it. A single field called **Stage** tracks where it is right now: `Possible`, `Active`, `Awarded`, `Watchlist`, or `Archived`.

**Why one table instead of separate tables per stage:** If "the same grant" lived in three different tables as it moved through its life, you'd risk ending up with three slightly different copies of its funding amount, its deadline, its funder — and no way to be sure which one was right. Keeping one row per grant means there's exactly one place that holds the truth about it, no matter what stage it's in.

**Fields and what they mean:**

| Field | What it holds |
|---|---|
| Grant Name | The opportunity's name — this is the primary field, so it's what identifies the row everywhere else it's linked |
| Stage | Possible / Active / Awarded / Watchlist / Archived — where this grant is in its life right now |
| Funder | The name of the organization offering the grant |
| Website | A link to the funder's page for this opportunity |
| Restricted vs. Unrestricted | What kind of funding this is (general operating, program-restricted, capacity-building, capital, etc.) |
| Project / Program Area | Which of your programs this grant would fund |
| Geography | The funder's geographic eligibility, in plain text |
| Funding Amount Min / Max | The award size range |
| Match Required | Whether the funder requires you to match the grant with your own funds |
| Match Details | Specifics on the match requirement |
| Application Close Date | The deadline |
| Cycle / Recurrence | Whether this is a one-time opportunity or a recurring one (annual, multi-year, rolling) |
| Next Cycle Opens | For recurring grants, when it's expected to reopen |
| Pipeline Priority | A field reserved for your own internal prioritization — set by you, not the scan |
| Fit Score, Fit Level, Readiness, Priority | The scoring skill's assessment of this opportunity |
| Scoring Notes / Pushback | The scoring skill's honest reasoning and any concerns it flagged |
| Notes | Free-form notes |
| Provenance | Where this row came from (a scan, a manual entry, an install) |

**What you *do* here:** Read it constantly. Filter it, sort it, build views on it (see Part 3). Update the Stage field yourself when you promote a grant. Just don't add new fields to it or change what's in the dropdowns.

### Donor Master

**What it is:** One row per funder your organization knows about — every foundation, agency, or corporate giving program, regardless of whether you currently have an open grant with them.

**Fields:** Donor Name (primary), Category / Type, Website, Owner, Notes.

**Why it's separate from Grant Master:** A single funder might fund you multiple times over the years, across several different grants. Keeping funder information in its own table means you record what you know about *PetSmart Charities* once, and every grant from them links back to that one record — instead of retyping their details every time you apply again.

### Our Org Profile

**What it is:** A single row that holds everything the scan and scoring skills need to know about *your* organization — your stage of development, your budget and award-size sweet spot, your funding priorities, your non-negotiable rules, and how you want your writing to sound.

**This is the one table where the "don't change the structure, but do use the content" distinction matters most.** You should expect to come back and edit the *content* of this row regularly — your budget grows, a program moves from "emerging" to "active," your award bands shift. That's not just allowed, it's the whole point: every skill reads this row fresh every time it runs, so updating it here is how you keep the whole system current without touching a single skill file.

What you shouldn't do is add new fields to this table, rename existing ones, or restructure its dropdown options — the skills are looking for these fields by their exact names.

**Running more than one profile.** This table can hold several rows, not just one. Each row is a complete profile with its own stage posture, award bands, priorities, and rules — and each has a short label in the **Profile Name** field (your first one is probably "Main").

Why you might want a second profile:
- You're a fiscally sponsored project and want to model how scoring changes if you were independent.
- You run a distinct program with a different funding profile than your core work.
- You want to test whether a different award band or posture surfaces different opportunities, without disturbing your real settings.

**How the skills pick which one to use:** if you don't say anything, they use the **first row** and tell you which profile they used. If you want a different one, just name it — "score this against the Equine Program profile" — and they'll match it against Profile Name. If you name a profile that doesn't exist, they'll stop and list what's available rather than quietly guessing, because a wrong profile produces a confidently wrong score.

A practical way to use this: **keep separate chat windows for separate profiles.** One window where you always work from "Main," another where you always work from a second profile. Because the skills state which profile they used in their output, you can also just glance at any response to confirm you're in the right context.

### Search Audit Log

**What it is:** An automatic diary. Every time a skill runs a scan, a scoring pass, or a maintenance cycle, it writes one honest entry here — what it searched, what it found, what it didn't get to, and why it stopped. You never write to this table yourself; the skills do.

**Why it exists:** So that six months from now, you (or a new team member) can look back and understand exactly what happened in your pipeline and when, rather than guessing.

---

## Part 2: The six tables built for you

### Why these are safe to reshape

None of your five installed skills ever writes to Active Grants (Pre-Award), Portfolio (Post-Award), Watchlist, Archive, Active Donors, or the Donor Restriction Log. They exist purely to hold *your* team's day-to-day management information — the stuff that's specific to how your organization works, which no generic template could anticipate. Because nothing automated is watching these tables, you can add fields, remove fields, rename fields, and build any views you like without any risk of breaking a skill.

**The one field to leave alone in each of these tables** is the link field connecting each row back to its Grant Master or Donor Master record (for example, Portfolio's "Grant" link field). That link is what lets you jump between "the full history of this grant" and "how we're currently managing it." Everything else in these five tables is yours to shape.

### How a row gets here

You create these rows yourself, by hand, when you promote something. For example: when your team decides to actually pursue a grant sitting in Grant Master at Stage = Possible, you add a new row in Active Grants, click into its link field, and pick that grant from Grant Master — then go back to Grant Master and flip its Stage to Active. That's the "operator gate" the whole system is built around: nothing gets promoted without a person deciding it.

### Active Grants (Pre-Award)

**What it's for:** Tracking your team's actual day-to-day work on a grant you've decided to pursue — who owns it, where the application stands, and any internal notes.

**Starting fields:** Owner, Internal Deadline, Application Status, Work Notes.

**The Application Status options** walk a pursuit through its real sequence: Researching → Preparing LOI → LOI Submitted - Awaiting Decision → Preparing Full Proposal → Full Proposal Submitted - Awaiting Decision, and then one of three endings: Awarded - In Portfolio, Declined - In Archive, or Withdrawn - In Archive.

Those last three are signposts. They tell you at a glance what became of a pursuit, but the authoritative record lives elsewhere — in the grant's Stage in Grant Master, plus a row in Portfolio (Post-Award) or Archive. So when a grant is awarded, you'll set this status to "Awarded - In Portfolio," flip the Grant Master Stage to Awarded, and create the Portfolio row. Three small steps, and the reason it's worth doing all three is that each table then tells a complete story on its own.

**Ideas for fields you might add:** A checklist of required attachments, a link to your shared drafting document, a field for who needs to review before submission, a countdown or priority flag for your weekly team meeting.

### Portfolio (Post-Award)

**What it's for:** Managing a grant after you've won it — award terms, reporting obligations, and how the money is being used.

**Starting fields:** Award Date, Award Amount, Reporting Due, Grant Status (Active - Year 1 / Active - Year 2 / Active - Year 3 / Closed), Management Notes.

**Ideas for fields you might add:** A field for each required report's due date if there are several, a field tracking what percentage of the award has been spent, a link to your grant agreement document, a field for the program officer's name and direct contact.

### Archive

**What it's for:** A record of grants that didn't move forward — rejected, not awarded, or withdrawn — kept so your prospect scan never wastes time re-suggesting something you already know isn't a fit.

**Starting fields:** Archive Reason / Status, Date Archived, Disposition Notes.

**Ideas for fields you might add:** A field noting whether you'd consider reapplying in a future cycle, a field for what specifically to fix before trying again.

### Watchlist

**What it's for:** Grants that genuinely fit your organization but that you've decided not to pursue *right now* — maybe the cycle closed, maybe you're not eligible yet, maybe you need a relationship first. Instead of losing track of them or letting them clutter your active pipeline, they get parked here with a reason and a date to look again.

**Starting fields:** Watchlist Status (Awaiting Next Cycle / Not Yet Eligible / Low Priority / Emerging Fit / Relationship Needed / Monitoring), Next Review Date, What Would Need to Change, Watchlist Notes.

**Why "What Would Need to Change" matters:** it's the most useful field in this table. When your scoring skill flags a grant as a future fit, it usually says *why* it isn't a fit yet — you need two years of audited financials, or a program that doesn't exist yet, or a partner commitment. Writing that down turns a vague "someday" into an actual checklist. Six months later you can look at the row and know immediately whether you've cleared the bar.

**Ideas for fields you might add:** a link to the funder's guidelines page so you can re-check requirements quickly, a checkbox for whether you've set a calendar reminder, a field for who's responsible for the relationship-building if that's the blocker.

**One thing to know about how grants get here:** your skills never file something as Watchlist on their own. When the scoring skill decides a grant is a future fit rather than a now fit, it writes that recommendation onto the grant's row in Grant Master (in the Priority field) while leaving its Stage as `Possible`. You decide whether to actually move it to Watchlist. That's deliberate — the system recommends, you dispose.

### Active Donors

**What it's for:** Relationship management with funders you currently have (or are actively cultivating) — separate from the factual funder data in Donor Master.

**Starting fields:** Relationship Owner, Relationship Stage (Prospect / Cultivating / Active Funder / Lapsed), Last Contact, Relationship Notes.

**Ideas for fields you might add:** A field for their typical annual giving cycle so you know when to reach out, a checkbox for whether they've been thanked for their most recent gift, a field logging board or staff connections to that funder.

### Donor Restriction Log

**What it's for:** A record of funders you can't or shouldn't approach right now — maybe you were asked not to reapply for two years after a decline, or a program only funds certain kinds of organizations and yours doesn't qualify. Your prospect scan reads this table so it never suggests a restricted funder.

**Starting fields:** Restriction Type, Restricted Program, Flag Language, Status (Active / Expired), Restricted Until.

**Ideas for fields you might add:** A field for who at your organization has the relationship context on why the restriction exists, in case the person who knows moves on.

---

## Part 3: Views vs. custom fields — two different tools for two different needs

This is the single most useful distinction to understand before you touch anything, because it answers "how do I make this table work better for me?" almost every time it comes up.

### A view is a different way of *looking at* data that already exists

Think of a table like a big spreadsheet, and a view like a pair of glasses you can put on to see just part of it, sorted or arranged a certain way. **No new information is created. Nothing about the underlying data changes.** You can create a view, delete it, or change it, and the actual records in the table are never affected.

Use a view when your honest answer to "what do I want?" is some version of *"I want to see this data differently"* — a filtered list, a different sort order, certain columns hidden, or a whole different layout like a calendar or a kanban board.

**The single most useful habit: build one view per stage.** Grant Master holds every grant at every stage, which makes it the honest single source of truth — and also makes it noisy to look at directly. The fix is to create a filtered view for each Stage and work from those instead of the raw table:

- **Possible** — filter Stage = Possible, sort by Fit Score descending. This is your review queue: what the scan found, best fits first.
- **Active** — filter Stage = Active. What your team is actually working on right now.
- **Awarded** — filter Stage = Awarded. Everything currently funded.
- **Watchlist** — filter Stage = Watchlist. Your "not yet" pile.
- **Archived** — filter Stage = Archived. History, out of the way.

Name them plainly ("Possible — Review Queue," "Active Pursuits") and you've effectively turned one table into five focused workspaces without duplicating a single record. Do the same in any table that gets busy — filter Portfolio (Post-Award) by Grant Status, or Active Donors by Relationship Stage.

**A few more worth building:**
- In Portfolio (Post-Award): a view sorted by Reporting Due, so you never miss a report deadline.
- In Active Grants (Pre-Award): a kanban board grouped by Application Status, so your team sees the whole pre-award pipeline at a glance.
- In Watchlist: a view sorted by Next Review Date, so nothing sits parked and forgotten.

### A custom field is *new information* you want to start capturing

A field is a column. Adding one means you're telling Airtable "starting now, I want to record this piece of information for every row in this table" — and from then on, that's real data you fill in and can use, filter by, and build views around.

Use a custom field when your honest answer is some version of *"there's something I want to write down here that doesn't have a home yet."*

### The simple test

Ask yourself: **"Am I trying to see something differently, or record something new?"**

- Seeing differently → build a view.
- Recording something new → add a field (only in one of your six customizable tables).

If you're not sure which one you need, it's almost always safe to try a view first — it costs you nothing to delete if it wasn't what you wanted, whereas a field you add sticks around holding data once you start using it.

---

## Part 4: Try it yourself

The fastest way to trust that you understand this is to actually do it. Both exercises below are on your six customizable tables, so there's no way to cause a problem — the absolute worst case is you delete a view or a field you just made, which takes one click.

### Exercise 1 — Build a view

**Goal:** In Portfolio (Post-Award), build a view that shows only grants with a report due in the next 30 days.

1. Open your base and click into the **Portfolio (Post-Award)** table.
2. Along the top, you'll see your current view (usually called "Grid view") in a tab. Click the **+** next to it to add a new view.
3. Give it a name, like "Reports Due Soon."
4. Click **Filter**, and set a condition on the **Reporting Due** field — something like "is within the next 30 days" (Airtable's date filter options will show you what's available).
5. Optionally click **Sort** and sort by Reporting Due, soonest first.

**Reflection:** Look at Grant Master. Did anything there change? It shouldn't have — that's the proof that a view is just a lens, not a change to your data. Delete the view if you like; nothing is lost either way.

### Exercise 2 — Add a custom field

**Goal:** In Active Donors, add a field to track each funder's preferred way to be contacted.

1. Open the **Active Donors** table.
2. Scroll to the right end of your columns — you'll see a **+** button at the end of the header row.
3. Click it, name the field something like "Preferred Contact Method," and choose **Single select** as the field type.
4. Add a few options: Email, Phone, Mail.
5. Go through a couple of existing rows and fill it in.

**Reflection:** Would it make sense to add this same field to Donor Master instead? Take a moment before reading on.

*(The answer: probably not — Donor Master is meant to stay lean and universal, since it's read by your scan and scoring skills every time they run. "Preferred contact method" is a relationship-management detail, not something the skills need, which is exactly why it belongs in Active Donors instead.)*

### One more, if you want the practice

Build a **calendar view** in Grant Master filtered to Stage = Possible, using Application Close Date — a fast way to see every upcoming deadline across your whole pipeline at a glance.

---

## Quick reference

| Table | Structural changes | Content changes |
|---|---|---|
| Grant Master | Don't add/rename/remove fields or options | Update Stage as you promote grants; read constantly |
| Donor Master | Don't add/rename/remove fields or options | Add new funders as discovered; read constantly |
| Our Org Profile | Don't add/rename/remove fields | **Edit the content often**; add extra profile rows if useful |
| Search Audit Log | Don't add/rename/remove fields | Read-only for you; the skills write here automatically |
| Active Grants | Customize freely | Yours |
| Portfolio | Customize freely | Yours |
| Archive | Customize freely | Yours |
| Active Donors | Customize freely | Yours |
| Donor Restriction Log | Customize freely | Yours |

If you're ever unsure whether a table is safe to reshape, come back to this table — or just remember: **if a skill depends on it, leave the structure alone; if it's one of your six, it's yours.**
