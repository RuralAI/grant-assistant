import test from "node:test";
import assert from "node:assert/strict";
import {buildAirtableProvisioningPlan} from "../src/v2/airtable-provisioning.mjs";
import {inspectAirtableInstallation,installAirtableInspectionFirst} from "../src/v2/airtable-install-inspection-first.mjs";
const plan=buildAirtableProvisioningPlan({workspaceId:"wspTEST",baseName:"Grant Assistant v2 - Test"});
const schema={tables:plan.tables.map((t,i)=>({id:"tbl"+i,name:t.name,fields:t.fields.map((f,j)=>({...structuredClone(f),id:"fld"+i+"_"+j}))}))};
const approval={approved:true,workspaceId:plan.workspaceId,baseName:plan.baseName,contractVersion:plan.contractVersion};
test("I01 absent destination is inspectable without writes",async()=>{
 const r=await inspectAirtableInstallation({plan,discovery:{listBases:async()=>[]},transport:{getBaseSchema:async()=>schema}});
 assert.equal(r.status,"absent");
});
test("I02 existing compatible base is reused without creating",async()=>{
 let creates=0;
 const r=await installAirtableInspectionFirst({plan,approval,discovery:{listBases:async()=>[{id:"appExisting",name:plan.baseName}]},transport:{getBaseSchema:async()=>schema,createBase:async()=>{creates++;}}});
 assert.equal(r.status,"existing");assert.equal(creates,0);
});
test("I03 incompatible candidate blocks creation",async()=>{
 let creates=0;
 await assert.rejects(()=>installAirtableInspectionFirst({plan,approval,discovery:{listBases:async()=>[{id:"appExisting",name:plan.baseName}]},transport:{getBaseSchema:async()=>({tables:[]}),createBase:async()=>{creates++;}}}),e=>e.code==="REVIEW");
 assert.equal(creates,0);
});
test("I04 uncertain create never retries automatically",async()=>{
 let creates=0;
 await assert.rejects(()=>installAirtableInspectionFirst({plan,approval,discovery:{listBases:async()=>[]},transport:{createBase:async()=>{creates++;throw Error("timeout")},getBaseSchema:async()=>schema}}),e=>e.code==="RECONCILE");
 assert.equal(creates,1);
});
test("I05 successful create validates returned schema",async()=>{
 const r=await installAirtableInspectionFirst({plan,approval,discovery:{listBases:async()=>[]},transport:{createBase:async()=>({id:"appCreated"}),getBaseSchema:async()=>schema}});
 assert.equal(r.status,"created");assert.equal(r.config.baseId,"appCreated");
});
test("I06 missing approval blocks creation",async()=>{
 let creates=0;
 await assert.rejects(()=>installAirtableInspectionFirst({plan,discovery:{listBases:async()=>[]},transport:{createBase:async()=>{creates++},getBaseSchema:async()=>schema}}),e=>e.code==="AUTH");
 assert.equal(creates,0);
});
