// Hardened provisioning entrypoint: destination-scoped exclusive lock and exact-plan approval.
import {createHash} from "node:crypto";
import {executeAirtableProvisioning,ProvisioningError} from "./airtable-provisioning-executor.mjs";
export function provisioningPlanDigest(plan){
 const canonical=JSON.stringify({contractVersion:plan?.contractVersion,workspaceId:plan?.workspaceId,baseName:plan?.baseName,tables:plan?.tables,codecs:plan?.codecs});
 return createHash("sha256").update(canonical).digest("hex");
}
export async function executeExclusiveAirtableProvisioning(args={}){
 const {approval,coordinator,plan}=args;
 if(typeof approval?.installationId!=="string"||!approval.installationId.trim())throw new ProvisioningError("AUTH","installationId required");
 if(!plan?.workspaceId||!plan?.baseName)throw new ProvisioningError("PLAN","destination required");
 if(approval.planDigest!==provisioningPlanDigest(plan))throw new ProvisioningError("AUTH","approval must bind to exact plan digest");
 if(!coordinator||typeof coordinator.withExclusive!=="function")throw new ProvisioningError("LOCK_REQUIRED","exclusive coordinator required");
 const destination="destination:"+plan.workspaceId+":"+plan.baseName.trim().toLowerCase();
 return coordinator.withExclusive(destination,()=>coordinator.withExclusive("installation:"+approval.installationId,async()=>{
  if(!args.journal?.load||!args.journal?.save)throw new ProvisioningError("CONFIG","durable journal required");
  const reservationKey=destination;
  const prior=await args.journal.load(reservationKey);
  if(prior&&prior.ownerInstallationId!==approval.installationId)throw new ProvisioningError("DESTINATION_RESERVED","destination already reserved; reconcile before new installation");
  if(!prior)await args.journal.save(reservationKey,{installationId:reservationKey,ownerInstallationId:approval.installationId,workspaceId:plan.workspaceId,baseName:plan.baseName,contractVersion:plan.contractVersion,status:"reserved"});
  // Reservation identity is distinct from the installation journal identity.
  return executeAirtableProvisioning(args);
 }));
}
