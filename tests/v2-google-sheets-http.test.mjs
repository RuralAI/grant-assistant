import test from "node:test";
import assert from "node:assert/strict";
import {createGoogleSheetsHttpClient} from "../src/v2/google-sheets-http.mjs";
test("H01 reads and appends using Google Sheets values API",async()=>{
 const calls=[];
 const fetchImpl=async(url,options)=>{calls.push({url,options});return {ok:true,json:async()=>calls.length===1?{values:[["grant_id"],["g1"]]}:{updates:{updatedRange:"'Grants'!A3:A3"}}};};
 const c=createGoogleSheetsHttpClient({token:"test",fetchImpl});
 assert.equal((await c.readRows({spreadsheetId:"s1",sheetTitle:"Grants"}))[1][0],"g1");
 assert.equal((await c.appendRow({spreadsheetId:"s1",sheetTitle:"Grants",values:["g2"]})).rowNumber,3);
 assert.match(calls[1].url,/append/);
 assert.equal(calls[1].options.method,"POST");
});
test("H02 update targets one row and uses RAW",async()=>{
 let url;
 const c=createGoogleSheetsHttpClient({token:"test",fetchImpl:async(u)=>{url=u;return {ok:true,json:async()=>({})};}});
 await c.updateRow({spreadsheetId:"s1",sheetTitle:"Grants",rowNumber:3,values:["g2","Grant"]});
 assert.match(url,/valueInputOption=RAW/);assert.match(decodeURIComponent(url),/A3:B3/);
});
test("H03 ambiguous append fails closed",async()=>{
 const c=createGoogleSheetsHttpClient({token:"test",fetchImpl:async()=>({ok:true,json:async()=>({})})});
 await assert.rejects(()=>c.appendRow({spreadsheetId:"s1",sheetTitle:"Grants",values:["g1"]}),/uncertain/);
});
