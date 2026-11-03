/* ===== triage · routine · sessions · saved copies · stats · palette · settings · folder backup ===== */
let TX={},PAL={k:0,r:[]};
chrome.storage.local.get('hub_tx').then(r=>{TX=r.hub_tx||{}}).catch(()=>{});
const saveTX=()=>chrome.storage.local.set({hub_tx:TX});
const neverOpened=i=>!i.o&&!i.lo&&i.s!=='done'&&now()-i.a>7*DAY;
const go=v=>{S.view=v;save();render()};
const clickA=a=>{const b=document.querySelector('.bar [data-a="'+a+'"]');if(b)b.click()};
function setBadge(){const n=S.items.filter(i=>attn(i)||(i.sn&&i.sn.changed)||i.lc||outdated(i)).length;try{chrome.action.setBadgeText({text:n?String(n):''});chrome.action.setBadgeBackgroundColor({color:'#c2410c'})}catch(e){}}
{const _r=render;render=function(){_r.apply(this,arguments);try{setBadge()}catch(e){}}}
document.body.insertAdjacentHTML('beforeend','<dialog id="dCp"></dialog><dialog id="dSet"></dialog><dialog id="dPal"><input id="palI" placeholder="Jump to a folder or a link…  (Shift+Enter opens it anonymously)" autocomplete="off"><div id="palL"></div></dialog>');
$('.bar').insertAdjacentHTML('beforeend','<button class="btn" data-a="palOpen" title="Ctrl+K">⌘ Menu</button>');

/* ----- extras shown on cards / sidebar / home ----- */
function cardExtra(i){let x='';
 x+=`<button class="b" data-a="rdOpen" data-id="${i.id}" title="Reader: the page as clean text, with highlights">📖 Reader</button>`;
 x+=`<button class="b" data-a="qadd" data-id="${i.id}" title="Read next">${inQ(i.id)?'✓ In Read next':'📚 Read next'}</button>`;if(i.sn&&i.sn.rt)x+=`<span class="b">⏱ ${i.sn.rt} min</span>`;if(i.hl&&i.hl.length)x+=`<button class="b" data-a="hlView" data-id="${i.id}">🖍 ${i.hl.length}</button>`;
 if(i.x&&i.x.length)x+=i.x.map(l=>`<a class="b s" href="${E(l.u)}" data-oid="${i.id}" target="_blank" rel="noopener" title="${E(l.u)}">${E(l.t)} ↗</a>`).join('');
 if(i.d)x+=`<button class="b" data-a="cad" data-id="${i.id}" title="How often to check this link">🔁 ${i.cad||'daily'}</button>`;
 if(i.ls)x+=`<span class="b" title="Tracked from a GitHub list">📋 ${/\d/.test(i.ls.ver||'')?'list: '+E(i.ls.ver):'list'}</span>`;
 if(i.lc)x+=`<span class="b stale">${i.lc.gone?'📋 removed from the list':'📋 list: '+E(i.lc.from)+' → '+E(i.lc.to)}</span><button class="b" data-a="lcSeen" data-id="${i.id}">mark as seen</button>`;
 if(i.ls&&!i.v)x+=`<button class="b" data-a="use" data-id="${i.id}">✓ I use this</button>`;
 if(outdated(i))x+=`<button class="b" data-a="rn" data-id="${i.id}">📝 what’s new</button>`;
 if(i.cp)x+=`<button class="b" data-a="cpView" data-id="${i.id}">💾 copy ${ago(i.cp)}</button>`;else if(i.d||i.pin)x+=`<button class="b" data-a="cpSave" data-id="${i.id}">💾 save copy</button>`;
 if(i.o)x+=`<span class="b" title="last opened ${ago(i.lo)}">👁 ${i.o}×</span>`;
 const s=(typeof q==='string'?q:'').toLowerCase();
 if(s.length>2&&TX[i.id]){const p=TX[i.id].x.toLowerCase().indexOf(s);if(p>=0)x+=`<span class="dom" style="flex-basis:100%">…${E(TX[i.id].x.slice(Math.max(0,p-60),p+100))}…</span>`}
 return x}
