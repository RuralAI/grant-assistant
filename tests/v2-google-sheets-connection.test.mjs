import test from "node:test";
import assert from "node:assert/strict";
import {createGoogleSheetsV2Connection,validateCompleteSheetsRecord} from "../src/v2/google-sheets-connection.mjs";
const rows=new Map();
const client={
 readRows:async({sheetTitle})=>structuredClone(rows.get(sheetTitle)),
 appendRow:async({sheetTitle,values})=>{const r=rows.get(sheetTitle);r.push(values);return {rowNumber:r.length};},
 updateRow:async({sheetTitle,rowNumber,values})=>{rows.get(sheetTitle)[rowNumber-1]=values;}
};
function setup(authorize=async()=>({actor:"operator"})){
 const c=createGoogleSheetsV2Connection({spreadsheetId:"test",client,authorize});
 for(const sheet of Object.values(c.sheets))rows.set(sheet.title,[sheet.headers]);
 return c;
}
test("C01 inspects all four v2 collections",async()=>{const c=setup();const result=await c.inspect();assert.equal(result.ok,true);assert.equal(result.collections.length,4);assert.equal(result.collections.reduce((n,x)=>n+x.headers,0),84);});
test("C02 create, duplicate refusal and update",async()=>{const c=setup();const first=await c.create("grants",{grant_id:"g1",title:"Synthetic",stage:"possible"});assert.equal(first.id,"sheet:grants:2");await assert.rejects(()=>c.create("grants",{grant_id:"g1",title:"Duplicate"}),/duplicate/);await c.update("grants",first.id,{grant_id:"g1",stage:"watchlist"},{actor:"operator"});assert.equal((await c.list("grants")).records[0].fields.stage,"watchlist");});
test("C03 refuses writes without authorization",async()=>{const c=setup(async()=>false);await assert.rejects(()=>c.create("grants",{grant_id:"g1",title:"Synthetic Grant 1"}),/not authorized/);assert.equal((await c.list("grants")).records.length,0);});
test("C04 rejects stale locator and missing logical ID",async()=>{const c=setup();await assert.rejects(()=>c.create("grants",{title:"Missing"}),/identity/);const first=await c.create("grants",{grant_id:"g1",title:"Synthetic Grant 1"});await c.create("grants",{grant_id:"g2",title:"Synthetic Grant 2"});const r=rows.get("Grants");[r[1],r[2]]=[r[2],r[1]];await assert.rejects(()=>c.update("grants",first.id,{grant_id:"g1",stage:"watchlist"},{actor:"operator"}),e=>e.code==="CONFLICT");});

test("C05 agent cannot change human review decision or stage",async()=>{const c=setup(async({context})=>context?.actor==="operator"?{actor:"operator"}:true);const first=await c.create("grants",{grant_id:"g1",title:"Synthetic",review_status:"Needs Research"});await c.update("grants",first.id,{grant_id:"g1",review_status:"Approved"},{actor:"operator"});await assert.rejects(()=>c.update("grants",first.id,{grant_id:"g1",review_status:"Rejected"}),/human-owned/);await assert.rejects(()=>c.update("grants",first.id,{grant_id:"g1",stage:"active"}),/human-owned/);assert.equal((await c.list("grants")).records[0].fields.review_status,"Approved");});
test("C06 agent cannot create approved grants",async()=>{const c=setup(async()=>true);await assert.rejects(()=>c.create("grants",{grant_id:"g1",review_status:"Approved"}),/human review decision/);assert.equal((await c.list("grants")).records.length,0);});

test("C07 caller actor label does not grant operator authority",async()=>{const c=setup(async()=>true);const first=await c.create("grants",{grant_id:"g1",title:"Synthetic"});await assert.rejects(()=>c.update("grants",first.id,{grant_id:"g1",review_status:"Approved"},{actor:"operator"}),/human-owned/);await assert.rejects(()=>c.create("grants",{grant_id:"g2",review_status:"Approved"},{actor:"operator"}),/human review decision/);});

