import {classifyInstallation,previewLegacyMigration} from "./installation-detection.mjs";
import {buildOrganizationSeed} from "./organization-intake.mjs";
import {bindAirtableInstallation,bindSheetsInstallation,assertBindingCurrent} from "./installation-bindings.mjs";
import {createAirtableSeedAdapter,createSheetsSeedAdapter} from "./organization-seed-adapters.mjs";
import {prepareSkillInstallation} from "./skill-registration.mjs";
/**
 * Provider-neutral installation gate. All provider operations are injected by
 * a trusted host; this module never fabricates an authenticated API session.
 */
export async function installGrantAssistantV2({provider,platform,destination,inspect,provision,approveProvision,approveSkills,register,verify,organizationIntake,approveSeed,writeSeed,readSeed,seedTransport}){
 if(!["airtable","google_sheets"].includes(provider))throw Error("unsupported storage provider");
 if(!["chatgpt","claude"].includes(platform))throw Error("unsupported skill platform");
 if(typeof inspect!=="function")throw Error("trusted live destination inspection required");
 if(!destination||typeof destination!=="object")throw Error("explicit destination required");
 let observed=await inspect({provider,destination});
 const detected=classifyInstallation({provider,observed});
 if(detected.kind==="legacy")return {status:"BLOCKED",phase:"migration",detection:detected,migration:previewLegacyMigration({provider,observed})};
 if(["mixed","partial_v2","unknown"].includes(detected.kind))return {status:"BLOCKED",phase:"inspection",detection:detected,reason:"destination requires reviewed reconciliation; no automatic repair"};
 let seed=null;
 if(organizationIntake!==undefined){
  seed=buildOrganizationSeed(organizationIntake);
  if(seed.status!=="READY_FOR_REVIEW")return {status:"BLOCKED",phase:"intake",seed};
 }
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
 if(seed){
  if(typeof approveSeed!=="function"||await approveSeed({provider,platform,destination,seed})!==true)
   return {status:"BLOCKED",phase:"seed",reason:"organization seed requires explicit approval",seed,provisioned,binding};
  let writer=writeSeed,reader=readSeed;
  if((typeof writer!=="function"||typeof reader!=="function")&&seedTransport){
   const adapter=provider==="airtable"
    ?createAirtableSeedAdapter({binding,transport:seedTransport})
    :createSheetsSeedAdapter({binding,client:seedTransport});
   writer=adapter.writeSeed;reader=adapter.readSeed;
  }
  if(typeof writer!=="function"||typeof reader!=="function")
   return {status:"BLOCKED",phase:"seed",reason:"authenticated seed write and independent readback required",seed,provisioned,binding};
  const saved=await writer({provider,destination,binding,profile:seed.profile});
  if(saved?.written!==true)return {status:"BLOCKED",phase:"seed",reason:"seed write not confirmed",seed,provisioned,binding};
  const readback=await reader({provider,destination,binding,profileId:seed.profile.profile_id});
  if(!readback||Object.entries(seed.profile).some(([key,value])=>JSON.stringify(readback[key])!==JSON.stringify(value)))
   return {status:"BLOCKED",phase:"seed",reason:"organization profile readback mismatch",seed,provisioned,binding};
 }
 const result=await prepareSkillInstallation({binding,observedSchema:observed,platform,approve:approveSkills,register,verify});
 return {...result,phase:result.status==="INSTALLED"?"complete":"skills",provisioned,binding,seeded:Boolean(seed)};
}
