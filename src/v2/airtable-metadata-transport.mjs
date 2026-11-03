// Airtable metadata transport for controlled v2 provisioning.
// No automatic retries for POST: a network failure may have created the base.
export class AirtableMetadataError extends Error {
 constructor(code,message,status){super(message);this.name="AirtableMetadataError";this.code=code;this.status=status;}
}
const requiredOptions={
 number:{precision:0},currency:{precision:2,symbol:"$"},
 date:{dateFormat:{name:"iso"}},
 dateTime:{dateFormat:{name:"iso"},timeFormat:{name:"24hour"},timeZone:"utc"},
 checkbox:{icon:"check",color:"greenBright"}
};
export function toAirtableCreationTables(tables){
 if(!Array.isArray(tables)||tables.length!==4)throw new AirtableMetadataError("PLAN","four tables required");
 return tables.map(t=>({name:t.name,fields:t.fields.map((f,i)=>{
  const out={name:f.name,type:f.type};
  if(i===0&&f.type!=="singleLineText")throw new AirtableMetadataError("PLAN","primary field must be text");
  if(f.options)out.options=structuredClone(f.options);
  else if(requiredOptions[f.type])out.options=structuredClone(requiredOptions[f.type]);
  return out;
 })}));
}
export function createAirtableMetadataTransport({token,fetchImpl=fetch,apiRoot="https://api.airtable.com/v0/meta"}={}){
 if(typeof token!=="string"||!token.trim())throw new AirtableMetadataError("CONFIG","token required");
 if(apiRoot!=="https://api.airtable.com/v0/meta")throw new AirtableMetadataError("CONFIG","official metadata API required");
 const request=async(method,path,body)=>{
  let response;
  try{response=await fetchImpl(apiRoot+path,{method,headers:{Authorization:"Bearer "+token,"Content-Type":"application/json"},...(body?{body:JSON.stringify(body)}:{})});}
  catch(e){throw new AirtableMetadataError(method==="POST"?"AMBIGUOUS_CREATE":"NETWORK","metadata request outcome uncertain");}
  if(!response?.ok)throw new AirtableMetadataError(method==="POST"&&[429,500,502,503,504].includes(response.status)?"AMBIGUOUS_CREATE":"HTTP","metadata request failed",response?.status);
  try{return await response.json();}catch{throw new AirtableMetadataError(method==="POST"?"AMBIGUOUS_CREATE":"RESPONSE","invalid metadata response");}
 };
 return {
  listBases:async()=>{\n   const bases=[];let offset;const seen=new Set();\n   do{\n    const page=await request("GET","/bases"+(offset?"?offset="+encodeURIComponent(offset):""));\n    if(!Array.isArray(page.bases))throw new AirtableMetadataError("DISCOVERY","invalid bases listing");\n    bases.push(...page.bases);\n    offset=page.offset;\n    if(offset){if(seen.has(offset))throw new AirtableMetadataError("DISCOVERY","pagination loop");seen.add(offset);}\n   }while(offset);\n   return bases;\n  },\n  createBase:({workspaceId,name,tables})=>request("POST","/bases",{workspaceId,name,tables:toAirtableCreationTables(tables)}),
  getBaseSchema:({baseId})=>request("GET","/bases/"+encodeURIComponent(baseId)+"/tables")
 };
}
