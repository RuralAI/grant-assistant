import test from "node:test";
import assert from "node:assert/strict";
import {buildAirtableProvisioningPlan} from "../src/v2/airtable-provisioning.mjs";
import {classifyInstallation,previewLegacyMigration} from "../src/v2/installation-detection.mjs";
import {installGrantAssistantV2} from "../src/v2/full-install-orchestrator.mjs";
const plan=buildAirtableProvisioningPlan({workspaceId:"test",baseName:"test"});
const sheets={spreadsheetId:"synthetic",sheets:plan.tables.map((t,i)=>({sheetId:i,title:t.name,headers:t.fields.map(f=>f.name)}))};
const intake={profile_id:"profile-synthetic",profile_name:"Main",organization_name:"Synthetic Nonprofit",issue_areas:["housing"],search_geographies:["CO"],beneficiaries:["rural"],applicant_type:"nonprofit",funding_preferences:["grants"],programs:[{name:"pilot",maturity:"pilot"}]};
test("installation states distinguish fresh, existing, partial, legacy and mixed",()=>{
 assert.equal(classifyInstallation({provider:"google_sheets",observed:null}).kind,"fresh");
 assert.equal(classifyInstallation({provider:"google_sheets",observed:sheets}).kind,"existing_v2");
 assert.equal(classifyInstallation({provider:"google_sheets",observed:{...sheets,sheets:sheets.sheets.slice(0,3)}}).kind,"partial_v2");
 assert.equal(classifyInstallation({provider:"google_sheets",observed:{sheets:[{title:"Grant Master"}]}}).kind,"legacy");
 assert.equal(classifyInstallation({provider:"google_sheets",observed:{sheets:[{title:"Grant Master"},sheets.sheets[0]]}}).kind,"mixed");
});
test("legacy preview requires mapping, inventory, rollback and approval without mutation",()=>{
 const p=previewLegacyMigration({provider:"google_sheets",observed:{sheets:[{title:"Grant Master"}]}});
 assert.equal(p.status,"REVIEW_REQUIRED");assert.equal(p.mutations,0);
 assert.equal(p.requiresRecordInventory,true);assert.equal(p.requiresRollbackPlan,true);
});
test("legacy installation blocks before provisioning or registration",async()=>{
 let calls=0;
 const result=await installGrantAssistantV2({provider:"google_sheets",platform:"chatgpt",destination:{id:"test"},inspect:async()=>({sheets:[{title:"Grant Master"}]}),provision:async()=>{calls++;return {created:true}},register:async()=>{calls++;return {installed:true}}});
 assert.equal(result.phase,"migration");assert.equal(calls,0);
});
test("approved seed is written, read back, then five skills are registered",async()=>{
 const steps=[];
 const result=await installGrantAssistantV2({provider:"google_sheets",platform:"chatgpt",destination:{id:"test"},inspect:async()=>sheets,organizationIntake:intake,
  approveSeed:async()=>{steps.push("approve");return true},
  writeSeed:async({profile})=>{steps.push("write");return {written:true}},
  readSeed:async()=>{steps.push("read");return {...intake}},
  approveSkills:async()=>true,register:async()=>{steps.push("register");return {installed:true}},verify:async()=>true});
 assert.equal(result.status,"INSTALLED");assert.equal(result.seeded,true);
 assert.deepEqual(steps.slice(0,3),["approve","write","read"]);assert.equal(steps.filter(x=>x==="register").length,5);
});
test("seed readback mismatch blocks skill registration",async()=>{
 let registered=0;
 const result=await installGrantAssistantV2({provider:"google_sheets",platform:"claude",destination:{id:"test"},inspect:async()=>sheets,organizationIntake:intake,
  approveSeed:async()=>true,writeSeed:async()=>({written:true}),readSeed:async()=>({...intake,organization_name:"Changed"}),
  approveSkills:async()=>true,register:async()=>{registered++;return {installed:true}},verify:async()=>true});
 assert.equal(result.phase,"seed");assert.equal(registered,0);
});
test("no seed approval means no mutation",async()=>{
 let writes=0;
 const result=await installGrantAssistantV2({provider:"google_sheets",platform:"chatgpt",destination:{id:"test"},inspect:async()=>sheets,organizationIntake:intake,approveSeed:async()=>false,writeSeed:async()=>{writes++;return {written:true}}});
 assert.equal(result.phase,"seed");assert.equal(writes,0);
});
