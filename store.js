const SEED=false;
const store={async load(){const r=await chrome.storage.local.get('hub1');return r.hub1||null},save(d){return chrome.storage.local.set({hub1:d})},
watch(cb){chrome.storage.onChanged.addListener((c,a)=>{if(a==='local'&&c.hub1)cb(c.hub1.newValue)})}};
