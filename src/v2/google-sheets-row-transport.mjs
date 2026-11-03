// Google Sheets row transport for the existing v2 logical adapter.
// Client methods are injected; no Google credentials, discovery, or writes on import.
// One worksheet per collection, row 1 contains unique logical field headers.
// Physical record IDs are sheet row numbers; logical IDs remain authoritative.
export class SheetsTransportError extends Error {
 constructor(code,message){super(message);this.name="SheetsTransportError";this.code=code;}
}
const fail=(code,message)=>{throw new SheetsTransportError(code,message);};
export function inspectSheetHeaders({headers,requiredFields=[]}={}){
 if(!Array.isArray(headers)||headers.some(h=>typeof h!=="string"||!h.trim()))fail("SCHEMA","nonempty header row required");
 if(new Set(headers).size!==headers.length)fail("SCHEMA","duplicate headers");
 const missing=requiredFields.filter(h=>!headers.includes(h));
 return {ok:missing.length===0,missing,headers:[...headers]};
}
export function createSheetsRowTransport({spreadsheetId,sheets,client}={}){
 if(!spreadsheetId||!sheets||typeof sheets!=="object")fail("CONFIG","spreadsheet and sheet mapping required");
 if(!client||typeof client.readRows!=="function"||typeof client.appendRow!=="function"||typeof client.updateRow!=="function")fail("CONFIG","readRows, appendRow and updateRow required");
 const resolve=(tableId)=>{const sheet=sheets[tableId];if(!sheet||!sheet.title||!Array.isArray(sheet.headers))fail("CONFIG","unknown sheet mapping");inspectSheetHeaders({headers:sheet.headers,requiredFields:sheet.requiredFields||[]});return sheet;};
 const encode=(fields,headers)=>headers.map(h=>fields[h]===undefined||fields[h]===null?"":typeof fields[h]==="object"?JSON.stringify(fields[h]):fields[h]);
 const decode=(values,headers)=>Object.fromEntries(headers.flatMap((h,i)=>values[i]===undefined||values[i]===""?[]:[[h,values[i]]]));
 const physical=(tableId,rowNumber)=>"sheet:"+tableId+":"+rowNumber;
 const parse=(id,tableId)=>{const prefix="sheet:"+tableId+":";if(typeof id!=="string"||!id.startsWith(prefix))fail("IDENTITY","record belongs to different sheet");const n=Number(id.slice(prefix.length));if(!Number.isSafeInteger(n)||n<2)fail("IDENTITY","invalid sheet row");return n;};
 return {
  async listRecords({tableId,offset,pageSize=100}){
   const sheet=resolve(tableId);
   const result=await client.readRows({spreadsheetId,sheetTitle:sheet.title});
   if(!Array.isArray(result)||!Array.isArray(result[0]))fail("TRANSPORT","expected worksheet rows");
   const verdict=inspectSheetHeaders({headers:result[0],requiredFields:sheet.headers});
   if(!verdict.ok)fail("SCHEMA","missing expected headers: "+verdict.missing.join(","));
   const start=offset?Number(offset):1;
   if(!Number.isSafeInteger(start)||start<1)fail("PAGINATION","invalid cursor");
   const records=[];
   for(let i=start;i<Math.min(result.length,start+pageSize);i++){
    const row=result[i];if(!Array.isArray(row)||row.every(v=>v===""||v===null||v===undefined))continue;
    records.push({id:physical(tableId,i+1),fields:decode(row,result[0])});
   }
   const next=start+pageSize<result.length?String(start+pageSize):undefined;
   return {records,...(next?{offset:next}:{})};
  },
  async createRecord({tableId,fields}){
   const sheet=resolve(tableId);
   const result=await client.readRows({spreadsheetId,sheetTitle:sheet.title});
   if(!Array.isArray(result)||!Array.isArray(result[0]))fail("SCHEMA","header row missing");
   if(!inspectSheetHeaders({headers:result[0],requiredFields:sheet.headers}).ok)fail("SCHEMA","headers changed");
   const row=encode(fields,result[0]);
   const response=await client.appendRow({spreadsheetId,sheetTitle:sheet.title,values:row});
   if(!Number.isSafeInteger(response?.rowNumber)||response.rowNumber<2)fail("RECONCILE","append row number not confirmed; inspect before retry");
   return {id:physical(tableId,response.rowNumber),fields};
  },
  async updateRecord({tableId,recordId,fields}){
   const sheet=resolve(tableId),rowNumber=parse(recordId,tableId);
   const rows=await client.readRows({spreadsheetId,sheetTitle:sheet.title});
   if(!Array.isArray(rows?.[0])||!inspectSheetHeaders({headers:rows[0],requiredFields:sheet.headers}).ok)fail("SCHEMA","headers changed");
   if(!Array.isArray(rows[rowNumber-1])||rows[rowNumber-1].every(v=>v===""||v===null||v===undefined))fail("NOT_FOUND","row missing");
   const existing=decode(rows[rowNumber-1],rows[0]);
   const identityField=sheet.identityField;
   if(!identityField||typeof fields[identityField]!=="string"||!fields[identityField].trim())fail("IDENTITY","logical identity required for safe update");
   if(existing[identityField]!==fields[identityField])fail("CONFLICT","row moved or logical identity changed; re-read before update");
   const merged={...existing,...fields};
   await client.updateRow({spreadsheetId,sheetTitle:sheet.title,rowNumber,values:encode(merged,rows[0])});
   return {id:recordId,fields:merged};
  }
 };
}
