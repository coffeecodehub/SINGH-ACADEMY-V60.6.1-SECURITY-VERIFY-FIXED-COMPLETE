import {apiFetch} from './api';

export type PublicSiteContent={
 membershipPlans?:any[];
 footerSocial?:Record<string,string>;
 websiteContent?:any;
};

let cached:PublicSiteContent|null=null;
let expiresAt=0;
let inFlight:Promise<PublicSiteContent>|null=null;
const TTL_MS=30_000;

/** Share the public site-settings request across the provider, footer, Academy page and checkout.
 * This removes duplicate /content/site requests without changing visible UI. Admin content saves
 * can still force an immediate refresh.
 */
export async function getPublicSiteContent(force=false):Promise<PublicSiteContent>{
 if(!force&&cached&&Date.now()<expiresAt)return cached;
 if(!force&&inFlight)return inFlight;
 const request=apiFetch('/content/site').then(d=>{
  const content=(d?.content||{}) as PublicSiteContent;
  cached=content;expiresAt=Date.now()+TTL_MS;
  return content;
 });
 inFlight=request;
 try{return await request;}finally{if(inFlight===request)inFlight=null;}
}
export function invalidatePublicSiteContent(){expiresAt=0;}
