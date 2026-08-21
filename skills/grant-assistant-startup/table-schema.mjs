/**
 * Canonical Airtable schema for the Grant Assistant pilot.
 *
 * THIS FILE IS THE SOURCE OF TRUTH for what the installer builds. It lives inside the
 * installer skill folder (skills/grant-assistant-startup/table-schema.mjs) as a single
 * copy; there is no duplicate to drift from. Appendix A of SKILL.md is a human-readable
 * rendering of this file and must be updated in the same change; CRAI's review skill
 * checks the two against each other before merge.
 *
 * Any change to this file is a MAJOR release. A base provisioned by an older installer
 * does not have the new table, field, or select option, and writes to it fail. See
 * docs/versioning.md.
 *
 * Field types deliberately avoided, learned live on this and other CRAI pilots:
 *   - formula, rollup, lookup: the connector cannot reliably create them and they are
 *     read-only. Store a writable copy instead.
 *   - autoNumber: not creatable through the API. Operators may add one in the UI.
 *
 * Build sequence (see SKILL.md Step 2): ONE create_base call with all ten tables, then
 * a link pass adding the six multipleRecordLinks fields (Airtable auto-creates the
 * inverse field on each master; capture both IDs).
 */

/** Written into Our Org Profile on every install; updated on every upgrade. */
export const INSTALLER_VERSION_FIELD = "Installer Version";

/**
 * This pilot's equivalent of the standard's Config table. It predates the standard
 * (the standard was generalized from this pilot) and carries the deployment stamp,
 * the Profile Name rows, AND the org's judgment layer in one operator-friendly table.
 */
export const CONFIG_TABLE = "Our Org Profile";

