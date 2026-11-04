import test from "node:test";
import assert from "node:assert/strict";
import {INTAKE_QUESTIONS,validateOrganizationIntake,buildOrganizationSeed} from "../src/v2/organization-intake.mjs";
const valid={profile_id:"profile-test",profile_name:"Main",organization_name:"Example Rural Nonprofit",issue_areas:["housing"],search_geographies:["Colorado"],beneficiaries:["rural residents"],applicant_type:"nonprofit",funding_preferences:["grants"],programs:[{name:"Housing",maturity:"pilot"}]};
test("15-question map retains its revisioned length",()=>assert.equal(INTAKE_QUESTIONS.length,15));
test("valid partial intake is reviewable, not automatically written",()=>{
 const result=buildOrganizationSeed(valid);
 assert.equal(result.status,"READY_FOR_REVIEW");
 assert.equal(result.requiresApproval,true);
 assert.equal(result.profile.organization_name,valid.organization_name);
 assert.ok(result.warnings.some(x=>x.includes("budget")));
});
test("missing core discovery attributes block profile seed",()=>{
 const result=buildOrganizationSeed({...valid,issue_areas:[]});
 assert.equal(result.status,"BLOCKED");
 assert.match(result.errors.join(" "),/issue_areas/);
});
test("sponsored applicant cannot omit sponsor identity",()=>{
 const result=validateOrganizationIntake({...valid,fiscal_sponsored:true});
 assert.equal(result.ok,false);
 assert.match(result.errors.join(" "),/fiscal sponsor/);
});
test("federal search missing registrations warns instead of inventing status",()=>{
 const result=validateOrganizationIntake({...valid,federal_search_enabled:true});
 assert.equal(result.ok,true);
 assert.ok(result.warnings.some(x=>x.includes("SAM")));
 assert.ok(result.warnings.some(x=>x.includes("UEI")));
});
test("invalid award range blocks intake",()=>{
 const result=validateOrganizationIntake({...valid,preferred_award_min:50000,preferred_award_max:10000});
 assert.equal(result.ok,false);
});
test("seed emits only portable profile fields, not extra partner/restriction tables",()=>{
 const result=buildOrganizationSeed({...valid,partners:[{name:"Partner"}],restricted_funders:[{name:"Funder"}]});
 assert.equal(result.status,"READY_FOR_REVIEW");
 assert.equal("partners" in result.profile,false);
 assert.equal("restricted_funders" in result.profile,false);
});
