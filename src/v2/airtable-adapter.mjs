import {verifyAirtableSchema,encodeAirtable,decodeAirtable} from "./airtable-codecs.mjs";
// Airtable adapter for Grant Assistant v2. Dependency-injected transport; no credentials or live writes.
// Transport: listRecords({baseId,tableId,offset,pageSize}), createRecord({baseId,tableId,fields}),
// updateRecord({baseId,tableId,recordId,fields}). All methods return Airtable-shaped objects.
import {normalizeGrant,normalizeProfile,duplicateKey,validateAgentPatch} from "./normalize.mjs";
import {normalizeOrganization,normalizeSearchAudit,normalizeFunderRestriction,normalizeOrganizationGrantRole} from "./records.mjs";
const validators={grants:normalizeGrant,organization_profile:normalizeProfile,organizations:normalizeOrganization,search_audit:normalizeSearchAudit,funder_restrictions:normalizeFunderRestriction,organization_grant_roles:normalizeOrganizationGrantRole};
const ids={grants:"grant_id",organization_profile:"profile_id",organizations:"organization_id",search_audit:"run_id",funder_restrictions:"restriction_id",organization_grant_roles:"role_id"};
const protectedFields={grants:["stage","review_status","operator_notes"],organizations:["notes"],organization_profile:[],search_audit:[],funder_restrictions:[],organization_grant_roles:[]};
export class AdapterError extends Error {constructor(code,message){super(message);this.name="AdapterError";this.code=code;}}
function check(cond,code,msg){if(!cond)throw new AdapterError(code,msg);}
function equal(a,b){return JSON.stringify(a)===JSON.stringify(b);}
function fieldsToLogical(fields,map){
  const result={};for(const [logical,physical] of Object.entries(map))if(Object.hasOwn(fields,physical))result[logical]=fields[physical];
  return result;
}
function logicalToFields(value,map){
  const result={};for(const [logical,physical] of Object.entries(map))if(Object.hasOwn(value,logical))result[physical]=value[logical];
  return result;
}
function validateConfig(config){
  check(config&&typeof config==="object","CONFIG","config required");
  check(typeof config.baseId==="string"&&config.baseId.startsWith("app"),"CONFIG","baseId required");
  check(config.collections&&typeof config.collections==="object","CONFIG","collection mapping required");
  for(const [name,def] of Object.entries(config.collections)){
    check(Boolean(validators[name]),"CONFIG","unknown collection "+name);
    check(typeof def.tableId==="string"&&def.tableId.startsWith("tbl"),"CONFIG","tableId required for "+name);
    check(def.fields&&typeof def.fields==="object"&&typeof def.fields[ids[name]]==="string","CONFIG","logical identity field mapping required for "+name);
    const targets=Object.values(def.fields);
    check(targets.every(x=>typeof x==="string"&&x.length>0)&&new Set(targets).size===targets.length,"CONFIG","field mappings must be unique");
  }
}
export function createAirtableAdapter({config,transport,schema=null,authorize=null}){
  validateConfig(config);
  check(Boolean(schema),"SCHEMA","Airtable metadata preflight is mandatory");
  verifyAirtableSchema(config,schema);
  check(typeof authorize==="function","AUTH","trusted authorization callback required");
  for(const [name,def] of Object.entries(config.collections)){
    check(def.codecs&&typeof def.codecs==="object","CONFIG","explicit codecs required for "+name);
    for(const logical of Object.keys(def.fields)){
      check(["text","json","number","boolean","date","timestamp","select"].includes(def.codecs[logical]),"CONFIG","explicit codec required for "+name+"."+logical);
      const type=schema.tables.find(t=>t.id===def.tableId).fields.find(f=>f.id===def.fields[logical]).type;
      const allowed={text:["singleLineText","multilineText","email","phoneNumber","url"],json:["multilineText","singleLineText"],number:["number","currency","percent"],boolean:["checkbox"],date:["date"],timestamp:["dateTime"],select:["singleSelect"]};
      check(allowed[def.codecs[logical]].includes(type),"SCHEMA","incompatible codec "+name+"."+logical);
    }
  }
  const types={};
  if(schema)for(const [name,def] of Object.entries(config.collections)){const table=schema.tables.find(t=>t.id===def.tableId);types[name]=Object.fromEntries(Object.entries(def.fields).map(([logical,physical])=>[logical,table.fields.find(f=>f.id===physical).type]));}
  const decode=(collection,fields)=>{const value=fieldsToLogical(fields,config.collections[collection].fields);for(const [k,v] of Object.entries(value))value[k]=decodeAirtable(v,types[collection][k],{json:config.collections[collection].codecs[k]==="json"});return value;};
  const encode=(collection,value)=>{const transformed={};for(const k of Object.keys(config.collections[collection].fields)){const v=value[k];if(v!==undefined&&v!==null)transformed[k]=encodeAirtable(v,types[collection][k]);}return logicalToFields(transformed,config.collections[collection].fields);};
  validateConfig(config);
  check(transport&&typeof transport.listRecords==="function"&&typeof transport.createRecord==="function"&&typeof transport.updateRecord==="function","CONFIG","transport methods required");
  async function rows(collection){
    const def=config.collections[collection];check(Boolean(def),"CONFIG","collection not configured: "+collection);
    const all=[];const offsets=new Set();let offset;
    do{
      const page=await transport.listRecords({baseId:config.baseId,tableId:def.tableId,offset,pageSize:100});
      check(page&&Array.isArray(page.records),"TRANSPORT","invalid Airtable list response");
      for(const r of page.records){check(typeof r.id==="string"&&r.fields&&typeof r.fields==="object","TRANSPORT","invalid Airtable record");all.push({recordId:r.id,value:decode(collection,r.fields)});}
      offset=page.offset||null;
      if(offset){check(!offsets.has(offset),"TRANSPORT","repeated pagination cursor");offsets.add(offset);}
    }while(offset);
    return all;
  }
  async function list(collection){return (await rows(collection)).map(r=>({...r.value}));}
  async function get(collection,id){
    check(typeof id==="string"&&id.trim(),"IDENTITY","logical ID required");
    const found=(await rows(collection)).filter(r=>r.value[ids[collection]]===id);
    check(found.length<=1,"COLLISION","multiple Airtable rows share logical ID");
    return found.length?{...found[0].value}:null;
  }
  async function upsert(collection,input,{actor="agent",allowCreate=true,authorization=null}={}){
    check(Boolean(validators[collection])&&Boolean(config.collections[collection]),"CONFIG","collection not configured");
    check(actor==="agent"||actor==="operator","ACTOR","actor must be agent or operator");
    const permission=await authorize({actor,collection,operation:"upsert",authorization,input});
    check(Boolean(permission),"AUTH","write not authorized");
    const trustedOperator=permission!==true&&permission?.actor==="operator";
    check(actor!=="operator"||trustedOperator,"AUTH","operator authority requires trusted authorization");
    const validator=validators[collection],idField=ids[collection],def=config.collections[collection];
    check(input&&typeof input==="object"&&!Array.isArray(input),"VALIDATION","record object required");
    const unexpected=Object.keys(input).filter(field=>!Object.hasOwn(def.fields,field));
    check(unexpected.length===0,"VALIDATION","unknown or unmapped fields: "+unexpected.join(", "));
    const key=input[idField];check(typeof key==="string"&&key.trim(),"IDENTITY","logical ID required");
    const existingRows=await rows(collection);
    const matches=existingRows.filter(r=>r.value[idField]===key);
    check(matches.length<=1,"COLLISION","multiple rows share logical ID");
    const existing=matches[0]||null;
    if(!existing){
      check(allowCreate,"NOT_FOUND","creation disabled");
      if(collection==="grants"){
        const candidate=duplicateKey(input);
        if(candidate){
          const duplicates=existingRows.filter(r=>{try{return duplicateKey(r.value)===candidate;}catch{return false;}});
          check(duplicates.length===0,"DUPLICATE","source identity or URL/cycle already exists; manual resolution required");
        }
      }
    }else{
      check(collection!=="search_audit","APPEND_ONLY","search audit cannot be updated");
      check(!Object.hasOwn(input,idField)||input[idField]===existing.value[idField],"IDENTITY","logical ID immutable");
      if(!trustedOperator){
        if(collection==="grants"){
          const gate=validateAgentPatch(existing.value,input);check(gate.ok,"HUMAN_FIELD",gate.errors.map(e=>e.field).join(", "));
        }else for(const field of protectedFields[collection]){
          if(Object.hasOwn(input,field)&&!equal(input[field],existing.value[field]))throw new AdapterError("HUMAN_FIELD",field+" is human-owned");
        }
      }
    }
    const merged={...(existing?.value||{}),...input};
    if(!trustedOperator&&!existing&&collection==="grants"){
      check(!Object.hasOwn(input,"stage")||input.stage==="possible","HUMAN_FIELD","agent cannot create promoted grant");
      check(!Object.hasOwn(input,"operator_notes")||!input.operator_notes,"HUMAN_FIELD","agent cannot set operator notes");
      check(!Object.hasOwn(input,"review_status")||input.review_status==="Needs Research","HUMAN_FIELD","agent cannot set human review decision on create");
    }
    const result=validator(merged);
    check(result.ok,"VALIDATION",JSON.stringify(result.errors));
    const normalized=result.value;
    // No-op detection compares only fields in configured mapping, not provider metadata.
    const target=encode(collection,normalized);
    if(existing){
      const old=encode(collection,existing.value);
      const changes={};for(const [k,v] of Object.entries(target))if(!equal(old[k],v))changes[k]=v;
      if(Object.keys(changes).length===0)return {action:"unchanged",logicalId:key,recordId:existing.recordId};
      // Recheck before writing; fail closed on intervening edits. This is not an atomic CAS.
      const fresh=(await rows(collection)).filter(r=>r.value[idField]===key);
      check(fresh.length===1 && fresh[0].recordId===existing.recordId,"CONFLICT","record changed or disappeared");
      check(equal(fresh[0].value,existing.value),"CONFLICT","record changed since read");
      const response=await transport.updateRecord({baseId:config.baseId,tableId:def.tableId,recordId:existing.recordId,fields:changes});
      check(response?.id===existing.recordId,"TRANSPORT","update response identity mismatch");
      return {action:"updated",logicalId:key,recordId:existing.recordId};
    }
    // Recheck identity and duplicate candidates immediately before creation.
    const fresh=await rows(collection);
    check(!fresh.some(r=>r.value[idField]===key),"CONFLICT","logical identity appeared during create");
    if(collection==="grants"){
      const keys=[duplicateKey(normalized)];
      const urlKey=normalized.source_url?("url:"+new URL(normalized.source_url).href.replace(/\/$/,"")+":cycle:"+(normalized.opportunity_cycle||"").trim().toLowerCase()):null;
      if(urlKey)keys.push(urlKey);
      for(const row of fresh){const g=row.value;const existingKey=duplicateKey(g);const existingUrl=g.source_url?("url:"+new URL(g.source_url).href.replace(/\/$/,"")+":cycle:"+(g.opportunity_cycle||"").trim().toLowerCase()):null;
        check(!keys.some(k=>k&&(k===existingKey||k===existingUrl)),"DUPLICATE","duplicate opportunity requires manual resolution");
      }
    }
    const response=await transport.createRecord({baseId:config.baseId,tableId:def.tableId,fields:target});
    check(typeof response?.id==="string","TRANSPORT","create response missing record ID");
    return {action:"created",logicalId:key,recordId:response.id};
  }
  return {list,get,upsert};
}
