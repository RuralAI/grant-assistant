import test from "node:test";
import assert from "node:assert/strict";
import {buildAirtableProvisioningPlan} from "../src/v2/airtable-provisioning.mjs";
import {installGrantAssistantV2} from "../src/v2/full-install-orchestrator.mjs";
const plan=buildAirtableProvisioningPlan({workspaceId:"test",baseName:"test"});
const sheets={spreadsheetId:"synthetic",sheets:plan.tables.map((t,i)=>({sheetId:i,title:t.name,headers:t.fields.map(f=>f.name)}))};
const airtable={baseId:"appSYNTHETIC",tables:plan.tables.map((t,i)=>({id:"tblSYNTH"+i,name:t.name,fields:t.fields.map((f,j)=>({id:"fldSYNTH"+i+"X"+j,name:f.name,type:f.type,...(f.options?{options:{choices:f.options.choices.map(c=>({name:c.name}))}}:{})}))}))};
for(const [provider,metadata] of [["google_sheets",sheets],["airtable",airtable]]){
 test(provider+" full installation from nonexistent destination with readback and five skills",async()=>{
  let existing=null,creates=0,registrations=0,verifications=0;
  const result=await installGrantAssistantV2({provider,platform:"chatgpt",destination:{id:"synthetic"},inspect:async()=>existing,approveProvision:async()=>true,provision:async()=>{creates++;existing=metadata;return {created:true}},approveSkills:async()=>true,register:async()=>{registrations++;return {installed:true}},verify:async()=>{verifications++;return true}});
  assert.equal(result.status,"INSTALLED");assert.equal(result.provisioned,true);assert.equal(creates,1);assert.equal(registrations,5);assert.equal(verifications,5);assert.equal(Object.values(result.binding.collections).reduce((n,c)=>n+Object.keys(c.fields||c.columns).length,0),84);
 });
 test(provider+" existing destination reconnect does not reprovision",async()=>{
  const result=await installGrantAssistantV2({provider,platform:"claude",destination:{id:"synthetic"},inspect:async()=>metadata,approveSkills:async()=>true,register:async()=>({installed:true}),verify:async()=>true});
  assert.equal(result.status,"INSTALLED");assert.equal(result.provisioned,false);
 });
}
test("provisioning cannot occur without approval",async()=>{
 let creates=0;const result=await installGrantAssistantV2({provider:"google_sheets",platform:"chatgpt",destination:{id:"synthetic"},inspect:async()=>null,approveProvision:async()=>false,provision:async()=>{creates++;return {created:true}}});
 assert.equal(result.status,"BLOCKED");assert.equal(creates,0);
});
test("no skill registration when provider readback is malformed",async()=>{
 let registered=0;const result=await installGrantAssistantV2({provider:"google_sheets",platform:"chatgpt",destination:{id:"synthetic"},inspect:async()=>({spreadsheetId:"x",sheets:[]}),approveSkills:async()=>true,register:async()=>{registered++;return {installed:true}},verify:async()=>true});
 assert.equal(result.phase,"binding");assert.equal(registered,0);
});
test("no skill registration when host lacks import support",async()=>{
 const result=await installGrantAssistantV2({provider:"airtable",platform:"claude",destination:{id:"synthetic"},inspect:async()=>airtable,approveSkills:async()=>true});
 assert.equal(result.status,"BLOCKED");assert.match(result.reason,/no supported/);
});
