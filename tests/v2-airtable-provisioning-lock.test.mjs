import test from "node:test";
import assert from "node:assert/strict";
import {mkdtemp,rm,mkdir} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {createLocalProvisioningCoordinator} from "../src/v2/airtable-provisioning-lock.mjs";
import {executeExclusiveAirtableProvisioning,provisioningPlanDigest} from "../src/v2/airtable-provisioning-exclusive.mjs";
import {buildAirtableProvisioningPlan} from "../src/v2/airtable-provisioning.mjs";
test("L01 hardened entrypoint rejects absent coordinator before writes",async()=>{
 const plan=buildAirtableProvisioningPlan({workspaceId:"wspTEST",baseName:"Disposable"});
 await assert.rejects(()=>executeExclusiveAirtableProvisioning({plan,approval:{installationId:"one",planDigest:provisioningPlanDigest(plan)}}),e=>e.code==="LOCK_REQUIRED");
});
test("L02 simultaneous same-ID callers cannot enter critical section",async()=>{
 const dir=await mkdtemp(join(tmpdir(),"v2-lock-"));
 try{
  const c=createLocalProvisioningCoordinator({directory:dir});let entered=0,release;
  const hold=new Promise(resolve=>{release=resolve;});
  const first=c.withExclusive("one",async()=>{entered++;await hold;});
  while(!entered)await new Promise(resolve=>setImmediate(resolve));
  await assert.rejects(()=>c.withExclusive("one",async()=>{entered++;}),e=>e.code==="LOCKED");
  assert.equal(entered,1);release();await first;
  await c.withExclusive("one",async()=>{entered++;});assert.equal(entered,2);
 }finally{await rm(dir,{recursive:true,force:true});}
});
test("L03 stale lock fails closed, never auto-removed",async()=>{
 const dir=await mkdtemp(join(tmpdir(),"v2-lock-"));
 try{
  const c=createLocalProvisioningCoordinator({directory:dir});
  let rejectFirst;
  await c.withExclusive("one",async()=>{});
  // Simulate crashed installer by leaving an owned lock directory.
  const {createHash}=await import("node:crypto");
  await mkdir(join(dir,createHash("sha256").update("one").digest("hex")+".lock"));
  await assert.rejects(()=>c.withExclusive("one",async()=>{}),e=>e.code==="LOCKED");
 }finally{await rm(dir,{recursive:true,force:true});}
});
test("L04 separate installation IDs can proceed independently",async()=>{
 const dir=await mkdtemp(join(tmpdir(),"v2-lock-"));
 try{
  const c=createLocalProvisioningCoordinator({directory:dir});
  const r=await Promise.all([c.withExclusive("one",async()=>1),c.withExclusive("two",async()=>2)]);
  assert.deepEqual(r,[1,2]);
 }finally{await rm(dir,{recursive:true,force:true});}
});
