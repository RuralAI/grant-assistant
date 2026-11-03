// Exclusive provisioning entrypoint. The lock must be held across journal read,
// base creation, verification and final journal write.
// For multi-host use, supply a shared coordinator with atomic acquire semantics.
import {executeAirtableProvisioning,ProvisioningError} from "./airtable-provisioning-executor.mjs";
export async function executeExclusiveAirtableProvisioning(args={}){
 const {approval,coordinator}=args;
 if(typeof approval?.installationId!=="string"||!approval.installationId.trim())throw new ProvisioningError("AUTH","installationId required");
 if(!coordinator||typeof coordinator.withExclusive!=="function")throw new ProvisioningError("LOCK_REQUIRED","exclusive coordinator required");
 return coordinator.withExclusive(approval.installationId,()=>executeAirtableProvisioning(args));
}
