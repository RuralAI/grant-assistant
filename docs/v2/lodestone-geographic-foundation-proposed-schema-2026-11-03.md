# Lodestone geographic foundation v0.1 — proposed schema
Status: REVIEW ONLY, no deployment. Date: 2026-11-03.
Owner approval required before any Supabase DDL, backfill, or API exposure.

## Architecture
Three discovery-owned tables in existing Lodestone project, leaving ingestion-owned lodestone_records untouched:
- geo_areas: canonical area identity by authority, code system, grain, code and boundary vintage.
- geo_area_relationships: dated containment, overlap or membership assertions.
- lodestone_record_geographies: source-record to area links, with explicit role and provenance.

## Draft PostgreSQL DDL (not executed)
```sql
create table public.geo_areas (
  area_id uuid primary key default gen_random_uuid(),
  grain_type text not null check (grain_type in ('country','state','county','census_place','census_tract','zcta','postal_zip','economic_region')),
  code_system text not null,
  authoritative_code text not null check (length(trim(authoritative_code)) > 0),
  area_name text not null,
  authority text not null,
  boundary_vintage text not null,
  effective_from date,
  effective_to date,
  created_at timestamptz not null default now(),
  check (effective_to is null or effective_from is null or effective_to >= effective_from),
  unique (grain_type, code_system, authoritative_code, boundary_vintage)
);
create index geo_areas_name_idx on public.geo_areas (lower(area_name));

create table public.geo_area_relationships (
  relationship_id uuid primary key default gen_random_uuid(),
  from_area_id uuid not null references public.geo_areas(area_id),
  to_area_id uuid not null references public.geo_areas(area_id),
  relationship_type text not null check (relationship_type in ('contains','overlaps','member_of')),
  relationship_authority text not null,
  evidence_url text,
  effective_from date,
  effective_to date,
  created_at timestamptz not null default now(),
  check (from_area_id <> to_area_id),
  check (effective_to is null or effective_from is null or effective_to >= effective_from),
  unique (from_area_id,to_area_id,relationship_type,relationship_authority,effective_from)
);
create index geo_relationship_to_idx on public.geo_area_relationships(to_area_id,relationship_type);
create index geo_relationship_from_idx on public.geo_area_relationships(from_area_id,relationship_type);

create table public.lodestone_record_geographies (
  assignment_id uuid primary key default gen_random_uuid(),
  record_id text not null references public.lodestone_records(record_id),
  area_id uuid not null references public.geo_areas(area_id),
  geographic_role text not null check (geographic_role in ('observation','coverage','associated')),
  assignment_method text not null,
  evidence_path text,
  evidence_authority text,
  review_status text not null default 'candidate' check (review_status in ('candidate','verified','rejected')),
  created_at timestamptz not null default now(),
  unique (record_id,area_id,geographic_role,assignment_method)
);
create index record_geo_area_idx on public.lodestone_record_geographies(area_id,geographic_role,review_status);
create index record_geo_record_idx on public.lodestone_record_geographies(record_id);

alter table public.geo_areas enable row level security;
alter table public.geo_area_relationships enable row level security;
alter table public.lodestone_record_geographies enable row level security;
```

## Security and deployment
RLS enabled with NO permissive policies by default; do not grant anon/authenticated access until approved. Discovery service identity and approved API access policies require separate design. Shared geographic reference data may later be readable by authorized clients, but source records and private client data must remain independently permissioned. RLS on geography alone does not authorize access to linked lodestone_records. Avoid public SECURITY DEFINER helpers.

## Semantics and caveats
- Keep codes as text, preserving leading zeros.
- Boundary vintage is part of identity; source reference date is not necessarily boundary vintage.
- A county FIPS field on a tract record is a parent association, not proof of county observation grain.
- Postal ZIP and Census ZCTA are distinct; overlap relationships may be partial.
- Economic regions can have many county members and cross administrative boundaries.
- Relationship direction: contains = from contains to; member_of = from is member of to; overlaps symmetric in meaning but stored in a governed canonical direction.
- Null effective_from in unique constraint does not prevent duplicates under ordinary PostgreSQL NULL semantics; use an additional unique index with NULLS NOT DISTINCT after review, or require effective_from for production relationships.
- This v0.1 does not store geometries or overlap weights. Add only when required by real source data and matching tests.
- No automatic statistical aggregation or grant eligibility conclusion from a geographic match.

## Silverton acceptance test
Census Place 0870580 Silverton and San Juan County 08111. FCC SRC-009 contains geography_type Census Place, geography_id 0870580, matched_county_fips ['08111'], relationship authority U.S. Census Bureau 2024 geoinfo geography 157. Retrieve place observations separately from county context, show vintage and provenance, avoid attributing county values to Silverton. Verify candidate/verified filtering and denied access by default.

## Pre-approval review
Validate actual geography code semantics across all 22 source groups; review authority/vintage choices, uniqueness and relationship date constraints; align Wayfinder scan-target and Grant Intelligence eligibility references; test query plans and permissions in a disposable environment before production. This document is a proposed design, not an approved implementation.