test("C08 refuses duplicate source identity and canonical URL-cycle",async()=>{
 const c=setup();
 await c.create("grants",{grant_id:"g1",title:"Synthetic Grant One",source_system:"funder-website",source_record_id:"award-2026",source_url:"https://example.org/funding/",opportunity_cycle:"2026"});
 await assert.rejects(()=>c.create("grants",{grant_id:"g2",title:"Synthetic Grant Two",source_system:"funder-website",source_record_id:"award-2026",source_url:"https://other.example/grant"}),/duplicate grant/);
 await assert.rejects(()=>c.create("grants",{grant_id:"g3",title:"Synthetic Grant Three",source_url:"https://example.org/funding",opportunity_cycle:"2026"}),/duplicate grant/);
 await c.create("grants",{grant_id:"g4",title:"Synthetic Grant Four",source_url:"https://example.org/funding",opportunity_cycle:"2027"});
 assert.equal((await c.list("grants")).records.length,2);
});
test("C09 Search Audit is append-only for operator and agent",async()=>{
 const c=setup();
 await c.create("organization_profile",{profile_id:"p-audit-legacy",profile_name:"Audit Profile",organization_name:"Synthetic CRAI",headquarters_geography:"Colorado",applicant_type:"nonprofit",issue_areas:["rural"],search_geographies:["Colorado"],beneficiaries:["communities"]}); const stamp="2026-11-07T12:00:00Z"; const r=await c.create("search_audit",{run_id:"run-1",audit_label:"Synthetic audit",profile_id:"p-audit-legacy",started_at:stamp,completed_at:stamp,created_at:stamp,mode:"discovery",queries_run:["synthetic"],sources_checked:[{source:"https://example.org"}],opportunities_identified:0,opportunities_added:0,opportunities_scored:0,opportunities_deferred:0,coverage_summary:"Test coverage",stopping_rationale:"Complete",gaps:[],next_searches:[],carried_forward:[]});
 await assert.rejects(()=>c.update("search_audit",r.id,{run_id:"run-1"}),/APPEND_ONLY/);
 assert.equal((await c.list("search_audit")).records.length,1);
});

test("C10 Sheets grants default to safe review state and reject invalid controls",async()=>{
 const c=setup();
 const created=await c.create("grants",{grant_id:"safe-1",title:"Synthetic"});
 const found=(await c.list("grants")).records.find(r=>r.id===created.id);
 assert.equal(found.fields.stage,"possible");
 assert.equal(found.fields.review_status,"Needs Research");
 await assert.rejects(()=>c.create("grants",{grant_id:"bad-1",stage:"invented"}),/invalid grant stage/);
 await assert.rejects(()=>c.create("grants",{grant_id:"bad-2",review_status:"Autopproved"}),/invalid grant review_status/);
 await assert.rejects(()=>c.update("grants",created.id,{stage:"invented"}),/invalid grant stage/);
});

test("C11 Sheets refuses unmapped input rather than silently dropping data",async()=>{
 const c=setup();
 await assert.rejects(()=>c.create("grants",{grant_id:"bad",invented_field:"unmapped"}),/unknown or unmapped fields/);
 const first=await c.create("grants",{grant_id:"valid",title:"Synthetic"});
 await assert.rejects(()=>c.update("grants",first.id,{grant_id:"valid",invented_field:"unmapped"}),/unknown or unmapped fields/);
 assert.equal((await c.list("grants")).records.length,1);
});

test("C12 Sheets refuses malformed grant values before writes",async()=>{
 const c=setup();
 await assert.rejects(()=>c.create("grants",{grant_id:"bad-amount",award_min:-2}),/invalid nonnegative numeric field/);
 await assert.rejects(()=>c.create("grants",{grant_id:"bad-date",deadline:"2026-02-30"}),/invalid ISO date/);
 await assert.rejects(()=>c.create("grants",{grant_id:"bad-url",source_url:"javascript:alert(1)"}),/invalid HTTP/);
 await assert.rejects(()=>c.create("grants",{grant_id:"bad-array",eligible_geographies:"Colorado"}),/invalid string array/);
 await assert.rejects(()=>c.create("grants",{grant_id:"bad-band",award_min:200,award_max:100}),/award_max less/);
 const good=await c.create("grants",{grant_id:"good",title:"Synthetic"});
 await assert.rejects(()=>c.update("grants",good.id,{grant_id:"good",fit_score:-1}),/invalid nonnegative numeric field/);
 assert.equal((await c.list("grants")).records.length,1);
});

