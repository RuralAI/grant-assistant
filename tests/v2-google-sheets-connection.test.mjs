import test from "node:test";
import assert from "node:assert/strict";
import {createGoogleSheetsV2Connection} from "../src/v2/google-sheets-connection.mjs";
const rows=new Map();
const client={
 readRows:async({sheetTitle})=>structuredClone(rows.get(sheetTitle)),
 appendRow:async({sheetTitle,values})=>{const r=rows.get(sheetTitle);r.push(values);return {rowNumber:r.length};},
 updateRow:async({sheetTitle,rowNumber,values})=>{rows.get(sheetTitle)[rowNumber-1]=values;}
};
function setup(authorize=async()=>true){
 const c=createGoogleSheetsV2Connection({spreadsheetId:"test",client,authorize});
 for(const sheet of Object.values(c.sheets))rows.set(sheet.title,[sheet.headers]);
 return c;
}
test("C01 inspects all four v2 collections",async()=>{const c=setup();const result=await c.inspect();assert.equal(result.ok,true);assert.equal(result.collections.length,4);assert.equal(result.collections.reduce((n,x)=>n+x.headers,0),84);});
test("C02 create, duplicate refusal and update",async()=>{const c=setup();const first=await c.create("grants",{grant_id:"g1",title:"Synthetic",stage:"possible"});assert.equal(first.id,"sheet:grants:2");await assert.rejects(()=>c.create("grants",{grant_id:"g1",title:"Duplicate"}),/duplicate/);await c.update("grants",first.id,{grant_id:"g1",stage:"watchlist"},{actor:"operator"});assert.equal((await c.list("grants")).records[0].fields.stage,"watchlist");});
test("C03 refuses writes without authorization",async()=>{const c=setup(async()=>false);await assert.rejects(()=>c.create("grants",{grant_id:"g1"}),/not authorized/);assert.equal((await c.list("grants")).records.length,0);});
test("C04 rejects stale locator and missing logical ID",async()=>{const c=setup();await assert.rejects(()=>c.create("grants",{title:"Missing"}),/identity/);const first=await c.create("grants",{grant_id:"g1"});await c.create("grants",{grant_id:"g2"});const r=rows.get("Grants");[r[1],r[2]]=[r[2],r[1]];await assert.rejects(()=>c.update("grants",first.id,{grant_id:"g1",stage:"watchlist"}),e=>e.code==="CONFLICT");});

test("C05 agent cannot change human review decision or stage",async()=>{const c=setup();const first=await c.create("grants",{grant_id:"g1",title:"Synthetic",review_status:"Needs Research"});await c.update("grants",first.id,{grant_id:"g1",review_status:"Approved"},{actor:"operator"});await assert.rejects(()=>c.update("grants",first.id,{grant_id:"g1",review_status:"Rejected"}),/human-owned/);await assert.rejects(()=>c.update("grants",first.id,{grant_id:"g1",stage:"active"}),/human-owned/);assert.equal((await c.list("grants")).records[0].fields.review_status,"Approved");});
test("C06 agent cannot create approved grants",async()=>{const c=setup();await assert.rejects(()=>c.create("grants",{grant_id:"g1",review_status:"Approved"}),/human review decision/);assert.equal((await c.list("grants")).records.length,0);});
