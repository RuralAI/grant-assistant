// Pure intake contract for Grant Assistant v2. No provider writes.
export const INTAKE_REVISION="jackson-15-2026-11-02";
export const INTAKE_QUESTIONS=[
 ["issue_areas",true],["search_geographies",true],["beneficiaries",true],
 ["applicant_type",true],["fiscal_sponsor_org_id",false],
 ["federal_search_enabled",false],["founded_year",false],
 ["annual_budget",false],["funding_preferences",true],
 ["restricted_funders",false],["partners",false],
 ["other_eligibility_barriers",false],["programs",true],
 ["preferred_award_min",false],["extra_search_terms",false]
];
const nonempty=v=>v!==undefined&&v!==null&&v!==""&&(!Array.isArray(v)||v.length>0);
export function validateOrganizationIntake(input){
 const errors=[],warnings=[];
 if(!input||typeof input!=="object"||Array.isArray(input))return {ok:false,errors:["organization intake object required"],warnings};
 for(const [key,required] of INTAKE_QUESTIONS)if(required&&!nonempty(input[key]))errors.push("missing "+key);
 if(input.fiscal_sponsored===true&&!nonempty(input.fiscal_sponsor_org_id))errors.push("fiscal sponsor identity required when sponsored");
 if(input.federal_search_enabled===true){
  if(!nonempty(input.sam_registration_status))warnings.push("SAM registration status unknown; federal eligibility unverified");
  if(!nonempty(input.uei_status))warnings.push("UEI status unknown; federal eligibility unverified");
 }
 if(nonempty(input.preferred_award_min)&&nonempty(input.preferred_award_max)&&Number(input.preferred_award_min)>Number(input.preferred_award_max))errors.push("award minimum exceeds maximum");
 if(!nonempty(input.organization_name))errors.push("missing organization_name");
 if(!nonempty(input.profile_name))errors.push("missing profile_name");
 if(!nonempty(input.profile_id))errors.push("missing profile_id");
 if(input.loan_policy===undefined)warnings.push("loan policy not confirmed; exclude loans from discovery by default");
 if(!nonempty(input.annual_budget))warnings.push("budget unknown; defer budget-dependent scoring");
 if(!nonempty(input.founded_year))warnings.push("founding year unknown; verify age-based eligibility per opportunity");
 return {ok:errors.length===0,errors,warnings,revision:INTAKE_REVISION};
}
export function buildOrganizationSeed(input){
 const result=validateOrganizationIntake(input);
 if(!result.ok)return {status:"BLOCKED",...result};
 const fields=["profile_id","profile_name","organization_name","issue_areas","headquarters_geography","search_geographies","beneficiaries","applicant_type","fiscal_sponsor_org_id","federal_search_enabled","sam_registration_status","uei_status","founded_year","audited_financial_years","annual_budget","currency","funding_preferences","other_eligibility_barriers","programs","preferred_award_min","preferred_award_max","extra_search_terms","writing_reference_url"];
 const profile=Object.fromEntries(fields.filter(k=>input[k]!==undefined).map(k=>[k,input[k]]));
 return {status:"READY_FOR_REVIEW",profile,warnings:result.warnings,revision:INTAKE_REVISION,requiresApproval:true};
}
