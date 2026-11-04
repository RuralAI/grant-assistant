import test from "node:test";
import assert from "node:assert/strict";
import {buildAirtableProvisioningPlan} from "../src/v2/airtable-provisioning.mjs";
import {bindSheetsInstallation} from "../src/v2/installation-bindings.mjs";
import {prepareSkillInstallation} from "../src/v2/skill-registration.mjs";

const plan=buildAirtableProvisioningPlan({workspaceId:"synthetic",baseName:"Synthetic"});
const observedSchema={spreadsheetId:"synthetic-spreadsheet",sheets:plan.tables.map((t,i)=>({sheetId:i,title:t.name,headers:t.fields.map(f=>f.name)}))};
const binding=bindSheetsInstallation(observedSchema);
const base={binding,observedSchema,platform:"chatgpt"};

test("registration refuses absent explicit approval without invoking provider callbacks",async()=>{
 let calls=0;
 const result=await prepareSkillInstallation({...base,approve:async()=>false,register:async()=>{calls++;return {installed:true}},verify:async()=>{calls++;return true}});
 assert.equal(result.status,"BLOCKED");
 assert.match(result.reason,/approval/);
 assert.equal(calls,0);
});

test("registration refuses absent real host registration and discovery callbacks",async()=>{
 const result=await prepareSkillInstallation({...base,approve:async()=>true});
 assert.equal(result.status,"BLOCKED");
 assert.match(result.reason,/no supported platform registration/);
});

test("registration stops when host reports installation failure",async()=>{
 let attempted=0,verified=0;
 const result=await prepareSkillInstallation({...base,approve:async()=>true,register:async()=>{attempted++;return {installed:false}},verify:async()=>{verified++;return true}});
 assert.equal(result.status,"BLOCKED");
 assert.equal(attempted,1);
 assert.equal(verified,0);
 assert.equal(result.registered.length,0);
});

test("registration stops when host cannot discover installed skill",async()=>{
 let attempted=0,verified=0;
 const result=await prepareSkillInstallation({...base,approve:async()=>true,register:async()=>{attempted++;return {installed:true}},verify:async()=>{verified++;return false}});
 assert.equal(result.status,"BLOCKED");
 assert.equal(attempted,1);
 assert.equal(verified,1);
 assert.equal(result.registered.length,0);
});

test("registration rejects unsupported platform before approval",async()=>{
 let approvals=0;
 await assert.rejects(prepareSkillInstallation({...base,platform:"unknown",approve:async()=>{approvals++;return true}}),/unsupported skill platform/);
 assert.equal(approvals,0);
});
