# Lodestone Geographic Grain — Discovery and Proposed Contract
Date: 2026-11-03
Status: Design for review. No Supabase schema or data changes authorized.

## Scope
Lodestone Rural Memory Supabase is the shared intelligence foundation for CAIR, Wayfinder, and Grant Intelligence. Geographic interpretation must be reusable across products without rewriting source-faithful corpus records.

## Read-only evidence
The public lodestone_records table contains 161,022 records across 22 source groups. Current canonical fields include record_id, source_id, record_url, record_description, coverage, source_last_updated, and source-native payload JSONB. The existing lodestone_record_dimensions bridge demonstrates the discovery-owned linking pattern.

Observed geography:
- County: numerous federal datasets; payload county_fips appears in SRC-001, 002, 003, 004, 005, 007, 008, 012, 015, 017, 022, 023, 027, 028, 029, 031.
- BEA SRC-006 uses geo_fips rather than county_fips.
- FCC SRC-009 uses geography_type and geography_id; 13,410 records have geography_type.
- Facility/association sources SRC-016 and SRC-026 require source-specific review; absence of county_fips is not evidence of no geography.
- National funding datasets SRC-013 (SAM.gov Assistance Listings) and SRC-014 (Grants.gov) do not use the sampled county_fips or geography_type keys.
- HUD and CDC datasets include tract-level examples; county_fips may coexist with tract-level observation, so the presence of county_fips alone does not establish observation grain.

Silverton evidence: FCC SRC-009 has Census Place geography_id 0870580 with matched_county_fips containing 08111, citing U.S. Census Bureau 2024 geoinfo geography 157. Example record ID FCC-BDC:2025-12-31:PLACE:0870580:TOTAL:R:OTHER.

## Proposed shared geography entities
1. geo_areas: stable internal area ID; grain_type; code_system; authoritative_code as TEXT; area_name; source_authority; boundary_vintage; effective_from and effective_to. Identity constraints must account for grain, code system, and vintage.
2. geo_area_relationships: from_area_id, to_area_id, relationship_type (contains, overlaps, member_of), authority, effective period, and optional overlap methodology. Never presume all geographies nest.
3. lodestone_record_geographies: record_id foreign key to lodestone_records, area_id, geographic_role (observation, coverage, associated), assignment_method, provenance and review state. Discovery-owned; no changes to ingestion payload.

Later product-owned associations: organization headquarters, organization service area, Wayfinder scan target/site location, grant project location, grant eligibility geography. Geographic eligibility must remain distinct from organizational legal status and grant applicant rules.

## Silverton retrieval acceptance
Resolve Census Place 0870580 and San Juan County 08111, retrieve direct place-level observations and county contextual observations separately, show source IDs and vintages, and prevent county statistics from being labeled as Silverton-specific. Never infer grant eligibility solely from geographic overlap.

## Implementation gates
Audit all 22 source groups for actual observation grain and geographic key semantics; check Census place/county authority and effective dates; differentiate postal ZIP from Census ZCTA and economic region definitions. Coordinate with the interns' Wayfinder proposal. Review DDL, indexes, RLS and tenant separation before any production writes.
