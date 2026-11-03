// Single-host exclusive coordinator using atomic directory creation.
// Not a distributed lock. Never auto-break stale locks: operator reconciliation required.
import {mkdir,rmdir} from "node:fs/promises";
import {join} from "node:path";
import {createHash} from "node:crypto";
export class ProvisioningLockError extends Error{constructor(code,message){super(message);this.name="ProvisioningLockError";this.code=code;}}
export function createLocalProvisioningCoordinator({directory}={}){
 if(typeof directory!=="string"||!directory.trim())throw new ProvisioningLockError("CONFIG","persistent lock directory required");
 const hash=id=>createHash("sha256").update(id).digest("hex");
 return {scope:"single-host",async withExclusive(installationId,fn){
  if(typeof installationId!=="string"||!installationId.trim()||typeof fn!=="function")throw new ProvisioningLockError("CONFIG","installation ID and callback required");
  await mkdir(directory,{recursive:true,mode:0o700});
  const lockPath=join(directory,hash(installationId)+".lock");
  try{await mkdir(lockPath,{mode:0o700});}
  catch(e){if(e.code==="EEXIST")throw new ProvisioningLockError("LOCKED","installation already active or stale; reconcile manually");throw e;}
  try{return await fn();}
  finally{await rmdir(lockPath);}
 }};
}
