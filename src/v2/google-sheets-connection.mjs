import {buildAirtableProvisioningPlan} from "./airtable-provisioning.mjs";
import {createSheetsRowTransport} from "./google-sheets-row-transport.mjs";
import {createGoogleSheetsHttpClient} from "./google-sheets-http.mjs";
// Bind the existing 83-field logical contract to the four Google worksheets.
// No spreadsheet creation, credential storage, or writes during initialization.
export function createGoogleSheetsV2Connection({spreadsheetId,token,client,authorize}={}){
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
   if(!await authorize({action:"create",collection,fields,context}))throw Error("write not authorized");
   const identity=sheets[collection]?.identityField;
   if(!identity||typeof fields?.[identity]!=="string"||!fields[identity].trim())throw Error("logical identity required");
   const existing=await transport.listRecords({tableId:collection,pageSize:10000});
   if(existing.offset)throw Error("incomplete duplicate scan");
   if(existing.records.some(r=>r.fields[identity]===fields[identity]))throw Error("duplicate logical ID");
   return transport.createRecord({tableId:collection,fields});
  },
  async update(collection,recordId,fields,context){
   if(!await authorize({action:"update",collection,recordId,fields,context}))throw Error("write not authorized");
   return transport.updateRecord({tableId:collection,recordId,fields});
  }
 };
}
