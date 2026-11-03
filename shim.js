/* Minimal chrome.* emulation so the extension's hub page runs as a normal web app / PWA / Capacitor app. */
(function(){
 const P='hubx:',ls=localStorage,ls_=(k)=>{try{return JSON.parse(ls.getItem(P+k))}catch(e){return null}};
 const subs=[];
 const storage={
  async get(keys){const o={};const ks=keys==null?Object.keys(ls).filter(k=>k.startsWith(P)).map(k=>k.slice(P.length)):[].concat(typeof keys==='object'&&!Array.isArray(keys)?Object.keys(keys):keys);
   ks.forEach(k=>{const v=ls_(k);if(v!==null)o[k]=v;else if(keys&&typeof keys==='object'&&!Array.isArray(keys))o[k]=keys[k]});return o},
  async set(obj){const ch={};for(const k in obj){const old=ls_(k);ls.setItem(P+k,JSON.stringify(obj[k]));ch[k]={oldValue:old,newValue:obj[k]}}subs.forEach(f=>f(ch,'local'))},
  async remove(keys){[].concat(keys).forEach(k=>ls.removeItem(P+k))}};
 const noop=async()=>{},open=u=>{try{window.open(u,'_blank','noopener')}catch(e){}};
 window.chrome={
  storage:{local:storage,onChanged:{addListener:f=>subs.push(f)}},
  runtime:{getURL:p=>new URL(p,location.href).href,sendMessage:()=>Promise.resolve(),onMessage:{addListener(){}},onInstalled:{addListener(){}}},
  tabs:{create:({url})=>{open(url);return Promise.resolve({})},query:async()=>[],update:noop,remove:noop,get:noop,sendMessage:noop,
        onUpdated:{addListener(){}},onCreated:{addListener(){}},onRemoved:{addListener(){}}},
  windows:{create:async({url}={})=>{[].concat(url||[]).forEach(open);return{}},update:noop,get:async()=>({}),getCurrent:async()=>({}),remove:noop,
           onRemoved:{addListener(){}},onBoundsChanged:{addListener(){}}},
  action:{setBadgeText:noop,setBadgeBackgroundColor:noop},
  alarms:{create:noop,get:(n,cb)=>cb&&cb(null),onAlarm:{addListener(){}}},
  scripting:{executeScript:async()=>{throw new Error('not available')}}
 };
 window.addEventListener('storage',e=>{if(e.key&&e.key.startsWith(P)){const k=e.key.slice(P.length);subs.forEach(f=>f({[k]:{oldValue:null,newValue:ls_(k)}},'local'))}});
})();
