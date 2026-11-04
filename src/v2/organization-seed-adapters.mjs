// Provider-backed organization profile seeding. Requires a trusted authenticated transport.
// Never overwrite an existing profile implicitly; ambiguous writes require reconciliation.
const encode=(v,codec)=>codec==="json"?JSON.stringify(v):v;
const decode=(v,codec)=>codec==="json"&&typeof v==="string"?JSON.parse(v):v;
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
export function createAirtableSeedAdapter({binding,transport}){
 if(binding?.provider!=="airtable"||!transport)throw Error("Airtable binding and authenticated transport required");
 const table=binding.collections.organization_profile;
 const baseId=binding.baseId,tableId=table.tableId;
 const toLogical=record=>Object.fromEntries(Object.entries(table.fields).filter(([,id])=>(Object.hasOwn(record.fields||{},id)||Object.hasOwn(record.fields||{},key))).map(([key,id])=>[key,decode(record.fields[id]??record.fields[key],table.codecs[key])]));
 const locate=async profileId=>{
  const matches=[];let offset;
  do{
   const page=await transport.listRecords({baseId,tableId,offset});
   for(const record of page.records||[]){
    const logical=toLogical(record);
    if(logical.profile_id===profileId)matches.push({record,logical});
   }
   offset=page.offset;
  }while(offset);
  if(matches.length>1)throw Error("duplicate profile_id; manual reconciliation required");
  return matches[0]||null;
 };
 return {
  async writeSeed({profile}){
   if(!profile?.profile_id)throw Error("profile_id required");
   const prior=await locate(profile.profile_id);
   if(prior){
    if(Object.entries(profile).every(([key,value])=>same(prior.logical[key],value)))return {written:true,unchanged:true};
    throw Error("existing organization profile differs; approval and field-level migration required");
   }
   const fields=Object.fromEntries(Object.entries(profile).map(([key,value])=>{
    if(!table.fields[key])throw Error("unknown profile field: "+key);
    return [table.fields[key],encode(value,table.codecs[key])];
   }));
   const created=await transport.createRecord({baseId,tableId,fields});
   if(!created?.id)throw Error("profile creation unconfirmed; reconcile before retry");
   return {written:true,recordId:created.id};
  },
  async readSeed({profileId}){const found=await locate(profileId);return found?.logical||null;}
 };
}
export function createSheetsSeedAdapter({binding,client}){
 if(binding?.provider!=="google_sheets"||!client)throw Error("Sheets binding and authenticated client required");
 const sheet=binding.collections.organization_profile;
 const locate=async profileId=>{
  const rows=await client.readRows({spreadsheetId:binding.spreadsheetId,sheetTitle:sheet.title});
  if(!same(rows[0],sheet.headers))throw Error("sheet header drift; stop writes");
  const matches=rows.slice(1).map((row,index)=>({row,rowNumber:index+2})).filter(x=>String(x.row[sheet.columns.profile_id]||"")===String(profileId));
  if(matches.length>1)throw Error("duplicate profile_id; manual reconciliation required");
  return matches[0]||null;
 };
 const fromRow=row=>Object.fromEntries(sheet.headers.map((key,i)=>[key,row[i]]).filter(([,value])=>value!==""&&value!==undefined).map(([key,value])=>[key,["issue_areas","search_geographies","beneficiaries","funding_preferences","other_eligibility_barriers","programs","extra_search_terms"].includes(key)&&typeof value==="string"?JSON.parse(value):value]));
 return {
  async writeSeed({profile}){
   if(!profile?.profile_id)throw Error("profile_id required");
   const prior=await locate(profile.profile_id);
   if(prior){
    const logical=fromRow(prior.row);
    if(Object.entries(profile).every(([key,value])=>same(logical[key],value)))return {written:true,unchanged:true};
    throw Error("existing organization profile differs; approval and field-level migration required");
   }
   const values=sheet.headers.map(key=>profile[key]===undefined?"":Array.isArray(profile[key])||typeof profile[key]==="object"&&profile[key]!==null?JSON.stringify(profile[key]):profile[key]);
   const result=await client.appendRow({spreadsheetId:binding.spreadsheetId,sheetTitle:sheet.title,values});
   if(!result?.rowNumber)throw Error("append outcome uncertain; reconcile before retry");
   return {written:true,rowNumber:result.rowNumber};
  },
  async readSeed({profileId}){const found=await locate(profileId);return found?fromRow(found.row):null;}
 };
}