test("C13 Sheets requires existing referenced profiles and organizations",async()=>{
 const c=setup();
 await assert.rejects(()=>c.create("grants",{grant_id:"g-missing",title:"Synthetic Missing Grant",search_profile_id:"p-missing"}),/missing reference: search_profile_id/);
 await assert.rejects(()=>c.create("grants",{grant_id:"g-missing2",title:"Synthetic Missing Grant Two",funder_organization_id:"o-missing"}),/missing reference: funder_organization_id/);
 await assert.rejects(()=>c.create("search_audit",{run_id:"r-missing",audit_label:"Synthetic Missing Profile",profile_id:"p-missing",started_at:"2026-11-07T12:00:00Z",completed_at:"2026-11-07T12:00:00Z",created_at:"2026-11-07T12:00:00Z",mode:"discovery",queries_run:["synthetic"],sources_checked:[{source:"https://example.org"}],opportunities_identified:0,opportunities_added:0,opportunities_scored:0,opportunities_deferred:0,coverage_summary:"Test coverage",stopping_rationale:"Complete",gaps:[],next_searches:[],carried_forward:[]}),/missing reference: profile_id/);
 await c.create("organization_profile",{profile_id:"p-valid",profile_name:"Synthetic Profile",organization_name:"Synthetic CRAI",headquarters_geography:"Colorado",applicant_type:"nonprofit",issue_areas:["rural"],search_geographies:["Colorado"],beneficiaries:["communities"]});
 await c.create("organizations",{organization_id:"o-valid",name:"Synthetic Organization",updated_at:"2026-11-07T12:00:00Z"});
 await c.create("grants",{grant_id:"g-valid",title:"Synthetic Valid Grant",search_profile_id:"p-valid",funder_organization_id:"o-valid"});
 assert.equal((await c.list("grants")).records.length,1);
});

test("C14 Sheets refuses grant source collision introduced by update",async()=>{
 const c=setup();
 const first=await c.create("grants",{grant_id:"g-one",title:"Synthetic Grant One",source_url:"https://example.org/a",opportunity_cycle:"2026"});
 const second=await c.create("grants",{grant_id:"g-two",title:"Synthetic Grant Two",source_url:"https://example.org/b",opportunity_cycle:"2026"});
 await assert.rejects(()=>c.update("grants",second.id,{grant_id:"g-two",title:"Synthetic Grant Two",source_url:"https://example.org/a"}),/duplicate grant/);
 assert.equal((await c.list("grants")).records.find(r=>r.id===second.id).fields.source_url,"https://example.org/b");
});
test("C15 Sheets rejects missing references on update without changing the row",async()=>{
 const c=setup();
 const first=await c.create("grants",{grant_id:"g-one",title:"Synthetic Grant One"});
 await assert.rejects(()=>c.update("grants",first.id,{grant_id:"g-one",search_profile_id:"missing"}),/missing reference/);
 assert.equal((await c.list("grants")).records[0].fields.search_profile_id,undefined);
});

test("C16 Sheets validates organization URLs and audit counts before writing",async()=>{
 const c=setup();
 await assert.rejects(()=>c.create("organizations",{organization_id:"o-invalid",website_url:"javascript:alert(1)"}),/invalid HTTP/);
 await assert.rejects(()=>c.create("search_audit",{run_id:"r-invalid",opportunities_added:-1}),/invalid nonnegative count/);
 await assert.rejects(()=>c.create("search_audit",{run_id:"r-invalid-time",started_at:"yesterday"}),/invalid timezone timestamp/);
 assert.equal((await c.list("organizations")).records.length,0);
 assert.equal((await c.list("search_audit")).records.length,0);
});

