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
 return coordinator.withExclusive(destination,()=>coordinator.withExclusive("installation:"+approval.installationId,()=>executeAirtableProvisioning(args)));
}
