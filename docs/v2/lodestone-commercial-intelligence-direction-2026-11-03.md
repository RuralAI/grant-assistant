# Lodestone commercial intelligence direction (2026-11-03)

Decision: Grant Intelligence will live in the existing Lodestone Rural Memory Supabase project, alongside rural evidence used for CAIR and forthcoming Wayfinder AGO website-scan data. This is not authorization for database writes.

Lodestone is the shared commercial intelligence foundation. Rural evidence provides geographic, economic, workforce and community context. Wayfinder provides permissioned website-visibility assessments. Grant Intelligence provides funder, grant, organization, eligibility and potential partnership intelligence. Products may reuse governed identities, geography and provenance without combining all operational tables.

Silverton is the integrated demonstration: rural evidence informs community needs; consenting local businesses and civic organizations assess visibility with Wayfinder; Grant Intelligence identifies evidence-backed funding and collaboration opportunities; later measurements evaluate outcomes without assuming causation.

The open-source Grant Assistant remains a user-populated Airtable/Google Sheets operational tool. Commercial Grant Intelligence adds prepopulated and maintained intelligence. Customer-owned profiles and scans must remain permission-isolated from reusable public intelligence.

Read-only Lodestone public-table inventory found eight existing tables: lodestone_sources, lodestone_records, lodestone_dimensions, lodestone_record_dimensions, lodestone_brain, source_registry, source_observations, source_editorial_contributions. No Wayfinder or grant-specific public tables appeared in this preliminary inventory.

Next: inspect existing geography and source lineage, candidate grant/funder sources, organization matching and permission boundaries; coordinate with the interns' Wayfinder proposal. Present a minimum schema for approval. No Supabase changes authorized.