function sideExtra(){const nv_=S.items.filter(neverOpened).length;
 return `<button class="nav" data-a="tri"><span>🧭 Triage</span><span>${S.items.filter(i=>i.c==='inbox').length}</span></button>`+(nv_?`<button class="nav ${S.view==='never'?'on':''}" data-v="never"><span>👻 Never opened</span><span>${nv_}</span></button>`:'')}
const CADD={daily:1,weekly:7,monthly:30};
const due=i=>{const c=i.cad||'daily',l=i.dn||0;return c==='daily'?new Date(l).toDateString()!==new Date().toDateString():now()-l>=CADD[c]*DAY-36e5};
function rrow(i,isDue){const g=glance(i);return g.slice(0,-6)+`<button class="b" data-a="cad" data-id="${i.id}" title="How often">🔁 ${i.cad||'daily'}</button>`+(isDue?`<button class="b s" data-a="rdone" data-id="${i.id}">✓ done</button>`:'')+'</div>'}
function routineHtml(day){const d=day.filter(due),dn=day.filter(i=>!due(i));
 return `<h3 class="sec">☀️ Routine <span class="dom">${dn.length}/${day.length} done</span></h3>`+(day.length?(d.length?d.map(i=>rrow(i,1)).join(''):'<div class="empty">🎉 Everything is done for now.</div>')+(dn.length?`<details><summary class="sub">Done or not due yet (${dn.length})</summary>${dn.map(i=>rrow(i,0)).join('')}</details>`:''):'<div class="empty">No daily links yet. Press 🌑 on a link to make it ☀️ daily.</div>')}
function sesHome(){const L=S.sessions||[];if(!L.length)return '';
 return '<h3 class="sec">🗂 Parked sessions</h3>'+L.map(s=>`<div class="card"><div class="t"><b>${E(s.name)}</b><span class="dom">${s.tabs.length} tabs · ${ago(s.at)}</span></div>${s.note?`<div class="why">${E(s.note)}</div>`:''}<details><summary class="sub">show tabs</summary>${s.tabs.map(t=>`<div class="ir"><span><a href="${E(t.u)}" target="_blank" rel="noopener">${E(t.t)}</a> <small>${E(dom(t.u))}</small></span></div>`).join('')}</details><div class="meta"><button class="b s" data-a="sesOpen" data-sid="${s.id}">Reopen all ↗</button><button class="b" data-a="sesAdd" data-sid="${s.id}">Add to my hub</button><button class="b" data-a="sesDel" data-sid="${s.id}">🗑 discard</button></div></div>`).join('')}
const homeTop=()=>(typeof queueHome==='function'?queueHome():'')+lstHome()+sesHome();
function homeInsights(){const top=S.items.filter(i=>i.o).sort((a,b)=>b.o-a.o).slice(0,6),nv_=S.items.filter(neverOpened).length;if(!top.length&&!nv_)return '';
 return '<h3 class="sec">📊 What you actually use <span class="dom">counted when you open links from here</span></h3>'+(top.length?`<div class="pins">${top.map(i=>`<a class="pin" href="${E(i.u)}" data-oid="${i.id}" target="_blank" rel="noopener"><img class="fav" src="${fav(i.u)}" alt="">${E(i.t)} <span class="dom">${i.o}×</span></a>`).join('')}</div>`:'')+(nv_?`<p class="sub" style="margin-top:10px">👻 ${nv_} links you saved but never opened from here. <button class="b" data-v="never">review them</button> <button class="b" data-a="tri">triage</button></p>`:'')}
