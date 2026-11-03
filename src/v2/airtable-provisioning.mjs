// Pure v2 Airtable provisioning plan. No network calls or writes.
export const PROVISIONING_VERSION="2.0.0-draft";
const field=(name,type,extra={})=>({name,type,...extra});
const text=(name)=>field(name,"singleLineText");
const long=(name)=>field(name,"multilineText");
const select=(name,choices)=>field(name,"singleSelect",{options:{choices:choices.map(name=>({name}))}});
const timestamp=(name)=>field(name,"dateTime");
const core=[
 {name:"Organization Profiles",collection:"organization_profile",fields:[
 text("profile_name"),text("profile_id"),text("organization_name"),long("issue_areas"),text("headquarters_geography"),long("search_geographies"),long("beneficiaries"),text("applicant_type"),text("fiscal_sponsor_org_id"),field("federal_search_enabled","checkbox"),text("sam_registration_status"),text("uei_status"),field("founded_year","number"),field("audited_financial_years","number"),field("annual_budget","currency"),text("currency"),long("funding_preferences"),long("other_eligibility_barriers"),long("programs"),field("preferred_award_min","currency"),field("preferred_award_max","currency"),long("extra_search_terms"),field("writing_reference_url","url"),timestamp("updated_at")]},
 {name:"Organizations",collection:"organizations",fields:[
 text("name"),text("organization_id"),field("website_url","url"),text("organization_type"),text("contact_name"),field("contact_email","email"),field("contact_phone","phoneNumber"),field("source_url","url"),long("notes"),timestamp("updated_at")]},
 {name:"Grants",collection:"grants",fields:[
 text("title"),text("grant_id"),text("funder_organization_id"),text("funder_name_observed"),text("source_system"),text("source_record_id"),field("source_url","url"),text("opportunity_cycle"),field("deadline","date"),field("award_min","currency"),field("award_max","currency"),text("currency"),long("eligible_geographies"),long("eligibility_requirements"),select("eligibility_status",["eligible","ineligible","conditional","unknown"]),long("eligibility_reason"),field("restriction_until","date"),field("fit_score","number"),long("fit_rationale"),select("readiness_status",["ready","needs_work","unknown"]),text("search_profile_id"),text("discovery_run_id"),timestamp("discovered_at"),timestamp("last_verified_at"),select("stage",["possible","active","awarded","watchlist","archived"]),long("next_action"),long("operator_notes"),timestamp("updated_at")]},
 {name:"Search Audit",collection:"search_audit",fields:[
 text("audit_label"),text("run_id"),timestamp("started_at"),timestamp("completed_at"),text("profile_id"),text("search_profile_id"),select("mode",["discovery","scoring","maintenance"]),long("queries_run"),long("sources_checked"),field("opportunities_identified","number"),field("opportunities_added","number"),field("opportunities_scored","number"),field("opportunities_deferred","number"),long("triage_details"),long("coverage_summary"),long("stopping_rationale"),long("gaps"),long("next_searches"),long("carried_forward"),long("updated_records"),timestamp("created_at")]}
];
const types={singleLineText:"text",multilineText:"json",url:"text",email:"text",phoneNumber:"text",checkbox:"boolean",number:"number",currency:"number",date:"date",dateTime:"timestamp",singleSelect:"select"};
const jsonFields=new Set(["issue_areas","search_geographies","beneficiaries","funding_preferences","other_eligibility_barriers","programs","extra_search_terms","eligible_geographies","queries_run","sources_checked","triage_details","gaps","next_searches","carried_forward","updated_records"]);
export function buildAirtableProvisioningPlan({workspaceId,baseName}={}){
 if(typeof workspaceId!=="string"||!workspaceId.trim()||typeof baseName!=="string"||!baseName.trim())throw Error("Explicit workspaceId and baseName required");
 const tables=structuredClone(core);
 const codecs=Object.fromEntries(tables.map(t=>[t.collection,Object.fromEntries(t.fields.slice(1).map(f=>[f.name,jsonFields.has(f.name)?"json":f.type==="multilineText"?"text":types[f.type]]))]));
 return {contractVersion:PROVISIONING_VERSION,workspaceId,baseName,tables,codecs,requiresApproval:true};
}
export function inspectProvisionedSchema(plan,schema){
 if(!plan?.tables||!Array.isArray(schema?.tables))throw Error("Plan and metadata tables required");
 const errors=[],collections={};
 for(const expected of plan.tables){
  const found=schema.tables.filter(t=>t.name===expected.name);
  if(found.length!==1){errors.push("Expected exactly one table: "+expected.name);continue;}
  const table=found[0],fields={};
  for(const e of expected.fields){
   const hits=(table.fields||[]).filter(f=>f.name===e.name);
   if(hits.length!==1){errors.push("Missing or duplicate field "+expected.name+"."+e.name);continue;}
   const f=hits[0];if(f.type!==e.type){errors.push("Wrong type "+expected.name+"."+e.name);continue;}
   if(e.type==="singleSelect"){
    const actual=(f.options?.choices||[]).map(c=>c.name),wanted=e.options.choices.map(c=>c.name);
    if(JSON.stringify(actual)!==JSON.stringify(wanted)){errors.push("Wrong choices "+expected.name+"."+e.name);continue;}
   }
   fields[e.name]=f.id;
  }
  collections[expected.collection]={tableId:table.id,fields,codecs:plan.codecs[expected.collection]};
 }
 return {ok:errors.length===0,errors,config:errors.length?null:{baseId:schema.baseId,collections}};
}
