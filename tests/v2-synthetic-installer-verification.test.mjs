import test from "node:test";
import assert from "node:assert/strict";
import {buildAirtableProvisioningPlan} from "../src/v2/airtable-provisioning.mjs";
import {bindSheetsInstallation,assertBindingCurrent} from "../src/v2/installation-bindings.mjs";
import {generateOperatingSkills,verifyOperatingSkills} from "../src/v2/operating-skill-generator.mjs";
import {prepareSkillInstallation} from "../src/v2/skill-registration.mjs";
const plan=buildAirtableProvisioningPlan({workspaceId:"synthetic",baseName:"Synthetic"});
const observed={spreadsheetId:"synthetic-spreadsheet",sheets:plan.tables.map((t,i)=>({sheetId:i,title:t.name,headers:t.fields.map(f=>f.name)}))};
test("synthetic installer verifies schema, five skills, authorization and discovery",async()=>{
 const binding=bindSheetsInstallation(observed);
 assertBindingCurrent(binding,observed);
 const generated=generateOperatingSkills(binding);
 assert.equal(verifyOperatingSkills(generated),true);
 const expected={
 "grant-prospect-scan":["nine configurable discovery lanes","Tier 2","partner pathway"],
 "grant-scoring":["funding type first","effort estimate","downgrade"],
 "grant-storage-write":["operator-owned","Organizations first","95-field production map"],
 "grant-writing":["human pursuit authorization","claims inventory","existing draft"],
 "grant-audit-log":["triaged versus scored","maintenance","skipped lanes"]
 };
 for(const [name,fragments] of Object.entries(expected)){
  const body=generated.files["skills/"+name+"/SKILL.md"];
  for(const fragment of fragments)assert.ok(body.includes(fragment),name+" missing "+fragment);
 }
 let registered=0,verified=0;
 const result=await prepareSkillInstallation({binding,observedSchema:observed,platform:"chatgpt",approve:async()=>true,register:async()=>{registered++;return {installed:true}},verify:async()=>{verified++;return true}});
 assert.equal(result.status,"INSTALLED");assert.equal(registered,5);assert.equal(verified,5);
 const drift=structuredClone(observed);drift.sheets[0].headers.reverse();
 assert.throws(()=>assertBindingCurrent(binding,drift),/header mismatch/);
});
