import test from "node:test";
import assert from "node:assert/strict";
import {buildAirtableProvisioningPlan} from "../src/v2/airtable-provisioning.mjs";
import {bindAirtableInstallation,bindSheetsInstallation} from "../src/v2/installation-bindings.mjs";
import {createAirtableSeedAdapter,createSheetsSeedAdapter} from "../src/v2/organization-seed-adapters.mjs";
const plan=buildAirtableProvisioningPlan({workspaceId:"test",baseName:"test"});
const airtable=bindAirtableInstallation({baseId:"appSYNTHETIC",tables:plan.tables.map((t,i)=>({id:"tblSYNTH"+i,name:t.name,fields:t.fields.map((f,j)=>({id:"fldSYNTH"+i+"X"+j,name:f.name,type:f.type,...(f.options?{options:f.options}:{})}))}))});
const sheets=bindSheetsInstallation({spreadsheetId:"synthetic",sheets:plan.tables.map((t,i)=>({sheetId:i,title:t.name,headers:t.fields.map(f=>f.name)}))});
const profile={profile_id:"profile-test",profile_name:"Main",organization_name:"Synthetic",issue_areas:["housing"],programs:[{name:"Housing"}]};
test("Airtable adapter writes once, independently reads, and does not overwrite",async()=>{
 const records=[];let writes=0;
 const transport={listRecords:async()=>({records}),createRecord:async({fields})=>{writes++;const record={id:"recSYNTH",fields};records.push(record);return record}};
 const adapter=createAirtableSeedAdapter({binding:airtable,transport});
 assert.equal((await adapter.writeSeed({profile})).written,true);
 assert.deepEqual(Object.fromEntries(Object.entries(await adapter.readSeed({profileId:profile.profile_id})).filter(([k])=>k in profile)),profile);
 assert.equal((await adapter.writeSeed({profile})).unchanged,true);
 await assert.rejects(adapter.writeSeed({profile:{...profile,organization_name:"Changed"}}),/differs/);
 assert.equal(writes,1);
});
test("Sheets adapter appends once, independently reads, and blocks changed profile",async()=>{
 const collection=sheets.collections.organization_profile;const rows=[collection.headers];
 let writes=0;
 const client={readRows:async()=>rows,appendRow:async({values})=>{writes++;rows.push(values);return {rowNumber:rows.length}}};
 const adapter=createSheetsSeedAdapter({binding:sheets,client});
 assert.equal((await adapter.writeSeed({profile})).written,true);
 const read=await adapter.readSeed({profileId:profile.profile_id});
 for(const [key,value] of Object.entries(profile))assert.deepEqual(read[key],value);
 assert.equal((await adapter.writeSeed({profile})).unchanged,true);
 await assert.rejects(adapter.writeSeed({profile:{...profile,organization_name:"Changed"}}),/differs/);
 assert.equal(writes,1);
});
test("Sheets adapter blocks drifted headers before writes",async()=>{
 const adapter=createSheetsSeedAdapter({binding:sheets,client:{readRows:async()=>[["wrong"]],appendRow:async()=>{throw Error("must not write")}}});
 await assert.rejects(adapter.writeSeed({profile}),/header drift/);
});
