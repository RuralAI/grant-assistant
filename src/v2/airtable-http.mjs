// Native Airtable REST transport. Injectable fetch for isolated testing.
// Never log credentials; callers must provide an authorized token.
export class AirtableAmbiguousWriteError extends Error {constructor(){super("Write outcome uncertain; reconcile by logical ID before retry");this.name="AirtableAmbiguousWriteError";this.code="AMBIGUOUS_WRITE";}}\nexport class AirtableHttpError extends Error {constructor(status,message){super(message);this.name="AirtableHttpError";this.status=status;}}
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
export function createAirtableHttpTransport({token,fetchImpl=fetch,wait=sleep,maxRetries=3,apiRoot="https://api.airtable.com/v0"}){
  if(typeof token!=="string"||!token.trim())throw Error("Airtable token required");
  if(!/^https:\/\/api\.airtable\.com\/v0$/.test(apiRoot))throw Error("Airtable API root must be official");
  async function request(method,baseId,tableId,{recordId,params,fields}={}){
    const url=new URL(apiRoot+"/"+encodeURIComponent(baseId)+"/"+encodeURIComponent(tableId)+(recordId?"/"+encodeURIComponent(recordId):""));
    for(const [k,v] of Object.entries(params||{}))if(v!==undefined&&v!==null)url.searchParams.set(k,String(v));
    for(let attempt=0;attempt<=maxRetries;attempt++){
      let response;
      try{response=await fetchImpl(url,{method,headers:{Authorization:"Bearer "+token,"Content-Type":"application/json"},...(fields?{body:JSON.stringify({fields})}:{})});}
      catch(e){if(method!=="GET")throw new AirtableAmbiguousWriteError();if(attempt===maxRetries)throw e;await wait(Math.min(1000*2**attempt,8000));continue;}
      if(response.ok)return response.json();
      if(method!=="GET" && (response.status===429||response.status>=500))throw new AirtableAmbiguousWriteError();\n      if((response.status===429||response.status>=500)&&attempt<maxRetries){
        const retry=Number(response.headers.get("retry-after"));
        await wait(Number.isFinite(retry)&&retry>0?Math.min(retry*1000,30000):Math.min(1000*2**attempt,8000));continue;
      }
      throw new AirtableHttpError(response.status,"Airtable request failed with status "+response.status);
    }
  }
  return {
    listRecords:({baseId,tableId,offset,pageSize=100})=>request("GET",baseId,tableId,{params:{offset,pageSize}}),
    createRecord:({baseId,tableId,fields})=>request("POST",baseId,tableId,{fields}),
    updateRecord:({baseId,tableId,recordId,fields})=>request("PATCH",baseId,tableId,{recordId,fields})
  };
}
