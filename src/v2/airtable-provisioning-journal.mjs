// Durable local provisioning journal. Use an operator-controlled persistent directory.
// This is a single-host journal, not a distributed lock; do not run multiple installers
// against the same installation ID concurrently across hosts.
import {mkdir,readFile,writeFile,rename,open} from "node:fs/promises";
import {join} from "node:path";
import {createHash,randomUUID} from "node:crypto";
const safeKey=k=>{if(typeof k!=="string"||!k.trim())throw Error("installation ID required");return createHash("sha256").update(k).digest("hex");};
export function createFileProvisioningJournal({directory}={}){
 if(typeof directory!=="string"||!directory.trim())throw Error("persistent journal directory required");
 const path=k=>join(directory,safeKey(k)+".json");
 return {
  async load(key){
   try{return JSON.parse(await readFile(path(key),"utf8"));}
   catch(e){if(e.code==="ENOENT")return null;throw e;}
  },
  async save(key,state){
   if(!state||state.installationId!==key)throw Error("journal installation identity mismatch");
   await mkdir(directory,{recursive:true,mode:0o700});
   const temp=path(key)+"."+randomUUID()+".tmp";
   const handle=await open(temp,"wx",0o600);
   try{await handle.writeFile(JSON.stringify(state));await handle.sync();}finally{await handle.close();}
   await rename(temp,path(key));
  }
 };
}
