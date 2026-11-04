import test from "node:test";
import assert from "node:assert/strict";
import {buildAirtableProvisioningPlan} from "../src/v2/airtable-provisioning.mjs";
import {normalizeGrant,validateAgentPatch,REVIEW_STATUSES} from "../src/v2/normalize.mjs";

test("portable contract provisions four collections and 84 fields with review options",()=>{
 const p=buildAirtableProvisioningPlan({workspaceId:"test-workspace",baseName:"Test"});
 assert.equal(p.tables.length,4);
 assert.equal(p.tables.reduce((n,t)=>n+t.fields.length,0),84);
 const grants=p.tables.find(t=>t.collection==="grants");
 assert.deepEqual(grants.fields.find(f=>f.name==="review_status").options.choices.map(x=>x.name),REVIEW_STATUSES);
});
test("review defaults to research and rejects unsupported value",()=>{
 const base={grant_id:"test-1",title:"Test"};
 assert.equal(normalizeGrant(base).value.review_status,"Needs Research");
 assert.equal(normalizeGrant({...base,review_status:"Pending Review"}).ok,true);
 assert.equal(normalizeGrant({...base,review_status:"Auto Approved"}).ok,false);
});
test("agent cannot overwrite a human review decision",()=>{
 assert.equal(validateAgentPatch({grant_id:"1",stage:"possible",review_status:"Approved"},{review_status:"Rejected"}).ok,false);
 assert.equal(validateAgentPatch({grant_id:"1",stage:"possible",review_status:"Approved"},{fit_score:18}).ok,true);
});
