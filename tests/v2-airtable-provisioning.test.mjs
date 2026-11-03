import test from "node:test";
import assert from "node:assert/strict";
import {buildAirtableProvisioningPlan,inspectProvisionedSchema} from "../src/v2/airtable-provisioning.mjs";
const make=()=>buildAirtableProvisioningPlan({workspaceId:"wspTEST",baseName:"Grant Assistant v2 Test"});
const metadata=p=>({baseId:"appTEST",tables:p.tables.map((t,i)=>({id:"tbl"+i,name:t.name,fields:t.fields.map((f,j)=>({id:"fld"+i+"_"+j,...structuredClone(f)}))}))});
test("P01 four core tables, portable UUID fields, typed required fields",()=>{
 const p=make();assert.equal(p.tables.length,4);assert.deepEqual(p.tables.map(t=>t.collection),["organization_profile","organizations","grants","search_audit"]);
 for(const [collection,id] of [["organization_profile","profile_id"],["organizations","organization_id"],["grants","grant_id"],["search_audit","run_id"]])assert.equal(p.tables.find(t=>t.collection===collection).fields.find(f=>f.name===id).type,"singleLineText");
 const r=inspectProvisionedSchema(p,metadata(p));assert.equal(r.ok,true);assert.equal(r.config.collections.grants.codecs.eligible_geographies,"json");assert.equal(r.config.collections.grants.fields.grant_id,"fld2_1");
});
test("P02 plan is deterministic, requires explicit destination, does not create anything",()=>{
 assert.deepEqual(make(),make());assert.equal(make().requiresApproval,true);
 assert.throws(()=>buildAirtableProvisioningPlan({workspaceId:"wspTEST"}),/Explicit/);
 assert.throws(()=>buildAirtableProvisioningPlan({baseName:"Test"}),/Explicit/);
});
test("P03 missing field, wrong type, changed select choices fail closed",()=>{
 const p=make();
 const missing=metadata(p);missing.tables[2].fields=missing.tables[2].fields.filter(f=>f.name!=="grant_id");
 assert.equal(inspectProvisionedSchema(p,missing).ok,false);
 const wrong=metadata(p);wrong.tables[2].fields.find(f=>f.name==="deadline").type="singleLineText";
 assert.match(inspectProvisionedSchema(p,wrong).errors.join(" "),/Wrong type/);
 const choices=metadata(p);choices.tables[2].fields.find(f=>f.name==="stage").options.choices.pop();
 assert.match(inspectProvisionedSchema(p,choices).errors.join(" "),/Wrong choices/);
});
test("P04 missing or duplicate tables fail closed",()=>{
 const p=make(),m=metadata(p);m.tables.push(structuredClone(m.tables[0]));
 assert.equal(inspectProvisionedSchema(p,m).ok,false);
});
test("P05 no shared mutable state across plans",()=>{
 const a=make(),b=make();a.tables[0].fields[0].name="altered";
 assert.equal(b.tables[0].fields[0].name,"profile_name");
});