test("C17 Sheets profile fields reject invalid structured and numeric data",async()=>{
 const c=setup();
 await assert.rejects(()=>c.create("organization_profile",{profile_id:"p-bad",issue_areas:"rural"}),/invalid profile string array/);
 await assert.rejects(()=>c.create("organization_profile",{profile_id:"p-bad2",funding_preferences:["invalid"]}),/invalid profile object array/);
 await assert.rejects(()=>c.create("organization_profile",{profile_id:"p-bad3",federal_search_enabled:"true"}),/invalid federal_search_enabled/);
 await assert.rejects(()=>c.create("organization_profile",{profile_id:"p-bad4",founded_year:1700}),/invalid profile integer/);
 await assert.rejects(()=>c.create("organization_profile",{profile_id:"p-bad5",annual_budget:-2}),/invalid profile amount/);
 assert.equal((await c.list("organization_profile")).records.length,0);
});

test("C18 Sheets audit structured fields and source identities fail closed",async()=>{
 const c=setup();
 await assert.rejects(()=>c.create("search_audit",{run_id:"bad-1",queries_run:"not-array"}),/invalid audit string array/);
 await assert.rejects(()=>c.create("search_audit",{run_id:"bad-2",sources_checked:["website"]}),/invalid audit object array/);
 await assert.rejects(()=>c.create("search_audit",{run_id:"bad-3",sources_checked:[{name:"no identity"}]}),/audit source identity required/);
 assert.equal((await c.list("search_audit")).records.length,0);
});

test("C19 complete-record validation enforces required fields for all four collections",()=>{
 for(const [collection,identity] of [["organization_profile","profile_id"],["organizations","organization_id"],["grants","grant_id"],["search_audit","run_id"]]){
  assert.throws(()=>validateCompleteSheetsRecord(collection,{[identity]:"test"}),/VALIDATION:/);
 }
 assert.throws(()=>validateCompleteSheetsRecord("nonexistent",{}),/unknown collection/);
});

test("C20 strict Sheets write mode rejects incomplete records before provider writes",async()=>{
 const c=createGoogleSheetsV2Connection({spreadsheetId:"test",client,authorize:async()=>({actor:"operator"}),strictCompleteRecords:true});
 for(const sheet of Object.values(c.sheets))rows.set(sheet.title,[sheet.headers]);
 for(const [collection,identity] of [["organization_profile","profile_id"],["organizations","organization_id"],["grants","grant_id"],["search_audit","run_id"]]){
  await assert.rejects(()=>c.create(collection,{[identity]:"synthetic"}),/VALIDATION:/);
  assert.equal((await c.list(collection)).records.length,0);
 }
});

test("C21 strict Sheets create accepts complete organization and validates serialized update",async()=>{
 const c=createGoogleSheetsV2Connection({spreadsheetId:"test",client,authorize:async()=>({actor:"operator"}),strictCompleteRecords:true});
 for(const sheet of Object.values(c.sheets))rows.set(sheet.title,[sheet.headers]);
 const first=await c.create("organizations",{organization_id:"org-1",name:"Synthetic Organization",updated_at:"2026-11-07T12:00:00Z"});
 await c.update("organizations",first.id,{organization_id:"org-1",name:"Updated Organization"});
 assert.equal((await c.list("organizations")).records[0].fields.name,"Updated Organization");
 await assert.rejects(()=>c.update("organizations",first.id,{organization_id:"org-1",contact_email:"invalid-email"}),/invalid collection values: contact_email/);
});

test("C22 strict Sheets grants round-trip complete normalized record",async()=>{
 const c=createGoogleSheetsV2Connection({spreadsheetId:"test",client,authorize:async()=>({actor:"operator"}),strictCompleteRecords:true});
 for(const sheet of Object.values(c.sheets))rows.set(sheet.title,[sheet.headers]);
 const created=await c.create("grants",{grant_id:"grant-complete",title:"Synthetic Rural Grant",source_url:"https://example.org/grant",eligible_geographies:["Colorado"],stage:"possible",review_status:"Needs Research"});
 const found=(await c.list("grants")).records.find(r=>r.id===created.id);
 assert.equal(found.fields.title,"Synthetic Rural Grant");
 await c.update("grants",created.id,{grant_id:"grant-complete",title:"Updated Rural Grant"});
 assert.equal((await c.list("grants")).records[0].fields.title,"Updated Rural Grant");
});

