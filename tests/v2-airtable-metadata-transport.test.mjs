import test from "node:test";
import assert from "node:assert/strict";
import {mkdtemp,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {buildAirtableProvisioningPlan} from "../src/v2/airtable-provisioning.mjs";
import {executeAirtableProvisioning} from "../src/v2/airtable-provisioning-executor.mjs";
import {createAirtableMetadataTransport,toAirtableCreationTables} from "../src/v2/airtable-metadata-transport.mjs";
import {createFileProvisioningJournal} from "../src/v2/airtable-provisioning-journal.mjs";
const plan=()=>buildAirtableProvisioningPlan({workspaceId:"wspTEST",baseName:"Disposable v2"});
const approval=p=>({approved:true,workspaceId:p.workspaceId,baseName:p.baseName,contractVersion:p.contractVersion,installationId:"install-test"});
test("T01 official endpoint, authorization and four-table payload",async()=>{
 const p=plan(),calls=[];
 const fetchImpl=async(url,init)=>{calls.push({url,init});return {ok:true,json:async()=>({id:"appTEST"})};};
 const t=createAirtableMetadataTransport({token:"secret",fetchImpl});
 await t.createBase({workspaceId:p.workspaceId,name:p.baseName,tables:p.tables});
 assert.equal(calls.length,1);assert.equal(calls[0].url,"https://api.airtable.com/v0/meta/bases");
 assert.equal(calls[0].init.headers.Authorization,"Bearer secret");
 const payload=JSON.parse(calls[0].init.body);assert.equal(payload.tables.length,4);
 assert.equal(payload.tables[2].fields.find(f=>f.name==="award_min").options.symbol,"$");
 assert.equal(payload.tables[2].fields.find(f=>f.name==="stage").options.choices.length,5);
});
test("T02 uncertain POST never retries",async()=>{
 let calls=0;const t=createAirtableMetadataTransport({token:"secret",fetchImpl:async()=>{calls++;throw Error("timeout");}});
 await assert.rejects(()=>t.createBase({workspaceId:"wspTEST",name:"x",tables:plan().tables}),e=>e.code==="AMBIGUOUS_CREATE");
 assert.equal(calls,1);
});
test("T03 rejects unofficial API root and malformed plan",()=>{
 assert.throws(()=>createAirtableMetadataTransport({token:"secret",apiRoot:"https://example.com"}),e=>e.code==="CONFIG");
 assert.throws(()=>toAirtableCreationTables([]),e=>e.code==="PLAN");
});
test("T04 durable journal survives recreation and prevents duplicate base",async()=>{
 const dir=await mkdtemp(join(tmpdir(),"grant-v2-"));
 try{
  const p=plan();let creates=0;
  const transport={createBase:async()=>{creates++;return {id:"appTEST"};},getBaseSchema:async()=>({tables:p.tables.map((t,i)=>({id:"tbl"+i,name:t.name,fields:t.fields.map((f,j)=>({...structuredClone(f),id:"fld"+i+"_"+j}))}))})};
  const args={plan:p,approval:approval(p),transport};
  const first=await executeAirtableProvisioning({...args,journal:createFileProvisioningJournal({directory:dir})});
  assert.equal(first.status,"complete");
  const second=await executeAirtableProvisioning({...args,journal:createFileProvisioningJournal({directory:dir})});
  assert.equal(second.reused,true);assert.equal(creates,1);
 }finally{await rm(dir,{recursive:true,force:true});}
});
test("T05 persisted pending state blocks uncertain retry after restart",async()=>{
 const dir=await mkdtemp(join(tmpdir(),"grant-v2-"));
 try{
  const p=plan(),journal=createFileProvisioningJournal({directory:dir});
  await journal.save("install-test",{installationId:"install-test",workspaceId:p.workspaceId,baseName:p.baseName,contractVersion:p.contractVersion,status:"create_pending"});
  await assert.rejects(()=>executeAirtableProvisioning({plan:p,approval:approval(p),journal:createFileProvisioningJournal({directory:dir}),transport:{createBase:async()=>{throw Error("must not create");},getBaseSchema:async()=>({})}}),e=>e.code==="RECONCILE");
 }finally{await rm(dir,{recursive:true,force:true});}
});
