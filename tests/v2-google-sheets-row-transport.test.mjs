import test from "node:test";
import assert from "node:assert/strict";
import {createSheetsRowTransport,inspectSheetHeaders} from "../src/v2/google-sheets-row-transport.mjs";
const headers=["grant_id","title","stage","fit_score"];
function fixture(){
 const rows=[headers];let writes=0;
 const client={
  readRows:async()=>structuredClone(rows),
  appendRow:async({values})=>{writes++;rows.push(values);return {rowNumber:rows.length};},
  updateRow:async({rowNumber,values})=>{writes++;rows[rowNumber-1]=values;}
 };
 return {rows,transport:createSheetsRowTransport({spreadsheetId:"test",sheets:{grants:{title:"Grants",headers,identityField:"grant_id",requiredFields:["grant_id","title"]}},client}),get writes(){return writes;}};
}
test("S01 validates headers and rejects duplicates",()=>{assert.equal(inspectSheetHeaders({headers,requiredFields:["grant_id"]}).ok,true);assert.throws(()=>inspectSheetHeaders({headers:["a","a"]}),e=>e.code==="SCHEMA");});
test("S02 creates, lists, updates and preserves unmapped cells",async()=>{const f=fixture();const created=await f.transport.createRecord({tableId:"grants",fields:{grant_id:"g1",title:"Example",stage:"possible",fit_score:2}});assert.equal(created.id,"sheet:grants:2");assert.equal((await f.transport.listRecords({tableId:"grants"})).records[0].fields.grant_id,"g1");await f.transport.updateRecord({tableId:"grants",recordId:created.id,fields:{grant_id:"g1",fit_score:3}});assert.equal(f.rows[1][1],"Example");assert.equal(f.rows[1][3],3);});
test("S03 refuses cross-sheet update and changed headers",async()=>{const f=fixture();await f.transport.createRecord({tableId:"grants",fields:{grant_id:"g1",title:"X"}});await assert.rejects(()=>f.transport.updateRecord({tableId:"grants",recordId:"sheet:other:2",fields:{title:"Y"}}),e=>e.code==="IDENTITY");f.rows[0]=["grant_id","title"];await assert.rejects(()=>f.transport.createRecord({tableId:"grants",fields:{grant_id:"g2"}}),e=>e.code==="SCHEMA");});
test("S04 refuses ambiguous append outcome",async()=>{const transport=createSheetsRowTransport({spreadsheetId:"test",sheets:{grants:{title:"Grants",headers}},client:{readRows:async()=>[headers],appendRow:async()=>({}),updateRow:async()=>{}}});await assert.rejects(()=>transport.createRecord({tableId:"grants",fields:{grant_id:"g1"}}),e=>e.code==="RECONCILE");});

test("S05 refuses stale row locator after row reorder",async()=>{const f=fixture();const first=await f.transport.createRecord({tableId:"grants",fields:{grant_id:"g1",title:"One"}});await f.transport.createRecord({tableId:"grants",fields:{grant_id:"g2",title:"Two"}});[f.rows[1],f.rows[2]]=[f.rows[2],f.rows[1]];await assert.rejects(()=>f.transport.updateRecord({tableId:"grants",recordId:first.id,fields:{grant_id:"g1",title:"Changed"}}),e=>e.code==="CONFLICT");assert.equal(f.rows[1][1],"Two");});
