// Google Sheets v4 transport. Caller owns OAuth token.
export function createGoogleSheetsHttpClient({token,fetchImpl=fetch}={}){
 if(!token)throw Error("OAuth token required");
 const call=async(method,url,body)=>{
  const r=await fetchImpl(url,{method,headers:{Authorization:"Bearer "+token,"Content-Type":"application/json"},...(body?{body:JSON.stringify(body)}:{})});
  if(!r.ok)throw Error("Google Sheets API error "+r.status);
  return r.json();
 };
 const base="https://sheets.googleapis.com/v4/spreadsheets/";
 const path=(id,title,suffix="")=>base+encodeURIComponent(id)+"/values/"+encodeURIComponent("'"+title.replaceAll("'","''")+"'"+suffix);
 return {
  async readRows({spreadsheetId,sheetTitle}){
   const r=await call("GET",path(spreadsheetId,sheetTitle)+"?valueRenderOption=UNFORMATTED_VALUE");
   return r.values||[];
  },
  async appendRow({spreadsheetId,sheetTitle,values}){
   const r=await call("POST",path(spreadsheetId,sheetTitle,"!A:ZZ")+":append?valueInputOption=RAW&insertDataOption=INSERT_ROWS",{values:[values]});
   const match=r.updates?.updatedRange?.match(/![A-Z]+([0-9]+)/);
   if(!match)throw Error("Append outcome uncertain; inspect sheet before retry");
   return {rowNumber:Number(match[1])};
  },
  async updateRow({spreadsheetId,sheetTitle,rowNumber,values}){
   if(!Number.isSafeInteger(rowNumber)||rowNumber<2)throw Error("Invalid row");
   let n=values.length,column="";
   while(n>0){n--;column=String.fromCharCode(65+n%26)+column;n=Math.floor(n/26);}
   return call("PUT",path(spreadsheetId,sheetTitle,"!A"+rowNumber+":"+column+rowNumber)+"?valueInputOption=RAW",{values:[values]});
  }
 };
}
