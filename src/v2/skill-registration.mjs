import {generateOperatingSkills,verifyOperatingSkills} from "./operating-skill-generator.mjs";
import {assertBindingCurrent} from "./installation-bindings.mjs";
export async function prepareSkillInstallation({binding,observedSchema,platform,approve,register,verify,skillPrefix="",displayPrefix=""}){
 if(!["chatgpt","claude"].includes(platform))throw Error("unsupported skill platform");
 assertBindingCurrent(binding,observedSchema);
 const bundle=generateOperatingSkills(binding,{skillPrefix,displayPrefix});
 const names=bundle.manifest.skills.map(skill=>skill.name);
 verifyOperatingSkills(bundle);
 if(typeof approve!=="function"||await approve({platform,provider:binding.provider,skills:names,manifest:bundle.manifest})!==true)
  return {status:"BLOCKED",reason:"explicit skill installation approval required",bundle};
 if(typeof register!=="function"||typeof verify!=="function")
  return {status:"BLOCKED",reason:"no supported platform registration and verification capability",bundle};
 const registered=[];
 for(const skill of bundle.manifest.skills){
  const root=skill.entrypoint.slice(0,-"SKILL.md".length);
  const files=Object.fromEntries(Object.entries(bundle.files).filter(([path])=>path.startsWith(root)));
  const result=await register({platform,name:skill.name,files,manifest:bundle.manifest});
  if(result?.installed!==true)return {status:"BLOCKED",reason:"registration failed for "+skill.name,registered,bundle};
  const confirmed=await verify({platform,name:skill.name,manifest:bundle.manifest});
  if(confirmed!==true)return {status:"BLOCKED",reason:"skill not discoverable: "+skill.name,registered,bundle};
  registered.push(skill.name);
 }
 return {status:"INSTALLED",registered,manifest:bundle.manifest};
}
