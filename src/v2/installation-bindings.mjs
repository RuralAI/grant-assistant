import {buildAirtableProvisioningPlan,inspectProvisionedSchema} from "./airtable-provisioning.mjs";
import {createHash} from "node:crypto";
const ids={organization_profile:"profile_id",organizations:"organization_id",grants:"grant_id",search_audit:"run_id"};
const hash=x=>createHash("sha256").update(JSON.stringify(x)).digest("hex");
export function bindAirtableInstallation(schema){
 const plan=buildAirtableProvisioningPlan({workspaceId:"binding",baseName:"Grant Assistant v2"});
 const result=inspectProvisionedSchema(plan,schema);
 if(!result.ok)throw Error("Airtable schema mismatch: "+result.errors.join("; "));
 if(!/^app[A-Za-z0-9]+$/.test(schema.baseId||""))throw Error("invalid Airtable base identity");
 const collections={};
 for(const t of plan.tables){
  const bound=result.config.collections[t.collection];
  if(!/^tbl[A-Za-z0-9]+$/.test(bound.tableId)||Object.values(bound.fields).some(v=>!/^fld[A-Za-z0-9]+$/.test(v)))throw Error("invalid Airtable physical IDs");
  collections[t.collection]={tableId:bound.tableId,identity:ids[t.collection],fields:bound.fields,codecs:bound.codecs};
 }
 const payload={provider:"airtable",contractVersion:plan.contractVersion,baseId:schema.baseId,collections};
 return {...payload,schemaFingerprint:hash(payload)};
}
export function bindSheetsInstallation({spreadsheetId,sheets}){
 if(typeof spreadsheetId!=="string"||!spreadsheetId.trim())throw Error("spreadsheet ID required");
 const plan=buildAirtableProvisioningPlan({workspaceId:"binding",baseName:"Grant Assistant v2"});
 if(!Array.isArray(sheets)||sheets.length!==4)throw Error("exactly four Sheets tabs required");
 const collections={};
 for(const t of plan.tables){
  const found=sheets.filter(s=>s.title===t.name);
  if(found.length!==1)throw Error("missing or duplicate sheet "+t.name);
  const sheet=found[0],expected=t.fields.map(f=>f.name);
  if(!Number.isInteger(sheet.sheetId)||sheet.sheetId<0)throw Error("numeric sheet ID required for "+t.name);
  if(JSON.stringify(sheet.headers)!==JSON.stringify(expected))throw Error("header mismatch for "+t.name);
  collections[t.collection]={sheetId:sheet.sheetId,title:t.name,identity:ids[t.collection],columns:Object.fromEntries(expected.map((name,index)=>[name,index])),headers:expected};
 }
 if(new Set(Object.values(collections).map(x=>x.sheetId)).size!==4)throw Error("duplicate Sheets tab IDs");
 const payload={provider:"google_sheets",contractVersion:plan.contractVersion,spreadsheetId,collections};
 return {...payload,schemaFingerprint:hash(payload)};
}
export function assertBindingCurrent(binding,observed){
 const actual=binding?.provider==="airtable"?bindAirtableInstallation(observed):binding?.provider==="google_sheets"?bindSheetsInstallation(observed):null;
 if(!actual||actual.schemaFingerprint!==binding.schemaFingerprint)throw Error("storage binding drift; stop writes and rebind with approval");
 return true;
}
