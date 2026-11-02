import test from "node:test";
import assert from "node:assert/strict";
import { normalizeGrant, normalizeProfile, duplicateKey, validateAgentPatch } from "../src/v2/normalize.mjs";

const grant={grant_id:"grant-1",title:" Rural opportunity ",source_url:"https://example.org/grant",eligibility_status:"unknown",readiness_status:"unknown",stage:"possible"};
test("unknown eligibility and low fit remain valid",()=>{const r=normalizeGrant({...grant,fit_score:1});assert.equal(r.ok,true);assert.equal(r.value.eligibility_status,"unknown");assert.equal(r.value.fit_score,1);});
test("ineligible classification requires rationale",()=>assert.equal(normalizeGrant({...grant,eligibility_status:"ineligible"}).ok,false));
test("invalid date and inverted award band fail",()=>assert.equal(normalizeGrant({...grant,deadline:"2026-02-30",award_min:100,award_max:50,currency:"USD"}).ok,false));
test("unverified leads may omit URL",()=>assert.equal(normalizeGrant({...grant,source_url:null}).ok,true));
test("verified grants require URL",()=>assert.equal(normalizeGrant({...grant,source_url:null,last_verified_at:"2026-11-02T09:00:00Z"}).ok,false));
test("same source identity deduplicates",()=>assert.equal(duplicateKey({source_system:"Federal",source_record_id:"123"}),duplicateKey({source_system:"federal",source_record_id:"123",source_url:"https://other.org"})));
test("different cycles do not deduplicate by URL",()=>assert.notEqual(duplicateKey({source_url:"https://example.org/grant",opportunity_cycle:"2026"}),duplicateKey({source_url:"https://example.org/grant",opportunity_cycle:"2027"})));
test("agent cannot promote grant or overwrite notes",()=>{assert.equal(validateAgentPatch(grant,{stage:"active"}).ok,false);assert.equal(validateAgentPatch(grant,{operator_notes:"changed"}).ok,false);assert.equal(validateAgentPatch(grant,{fit_score:5}).ok,true);});
const profile={profile_id:"p1",profile_name:"Main",organization_name:"Example",headquarters_geography:"CO",issue_areas:["rural"],search_geographies:["CO"],beneficiaries:["farmers"],applicant_type:"501c3",funding_preferences:[{type:"unrestricted"}],programs:[{name:"Digital"}]};
test("profile accepts optional financial information",()=>assert.equal(normalizeProfile(profile).ok,true));
test("federal readiness requires explicit status, not registration",()=>{assert.equal(normalizeProfile({...profile,federal_search_enabled:true}).ok,false);assert.equal(normalizeProfile({...profile,federal_search_enabled:true,sam_registration_status:"unknown",uei_status:"unknown"}).ok,true);});