export const schema = {
  tables: [
    {
      /**
       * The masters: one row per grant / per funder, at every lifecycle stage. Stage
       * is both the lifecycle and the operator write-gate: skills create and update
       * rows ONLY at Stage = Possible. Every other Stage is a human decision.
       */
      name: "Grant Master",
      description:
        "Every grant at every lifecycle stage, one row each. Stage is the operator gate: " +
        "skills write only at Possible.",
      fields: [
        { name: "Grant Name", type: "singleLineText" }, // primary
        {
          name: "Stage",
          type: "singleSelect",
          options: {
            choices: [
              { name: "Possible" },
              { name: "Active" },
              { name: "Awarded" },
              { name: "Watchlist" },
              { name: "Archived" },
            ],
          },
          description:
            "No Withdrawn stage: a withdrawn grant is Archived with an Archive row " +
            "reasoned Withdrawn. Skills set only Possible.",
        },
        { name: "Funder", type: "singleLineText" },
        { name: "Website", type: "url" },
        {
          name: "Restricted vs. Unrestricted",
          type: "singleSelect",
          options: {
            choices: [
              { name: "Unrestricted (General Operating Potential)" },
              { name: "Restricted (Program / Project Specific)" },
              { name: "Capacity-Building" },
              { name: "Capital" },
              { name: "Other" },
              { name: "Unknown" },
            ],
          },
        },
        { name: "Project / Program Area", type: "singleLineText" },
        {
          name: "Geography",
          type: "singleLineText",
          description: "Free text. Never impose another org's geography vocabulary.",
        },
        { name: "Funding Amount Min", type: "currency", options: { precision: 0, symbol: "$" } },
        { name: "Funding Amount Max", type: "currency", options: { precision: 0, symbol: "$" } },
        {
          name: "Match Required",
          type: "singleSelect",
          options: { choices: [{ name: "Yes" }, { name: "No" }, { name: "Unknown" }] },
        },
        { name: "Match Details", type: "multilineText" },
        { name: "Application Close Date", type: "date", options: { dateFormat: { name: "iso" } } },
        {
          name: "Cycle / Recurrence",
          type: "singleSelect",
          options: {
            choices: [
              { name: "One-time" },
              { name: "Annual" },
              { name: "Multi-year" },
              { name: "Rolling" },
            ],
          },
        },
        { name: "Next Cycle Opens", type: "date", options: { dateFormat: { name: "iso" } } },
        {
          name: "Pipeline Priority",
          type: "singleSelect",
          options: {
            choices: [{ name: "Now" }, { name: "Next" }, { name: "Later" }],
          },
          description: "Operator-only. Skills never set this.",
        },
        { name: "Fit Score", type: "number", options: { precision: 0 } },
        {
          name: "Fit Level",
          type: "singleSelect",
          options: {
            choices: [{ name: "High Fit" }, { name: "Medium Fit" }, { name: "Low Fit" }],
          },
        },
        {
          name: "Readiness",
          type: "singleSelect",
          options: {
            choices: [
              { name: "Actionable" },
              { name: "Needs Eligibility Confirmation" },
              { name: "Not Ready This Cycle" },
              { name: "Blocked by Eligibility" },
            ],
          },
        },
        {
          name: "Priority",
          type: "singleSelect",
          options: {
            choices: [
              { name: "High Priority" },
              { name: "Medium Priority" },
              { name: "High Fit / Needs Readiness Confirmation" },
              { name: "Watchlist / Future Fit" },
              { name: "Reject" },
            ],
          },
          description:
            "Exactly five options. High-fit-but-not-ready synthesizes to Watchlist / " +
            "Future Fit; a watchlist outcome is a recommendation written at Stage = " +
            "Possible, never a Stage change by a skill.",
        },
        { name: "Scoring Notes / Pushback", type: "multilineText" },
        { name: "Notes", type: "multilineText" },
        { name: "Provenance", type: "singleLineText" },
      ],
    },

    {
      name: "Donor Master",
      description: "Every funder the org knows about, one row each.",
      fields: [
        { name: "Donor Name", type: "singleLineText" }, // primary
        {
          name: "Category / Type",
          type: "singleSelect",
          options: {
            choices: [
              { name: "Private Foundation" },
              { name: "Community Foundation" },
              { name: "Corporate" },
              { name: "Government - Federal" },
              { name: "Government - State" },
              { name: "Government - Local" },
              { name: "Civic / Service Organization" },
              { name: "Individual / Family" },
              { name: "Other" },
            ],
          },
        },
        { name: "Website", type: "url" },
        { name: "Owner", type: "singleLineText" },
        { name: "Notes", type: "multilineText" },
      ],
    },

    {
      name: "Search Audit Log",
      description: "One honest entry per work cycle. Skills write; operators read.",
      fields: [
        { name: "Cycle Date", type: "singleLineText" }, // primary; date-as-text so it can be primary
        { name: "Conducted By", type: "singleLineText" },
        {
          name: "Search Mode",
          type: "singleSelect",
          options: {
            choices: [
              { name: "Discovery scan" },
              { name: "Scoring pass" },
              { name: "Maintenance / data-management" },
            ],
          },
        },
        { name: "Queries Run", type: "multilineText" },
        { name: "Coverage Summary", type: "multilineText" },
        { name: "Stopping Rationale", type: "multilineText" },
        { name: "Total Opportunities Identified", type: "number", options: { precision: 0 } },
        { name: "Opportunities Added", type: "number", options: { precision: 0 } },
        { name: "Gaps / Limitations", type: "multilineText" },
        { name: "Provenance", type: "singleLineText" },
      ],
    },

    {
      /**
       * The judgment layer and the deployment stamp. Operator edits content
       * constantly (that is the point); skills read it live at runtime and never
       * write it. Multiple rows = multiple profiles, selected by Profile Name.
       */
      name: CONFIG_TABLE,
      description:
        "The org's judgment layer, one row per profile. Skills read live; the operator " +
        "edits. Carries the Installer Version deployment stamp.",
      fields: [
        {
          name: "Profile Name",
          type: "singleLineText", // primary
          description:
            "Short label (e.g. Main). Skills default to the first row and state which " +
            "profile they used; a named profile that does not exist halts with the " +
            "available names listed.",
        },
        {
          name: INSTALLER_VERSION_FIELD,
          type: "singleLineText",
          description:
            "Version that built or last upgraded this base, e.g. 1.2.0. ABSENCE OF THIS " +
            "FIELD FROM THE SCHEMA (not a blank value) signals a pre-versioning base. " +
            "Historical values: v1.0, v1.1. Never repurpose.",
        },
        { name: "Legal Name", type: "singleLineText" },
        { name: "Incorporation Status", type: "singleLineText" },
        { name: "Fiscal Sponsor + EIN", type: "singleLineText" },
        { name: "Org Age / Stage", type: "singleLineText" },
        { name: "Stage Posture", type: "multilineText" },
        { name: "Operating Budget", type: "singleLineText" },
        { name: "Growth Target", type: "singleLineText" },
        { name: "Award Band Strong Min", type: "currency", options: { precision: 0, symbol: "$" } },
        { name: "Award Band Strong Max", type: "currency", options: { precision: 0, symbol: "$" } },
        { name: "Award Band Edge Note", type: "multilineText" },
        { name: "Capital Exception", type: "multilineText" },
        { name: "Funding Priority Order", type: "multilineText" },
        { name: "Fit Criteria + Anchors", type: "multilineText" },
        { name: "Readiness Criteria", type: "multilineText" },
        { name: "Durable Rules", type: "multilineText" },
        {
          name: "Loan Posture",
          type: "singleSelect",
          options: {
            choices: [{ name: "Exclude outright" }, { name: "Case-by-case - flag for board" }],
          },
        },
        { name: "Recurring Eligibility Traps", type: "multilineText" },
        { name: "Eligibility Nuances", type: "multilineText" },
        { name: "Partner Sufficiency", type: "multilineText" },
        { name: "Search Geography", type: "multilineText" },
        { name: "Populations Served", type: "multilineText" },
        { name: "Anchor Institutions", type: "multilineText" },
        { name: "Programs + Maturity", type: "multilineText" },
        { name: "Mission", type: "multilineText" },
        { name: "Problem Statement", type: "multilineText" },
        { name: "Voice Rules", type: "multilineText" },
        { name: "Boilerplate", type: "multilineText" },
      ],
    },

    {
      name: "Active Grants (Pre-Award)",
      description:
        "Operator-only working table for grants being pursued. Skills never write here.",
      fields: [
        { name: "Work Item", type: "singleLineText" }, // primary
        { name: "Owner", type: "singleLineText" },
        { name: "Internal Deadline", type: "date", options: { dateFormat: { name: "iso" } } },
        {
          name: "Application Status",
          type: "singleSelect",
          options: {
            choices: [
              { name: "Researching" },
              { name: "Preparing LOI" },
              { name: "LOI Submitted - Awaiting Decision" },
              { name: "Preparing Full Proposal" },
              { name: "Full Proposal Submitted - Awaiting Decision" },
              { name: "Awarded - In Portfolio" },
              { name: "Declined - In Archive" },
              { name: "Withdrawn - In Archive" },
            ],
          },
          description:
            "The last three are signposts; the authoritative state is Grant Master's " +
            "Stage plus the destination context row.",
        },
        { name: "Work Notes", type: "multilineText" },
      ],
    },

    {
      name: "Portfolio (Post-Award)",
      description: "Operator-only management table for awarded grants.",
      fields: [
        { name: "Award Item", type: "singleLineText" }, // primary
        { name: "Award Date", type: "date", options: { dateFormat: { name: "iso" } } },
        { name: "Award Amount", type: "currency", options: { precision: 0, symbol: "$" } },
        { name: "Reporting Due", type: "date", options: { dateFormat: { name: "iso" } } },
        {
          name: "Grant Status",
          type: "singleSelect",
          options: {
            choices: [
              { name: "Active - Year 1" },
              { name: "Active - Year 2" },
              { name: "Active - Year 3" },
              { name: "Closed" },
            ],
          },
        },
        { name: "Management Notes", type: "multilineText" },
      ],
    },

    {
      name: "Watchlist",
      description:
        "Operator-only parking table for good-fit grants deliberately not pursued yet.",
      fields: [
        { name: "Watch Item", type: "singleLineText" }, // primary
        {
          name: "Watchlist Status",
          type: "singleSelect",
          options: {
            choices: [
              { name: "Awaiting Next Cycle" },
              { name: "Not Yet Eligible" },
              { name: "Low Priority" },
              { name: "Emerging Fit" },
              { name: "Relationship Needed" },
              { name: "Monitoring" },
            ],
          },
        },
        { name: "Next Review Date", type: "date", options: { dateFormat: { name: "iso" } } },
        { name: "What Would Need to Change", type: "multilineText" },
        { name: "Watchlist Notes", type: "multilineText" },
      ],
    },

    {
      name: "Archive",
      description: "Operator-only disposition record for grants that did not move forward.",
      fields: [
        { name: "Archive Item", type: "singleLineText" }, // primary
        {
          name: "Archive Reason / Status",
          type: "singleSelect",
          options: {
            choices: [
              { name: "Rejected - Not a Fit" },
              { name: "Rejected - Ineligible" },
              { name: "Not Awarded" },
              { name: "Withdrawn" },
              { name: "Other" },
            ],
          },
        },
        { name: "Date Archived", type: "date", options: { dateFormat: { name: "iso" } } },
        { name: "Disposition Notes", type: "multilineText" },
      ],
    },

    {
      name: "Active Donors",
      description: "Operator-only relationship table for current and cultivated funders.",
      fields: [
        { name: "Relationship Item", type: "singleLineText" }, // primary
        { name: "Relationship Owner", type: "singleLineText" },
        {
          name: "Relationship Stage",
          type: "singleSelect",
          options: {
            choices: [
              { name: "Prospect" },
              { name: "Cultivating" },
              { name: "Active Funder" },
              { name: "Lapsed" },
            ],
          },
        },
        { name: "Last Contact", type: "date", options: { dateFormat: { name: "iso" } } },
        { name: "Relationship Notes", type: "multilineText" },
      ],
    },

    {
      name: "Donor Restriction Log",
      description:
        "Operator-only record of funders the org may not approach right now. The scan " +
        "reads this and never surfaces a restricted funder.",
      fields: [
        { name: "Restriction Item", type: "singleLineText" }, // primary
        { name: "Restriction Type", type: "singleLineText" },
        { name: "Restricted Program", type: "singleLineText" },
        { name: "Flag Language", type: "multilineText" },
        {
          name: "Status",
          type: "singleSelect",
          options: { choices: [{ name: "Active" }, { name: "Expired" }] },
        },
        { name: "Restricted Until", type: "date", options: { dateFormat: { name: "iso" } } },
      ],
    },
  ],
};

/**
 * The link pass: run AFTER create_base. Each entry adds a multipleRecordLinks field
 * on the context table pointing at its master; Airtable auto-creates the inverse
 * field on the master. Capture both generated field IDs into the field map.
 */
export const linkPass = [
  { table: "Active Grants (Pre-Award)", fieldName: "Grant", linksTo: "Grant Master" },
  { table: "Portfolio (Post-Award)", fieldName: "Grant", linksTo: "Grant Master" },
  { table: "Watchlist", fieldName: "Grant", linksTo: "Grant Master" },
  { table: "Archive", fieldName: "Grant", linksTo: "Grant Master" },
  { table: "Active Donors", fieldName: "Donor", linksTo: "Donor Master" },
  { table: "Donor Restriction Log", fieldName: "Donor", linksTo: "Donor Master" },
];

/** Tables skills may write, and the exact scope. Everything else is operator-only. */
export const writeScope = {
  "Grant Master": "CREATE and UPDATE only rows at Stage = Possible",
  "Donor Master": "CREATE new funders discovered by a scan",
  "Search Audit Log": "CREATE one entry per work cycle",
};

export default schema;
