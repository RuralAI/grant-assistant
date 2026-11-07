import {buildAirtableProvisioningPlan} from "./airtable-provisioning.mjs";
import {createSheetsRowTransport} from "./google-sheets-row-transport.mjs";
import {createGoogleSheetsHttpClient} from "./google-sheets-http.mjs";
import {duplicateKey,validateAgentPatch,normalizeGrant,normalizeProfile} from "./normalize.mjs";
import {normalizeOrganization,normalizeSearchAudit} from "./records.mjs";
function grantUrlCycleKey(grant){
 if(typeof grant.source_url!=="string"||!grant.source_url.trim())return null;
 try{
  const url=new URL(grant.source_url);
  if(!["https:","http:"].includes(url.protocol))return null;
  url.hash="";
  return "url:"+url.href.replace(/\/$/,"")+":cycle:"+String(grant.opportunity_cycle??"").trim().toLowerCase();
 }catch{return null;}
}
const STAGES=new Set(["possible","active","awarded","watchlist","archived"]);
const REVIEWS=new Set(["Pending Review","Approved","Rejected","Needs Research"]);
function assertKnownFields(collection,fields,sheets){
 if(!fields||typeof fields!=="object"||Array.isArray(fields))throw Error("record object required");
 const sheet=sheets[collection];
 if(!sheet)throw Error("unknown collection");
 const allowed=new Set(sheet.headers);
 const unknown=Object.keys(fields).filter(k=>!allowed.has(k));
 if(unknown.length)throw Error("unknown or unmapped fields: "+unknown.join(", "));
}
function validateGrantControls(fields){
 if(fields.stage!==undefined&&!STAGES.has(fields.stage))throw Error("invalid grant stage");
 if(fields.review_status!==undefined&&!REVIEWS.has(fields.review_status))throw Error("invalid grant review_status");
}
function validateGrantValues(fields){
 for(const name of ["award_min","award_max","fit_score"]){
  if(fields[name]!==undefined&&fields[name]!==null&&(typeof fields[name]!=="number"||!Number.isFinite(fields[name])||fields[name]<0))throw Error("invalid nonnegative numeric field: "+name);
 }
 for(const name of ["deadline","restriction_until"]){
  const v=fields[name];
  if(v!==undefined&&v!==null&&(typeof v!=="string"||!/^\\d{4}-\\d{2}-\\d{2}$/.test(v)||Number.isNaN(Date.parse(v))||new Date(v).toISOString().slice(0,10)!==v))throw Error("invalid ISO date: "+name);
 }
 for(const name of ["source_url"]){
  const v=fields[name];
  if(v!==undefined&&v!==null){
   try{const u=new URL(v);if(typeof v!=="string"||!["http:","https:"].includes(u.protocol))throw Error();}
   catch{throw Error("invalid HTTP(S) URL: "+name);}
  }
 }
 for(const name of ["eligible_geographies"]){
  const v=fields[name];
  if(v!==undefined&&v!==null&&(!Array.isArray(v)||v.some(x=>typeof x!=="string")))throw Error("invalid string array: "+name);
 }
 if(fields.award_min!==undefined&&fields.award_max!==undefined&&fields.award_min!==null&&fields.award_max!==null&&fields.award_min>fields.award_max)throw Error("award_max less than award_min");
}
const collectionValidators={organization_profile:normalizeProfile,organizations:normalizeOrganization,grants:normalizeGrant,search_audit:normalizeSearchAudit};
function validateProvidedFields(collection,fields){
 const validator=collectionValidators[collection];
 if(!validator)return;
 const result=validator(fields);
 const failures=result.errors.filter(e=>Object.hasOwn(fields,e.field));
 if(failures.length)throw Error("invalid collection values: "+failures.map(e=>e.field+" "+e.reason).join("; "));
}
export function validateCompleteSheetsRecord(collection,fields){
 const validator=collectionValidators[collection];
 if(!validator)throw Error("unknown collection");
 const result=validator(fields);
 if(!result.ok)throw Error("VALIDATION: "+result.errors.map(e=>e.field+" "+e.reason).join("; "));
 return result.value;
}
function validateProfileValues(fields){
 const arrays=["issue_areas","search_geographies","beneficiaries","other_eligibility_barriers","extra_search_terms"];
 for(const name of arrays){
  const v=fields[name];if(v===undefined||v===null)continue;
  if(!Array.isArray(v)||v.some(x=>typeof x!=="string"))throw Error("invalid profile string array: "+name);
 }
 for(const name of ["funding_preferences","programs"]){
  const v=fields[name];if(v===undefined||v===null)continue;
  if(!Array.isArray(v)||v.some(x=>x===null||typeof x!=="object"||Array.isArray(x)))throw Error("invalid profile object array: "+name);
 }
 if(fields.federal_search_enabled!==undefined&&fields.federal_search_enabled!==null&&typeof fields.federal_search_enabled!=="boolean")throw Error("invalid federal_search_enabled");
 for(const name of ["founded_year","audited_financial_years"]){
  const v=fields[name];if(v===undefined||v===null)continue;
  if(!Number.isSafeInteger(v)||v<0||(name==="founded_year"&&(v<1800||v>2100)))throw Error("invalid profile integer: "+name);
 }
 for(const name of ["annual_budget","preferred_award_min","preferred_award_max"]){
  const v=fields[name];if(v===undefined||v===null)continue;
  if(typeof v!=="number"||!Number.isFinite(v)||v<0)throw Error("invalid profile amount: "+name);
 }
 if(fields.preferred_award_min!==undefined&&fields.preferred_award_max!==undefined&&fields.preferred_award_min>fields.preferred_award_max)throw Error("preferred_award_max less than minimum");
}
function validateSharedValues(collection,fields){
 if(collection==="organization_profile")validateProfileValues(fields);
 const urls=collection==="organizations"?["website_url","source_url"]:collection==="organization_profile"?["website_url"]:collection==="grants"?["source_url","application_url","funder_url"]:[];
 for(const name of urls){
  const v=fields[name];if(v===undefined||v===null||v==="")continue;
  if(typeof v!=="string")throw Error("invalid HTTP(S) URL: "+name);
  try{const u=new URL(v);if(!["http:","https:"].includes(u.protocol))throw Error();}
  catch{throw Error("invalid HTTP(S) URL: "+name);}
 }
 const timestamps=collection==="organizations"?["updated_at"]:collection==="search_audit"?["started_at","completed_at","created_at"]:collection==="organization_profile"?["updated_at"]:[];
 for(const name of timestamps){
  const v=fields[name];if(v===undefined||v===null||v==="")continue;
  if(typeof v!=="string"||!/^\\d{4}-\\d{2}-\\d{2}T.*(?:Z|[+-]\\d{2}:\\d{2})$/.test(v)||!Number.isFinite(Date.parse(v)))throw Error("invalid timezone timestamp: "+name);
 }
 if(collection==="search_audit"){
  for(const name of ["queries_run","gaps","next_searches","carried_forward"]){
   const v=fields[name];if(v===undefined||v===null)continue;
   if(!Array.isArray(v)||v.some(x=>typeof x!=="string"))throw Error("invalid audit string array: "+name);
  }
  for(const name of ["sources_checked","triage_details","updated_records"]){
   const v=fields[name];if(v===undefined||v===null)continue;
   if(!Array.isArray(v)||v.some(x=>x===null||typeof x!=="object"||Array.isArray(x)))throw Error("invalid audit object array: "+name);
  }
  if(Array.isArray(fields.sources_checked)&&fields.sources_checked.some(x=>!x.source))throw Error("audit source identity required");
 }
 if(collection==="search_audit"){
  for(const name of ["opportunities_identified","opportunities_added","opportunities_scored","opportunities_deferred"]){
   const v=fields[name];if(v===undefined||v===null||v==="")continue;
   if(typeof v!=="number"||!Number.isSafeInteger(v)||v<0)throw Error("invalid nonnegative count: "+name);
  }
  if(fields.started_at&&fields.completed_at&&Date.parse(fields.completed_at)<Date.parse(fields.started_at))throw Error("completed_at before started_at");
  if(fields.opportunities_added!==undefined&&fields.opportunities_identified!==undefined&&fields.opportunities_added>fields.opportunities_identified)throw Error("opportunities_added exceeds identified");
 }
}
async function requireReferences(collection,fields,transport){
 const refs=collection==="grants"?[
  ["search_profile_id","organization_profile","profile_id"],
  ["funder_organization_id","organizations","organization_id"]
 ]:collection==="search_audit"?[["profile_id","organization_profile","profile_id"]]:[];
 for(const [field,target,idField] of refs){
  if(!fields[field])continue;
  const page=await transport.listRecords({tableId:target,pageSize:10000});
  if(page.offset)throw Error("incomplete reference scan");
  if(!page.records.some(r=>r.fields[idField]===fields[field]))throw Error("missing reference: "+field);
 }
}
// Bind the existing 84-field logical contract to the four Google worksheets.
// No spreadsheet creation, credential storage, or writes during initialization.
export function createGoogleSheetsV2Connection({spreadsheetId,token,client,authorize,strictCompleteRecords=false}={}){
 if(typeof spreadsheetId!=="string"||!spreadsheetId.trim())throw Error("spreadsheetId required");
 if(typeof authorize!=="function")throw Error("trusted authorization callback required");
 const plan=buildAirtableProvisioningPlan({workspaceId:"google-sheets",baseName:"Grant Assistant v2"});
 const sheets=Object.fromEntries(plan.tables.map(t=>[t.collection,{
  title:t.name,headers:t.fields.map(f=>f.name),
  requiredFields:t.fields.map(f=>f.name),
  identityField:({organization_profile:"profile_id",organizations:"organization_id",grants:"grant_id",search_audit:"run_id"})[t.collection]
 }]));
 const transport=createSheetsRowTransport({spreadsheetId,sheets,client:client||createGoogleSheetsHttpClient({token})});
 return {
  spreadsheetId,sheets,
  async inspect(){
   const details=[];
   for(const [tableId,sheet] of Object.entries(sheets)){
    const page=await transport.listRecords({tableId,pageSize:1});
    details.push({collection:tableId,title:sheet.title,headers:sheets[tableId].headers.length,hasRecords:page.records.length>0});
   }
   return {ok:true,spreadsheetId,collections:details};
  },
  async list(collection){return transport.listRecords({tableId:collection,pageSize:100});},
  async create(collection,fields,context){
   const permission=await authorize({action:"create",collection,fields,context});
   if(!permission)throw Error("write not authorized");
   const operator=permission!==true&&permission?.actor==="operator";
   assertKnownFields(collection,fields,sheets);
   if(collection==="grants"){validateGrantControls(fields);validateGrantValues(fields);}
   validateSharedValues(collection,fields);
   validateProvidedFields(collection,fields);
   const identity=sheets[collection]?.identityField;
   if(!identity||typeof fields?.[identity]!=="string"||!fields[identity].trim())throw Error("logical identity required");
   const existing=await transport.listRecords({tableId:collection,pageSize:10000});
   if(existing.offset)throw Error("incomplete duplicate scan");
   if(existing.records.some(r=>r.fields[identity]===fields[identity]))throw Error("duplicate logical ID");
   if(collection==="grants"){
    const key=duplicateKey(fields);
    const urlKey=grantUrlCycleKey(fields);
    if(existing.records.some(r=>(
      (key!==null&&duplicateKey(r.fields)===key)||
      (urlKey!==null&&grantUrlCycleKey(r.fields)===urlKey)
    )))throw Error("duplicate grant source identity or URL and cycle");
   }
   if(collection==="grants"&&!operator){
    if(fields.stage!==undefined&&fields.stage!=="possible")throw Error("agent cannot promote grant");
    if(fields.review_status!==undefined&&fields.review_status!=="Needs Research")throw Error("agent cannot set human review decision");
    if(fields.operator_notes)throw Error("agent cannot set operator notes");
   }
   const payload=collection==="grants"?{stage:"possible",review_status:"Needs Research",...fields}:fields;
   if(strictCompleteRecords)validateCompleteSheetsRecord(collection,payload);
   await requireReferences(collection,payload,transport);
   return transport.createRecord({tableId:collection,fields:payload});
  },
  async update(collection,recordId,fields,context){
   const permission=await authorize({action:"update",collection,recordId,fields,context});
   if(!permission)throw Error("write not authorized");
   if(collection==="search_audit")throw Error("APPEND_ONLY: search audit cannot be updated");
   assertKnownFields(collection,fields,sheets);
   if(collection==="grants"){validateGrantControls(fields);validateGrantValues(fields);}
   const operator=permission!==true&&permission?.actor==="operator";
   if(collection==="grants"&&!operator){
    const current=await transport.listRecords({tableId:collection,pageSize:10000});
    if(current.offset)throw Error("incomplete grant scan");
    const match=current.records.find(r=>r.id===recordId);
    if(!match)throw Error("grant record not found");
    const gate=validateAgentPatch(match.fields,fields);
    if(!gate.ok)throw Error("human-owned grant fields cannot be changed by agent: "+gate.errors.map(e=>e.field).join(", "));
   }
   const currentRows=await transport.listRecords({tableId:collection,pageSize:10000});
   if(currentRows.offset)throw Error("incomplete update scan");
   const target=currentRows.records.find(r=>r.id===recordId);
   if(!target)throw Error("record not found");
   const merged={...target.fields,...fields};
   if(collection==="grants"){
    validateGrantValues(merged);
    const key=duplicateKey(merged),urlKey=grantUrlCycleKey(merged);
    if(currentRows.records.some(r=>r.id!==recordId&&(
     (key!==null&&duplicateKey(r.fields)===key)||
     (urlKey!==null&&grantUrlCycleKey(r.fields)===urlKey)
    )))throw Error("duplicate grant source identity or URL and cycle");
   }
   validateSharedValues(collection,merged);
   validateProvidedFields(collection,fields);
   if(strictCompleteRecords)validateCompleteSheetsRecord(collection,merged);
   await requireReferences(collection,merged,transport);
   return transport.updateRecord({tableId:collection,recordId,fields});
  }
 };
}
