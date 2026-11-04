import {buildAirtableProvisioningPlan,inspectProvisionedSchema} from "./airtable-provisioning.mjs";
import {bindSheetsInstallation} from "./installation-bindings.mjs";
const legacyNames=new Set(["Grant Master","Donor Master","Our Org Profile","Search Audit Log"]);
const required=new Set(["Organization Profiles","Organizations","Grants","Search Audit"]);
export function classifyInstallation({provider,observed}){
 if(!observed)return {kind:"fresh",action:"create",safeToWrite:false};
 if(!["airtable","google_sheets"].includes(provider))throw Error("unsupported provider");
 const items=provider==="airtable"?observed.tables:observed.sheets;
 if(!Array.isArray(items))return {kind:"unknown",action:"manual_review",safeToWrite:false,reasons:["unreadable destination metadata"]};
 const names=items.map(x=>provider==="airtable"?x.name:x.title);
 if(new Set(names).size!==names.length)return {kind:"unknown",action:"manual_review",safeToWrite:false,reasons:["duplicate collection names"]};
 const legacy=names.filter(x=>legacyNames.has(x));
 const modern=names.filter(x=>required.has(x));
 if(legacy.length&&modern.length)return {kind:"mixed",action:"manual_review",safeToWrite:false,reasons:["legacy and v2 collections coexist"]};
 if(legacy.length)return {kind:"legacy",action:"migration_preview",safeToWrite:false,legacyCollections:legacy,reasons:["legacy master model requires reviewed field-level mapping and record inventory"]};
 if(!modern.length)return {kind:"unknown",action:"manual_review",safeToWrite:false,reasons:["no recognizable Grant Assistant collections"]};
 const plan=buildAirtableProvisioningPlan({workspaceId:"inspection",baseName:"Grant Assistant v2"});
 try{
  if(provider==="airtable"){
   const result=inspectProvisionedSchema(plan,observed);
   if(!result.ok)return {kind:"partial_v2",action:"repair_preview",safeToWrite:false,reasons:result.errors};
  }else bindSheetsInstallation(observed);
  if(modern.length!==4)return {kind:"partial_v2",action:"repair_preview",safeToWrite:false,reasons:["missing v2 collections"]};
  return {kind:"existing_v2",action:"reconnect",safeToWrite:false};
 }catch(e){return {kind:"partial_v2",action:"repair_preview",safeToWrite:false,reasons:[e.message]};}
}
export function previewLegacyMigration({provider,observed}){
 const state=classifyInstallation({provider,observed});
 if(state.kind!=="legacy")throw Error("legacy installation required");
 return {status:"REVIEW_REQUIRED",sourceKind:"legacy",target:"Grant Assistant v2 (four collections, 84 fields)",sourceCollections:state.legacyCollections,strategies:["parallel_v2_with_approved_transfer","in_place_only_after_verified_non_destructive_mapping"],requiresRecordInventory:true,requiresFieldMapping:true,requiresRollbackPlan:true,requiresApproval:true,mutations:0};
}
