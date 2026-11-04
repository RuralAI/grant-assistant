import {bindAirtableInstallation,bindSheetsInstallation,assertBindingCurrent} from "./installation-bindings.mjs";
import {prepareSkillInstallation} from "./skill-registration.mjs";
/**
 * Provider-neutral installation gate. All provider operations are injected by
 * a trusted host; this module never fabricates an authenticated API session.
 */
export async function installGrantAssistantV2({provider,platform,destination,inspect,provision,approveProvision,approveSkills,register,verify}){
 if(!["airtable","google_sheets"].includes(provider))throw Error("unsupported storage provider");
 if(!["chatgpt","claude"].includes(platform))throw Error("unsupported skill platform");
 if(typeof inspect!=="function")throw Error("trusted live destination inspection required");
 if(!destination||typeof destination!=="object")throw Error("explicit destination required");
 let observed=await inspect({provider,destination});
 let provisioned=false;
 if(!observed){
  if(typeof approveProvision!=="function"||await approveProvision({provider,platform,destination})!==true)
   return {status:"BLOCKED",phase:"provision",reason:"destination creation requires explicit approval"};
  if(typeof provision!=="function")
   return {status:"BLOCKED",phase:"provision",reason:"authenticated provider provisioning capability unavailable"};
  const created=await provision({provider,destination});
  if(!created?.created) return {status:"BLOCKED",phase:"provision",reason:"provider did not confirm creation"};
  provisioned=true;
  observed=await inspect({provider,destination,created});
  if(!observed) return {status:"BLOCKED",phase:"binding",reason:"authoritative readback unavailable",provisioned};
 }
 let binding;
 try {
  binding=provider==="airtable"?bindAirtableInstallation(observed):bindSheetsInstallation(observed);
  assertBindingCurrent(binding,observed);
 }catch(e){return {status:"BLOCKED",phase:"binding",reason:String(e.message),provisioned};}
 const result=await prepareSkillInstallation({binding,observedSchema:observed,platform,approve:approveSkills,register,verify});
 return {...result,phase:result.status==="INSTALLED"?"complete":"skills",provisioned,binding};
}
