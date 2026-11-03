#!/usr/bin/env node
// Preview by default. --create requires explicit operator action and destination.
import {buildAirtableProvisioningPlan} from "./airtable-provisioning.mjs";
import {createAirtableMetadataTransport} from "./airtable-metadata-transport.mjs";
import {inspectAirtableInstallation,installAirtableInspectionFirst} from "./airtable-install-inspection-first.mjs";
const args=process.argv.slice(2);
const get=(flag)=>{const i=args.indexOf(flag);return i<0?undefined:args[i+1]};
const workspaceId=get("--workspace"),baseName=get("--base");
const create=args.includes("--create");
if(!workspaceId||!baseName||!process.env.AIRTABLE_TOKEN){
 console.error("Usage: AIRTABLE_TOKEN=... node src/v2/airtable-install-cli.mjs --workspace <id> --base <name> [--create]");
 process.exitCode=2;
}else{
 try{
  const plan=buildAirtableProvisioningPlan({workspaceId,baseName});
  const transport=createAirtableMetadataTransport({token:process.env.AIRTABLE_TOKEN});
  // Metadata list is account-wide. Missing workspace membership is treated as a conflict, never silently reused.
  const discovery={listBases:()=>transport.listBases()};
  const result=create
   ?await installAirtableInspectionFirst({plan,discovery,transport,approval:{approved:true,workspaceId,baseName,contractVersion:plan.contractVersion}})
   :await inspectAirtableInstallation({plan,discovery,transport});
  console.log(JSON.stringify({mode:create?"create":"preview",...result},null,2));
 }catch(e){
  console.error(JSON.stringify({code:e.code||"ERROR",message:e.message,details:e.details||null}));
  process.exitCode=1;
 }
}