/* ----- open tracking ----- */
let _tm;const trackOpen=id=>{const i=S.items.find(x=>x.id===id);if(!i)return;i.o=(i.o||0)+1;i.lo=now();clearTimeout(_tm);_tm=setTimeout(save,600)};
const trk=e=>{const a=e.target.closest&&e.target.closest('a[data-oid]');if(a)trackOpen(a.dataset.oid)};
document.addEventListener('click',trk,true);document.addEventListener('auxclick',trk,true);
document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();palOpen()}});
/* ----- saved copies ----- */
async function cpSave(i){try{const r=await tfetch(i.u,20000,{cred:'include'});if(!r.ok)return false;
 const d=new DOMParser().parseFromString(await r.text(),'text/html');d.querySelectorAll('script,style,noscript,nav,header,footer,aside,form,svg,iframe').forEach(e=>e.remove());
 const root=d.querySelector('article,main,[role=main]')||d.body,x=(root?root.textContent:'').replace(/\s+/g,' ').trim().slice(0,60000);
 if(x.length<80)return false;TX[i.id]={at:now(),x};i.cp=now();return true}catch(e){return false}}
/* ----- folder backup (File System Access API) ----- */
const idb=()=>new Promise((res,rej)=>{const r=indexedDB.open('myhub',1);r.onupgradeneeded=()=>r.result.createObjectStore('kv');r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)});
const kvGet=async k=>{const d=await idb();return new Promise(res=>{const q=d.transaction('kv').objectStore('kv').get(k);q.onsuccess=()=>res(q.result);q.onerror=()=>res(null)})};
const kvSet=async(k,v)=>{const d=await idb();return new Promise(res=>{const t=d.transaction('kv','readwrite');t.objectStore('kv').put(v,k);t.oncomplete=()=>res()})};
async function folderWrite(){const h=await kvGet('dir');if(!h)return'none';if((await h.queryPermission({mode:'readwrite'}))!=='granted')return'perm';
 const name='my-hub-backup-'+['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date().getDay()]+'.json',f=await h.getFileHandle(name,{create:true}),w=await f.createWritable();
 await w.write(JSON.stringify({app:'my-hub',v:3,at:now(),data:slim(S)},null,1));await w.close();S.lastFolder=now();save();return'ok'}
async function dirStatus(){const el=$('#sDir');if(!el)return;try{const h=await kvGet('dir');el.textContent=!h?'No folder chosen.':(await h.queryPermission({mode:'readwrite'}))==='granted'?'📁 '+h.name+' ✓'+(S.lastFolder?' · last write '+ago(S.lastFolder):''):'📁 '+h.name+' — needs permission again'}catch(e){el.textContent='Folder backup isn’t available in this browser.'}}
/* ----- settings ----- */
function setOpen(){const kb=Math.round(JSON.stringify(TX).length/1024);
 $('#dSet').innerHTML=`<h3 style="margin:0">⚙ Settings</h3>
 <label class="chk"><input type="checkbox" id="sAuto" ${S.autoCheck?'checked':''}> Re-check my links in the background every 6 hours (40 links per run, oldest first; the toolbar icon shows a badge when something needs attention; needs the browser open)</label>
 <label class="chk"><input type="checkbox" id="sLazy" ${S.lazy!==false?'checked':''}> Open many tabs lazily: with 4 or more tabs, each one loads only when you click it (no browser freeze, no videos starting on their own)</label>
 <label class="chk"><input type="checkbox" id="sView" ${S.viewer!==false?'checked':''}> Open links in a side “peek” window (Ctrl/⌘+click opens a normal tab)</label>
 <label class="chk"><input type="checkbox" id="sDock" ${S.dock!==false?'checked':''}> While peeking, move the hub to the left half of the screen (restored afterwards)</label>
 <label class="chk"><input type="checkbox" id="sPv" ${S.autoPv!==false?'checked':''}> Fetch site previews automatically while I browse the gallery (anonymous requests, 40 at a time)</label>
 <label>GitHub token (optional: raises GitHub’s limit from 60 to 5,000 requests/hour; stays in this browser)</label><input id="sTok" type="password" value="${E(S.ghToken||'')}">
 <label>Backup folder (a daily automatic copy, 7 rotating files; e.g. a Dropbox or Drive folder)</label><div class="row" style="justify-content:flex-start;flex-wrap:wrap;margin-top:4px;align-items:center"><span class="sub" id="sDir">…</span><button class="btn" data-a="dirPick">Choose folder…</button><button class="btn" data-a="dirAllow">Allow again</button><button class="btn" data-a="dirNow">Write now</button><button class="btn" data-a="dirOff">Remove</button></div>
 <label>Saved page copies</label><div class="row" style="justify-content:flex-start;margin-top:4px;align-items:center"><span class="sub">${Object.keys(TX).length} pages · about ${kb} KB (not included in backups)</span><button class="btn" data-a="cpClear">Delete all copies</button></div>
 <div class="row"><button class="btn p" data-a="close">Done</button></div>`;$('#dSet').showModal();dirStatus()}
/* ----- command palette ----- */
const CMD=()=>[];
function palRender(){const s=$('#palI').value.trim().toLowerCase();let r=CMD().filter(c=>!s||c[0].toLowerCase().includes(s)).map(c=>({l:c[0],f:c[1]}));
 if(s){r=r.concat(S.colls.filter(c=>cpath(c.id).toLowerCase().includes(s)).slice(0,5).map(c=>({l:'📁 '+cpath(c.id),f:()=>go(c.id)})));
  r=r.concat(S.items.filter(i=>(i.t+' '+i.u+' '+i.g.join(' ')).toLowerCase().includes(s)).slice(0,6).map(i=>({l:'🔗 '+i.t+' — '+dom(i.u),f:()=>{trackOpen(i.id);window.open(i.u,'_blank','noopener')},fa:()=>openAnon([i])})))}
 PAL.r=r;PAL.k=Math.min(PAL.k,Math.max(0,r.length-1));
 $('#palL').innerHTML=r.map((x,k)=>`<div class="pr ${k===PAL.k?'on':''}" data-a="palRun" data-k="${k}">${E(x.l)}</div>`).join('')||'<div class="sub">'+(s?'No matches':'Type to find a folder or a link')+'</div>'}
function palOpen(){PAL.k=0;$('#palI').value='';palRender();if(!$('#dPal').open)$('#dPal').showModal();$('#palI').focus()}
function palRun(k,anon){const x=PAL.r[k];if(!x)return;$('#dPal').close();(anon&&x.fa?x.fa:x.f)()}
$('#palI').addEventListener('input',()=>{PAL.k=0;palRender()});
$('#palI').addEventListener('keydown',e=>{if(e.key==='ArrowDown'){PAL.k=Math.min(PAL.k+1,PAL.r.length-1);palRender();e.preventDefault()}else if(e.key==='ArrowUp'){PAL.k=Math.max(PAL.k-1,0);palRender();e.preventDefault()}else if(e.key==='Enter'){e.preventDefault();palRun(PAL.k,e.shiftKey)}});
/* ----- wiring ----- */
document.addEventListener('change',e=>{const t=e.target;
 if(t.id==='sAuto'){S.autoCheck=t.checked;save()}else if(t.id==='sLazy'){S.lazy=t.checked;save()}else if(t.id==='sView'){S.viewer=t.checked;save()}else if(t.id==='sDock'){S.dock=t.checked;save()}else if(t.id==='sPv'){S.autoPv=t.checked;save()}else if(t.id==='sTok'){S.ghToken=t.value.trim()||undefined;save()}});
document.addEventListener('click',async e=>{
 const b=e.target.closest('[data-a]');if(!b)return;const a=b.dataset.a,i=S.items.find(x=>x.id===b.dataset.id),ses=(S.sessions||[]).find(x=>x.id===b.dataset.sid);
 if(a==='tri')triStart();
 else if(a==='palOpen')palOpen();
 else if(a==='palRun')palRun(+b.dataset.k);
 else if(a==='setOpen')setOpen();
 else if(a==='cad'&&i){i.cad={daily:'weekly',weekly:'monthly',monthly:'daily'}[i.cad||'daily'];save();render()}
 else if(a==='rdone'&&i){i.dn=now();if(i.sn)i.sn.changed=false;delete i.lc;save();render()}
 else if(a==='cpSave'&&i){b.textContent='…';const ok=await cpSave(i);await saveTX();save();render();if(!ok)ask('Could not save a readable copy',{msg:'The page may need JavaScript or a login.'})}
 else if(a==='cpView'&&i&&TX[i.id]){$('#dCp').innerHTML=`<h3 style="margin:0">💾 ${E(i.t)}</h3><p class="sub">Saved ${ago(TX[i.id].at)} · text only</p><div class="box"><pre style="white-space:pre-wrap;font:inherit;font-size:13px">${E(TX[i.id].x.slice(0,20000))}</pre></div><div class="row"><button class="btn" data-a="cpDel" data-id="${i.id}">Delete copy</button><button class="btn p" data-a="close">Close</button></div>`;$('#dCp').showModal()}
 else if(a==='cpDel'&&i){delete TX[i.id];delete i.cp;await saveTX();save();$('#dCp').close();render()}
 else if(a==='bCp'){const L=S.items.filter(x=>SEL.has(x.id));SEL.clear();await runPool(L,cpSave,3,(d,t)=>{prog(`Saving copies ${d}/${t}…`)});prog('');await saveTX();save();render()}
 else if(a==='cpClear'){if(await ask('Delete all saved copies?',{ok:'Delete'})){TX={};S.items.forEach(x=>delete x.cp);await saveTX();save();setOpen();render()}}
 else if(a==='sesOpen'&&ses){if(ses.tabs.length>20&&!await ask('Open '+ses.tabs.length+' tabs?',{ok:'Open'}))return;chrome.windows.create({url:ses.tabs.map(t=>S.lazy===false?t.u:lazyUrl(t.u,t.t))})}
 else if(a==='sesAdd'&&ses){const have=new Set(S.items.map(x=>nk(x.u))),cid=ensPath(['Sessions',ses.name]);
  ses.tabs.forEach(t=>{if(!have.has(nk(t.u))){S.items.push({id:uid(),t:t.t,u:t.u,w:ses.note||'From session “'+ses.name+'”.',c:cid,s:'todo',g:['session'],d:false,v:'',k:0,a:now()})}});S.view=cid;save();render()}
 else if(a==='sesDel'&&ses){if(await ask('Discard this session?',{msg:ses.name,ok:'Discard'})){S.sessions=S.sessions.filter(x=>x!==ses);save();render()}}
 else if(a==='dirPick'){try{await kvSet('dir',await showDirectoryPicker({mode:'readwrite'}))}catch(err){}dirStatus()}
 else if(a==='dirAllow'){try{const h=await kvGet('dir');if(h)await h.requestPermission({mode:'readwrite'})}catch(err){}dirStatus()}
 else if(a==='dirNow'){try{const r=await folderWrite();$('#sDir').textContent=r==='ok'?'Written ✓':r==='perm'?'Permission needed: press “Allow again”.':'Choose a folder first.'}catch(err){$('#sDir').textContent='Could not write: '+err.message}}
 else if(a==='dirOff'){await kvSet('dir',null);dirStatus()}
});
/* tidy: drop saved copies of deleted links */
{const t=setInterval(()=>{if(S){clearInterval(t);const ids=Object.keys(TX).filter(id=>!S.items.some(i=>i.id===id));if(ids.length){ids.forEach(id=>delete TX[id]);saveTX()}}},500)}
