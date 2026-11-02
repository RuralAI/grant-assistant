// Grant Assistant v2 — dependency-free, storage-neutral validation and normalization.
// Pure functions: no network, persistence, timestamps or provider-specific record IDs.
export const ELIGIBILITY = Object.freeze(["eligible","ineligible","conditional","unknown"]);
export const READINESS = Object.freeze(["ready","needs_work","unknown"]);
export const STAGES = Object.freeze(["possible","active","awarded","watchlist","archived"]);
const has = (v) => v !== undefined && v !== null && v !== "";
const obj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const trim = (v) => typeof v === "string" ? v.trim() : v;
function fail(field, reason) { return { field, reason }; }
function date(value, field, errors) {
  if (!has(value)) return null;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value)) || new Date(value).toISOString().slice(0,10) !== value) {
    errors.push(fail(field,"invalid ISO date")); return null;
  }
  return value;
}
function timestamp(value, field, errors) {
  if (!has(value)) return null;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(value) || Number.isNaN(Date.parse(value))) {
    errors.push(fail(field,"invalid timestamp with timezone")); return null;
  }
  return new Date(value).toISOString();
}
function money(value, field, errors) {
  if (!has(value)) return null;
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) { errors.push(fail(field,"must be nonnegative finite number")); return null; }
  return value;
}
function enumValue(value, allowed, field, errors, fallback) {
  if (!has(value)) return fallback;
  if (typeof value !== "string" || !allowed.includes(value)) { errors.push(fail(field,"invalid controlled value")); return fallback; }
  return value;
}
function list(value, field, errors) {
  if (!has(value)) return [];
  if (!Array.isArray(value) || value.some(v=>typeof v!=="string")) { errors.push(fail(field,"must be string array")); return []; }
  return [...new Set(value.map(v=>v.trim()).filter(Boolean))];
}
function url(value, field, errors) {
  if (!has(value)) return null;
  try { const u=new URL(value); if (!["https:","http:"].includes(u.protocol)) throw Error(); return u.href; }
  catch { errors.push(fail(field,"must be HTTP(S) URL")); return null; }
}
function text(value, field, errors, required=false) {
  if (!has(value)) { if (required) errors.push(fail(field,"required")); return null; }
  if (typeof value !== "string" || !value.trim()) { errors.push(fail(field,"must be nonempty text")); return null; }
  return value.trim();
}
export function normalizeGrant(input) {
  const errors=[];
  if (!obj(input)) return {ok:false,errors:[fail("record","must be object")],value:null};
  const value={
    grant_id:text(input.grant_id,"grant_id",errors,true),
    title:text(input.title,"title",errors,true),
    source_system:text(input.source_system,"source_system",errors),
    source_record_id:text(input.source_record_id,"source_record_id",errors),
    source_url:url(input.source_url,"source_url",errors),
    opportunity_cycle:text(input.opportunity_cycle,"opportunity_cycle",errors),
    funder_organization_id:text(input.funder_organization_id,"funder_organization_id",errors),
    funder_name_observed:text(input.funder_name_observed,"funder_name_observed",errors),
    deadline:date(input.deadline,"deadline",errors),
    award_min:money(input.award_min,"award_min",errors),
    award_max:money(input.award_max,"award_max",errors),
    currency:text(input.currency,"currency",errors),
    eligible_geographies:list(input.eligible_geographies,"eligible_geographies",errors),
    eligibility_requirements:text(input.eligibility_requirements,"eligibility_requirements",errors),
    eligibility_status:enumValue(input.eligibility_status,ELIGIBILITY,"eligibility_status",errors,"unknown"),
    eligibility_reason:text(input.eligibility_reason,"eligibility_reason",errors),
    restriction_until:date(input.restriction_until,"restriction_until",errors),
    fit_score:money(input.fit_score,"fit_score",errors),
    fit_rationale:text(input.fit_rationale,"fit_rationale",errors),
    readiness_status:enumValue(input.readiness_status,READINESS,"readiness_status",errors,"unknown"),
    search_profile_id:text(input.search_profile_id,"search_profile_id",errors),
    discovery_run_id:text(input.discovery_run_id,"discovery_run_id",errors),
    discovered_at:timestamp(input.discovered_at,"discovered_at",errors),
    last_verified_at:timestamp(input.last_verified_at,"last_verified_at",errors),
    stage:enumValue(input.stage,STAGES,"stage",errors,"possible"),
    next_action:text(input.next_action,"next_action",errors),
    operator_notes:text(input.operator_notes,"operator_notes",errors),
    updated_at:timestamp(input.updated_at,"updated_at",errors)
  };
  if (value.award_min!==null && value.award_max!==null && value.award_min>value.award_max) errors.push(fail("award_max","less than minimum"));
  if ((value.award_min!==null || value.award_max!==null) && !value.currency) errors.push(fail("currency","required for award amounts"));
  if (value.eligibility_status==="ineligible" && !value.eligibility_reason) errors.push(fail("eligibility_reason","required for ineligible classification"));
  if (value.last_verified_at && !value.source_url) errors.push(fail("source_url","required for verified opportunity"));
  return {ok:errors.length===0,errors,value};
}
export function normalizeProfile(input) {
  const errors=[];
  if (!obj(input)) return {ok:false,errors:[fail("record","must be object")],value:null};
  const value={
    profile_id:text(input.profile_id,"profile_id",errors,true),
    profile_name:text(input.profile_name,"profile_name",errors,true),
    organization_name:text(input.organization_name,"organization_name",errors,true),
    issue_areas:list(input.issue_areas,"issue_areas",errors),
    headquarters_geography:text(input.headquarters_geography,"headquarters_geography",errors,true),
    search_geographies:list(input.search_geographies,"search_geographies",errors),
    beneficiaries:list(input.beneficiaries,"beneficiaries",errors),
    applicant_type:text(input.applicant_type,"applicant_type",errors,true),
    fiscal_sponsor_org_id:text(input.fiscal_sponsor_org_id,"fiscal_sponsor_org_id",errors),
    federal_search_enabled:input.federal_search_enabled===undefined?null:input.federal_search_enabled,
    sam_registration_status:text(input.sam_registration_status,"sam_registration_status",errors),
    uei_status:text(input.uei_status,"uei_status",errors),
    founded_year:input.founded_year??null,
    audited_financial_years:input.audited_financial_years??null,
    annual_budget:money(input.annual_budget,"annual_budget",errors),
    currency:text(input.currency,"currency",errors),
    funding_preferences:input.funding_preferences??[],
    other_eligibility_barriers:list(input.other_eligibility_barriers,"other_eligibility_barriers",errors),
    programs:input.programs??[],
    preferred_award_min:money(input.preferred_award_min,"preferred_award_min",errors),
    preferred_award_max:money(input.preferred_award_max,"preferred_award_max",errors),
    extra_search_terms:list(input.extra_search_terms,"extra_search_terms",errors),
    writing_reference_url:url(input.writing_reference_url,"writing_reference_url",errors),
    updated_at:timestamp(input.updated_at,"updated_at",errors)
  };
  for (const f of ["issue_areas","search_geographies","beneficiaries"]) if (!value[f].length) errors.push(fail(f,"at least one required"));
  for (const f of ["funding_preferences","programs"]) if (!Array.isArray(value[f]) || value[f].some(v=>!obj(v))) errors.push(fail(f,"must be array of objects"));
  if (value.federal_search_enabled!==null && typeof value.federal_search_enabled!=="boolean") errors.push(fail("federal_search_enabled","must be boolean"));
  if (value.federal_search_enabled===true && (!value.sam_registration_status || !value.uei_status)) errors.push(fail("federal_registration","registration readiness must be recorded; unknown is valid"));
  if (value.founded_year!==null && (!Number.isInteger(value.founded_year)||value.founded_year<1800||value.founded_year>2100)) errors.push(fail("founded_year","invalid year"));
  if (value.audited_financial_years!==null && (!Number.isInteger(value.audited_financial_years)||value.audited_financial_years<0)) errors.push(fail("audited_financial_years","invalid count"));
  if (value.preferred_award_min!==null && value.preferred_award_max!==null && value.preferred_award_min>value.preferred_award_max) errors.push(fail("preferred_award_max","less than minimum"));
  if ((value.annual_budget!==null||value.preferred_award_min!==null||value.preferred_award_max!==null)&&!value.currency) errors.push(fail("currency","required for monetary values"));
  return {ok:errors.length===0,errors,value};
}
export function duplicateKey(grant) {
  if (grant.source_system && grant.source_record_id) return "source:"+grant.source_system.trim().toLowerCase()+":"+grant.source_record_id.trim();
  if (!grant.source_url) return null;
  const u=new URL(grant.source_url);
  u.hash=""; u.hostname=u.hostname.toLowerCase();
  return "url:"+u.href.replace(/\/$/,"")+":cycle:"+(grant.opportunity_cycle||"").trim().toLowerCase();
}
export function validateAgentPatch(existing, patch) {
  const errors=[];
  if (!obj(existing)||!obj(patch)) return {ok:false,errors:[fail("patch","existing and patch must be objects")]};
  for (const field of ["stage","operator_notes","grant_id"]) if (Object.hasOwn(patch,field) && patch[field]!==existing[field]) errors.push(fail(field,"human-owned or immutable"));
  return {ok:errors.length===0,errors};
}