test("C23 strict Sheets profile rejects incomplete required context",async()=>{
 const c=createGoogleSheetsV2Connection({spreadsheetId:"test",client,authorize:async()=>({actor:"operator"}),strictCompleteRecords:true});
 for(const sheet of Object.values(c.sheets))rows.set(sheet.title,[sheet.headers]);
 await assert.rejects(()=>c.create("organization_profile",{profile_id:"p-complete",profile_name:"Synthetic",organization_name:"Test Organization"}),/VALIDATION:/);
 assert.equal((await c.list("organization_profile")).records.length,0);
});
test("C24 strict Sheets Search Audit rejects incomplete append and preserves empty journal",async()=>{
 const c=createGoogleSheetsV2Connection({spreadsheetId:"test",client,authorize:async()=>({actor:"operator"}),strictCompleteRecords:true});
 for(const sheet of Object.values(c.sheets))rows.set(sheet.title,[sheet.headers]);
 await assert.rejects(()=>c.create("search_audit",{run_id:"run-complete",audit_label:"Synthetic audit"}),/VALIDATION:/);
 assert.equal((await c.list("search_audit")).records.length,0);
});

test("C25 strict Sheets complete profile create and update",async()=>{
 const c=createGoogleSheetsV2Connection({spreadsheetId:"test",client,authorize:async()=>({actor:"operator"}),strictCompleteRecords:true});
 for(const sheet of Object.values(c.sheets))rows.set(sheet.title,[sheet.headers]);
 const profile={profile_id:"p-strict",profile_name:"Synthetic Profile",organization_name:"Synthetic CRAI",headquarters_geography:"Colorado",applicant_type:"nonprofit",issue_areas:["rural"],search_geographies:["Colorado"],beneficiaries:["rural communities"]};
 const record=await c.create("organization_profile",profile);
 assert.equal((await c.list("organization_profile")).records[0].fields.profile_name,"Synthetic Profile");
 await c.update("organization_profile",record.id,{profile_id:"p-strict",profile_name:"Updated Profile"});
 assert.equal((await c.list("organization_profile")).records[0].fields.profile_name,"Updated Profile");
});
test("C26 strict Sheets complete audit append",async()=>{
 const c=createGoogleSheetsV2Connection({spreadsheetId:"test",client,authorize:async()=>({actor:"operator"}),strictCompleteRecords:true});
 for(const sheet of Object.values(c.sheets))rows.set(sheet.title,[sheet.headers]);
 await c.create("organization_profile",{profile_id:"p-audit",profile_name:"Audit Profile",organization_name:"Synthetic CRAI",headquarters_geography:"Colorado",applicant_type:"nonprofit",issue_areas:["rural"],search_geographies:["Colorado"],beneficiaries:["rural communities"]});
 const stamp="2026-11-07T12:00:00Z";
 await c.create("search_audit",{run_id:"audit-strict",audit_label:"Synthetic Audit",profile_id:"p-audit",started_at:stamp,completed_at:stamp,created_at:stamp,mode:"discovery",queries_run:["rural grants"],sources_checked:[{source:"https://example.org"}],opportunities_identified:0,opportunities_added:0,opportunities_scored:0,opportunities_deferred:0,coverage_summary:"Synthetic coverage",stopping_rationale:"Completed",gaps:[],next_searches:[],carried_forward:[]});
 assert.equal((await c.list("search_audit")).records.length,1);
});

test("C27 strict complete records are default without explicit option",async()=>{
 const c=createGoogleSheetsV2Connection({spreadsheetId:"test",client,authorize:async()=>({actor:"operator"})});
 for(const sheet of Object.values(c.sheets))rows.set(sheet.title,[sheet.headers]);
 await assert.rejects(()=>c.create("organizations",{organization_id:"incomplete"}),/VALIDATION:/);
 assert.equal((await c.list("organizations")).records.length,0);
});
