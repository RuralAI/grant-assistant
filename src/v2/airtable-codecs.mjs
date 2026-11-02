// Airtable field codecs and schema preflight. All writes use field IDs.
export class AirtableSchemaError extends Error {constructor(message){super(message);this.name="AirtableSchemaError";}}
const scalar=new Set(["singleLineText","multilineText","email","phoneNumber","url","singleSelect","number","currency","percent","date","dateTime","checkbox"]);
export function verifyAirtableSchema(config,schema){
  if(!schema||!Array.isArray(schema.tables))throw new AirtableSchemaError("metadata tables required");
  for(const [name,def] of Object.entries(config.collections)){
    const table=schema.tables.find(t=>t.id===def.tableId);
    if(!table)throw new AirtableSchemaError("missing table "+name);
    const seen=new Set();
    for(const [logical,fieldId] of Object.entries(def.fields)){
      const field=table.fields?.find(f=>f.id===fieldId);
      if(!field)throw new AirtableSchemaError("missing field "+name+"."+logical);
      if(seen.has(fieldId))throw new AirtableSchemaError("duplicate field mapping");
      seen.add(fieldId);
      if(!scalar.has(field.type))throw new AirtableSchemaError("unsupported field type "+field.type+" for "+logical);
      if(field.type==="singleSelect" && field.options?.choices && field.options.choices.length===0)throw new AirtableSchemaError("empty select choices");
    }
  }
  return true;
}
export function encodeAirtable(value,type){
  if(value===undefined)return undefined;
  if(value===null)return null;
  if(["singleLineText","multilineText"].includes(type)&&typeof value==="object")return JSON.stringify(value);
  if(type==="checkbox"){if(typeof value!=="boolean")throw new AirtableSchemaError("checkbox must be boolean");return value;}
  if(["number","currency","percent"].includes(type)){if(typeof value!=="number"||!Number.isFinite(value))throw new AirtableSchemaError("numeric field expected");return value;}
  if(typeof value!=="string")throw new AirtableSchemaError("string expected for "+type);
  return value;
}
export function decodeAirtable(value,type,{json=false}={}){
  if(value===undefined||value===null)return null;
  if(json){if(typeof value!=="string")throw new AirtableSchemaError("JSON text expected");try{return JSON.parse(value);}catch{throw new AirtableSchemaError("invalid JSON text");}}
  return value;
}
