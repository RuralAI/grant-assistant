import {createHash} from "node:crypto";
import {assertBindingCurrent} from "./installation-bindings.mjs";
const definitions=[
 ["grant-prospect-scan","Prospect Scan","Research funding opportunities from authoritative funder sources; retain canonical source URLs, observed cycles, eligibility uncertainty and evidence. Never fabricate verification."],
 ["grant-scoring","Grant Scoring","Score eligibility, fit and readiness separately; record rationale, evidence and unknowns. Do not change human-owned stage, review_status or operator_notes."],
 ["grant-storage-write","Storage Write","Validate source identity, enforce authorization, reconcile duplicates, verify binding before every write, preserve human-owned fields and refuse schema drift. Use the approved adapter, not raw provider writes."],
 ["grant-writing","Grant Writing","Draft grant narratives grounded in authorized organization profiles, verified opportunities and supplied evidence. Distinguish draft claims from verified facts. Never submit an application."],
 ["grant-audit-log","Audit Log","Append evidence of each search or operational run to Search Audit using a unique run_id; preserve counts, source coverage, unresolved gaps and timestamps. Never overwrite an audit entry."]
];
const escapeYaml=s=>JSON.stringify(s);
export function generateOperatingSkills(binding){
 if(!binding||!["airtable","google_sheets"].includes(binding.provider)||!binding.schemaFingerprint)throw Error("verified binding manifest required");
 const files={};const manifest={contractVersion:binding.contractVersion,provider:binding.provider,schemaFingerprint:binding.schemaFingerprint,skills:[]};
 for(const [slug,label,purpose] of definitions){
  const root="skills/"+slug+"/";
  const front="---\nname: "+slug+"\ndescription: "+escapeYaml(purpose+" Use this skill for Grant Assistant v2 "+label.toLowerCase()+" operations on an approved installation.")+"\n---\n";
  const body="\n# "+label+"\n\n"+purpose+"\n\n## Installation contract\n\n1. Read references/storage-binding.json before any provider operation. Confirm provider, contract version and schema fingerprint.\n2. Inspect the live destination and call assertBindingCurrent with authoritative metadata before writing. Refuse any missing, duplicate or reordered physical mapping.\n3. Require explicit destination authorization from a trusted host callback. A caller-supplied actor label does not grant operator rights.\n4. Use logical IDs and approved v2 adapters. Never infer a physical table/field or Sheet column from an unverified name.\n5. Keep grant stage, review_status and operator_notes human-owned. Do not silently repair, overwrite, submit or delete.\n6. Record accurate readback, evidence and failures. If runtime or connector is unavailable, report BLOCKED rather than claiming success.\n\n## Capability\n\n"+purpose+"\n";
  files[root+"SKILL.md"]=front+body;
  files[root+"agents/openai.yaml"]="interface:\n  display_name: "+escapeYaml("Grant "+label)+"\n  short_description: "+escapeYaml(label+" for a verified Grant Assistant v2 installation")+"\n";
  files[root+"references/storage-binding.json"]=JSON.stringify(binding,null,2)+"\n";
  manifest.skills.push({name:slug,entrypoint:root+"SKILL.md"});
 }
 const ordered=Object.entries(files).sort(([a],[b])=>a.localeCompare(b));
 manifest.files=ordered.map(([path,content])=>({path,sha256:createHash("sha256").update(content).digest("hex")}));
 return {files:Object.fromEntries(ordered),manifest};
}
export function verifyOperatingSkills(output){
 if(!output?.files||!output?.manifest||output.manifest.skills.length!==5)throw Error("five operating skills required");
 for(const entry of output.manifest.skills){
  const root=entry.entrypoint.slice(0,-"SKILL.md".length);
  for(const suffix of ["SKILL.md","agents/openai.yaml","references/storage-binding.json"])if(typeof output.files[root+suffix]!=="string")throw Error("missing skill resource "+root+suffix);
 }
 for(const {path,sha256} of output.manifest.files)if(createHash("sha256").update(output.files[path]||"").digest("hex")!==sha256)throw Error("skill artifact changed: "+path);
 return true;
}
