/* shared by the hub page and the background worker */
async function tfetch(url,ms,o={}){const c=new AbortController(),t=setTimeout(()=>c.abort(),ms);
 try{return await fetch(url,{signal:c.signal,redirect:'follow',credentials:o.cred||'omit',...(o.init||{})})}finally{clearTimeout(t)}}
const CTRL={https:true,http:true};
async function probe(){const t=async u=>{try{const r=await tfetch(u,8000);try{r.body.cancel()}catch(e){}return true}catch(e){return false}};
 CTRL.https=await t('https://example.com/');CTRL.http=await t('http://example.com/');return CTRL.https}
const vars=u=>{try{const x=new URL(u),o=[u],a=new URL(u);a.protocol=x.protocol==='https:'?'http:':'https:';o.push(a.href);const w=new URL(u);w.hostname=x.hostname.startsWith('www.')?x.hostname.slice(4):'www.'+x.hostname;o.push(w.href);return o}catch(e){return[u]}};
const sameSite=(a,b)=>{const f=u=>{try{const x=new URL(u);return x.hostname.replace(/^www\./,'')+x.pathname.replace(/\/+$/,'')}catch(e){return u}};return f(a)===f(b)};
async function dnsState(h){try{const r=await tfetch('https://cloudflare-dns.com/dns-query?name='+encodeURIComponent(h)+'&type=A',8000,{init:{headers:{accept:'application/dns-json'}}});return(await r.json()).Status===3?'nx':'ok'}catch(e){return'?'}}
async function rootState(u){try{const r=await tfetch(new URL(u).origin+'/',10000,{init:{headers:{Accept:'text/html,*/*;q=0.8'}}});try{r.body.cancel()}catch(e){}return[404,410].includes(r.status)?'dead':r.status>=500?'down':'up'}catch(e){return'down'}}
async function health(i,deep){
 const res={at:Date.now()};let host='';
 try{host=new URL(i.u).hostname}catch(e){res.st='dead';res.err='invalid address';i.h=res;return res}
 const V=vars(i.u).filter(u=>CTRL.http||!/^http:/.test(u));let bad=null,net=0,tm=0;
 for(const u of V){let r;
  try{r=await tfetch(u,deep?25000:10000,{cred:deep?'include':'omit',init:{headers:{Accept:'text/html,application/xhtml+xml,*/*;q=0.8'}}});try{r.body.cancel()}catch(e){}}
  catch(e){e.name==='AbortError'?tm++:net++;continue}
  if(r.ok){res.code=r.status;
   if(u===i.u&&sameSite(i.u,r.url))res.st='ok';
   else{res.to=r.url;let p='';try{p=new URL(r.url).pathname}catch(e){}res.st=u===i.u&&(p===''||p==='/')&&new URL(i.u).pathname.length>1?'page':'moved';if(res.st==='page')res.err='redirects to the site’s home page'}
   i.h=res;return res}
  if(!bad)bad=r;
  if(![404,410].includes(r.status)&&r.status<500)break;
 }
 if(bad){res.code=bad.status;
  if([404,410].includes(bad.status)){const rt=await rootState(bad.url||i.u);
   res.st=rt==='up'?'page':rt==='down'?'down':'dead';
   res.err=rt==='up'?'this page no longer exists, but the site is online':rt==='down'?'page not found and the site isn’t answering':'page and site home both not found'}
  else{res.st=bad.status>=500?'error':'unsure';res.err=res.st==='unsure'?'site refuses automated checks':'server error'}}
 else if(tm&&!net){res.st='timeout';res.err='no answer in time'}
 else if(!CTRL.http&&/^http:/.test(i.u)){res.st='unsure';res.err='plain http can’t be tested here'}
 else{const d=await dnsState(host);res.st=d==='nx'?'dead':'down';res.err=d==='nx'?'domain no longer exists':'server not responding (domain exists)'}
 i.h=res;return res;
}

/* a tab opened lazily (or in the reader) stands for a real page: resolve it so it is never "not a web page" */
function tabReal(t){const u=t.url||'';
 if(/^chrome-extension:\/\/[^/]+\/lazy\.html/.test(u)){try{const p=new URL(u).searchParams,r=p.get('u');if(/^https?:/i.test(r||''))return{u:r,t:p.get('t')||t.title||r}}catch(e){}return null}
 return /^https?:/i.test(u)?{u,t:t.title||u}:null}
