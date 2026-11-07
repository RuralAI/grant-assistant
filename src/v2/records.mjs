// Pure validation for four Grant Assistant v2 logical collections.
// No provider IDs, network, storage writes, or clock-dependent behavior.
const isObject = x => x !== null && typeof x === "object" && !Array.isArray(x);
const present = x => x !== null && x !== undefined && x !== "";
const error = (field,reason) => ({field,reason});
function requiredString(x,field,errors) {
  if (typeof x !== "string" || !x.trim()) {errors.push(error(field,"nonempty text required"));return null;}
  return x.trim();
}
function optionalString(x,field,errors) {
  if (!present(x)) return null;
  return requiredString(x,field,errors);
}
function httpUrl(x,field,errors) {
  if (!present(x)) return null;
  if (typeof x !== "string") {errors.push(error(field,"HTTP(S) URL required"));return null;}
  try {const u=new URL(x);if (!["https:","http:"].includes(u.protocol)) throw Error();return u.href;}
  catch {errors.push(error(field,"HTTP(S) URL required"));return null;}
}
function isoDate(x,field,errors) {
  if (!present(x)) return null;
  if (typeof x!=="string" || !/^\d{4}-\d{2}-\d{2}$/.test(x) || !Number.isFinite(Date.parse(x)) || new Date(x).toISOString().slice(0,10)!==x) {errors.push(error(field,"invalid ISO date"));return null;}
  return x;
}
function isoTimestamp(x,field,errors,required=false) {
  if (!present(x)) {if(required)errors.push(error(field,"timestamp required"));return null;}
  if (typeof x!=="string" || !/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(x) || !Number.isFinite(Date.parse(x))) {errors.push(error(field,"invalid timezone timestamp"));return null;}
  return new Date(x).toISOString();
}
function choice(x,field,allowed,errors,required=false) {
  if (!present(x)) {if(required)errors.push(error(field,"required"));return null;}
  if (typeof x!=="string" || !allowed.includes(x)) {errors.push(error(field,"invalid controlled value"));return null;}
  return x;
}
function stringArray(x,field,errors,required=false) {
  if (!present(x)) {if(required)errors.push(error(field,"array required"));return [];}
  if (!Array.isArray(x)||x.some(v=>typeof v!=="string")) {errors.push(error(field,"string array required"));return [];}
  return [...new Set(x.map(v=>v.trim()).filter(Boolean))];
}
function objectsArray(x,field,errors,required=false) {
  if (!present(x)) {if(required)errors.push(error(field,"array required"));return [];}
  if (!Array.isArray(x)||x.some(v=>!isObject(v))) {errors.push(error(field,"object array required"));return [];}
  return x.map(v=>({...v}));
}
function count(x,field,errors) {
  if (!Number.isSafeInteger(x)||x<0) {errors.push(error(field,"nonnegative integer required"));return null;}
  return x;
}
function begin(x) {return isObject(x)?[]:[error("record","object required")];}
function done(errors,value){return {ok:errors.length===0,errors,value:errors.some(e=>e.field==="record")?null:value};}
export const GRANT_ROLES=Object.freeze(["funder","lead_applicant","co_applicant","subrecipient","partner","contractor","vendor","other"]);
export function normalizeOrganization(input) {
  const errors=begin(input);if(errors.length)return done(errors,null);
  const value={
    organization_id:requiredString(input.organization_id,"organization_id",errors),
    name:requiredString(input.name,"name",errors),
    website_url:httpUrl(input.website_url,"website_url",errors),
    organization_type:optionalString(input.organization_type,"organization_type",errors),
    contact_name:optionalString(input.contact_name,"contact_name",errors),
    contact_email:optionalString(input.contact_email,"contact_email",errors),
    contact_phone:optionalString(input.contact_phone,"contact_phone",errors),
    source_url:httpUrl(input.source_url,"source_url",errors),
    notes:optionalString(input.notes,"notes",errors),
    updated_at:isoTimestamp(input.updated_at,"updated_at",errors,true)
  };
  if(value.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.contact_email))errors.push(error("contact_email","invalid email"));
  return done(errors,value);
}
export function normalizeSearchAudit(input) {
  const errors=begin(input);if(errors.length)return done(errors,null);
  const value={
    audit_label:requiredString(input.audit_label,"audit_label",errors),
    run_id:requiredString(input.run_id,"run_id",errors),
    started_at:isoTimestamp(input.started_at,"started_at",errors,true),
    completed_at:isoTimestamp(input.completed_at,"completed_at",errors,true),
    profile_id:requiredString(input.profile_id,"profile_id",errors),
    search_profile_id:optionalString(input.search_profile_id,"search_profile_id",errors),
    mode:choice(input.mode,"mode",["discovery","scoring","maintenance"],errors,true),
    queries_run:stringArray(input.queries_run,"queries_run",errors,true),
    sources_checked:objectsArray(input.sources_checked,"sources_checked",errors,true),
    opportunities_identified:count(input.opportunities_identified,"opportunities_identified",errors),
    opportunities_added:count(input.opportunities_added,"opportunities_added",errors),
    opportunities_scored:count(input.opportunities_scored,"opportunities_scored",errors),
    opportunities_deferred:count(input.opportunities_deferred,"opportunities_deferred",errors),
    triage_details:objectsArray(input.triage_details,"triage_details",errors),
    coverage_summary:requiredString(input.coverage_summary,"coverage_summary",errors),
    stopping_rationale:requiredString(input.stopping_rationale,"stopping_rationale",errors),
    gaps:stringArray(input.gaps,"gaps",errors,true),
    next_searches:stringArray(input.next_searches,"next_searches",errors,true),
    carried_forward:stringArray(input.carried_forward,"carried_forward",errors,true),
    updated_records:objectsArray(input.updated_records,"updated_records",errors),
    created_at:isoTimestamp(input.created_at,"created_at",errors,true)
  };
  if(value.started_at && value.completed_at && value.completed_at<value.started_at)errors.push(error("completed_at","before started_at"));
  if(value.added!==null && value.opportunities_identified!==null && value.opportunities_added>value.opportunities_identified)errors.push(error("opportunities_added","cannot exceed identified"));
  if(value.sources_checked.some(x=>!present(x.source)))errors.push(error("sources_checked","each source needs identity"));
  return done(errors,value);
}
export function normalizeFunderRestriction(input) {
  const errors=begin(input);if(errors.length)return done(errors,null);
  const value={
    restriction_id:requiredString(input.restriction_id,"restriction_id",errors),
    organization_id:requiredString(input.organization_id,"organization_id",errors),
    profile_id:requiredString(input.profile_id,"profile_id",errors),
    reason:requiredString(input.reason,"reason",errors),
    effective_from:isoDate(input.effective_from,"effective_from",errors),
    expires_on:isoDate(input.expires_on,"expires_on",errors),
    evidence_url:httpUrl(input.evidence_url,"evidence_url",errors),
    status:choice(input.status,"status",["active","expired","withdrawn","unknown"],errors,true)
  };
  if(value.effective_from && value.expires_on && value.expires_on<value.effective_from)errors.push(error("expires_on","before effective date"));
  return done(errors,value);
}
export function normalizeOrganizationGrantRole(input) {
  const errors=begin(input);if(errors.length)return done(errors,null);
  const value={
    role_id:requiredString(input.role_id,"role_id",errors),
    organization_id:requiredString(input.organization_id,"organization_id",errors),
    grant_id:requiredString(input.grant_id,"grant_id",errors),
    role:choice(input.role,"role",GRANT_ROLES,errors,true),
    evidence_url:httpUrl(input.evidence_url,"evidence_url",errors),
    valid_from:isoDate(input.valid_from,"valid_from",errors),
    valid_until:isoDate(input.valid_until,"valid_until",errors),
    verification_status:choice(input.verification_status,"verification_status",["verified","unverified","disputed"],errors,true)
  };
  if(value.valid_from && value.valid_until && value.valid_until<value.valid_from)errors.push(error("valid_until","before valid_from"));
  if(value.verification_status==="verified" && !value.evidence_url)errors.push(error("evidence_url","required for verified role"));
  return done(errors,value);
}
