# Lodestone architecture alignment: geography, Wayfinder, Grant Intelligence
Date: 2026-11-03. Status: review-only design note. No database changes authorized.

## Verified existing Supabase architecture
Project: Lodestone Rural Memory (xbmuhzdemddmnrcteubq). Eight public tables:
1. lodestone_sources: 22 source definitions; source_id text primary key.
2. lodestone_records: 161,022 records; record_id text primary key; source_id FK; record_url, record_description, coverage, source_last_updated, payload jsonb.
3. lodestone_dimensions: 11 semantic dimensions; dimension_id text PK; unique(dimension_type,dimension_value).
4. lodestone_record_dimensions: 203,788 associations; PK(record_id,dimension_id); FKs to records and dimensions; role, assignment_method, assignment_note.
5. lodestone_brain: 339 research articles, separate review/visibility fields.
6. source_registry: 80 research-source definitions.
7. source_observations: 553 per-run source measurements.
8. source_editorial_contributions: 36 editorial provenance records.
All eight public tables report RLS enabled. Verified indexes: lodestone_records PK and source_id index; lodestone_record_dimensions PK and indexes on record_id and dimension_id.

## Architecture direction
Keep three boundaries:
- Ingestion-owned: lodestone_sources and lodestone_records, source-faithful JSON payloads. Do not modify.
- Discovery-owned: semantic dimensions and proposed geographic reference/assignment tables.
- Product-owned: future Wayfinder and Grant Intelligence tables, each referencing shared geography and using separate authorization boundaries.

Proposed new shared tables:
geo_areas (area_id UUID PK; grain, code system, authoritative text code, name, authority, boundary vintage, effective dates).
geo_area_relationships (relationship_id UUID PK; from_area_id/to_area_id FKs; relation type, authority, evidence, effective dates).
lodestone_record_geographies (assignment_id UUID PK; record_id TEXT FK to lodestone_records.record_id; area_id UUID FK; observation/coverage/associated role; assignment method and provenance; review status).

This follows the existing lodestone_record_dimensions bridge pattern. Geographic identity is not a semantic dimension label; it needs code authority, temporal versioning and cross-grain relationships. Do not create one table per geographic grain. Keep FIPS and other codes as TEXT.

## Proposed relationship direction
lodestone_sources 1 -> many lodestone_records.
lodestone_records 1 -> many lodestone_record_dimensions -> lodestone_dimensions.
lodestone_records 1 -> many lodestone_record_geographies -> geo_areas.
geo_areas <-> geo_areas via geo_area_relationships.
Future Wayfinder scan target, site, organization and project records may reference geo_areas through role-specific location associations. Future Grant Intelligence organizations, service areas, funders, opportunities and eligible project geographies may reference geo_areas; geographic match does not itself establish legal eligibility.

## Specific compatibility and design review
- Existing lodestone_records.record_id is TEXT; geographic assignment FK must be TEXT, not UUID.
- Existing dimension IDs are TEXT; geographic area UUID IDs are new internal identifiers, not replacements for Census GEOIDs.
- Avoid coupling grant/funder source records to source_registry: it currently serves research-source monitoring and is distinct from lodestone_sources.
- Existing SRC-013 SAM.gov Assistance Listings and SRC-014 Grants.gov opportunities are source-faithful evidence; any future grant domain model should link to them rather than duplicate provenance.
- Geography must distinguish observation grain, geographic coverage, organization headquarters, service area, Wayfinder scan location, project location, and grant eligibility.
- County FIPS in a tract payload is not proof of county observation grain.
- Postal ZIP and Census ZCTA are not interchangeable; economic regions may overlap.
- Boundary vintage is part of area identity. Region memberships and area relationships must have evidence and time semantics.
- RLS enabled without policies is deny-by-default for ordinary API roles; product access must be designed independently, with tenant isolation for customer profiles/scans.
- The previously drafted geo_area_relationships unique constraint with nullable effective_from is insufficient to prevent duplicates; require nonnull effective_from or use NULLS NOT DISTINCT as supported.
- Geographic relationship direction and duplicate canonicalization should be validated before migrations.
- Preserve current source ingest and semantic classification jobs unchanged.

## Guidance to Wayfinder student team
Do not create an independent county/place/ZIP master or duplicate Lodestone geographic IDs. Model website, scan, organization and scan findings as Wayfinder-owned entities. For location, specify a proposed association to shared geo_areas.area_id with location role (headquarters, service area, scan target, project site), source, confidence and effective date. Retain original address or user-provided location as evidence. Do not treat a website domain as an organization identity or a scan's location as the organization's entire service area. The geo_areas contract is proposed, not yet deployed; include it as an integration dependency and bring your schema for review before any writes.

## Next approval gates
1. Review student Wayfinder proposal against this interface.
2. Audit all 22 source-specific geographic mappings, especially tract, place, facility, region and national grant records.
3. Review minimal DDL and temporal uniqueness semantics, indexing and RLS policies.
4. Test Silverton place 0870580 / San Juan County 08111 retrieval in a disposable environment.
5. Approve and stage geographic foundation before any production deployment.
