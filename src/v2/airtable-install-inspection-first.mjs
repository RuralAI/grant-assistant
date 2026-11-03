// Inspection-first provisioning: no persistent journal or lock service.
// Caller supplies destination discovery and an explicit create authorization.
import {inspectProvisionedSchema} from "./airtable-provisioning.mjs";
export class InstallationInspectionError extends Error{
 constructor(code,message,details){super(message);this.name="InstallationInspectionError";this.code=code;this.details=details;}
}
export async function inspectAirtableInstallation({plan,discovery,transport}={}){
 if(!plan?.workspaceId||!plan?.baseName||!Array.isArray(plan.tables))throw new InstallationInspectionError("PLAN","valid plan required");
 if(typeof discovery?.listBases!=="function"||typeof transport?.getBaseSchema!=="function")throw new InstallationInspectionError("CONFIG","base discovery and schema reader required");
 const bases=await discovery.listBases({workspaceId:plan.workspaceId});
 if(!Array.isArray(bases))throw new InstallationInspectionError("DISCOVERY","base discovery incomplete");
 // Discovery may be account-wide when workspace membership is unavailable. Treat all same-name bases as candidates; never silently ignore one.
 const candidates=bases.filter(b=>b.name?.trim().toLowerCase()===plan.baseName.trim().toLowerCase());
 const inspected=[];
 for(const base of candidates){
  try{
   const schema=await transport.getBaseSchema({baseId:base.id});
   const verdict=inspectProvisionedSchema(plan,{...schema,baseId:base.id});
   inspected.push({baseId:base.id,name:base.name,workspaceId:base.workspaceId,compatible:verdict.ok,errors:verdict.errors,config:verdict.config});
  }catch(e){inspected.push({baseId:base.id,name:base.name,compatible:false,errors:["schema inspection unavailable"],config:null});}
 }
 return {status:inspected.length===0?"absent":inspected.length===1&&inspected[0].compatible?"compatible":"review_required",candidates:inspected};
}
export async function installAirtableInspectionFirst({plan,discovery,transport,approval}={}){
 if(approval?.approved!==true||approval.workspaceId!==plan.workspaceId||approval.baseName!==plan.baseName||approval.contractVersion!==plan.contractVersion)throw new InstallationInspectionError("AUTH","explicit destination and version approval required");
 const before=await inspectAirtableInstallation({plan,discovery,transport});
 if(before.status==="compatible"){
  const candidate=before.candidates[0];
  // An account-wide listing cannot prove workspace membership. Never auto-connect across workspaces.
  if(candidate.workspaceId!==plan.workspaceId)throw new InstallationInspectionError("REVIEW","matching base workspace not verified",before);
  return {status:"existing",...candidate};
 }
 if(before.status!=="absent")throw new InstallationInspectionError("REVIEW","existing candidate requires review",before);
 if(approval?.approved!==true||approval.workspaceId!==plan.workspaceId||approval.baseName!==plan.baseName||approval.contractVersion!==plan.contractVersion)throw new InstallationInspectionError("AUTH","explicit destination and version approval required");
 if(typeof transport?.createBase!=="function")throw new InstallationInspectionError("CONFIG","create transport required");
 let created;
 try{created=await transport.createBase({workspaceId:plan.workspaceId,name:plan.baseName,tables:plan.tables.map(t=>({name:t.name,fields:t.fields}))});}
 catch(e){throw new InstallationInspectionError("RECONCILE","create outcome uncertain; rediscover destination before any retry");}
 if(!created?.id)throw new InstallationInspectionError("RECONCILE","create response missing ID; rediscover before retry");
 let schema;
 try{schema=await transport.getBaseSchema({baseId:created.id});}
 catch(e){throw new InstallationInspectionError("VERIFY","base created but verification failed; inspect existing base",{baseId:created.id});}
 const verdict=inspectProvisionedSchema(plan,{...schema,baseId:created.id});
 if(!verdict.ok)throw new InstallationInspectionError("SCHEMA","created base requires schema review",{baseId:created.id,errors:verdict.errors});
 return {status:"created",baseId:created.id,config:verdict.config};
}
