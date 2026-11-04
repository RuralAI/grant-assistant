import {createHash} from "node:crypto";
import {assertBindingCurrent} from "./installation-bindings.mjs";
const definitions=[
 ["grant-prospect-scan","Prospect Scan","Research funding opportunities from authoritative funder sources; retain canonical source URLs, observed cycles, eligibility uncertainty and evidence. Never fabricate verification."],
 ["grant-scoring","Grant Scoring","Score eligibility, fit and readiness separately; record rationale, evidence and unknowns. Do not change human-owned stage, review_status or operator_notes."],
 ["grant-storage-write","Storage Write","Validate source identity, enforce authorization, reconcile duplicates, verify binding before every write, preserve human-owned fields and refuse schema drift. Use the approved adapter, not raw provider writes."],
 ["grant-writing","Grant Writing","Draft grant narratives grounded in authorized organization profiles, verified opportunities and supplied evidence. Distinguish draft claims from verified facts. Never submit an application."],
 ["grant-audit-log","Audit Log","Append evidence of each search or operational run to Search Audit using a unique run_id; preserve counts, source coverage, unresolved gaps and timestamps. Never overwrite an audit entry."]
];
const workflows={
 "grant-prospect-scan":`## Discovery execution
1. Load the selected Organization Profile by profile_id; identify applicant type, geography, programs, fiscal sponsor, funding preferences, award bounds and registration status. Do not silently infer missing attributes.
2. Construct a search plan spanning authoritative funder pages, official program notices, Grants.gov or relevant regional foundations, and explicit user-supplied sources. Treat search-engine summaries as leads, not eligibility evidence.
3. For each opportunity record funder, title, source_system, source_record_id, canonical source_url, opportunity_cycle, deadline, award range, eligibility requirements, geography and last_verified_at. Distinguish open, anticipated, historical and undated cycles.
4. Evaluate eligibility against every mandatory requirement. Mark unknown if evidence is missing; fiscal sponsorship must be confirmed per opportunity. Do not equate topical fit with eligibility.
5. Reconcile by stable source ID; fall back to normalized canonical URL plus cycle. Ambiguous identity must be queued for review; never create duplicates by title alone.
6. Produce a no-write preview with added/unchanged/deferred counts, citations, uncertainties and search coverage. Seek approval before any destination write.
7. Record the discovery run and unresolved gaps via Audit Log. Never claim a search occurred if a source was inaccessible.`,
 "grant-scoring":`## Scoring execution
1. Load the approved profile and verified opportunity, including canonical evidence and last_verified_at.
2. Evaluate mandatory eligibility first: eligible, ineligible, conditional or unknown. Document each blocker and verification source. Ineligible opportunities must not be described as viable because of a high fit score.
3. Score fit on a 0-100 scale using explicit weighted dimensions: mission/program 30, geography/beneficiaries 25, award size and allowed uses 20, application readiness 15, timing and capacity 10. Document each component, evidence and missing assumptions.
4. Report readiness separately as ready, needs_work or unknown. An unknown mandatory condition is not a pass.
5. Prepare an agent-owned patch limited to fit_score, fit_rationale, eligibility_status, eligibility_reason and readiness_status; preserve stage, review_status, operator_notes and grant_id.
6. Present score, confidence, evidence and disqualifiers for review. Write only with approved authorization and verify readback. Never promote a grant automatically.`,
 "grant-storage-write":`## Provider-bound write procedure
1. Load the binding JSON and inspect the live provider metadata before EVERY write batch. Verify schemaFingerprint via src/v2/installation-bindings.mjs; refuse drift or absent IDs.
2. Airtable: use baseId, tableId and every mapped fld ID in the manifest; validate field types and select choices. Encode/decode using src/v2/airtable-codecs.mjs and use createAirtableAdapter with a trusted authorize callback.
3. Google Sheets: use spreadsheetId, numeric sheetId, exact headers and zero-based column indexes; check headers before operations. Use src/v2/google-sheets-connection.mjs and row transport, never cached row numbers as identity; re-resolve logical ID, detect duplicate rows and stale locators.
4. Use profile_id, organization_id, grant_id and run_id as stable identities. Reconcile grants by source_system+source_record_id, otherwise canonical URL+cycle. Refuse ambiguous matches.
5. Obtain separate approval for writes. Boolean authorization does NOT grant operator rights. Only trusted host authorization may grant operator capability. Agents cannot set or modify stage, review_status, operator_notes or grant_id.
6. Normalize and validate before writes; fail closed on unsupported types, missing identity, schema drift, partial transport responses or conflicting updates. Search Audit is append-only.
7. Read back each mutation and report created, updated, unchanged, deferred and failed counts. On partial failure, stop and produce an exact reconciliation report; never blind-retry non-idempotent creates.
8. A schema fingerprint does not make Sheets updates atomic. Refuse concurrent editing during a batch and report remaining race risks.`,
 "grant-writing":`## Drafting execution
1. Identify the human-selected grant_id, applicant profile_id and authoritative opportunity guidelines. Require current cycle, eligibility, deadline and application instructions; flag missing material.
2. Load only authorized organization evidence: programs, outcomes, budgets, collaborators, geography, historical performance and source URLs. Never fabricate metrics, matching funds, fiscal sponsorship, endorsements or commitments.
3. Build a requirements matrix of each funder prompt, word/character limit, attachment, budget requirement, scoring criterion and verified source. Mark gaps explicitly.
4. Produce a narrative outline and draft by section: need, proposed approach, measurable outcomes, workplan, organizational capacity, evaluation, sustainability and budget rationale, only where required.
5. Attach claim-to-source notes and label proposed language, unverified assertions and required human inputs. Validate arithmetic, dates and length limits.
6. Provide an editorial checklist and revision history. Do not mark review_status Approved, advance stage, or submit applications. Human approval of pursuit is distinct from submission authorization.`,
 "grant-audit-log":`## Audit execution
1. Create one unique run_id for each actual discovery, scoring or maintenance run and identify profile_id/search_profile_id, mode and started_at.
2. Capture queries_run, sources_checked, coverage_summary, opportunities_identified/added/scored/deferred, triage_details, gaps, stopping_rationale, next_searches, carried_forward and updated_records.
3. Separate observed counts from estimates; use timestamps from the execution environment, not guessed dates. Preserve canonical evidence URLs and provenance where supported.
4. Append through the approved storage adapter after explicit write authorization; verify the run_id is unique and the row is readable. Never update or delete an existing Search Audit record.
5. If a write fails, return the unsaved audit payload and error, mark audit incomplete, and avoid claiming persistence. Do not duplicate a previously appended run on retry.`
};
const escapeYaml=s=>JSON.stringify(s);
export function generateOperatingSkills(binding){
 if(!binding||!["airtable","google_sheets"].includes(binding.provider)||!binding.schemaFingerprint)throw Error("verified binding manifest required");
 const files={};const manifest={contractVersion:binding.contractVersion,provider:binding.provider,schemaFingerprint:binding.schemaFingerprint,skills:[]};
 for(const [slug,label,purpose] of definitions){
  const root="skills/"+slug+"/";
  const front="---\nname: "+slug+"\ndescription: "+escapeYaml(purpose+" Use this skill for Grant Assistant v2 "+label.toLowerCase()+" operations on an approved installation.")+"\n---\n";
  const body="\n# "+label+"\n\n"+purpose+"\n\n## Installation contract\n\n1. Read references/storage-binding.json before any provider operation. Confirm provider, contract version and schema fingerprint.\n2. Inspect the live destination and call assertBindingCurrent with authoritative metadata before writing. Refuse any missing, duplicate or reordered physical mapping.\n3. Require explicit destination authorization from a trusted host callback. A caller-supplied actor label does not grant operator rights.\n4. Use logical IDs and approved v2 adapters. Never infer a physical table/field or Sheet column from an unverified name.\n5. Keep grant stage, review_status and operator_notes human-owned. Do not silently repair, overwrite, submit or delete.\n6. Record accurate readback, evidence and failures. If runtime or connector is unavailable, report BLOCKED rather than claiming success.\n\n## Capability\n\n"+purpose+"\n\n"+workflows[slug]+"\n";
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
