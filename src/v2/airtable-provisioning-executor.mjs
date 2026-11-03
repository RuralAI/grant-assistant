// Controlled Airtable v2 base provisioning executor. Dependency injected: no live credentials.
// A durable journal must be written BEFORE a potentially ambiguous create call.
import {inspectProvisionedSchema} from "./airtable-provisioning.mjs";
export class ProvisioningError extends Error {constructor(code,message){super(message);this.name="ProvisioningError";this.code=code;}}
const fail=(code,message)=>{throw new ProvisioningError(code,message);};
export async function executeAirtableProvisioning({plan,approval,transport,journal}={}){
 if(!plan?.requiresApproval||!Array.isArray(plan.tables)||plan.tables.length!==4||!plan.workspaceId||!plan.baseName)fail("PLAN","valid four-table plan required");
 if(!approval||approval.approved!==true||approval.workspaceId!==plan.workspaceId||approval.baseName!==plan.baseName||approval.contractVersion!==plan.contractVersion)fail("AUTH","explicit plan-specific operator approval required");
 if(!transport||typeof transport.createBase!=="function"||typeof transport.getBaseSchema!=="function")fail("CONFIG","createBase and getBaseSchema required");
 if(!journal||typeof journal.load!=="function"||typeof journal.save!=="function")fail("CONFIG","durable journal required");
 const key=approval.installationId;
 if(typeof key!=="string"||!key.trim())fail("AUTH","installationId required");
 const current=await journal.load(key);
 if(current){
  if(current.workspaceId!==plan.workspaceId||current.baseName!==plan.baseName||current.contractVersion!==plan.contractVersion)fail("CONFLICT","installationId reused for different plan");
  if(current.status==="complete")return {status:"complete",baseId:current.baseId,config:current.config,reused:true};
  // Do not issue a second create for pending or ambiguous requests.
  fail("RECONCILE","existing incomplete installation requires manual reconciliation before retry");
 }
 const state={installationId:key,workspaceId:plan.workspaceId,baseName:plan.baseName,contractVersion:plan.contractVersion,status:"create_pending"};
 await journal.save(key,state);
 let created;
 try{created=await transport.createBase({workspaceId:plan.workspaceId,name:plan.baseName,tables:plan.tables.map(t=>({name:t.name,fields:t.fields}))});}
 catch(e){await journal.save(key,{...state,status:"create_uncertain"});fail("AMBIGUOUS_CREATE","base creation uncertain; inspect workspace and reconcile manually");}
 if(typeof created?.id!=="string"||!created.id.startsWith("app")){
  await journal.save(key,{...state,status:"create_uncertain"});
  fail("AMBIGUOUS_CREATE","create response missing base ID; reconcile manually");
 }
 const baseId=created.id;
 await journal.save(key,{...state,baseId,status:"verify_pending"});
 let schema;
 try{schema=await transport.getBaseSchema({baseId});}
 catch(e){await journal.save(key,{...state,baseId,status:"verify_pending"});fail("VERIFY","schema lookup failed; reconcile before continuing");}
 const result=inspectProvisionedSchema(plan,{...schema,baseId});
 if(!result.ok){
  await journal.save(key,{...state,baseId,status:"schema_mismatch",errors:result.errors});
  fail("SCHEMA","created base failed preflight: "+result.errors.join("; "));
 }
 const complete={...state,baseId,status:"complete",config:result.config};
 await journal.save(key,complete);
 return {status:"complete",baseId,config:result.config,reused:false};
}
