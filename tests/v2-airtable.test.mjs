import test from "node:test";
import assert from "node:assert/strict";
import {createAirtableAdapter,AdapterError} from "../src/v2/airtable-adapter.mjs";
const baseId="appTEST",tableId="tblTEST";
const mapped=["grant_id","title","source_url","source_system","source_record_id","opportunity_cycle","stage","operator_notes","eligibility_status","readiness_status","fit_score"];
const config={baseId,collections:{grants:{tableId,fields:Object.fromEntries(mapped.map(x=>[x,x])),codecs:Object.fromEntries(mapped.map(x=>[x,x==="fit_score"?"number": "text"]))}}};
const schema={tables:[{id:tableId,fields:mapped.map(x=>({id:x,type:x==="fit_score"?"number":"singleLineText"}))}]};
const authorize=async()=>true;
const grant={grant_id:"g1",title:"Grant",source_url:"https://example.org/g",stage:"possible",eligibility_status:"unknown",readiness_status:"unknown"};
function fixture(seed=[],authorization=authorize){
  let records=structuredClone(seed),writes=0;
  const transport={
    async listRecords(){return {records:structuredClone(records)};},
    async createRecord({fields}){writes++;const id="rec"+(records.length+1);records.push({id,fields});return {id,fields};},
    async updateRecord({recordId,fields}){writes++;const r=records.find(x=>x.id===recordId);Object.assign(r.fields,fields);return {id:recordId,fields:r.fields};}
  };
  return {adapter:createAirtableAdapter({config,transport,schema,authorize:authorization}),get writes(){return writes;},get records(){return records;}};
}
test("creates then idempotently reads by logical ID",async()=>{const f=fixture();assert.equal((await f.adapter.upsert("grants",grant)).action,"created");assert.equal((await f.adapter.upsert("grants",grant)).action,"unchanged");assert.equal(f.writes,1);assert.equal((await f.adapter.get("grants","g1")).title,"Grant");});
test("updates only changed fields",async()=>{const f=fixture();await f.adapter.upsert("grants",grant);const r=await f.adapter.upsert("grants",{grant_id:"g1",fit_score:5});assert.equal(r.action,"updated");assert.equal(f.records[0].fields.fit_score,5);});
test("agent cannot promote existing grant",async()=>{const f=fixture();await f.adapter.upsert("grants",grant);await assert.rejects(()=>f.adapter.upsert("grants",{grant_id:"g1",stage:"active"}),e=>e.code==="HUMAN_FIELD");});
test("agent cannot create promoted grant",async()=>{const f=fixture();await assert.rejects(()=>f.adapter.upsert("grants",{...grant,stage:"awarded"}),e=>e.code==="HUMAN_FIELD");});
test("agent preserves operator notes",async()=>{const f=fixture([{id:"rec1",fields:{...grant,operator_notes:"Do not edit"}}]);await f.adapter.upsert("grants",{grant_id:"g1",fit_score:2});assert.equal(f.records[0].fields.operator_notes,"Do not edit");});
test("same source identity cannot create duplicate logical grant",async()=>{const f=fixture();await f.adapter.upsert("grants",{...grant,source_system:"agency",source_record_id:"123"});await assert.rejects(()=>f.adapter.upsert("grants",{...grant,grant_id:"g2",source_system:"agency",source_record_id:"123"}),e=>e.code==="DUPLICATE");});
test("same URL different cycles allowed",async()=>{const f=fixture();await f.adapter.upsert("grants",{...grant,opportunity_cycle:"2026"});assert.equal((await f.adapter.upsert("grants",{...grant,grant_id:"g2",opportunity_cycle:"2027"})).action,"created");});
test("duplicate logical ID collision blocks writes",async()=>{const f=fixture([{id:"rec1",fields:grant},{id:"rec2",fields:grant}]);await assert.rejects(()=>f.adapter.upsert("grants",grant),e=>e.code==="COLLISION");assert.equal(f.writes,0);});
test("invalid grant blocks writes",async()=>{const f=fixture();await assert.rejects(()=>f.adapter.upsert("grants",{...grant,source_url:"javascript:bad"}),e=>e.code==="VALIDATION");assert.equal(f.writes,0);});
test("operator can promote stage",async()=>{const f=fixture([],async()=>({actor:"operator"}));await f.adapter.upsert("grants",grant);await f.adapter.upsert("grants",{grant_id:"g1",stage:"active"},{actor:"operator"});assert.equal(f.records[0].fields.stage,"active");});
test("pagination reads all pages",async()=>{let n=0;const transport={listRecords:async({offset})=>{n++;return offset?{records:[{id:"rec2",fields:{...grant,grant_id:"g2"}}]}:{records:[{id:"rec1",fields:grant}],offset:"page2"};},createRecord:async()=>{},updateRecord:async()=>{}};const a=createAirtableAdapter({config,transport,schema,authorize});assert.equal((await a.list("grants")).length,2);assert.equal(n,2);});
test("append-only audit prevents update",async()=>{const auditConfig={baseId,collections:{search_audit:{tableId,fields:{run_id:"run_id"},codecs:{run_id:"text"}}}};const transport={listRecords:async()=>({records:[{id:"rec1",fields:{run_id:"run1"}}]}),createRecord:async()=>{},updateRecord:async()=>{throw Error("should not write")}};const a=createAirtableAdapter({config:auditConfig,transport,schema:{tables:[{id:tableId,fields:[{id:"run_id",type:"singleLineText"}]}]},authorize});await assert.rejects(()=>a.upsert("search_audit",{run_id:"run1"}),e=>e.code==="APPEND_ONLY");});

test("caller cannot self-assert operator with boolean authorization",async()=>{const f=fixture();await f.adapter.upsert("grants",grant);await assert.rejects(()=>f.adapter.upsert("grants",{grant_id:"g1",stage:"active"},{actor:"operator"}),e=>e.code==="AUTH");assert.equal(f.records[0].fields.stage,"possible");});

test("ambiguous Airtable create is reconciled by logical ID on retry",async()=>{
 let records=[],writes=0;
 const transport={
  async listRecords(){return {records:structuredClone(records)};},
  async createRecord({fields}){writes++;records.push({id:"rec1",fields});throw Error("network response lost after commit");},
  async updateRecord(){throw Error("unexpected update");}
 };
 const adapter=createAirtableAdapter({config,transport,schema,authorize});
 await assert.rejects(()=>adapter.upsert("grants",grant),/response lost/);
 const retry=await adapter.upsert("grants",grant);
 assert.equal(retry.action,"unchanged");
 assert.equal(writes,1);
 assert.equal(records.length,1);
});
