/* ===== collections tree, selection, home, export ===== */
const SEL=new Set();
const isRoot=c=>!c.p||!S.colls.some(x=>x.id===c.p);
const cpath=id=>{const o=[];let c=S.colls.find(x=>x.id===id),g=0;while(c&&g++<20){o.unshift(c.n);c=S.colls.find(x=>x.id===c.p)}return o.join(' / ')};
const deep=(id,d=0)=>{const o=[id];if(d<20)S.colls.filter(c=>c.p===id).forEach(c=>o.push(...deep(c.id,d+1)));return o};
const cnt=id=>S.items.filter(i=>i.c===id).length;
const PROT=['inbox','daily','projects','gh'];
const emptyColls=()=>S.colls.filter(c=>!PROT.includes(c.id)&&deep(c.id).every(id=>cnt(id)===0));
const attn=i=>i.h&&['dead','soft','page','down','timeout','moved','error'].includes(i.h.st);
const nvr=s=>String(s||'').trim().replace(/^v/i,'');
const outdated=i=>{const g=gh(i.u);const ref=(i.gl&&i.gl.tag)||(i.ls&&/\d/.test(i.ls.ver||'')&&i.ls.ver)||'';return !!(g[1]&&i.v&&ref&&nvr(i.v)!==nvr(ref))};
const fav=u=>{try{return chrome.runtime.getURL('/_favicon/')+'?pageUrl='+encodeURIComponent(u)+'&size=32'}catch(e){return''}};
const VN={today:'☀️ Today',all:'📚 Everything',attn:'🩺 Needs attention',chg:'🆕 Changed',upd:'⚠️ Program updates',never:'👻 Never opened'};
function list(){
 let it=S.items;const v=S.view;
 if(v==='today')it=it.filter(i=>i.d);else if(v==='attn')it=it.filter(attn);else if(v==='chg')it=it.filter(i=>(i.sn&&i.sn.changed)||i.lc);else if(v==='never')it=it.filter(neverOpened);else if(v.startsWith('L:'))it=it.filter(i=>i.ls&&i.ls.id===v.slice(2));else if(v==='upd')it=it.filter(outdated);
 else if(v!=='all'&&v!=='home')it=it.filter(i=>i.c===v);
 const s=q.toLowerCase();if(s)it=it.filter(i=>(i.t+i.u+i.w+i.g.join(' ')+(i.hl||[]).map(h=>h.t).join(' ')).toLowerCase().includes(s)||(s.length>2&&TX[i.id]&&TX[i.id].x.toLowerCase().includes(s)));
 return fltApply(sortItems(it.slice()));
}
function sidebar(){
 const anc=new Set();{let c=S.colls.find(x=>x.id===S.view),g=0;while(c&&c.p&&g++<20){anc.add(c.p);c=S.colls.find(x=>x.id===c.p)}}
 const row=(c,d)=>{const k=S.colls.some(x=>x.p===c.id),op=!!(S.open&&S.open[c.id])||anc.has(c.id);
  return `<div class="nr" style="padding-left:${d*14}px"><i class="tg" ${k?`data-tg="${c.id}"`:''}>${k?(op?'▾':'▸'):''}</i><button class="nav ${S.view===c.id?'on':''}" data-v="${c.id}"><span>${E(c.e)} ${E(c.n)}</span><span>${cnt(c.id)}</span></button></div>`+(k&&op?S.colls.filter(x=>x.p===c.id).map(x=>row(x,d+1)).join(''):'')};
 const nv=(v,l,n)=>`<button class="nav ${S.view===v?'on':''}" data-v="${v}"><span>${l}</span><span>${n}</span></button>`;
 $('#side').innerHTML='<h1>🧭 My Hub</h1>'+nv('home','🏠 Home','')+nv('today','☀️ Today',S.items.filter(i=>i.d).length)+nv('all','📚 Everything',S.items.length)+nv('attn','🩺 Needs attention',S.items.filter(attn).length)+sideExtra()+'<hr class="sp">'+S.colls.filter(isRoot).map(c=>row(c,0)).join('')+'<button class="nav" data-a="newColl"><span>+ New collection</span></button>'+(emptyColls().length?`<button class="nav" data-a="cleanEmpty"><span>🧹 Clean ${emptyColls().length} empty folders</span></button>`:'');
}
function card(i){
 const g=gh(i.u),col=S.colls.find(c=>c.id===i.c),h=i.h,sn=i.sn,gl=i.gl;let x='';
 if(g[1]){const dd=i.k?Math.floor((now()-i.k)/DAY):null,upd=outdated(i);
  x+=`<span class="b ${upd||dd===null||dd>30?'stale':''}">${i.v?'v'+E(nvr(i.v)):'version ?'} · latest ${gl&&gl.tag?E(gl.tag):'?'}${upd?' ⚠️ update':''} · checked ${dd===null?'never':dd+'d ago'}${gl&&gl.push?' · last commit '+ago(gl.push):''}</span>`+
   (gl&&gl.err?`<span class="b stale">${E(gl.err)}</span>`:'')+`<a class="b" target="_blank" rel="noopener" href="https://github.com/${E(g[1])}/${E(g[2])}/releases">Releases ↗</a><button class="b" data-a="chk" data-id="${i.id}">✓ Checked</button>`}
 if(h&&HB[h.st])x+=`<span class="b stale" title="${E(h.err||'')}">${HB[h.st][0]} ${HB[h.st][1]}${h.code?' ('+h.code+')':''}</span>`+(h.st==='moved'?`<button class="b" data-a="useNew" data-id="${i.id}">use new address</button>`:'')+(['page','soft'].includes(h.st)?`<button class="b" data-a="useHome" data-id="${i.id}">go to site home</button>`:'')+(['dead','soft','page','down','timeout'].includes(h.st)?`<a class="b" target="_blank" rel="noopener" href="https://web.archive.org/web/*/${E(i.u)}">Wayback ↗</a>`:'');
 else if(h&&h.st==='ok')x+=`<span class="b" title="checked ${ago(h.at)}">✓ alive</span>`;
 let sb='';
 if(sn){const hs=sn.heads||[];sb=`<div class="snap">${sn.img?`<img src="${E(sn.img)}" referrerpolicy="no-referrer" loading="lazy" alt="">`:''}<div>${sn.changed?'<span class="b stale">🆕 changed</span> ':''}${sn.err?`<span class="b stale">${E(sn.err)}</span> `:''}<span class="dom">updated ${ago(sn.at)}</span>${sn.desc?`<div>${E(sn.desc)}</div>`:''}${hs.length?`<ul>${hs.map(t=>`<li>${E(t)}</li>`).join('')}</ul>`:''}${!sn.desc&&!hs.length&&!sn.err?'<div class="dom">No readable text (this page probably needs JavaScript).</div>':''}${sn.changed?`<button class="b" data-a="seen" data-id="${i.id}">mark as seen</button>`:''}</div></div>`}
 return `<div class="card ${i.s==='done'?'done':''}" data-hid="${i.id}"><div class="t"><div><input type="checkbox" class="sel" data-s="${i.id}" ${SEL.has(i.id)?'checked':''}><img class="fav" src="${fav(i.u)}" alt=""><a href="${E(i.u)}" data-oid="${i.id}" target="_blank" rel="noopener">${E(i.t)}</a> <span class="dom">${E(dom(i.u))}</span></div>
 <div class="act"><button title="Open anonymously (private window). Shift+click a title does the same" data-a="anon" data-id="${i.id}">🕶</button><button title="Pin to Home" data-a="pin" data-id="${i.id}">${i.pin?'📌':'📍'}</button><button title="Refresh snapshot" data-a="refresh" data-id="${i.id}">↻</button><button title="Daily" data-a="day" data-id="${i.id}">${i.d?'☀️':'🌑'}</button><button title="Edit" data-a="edit" data-id="${i.id}">✏️</button><button title="Delete" data-a="del" data-id="${i.id}">🗑</button></div></div>
 <div class="why">${E(i.w)}</div>${sb}
 <div class="meta"><button class="b s" data-a="cyc" data-id="${i.id}">${ST[i.s]}</button>${['all','today','attn','chg','upd','home'].includes(S.view)?`<span class="b">${col?E(col.e+' '+cpath(col.id)):''}</span>`:''}${i.g.map(t=>`<span class="b">#${E(t)}</span>`).join('')}${x}${cardExtra(i)}</div></div>`;
}
function glance(i){const sn=i.sn,gl=i.gl;
 const line=gl&&gl.tag?`latest ${gl.tag}${outdated(i)?' ⚠️ you have '+nvr(i.v):''}${sn&&sn.changed?' · 🆕 new commits':''}`:sn?(sn.changed?'🆕 ':'')+((sn.heads&&sn.heads[0])||sn.desc||sn.err||'no readable text'):(i.w||dom(i.u));
 return `<div class="ir2"><img class="fav" src="${fav(i.u)}" alt=""><a href="${E(i.u)}" data-oid="${i.id}" target="_blank" rel="noopener">${E(i.t)}</a><span class="dom">${E(line)}</span><span class="dom">${sn?ago(sn.at):''}</span><button class="b" data-a="refresh" data-id="${i.id}">↻</button></div>`}
function home(){
 const hr=new Date().getHours(),gr=hr<5?'Good night':hr<12?'Good morning':hr<18?'Good afternoon':'Good evening';
 const day=S.items.filter(i=>i.d),chg=S.items.filter(i=>(i.sn&&i.sn.changed)||i.lc),upd=S.items.filter(outdated),att=S.items.filter(attn),inb=S.items.filter(i=>i.c==='inbox'),pins=S.items.filter(i=>i.pin);
 const tile=(v,ic,l,n,w)=>`<button class="tile ${w&&n?'w':''}" data-v="${v}"><b>${n}</b><span>${ic} ${l}</span></button>`;
 const tot=id=>deep(id).reduce((s,x)=>s+cnt(x),0);
 let h=`<div class="hero"><div><h1>${gr} 👋</h1><p class="sub" style="margin:2px 0 0">${new Date().toLocaleDateString(undefined,{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</p></div><div class="row" style="margin:0"><button class="btn p" data-a="homeRef">↻ Refresh dailies</button><button class="btn" data-a="homeOpen">Open dailies ↗</button></div></div>
 <div class="tiles">${tile('today','☀️','Daily links',day.length)+tile('chg','🆕','Changed',chg.length,1)+tile('upd','⚠️','Program updates',upd.length,1)+tile('attn','🩺','Need attention',att.length,1)+tile('inbox','📥','To sort (Inbox)',inb.length)+tile('all','📚','All links',S.items.length)}</div>`;
 h+=homeTop();
 if(!S.items.length)h+='<div class="card"><b>Start here</b><ol><li>Press <b>⬇ Import bookmarks</b> to bring in your old favorites. They are tested first, and your folders are kept.</li><li>Use the toolbar button on any tab to save it with a note on why.</li><li>Press 🌑 on sites you check every day, then <b>↻ Refresh dailies</b> to see their latest headlines here.</li></ol></div>';
 if(S.items.length&&(!S.lastFile||now()-S.lastFile>14*DAY))h+=`<div class="card">💾 ${S.lastFile?'Your last backup file is '+Math.floor((now()-S.lastFile)/DAY)+' days old.':'You have never saved a backup file.'} <button class="btn p" data-a="bk">Back up now</button></div>`;
 if(pins.length)h+=`<h3 class="sec">📌 Pinned</h3><div class="pins">${pins.map(i=>`<a class="pin" href="${E(i.u)}" data-oid="${i.id}" target="_blank" rel="noopener"><img class="fav" src="${fav(i.u)}" alt="">${E(i.t)}</a>`).join('')}</div>`;
 if(chg.length)h+='<h3 class="sec">🆕 Changed since you last looked</h3>'+chg.slice(0,6).map(card).join('');
 if(upd.length)h+='<h3 class="sec">⚠️ Programs with updates</h3>'+upd.slice(0,6).map(card).join('');
 h+=routineHtml(day);
 const rec=S.items.slice().sort((a,b)=>b.a-a.a).slice(0,5);
 if(rec.length)h+='<h3 class="sec">🕘 Recently added</h3>'+railHtml(rec);
 h+=homeInsights();
 const roots=S.colls.filter(isRoot);
 h+=`<h3 class="sec">📁 Collections</h3><div class="tiles">${roots.map(c=>`<button class="tile" data-v="${c.id}"><b>${tot(c.id)}</b><span>${E(c.e+' '+c.n)}</span></button>`).join('')}</div>`;
 return h;
}
function bulkBar(){let e=$('#bulk');if(!e){document.body.insertAdjacentHTML('beforeend','<div id="bulk"></div>');e=$('#bulk')}
 e.style.display=SEL.size?'flex':'none';
 e.innerHTML=SEL.size?`<b>${SEL.size} selected</b><button class="btn" data-a="selAll">all in view</button><select id="bMv"><option value="">Move to…</option>${S.colls.map(c=>`<option value="${c.id}">${E(c.e+' '+cpath(c.id))}</option>`).join('')}</select><button class="btn" data-a="bDay">☀️ daily</button><button class="btn" data-a="bUse" title="Set my installed version from the list">✓ I use these</button><button class="btn" data-a="bCp">💾 copies</button><button class="btn" data-a="bExp">⬆ Export</button><button class="btn" data-a="bShare">🔗 Share</button><button class="btn" data-a="bDel">🗑 Delete</button><button class="btn" data-a="selClr">✕</button>`:''}
function render(){
 if(!S)return;sidebar();
 const v=S.view,c=S.colls.find(x=>x.id===v);
 if(v==='home'&&!q){$('#head').innerHTML='';$('#list').innerHTML=home();bulkBar();return}
 const L=list(),name=v==='home'?'🔎 Search results':VN[v]||(c?c.e+' '+cpath(c.id):'')||(v.startsWith('L:')?'📋 '+listName(v.slice(2)):'');
 const sub=v==='today'?'Your daily set: links flagged ☀️.':v==='inbox'?'Triage: give each link a collection and a reason, or delete it.':v==='attn'?'Links that failed a check. Checks can be wrong, so open a few before deleting.':v==='upd'?'Programs where your installed version differs from the latest release.':' ';
 const par=c&&c.p?S.colls.find(x=>x.id===c.p):null;
 const chips=(par?`<button class="b" data-v="${par.id}">⬆ ${E(par.n)}</button> `:'')+(c?S.colls.filter(x=>x.p===c.id).map(k=>`<button class="b" data-v="${k.id}">${E(k.e+' '+k.n)} (${cnt(k.id)})</button>`).join(' '):'');
 $('#head').innerHTML=headHtml(v,c,L,name,sub,chips);
 $('#list').innerHTML=L.length?L.map(card).join(''):'<div class="empty">Nothing here yet.</div>';
 bulkBar();
}
/* export as a standard bookmarks file */
function toNetscape(items,keep){
 const by={};items.forEach(i=>(by[i.c]=by[i.c]||[]).push(i));
 const has=(id,d=0)=>d<20&&((by[id]||[]).length||S.colls.some(c=>c.p===id&&has(c.id,d+1)));
 const A=i=>`<DT><A HREF="${E(i.u)}" ADD_DATE="${Math.floor((i.a||now())/1000)}"${i.g&&i.g.length?` TAGS="${E(i.g.join(','))}"`:''}>${E(i.t)}</A>`+(i.w?`\n<DD>${E(i.w)}`:'');
 const F=c=>`<DT><H3>${E(c.n)}</H3>\n<DL><p>\n`+(by[c.id]||[]).map(A).join('\n')+'\n'+S.colls.filter(k=>k.p===c.id&&has(k.id)).map(F).join('\n')+'\n</DL><p>';
 const orph=items.filter(i=>!S.colls.some(c=>c.id===i.c));
 const body=keep?S.colls.filter(c=>isRoot(c)&&has(c.id)).map(F).concat(orph.map(A)).join('\n'):items.map(A).join('\n');
 return `<!DOCTYPE NETSCAPE-Bookmark-file-1>\n<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">\n<TITLE>Bookmarks</TITLE>\n<H1>Bookmarks</H1>\n<DL><p>\n${body}\n</DL><p>\n`}
const viewItems=()=>{const v=S.view;if(S.colls.some(c=>c.id===v)){const ids=deep(v);return S.items.filter(i=>ids.includes(i.c))}return list()};
function openExp(sel){
 const r=(v,l,n,d)=>`<label class="chk"><input type="radio" name="xs" value="${v}" ${d?'disabled':''} ${(sel?v==='sel':v==='all')?'checked':''}> ${l} (${n})</label>`;
 $('#dExp').innerHTML=`<h3 style="margin:0">Export as a bookmarks file</h3><p class="sub">Makes a standard .html bookmarks file that Chrome, Edge, Firefox, Brave and Safari can import as favorites.</p>
 ${r('all','Everything',S.items.length)+r('view','Current view (with subfolders)',viewItems().length)+r('sel','Selected links',SEL.size,!SEL.size)+r('day','Only ☀️ daily links',S.items.filter(i=>i.d).length)}
 <label class="chk"><input type="checkbox" id="xf" checked> Keep my folder structure</label><label class="chk"><input type="checkbox" id="xd" checked> Leave out links marked dead</label>
 <div class="row"><button class="btn" data-a="xClose">Cancel</button><button class="btn p" data-a="xGo">Download</button></div>`;
 $('#dExp').showModal()}
function doExport(){
 const sc=document.querySelector('input[name=xs]:checked').value,keep=$('#xf').checked,nd=$('#xd').checked;
 let it=sc==='all'?S.items:sc==='view'?viewItems():sc==='sel'?S.items.filter(i=>SEL.has(i.id)):S.items.filter(i=>i.d);
 if(nd)it=it.filter(i=>!(i.h&&i.h.st==='dead'));
 if(!it.length)return;
 const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([toNetscape(it,keep)],{type:'text/html'}));
 a.download='my-hub-bookmarks-'+new Date().toISOString().slice(0,10)+'.html';document.body.appendChild(a);a.click();a.remove();$('#dExp').close()}
/* wiring */
document.body.insertAdjacentHTML('beforeend','<dialog id="dExp"></dialog>');
document.addEventListener('error',e=>{if(e.target.tagName==='IMG')e.target.style.display='none'},true);
document.addEventListener('keydown',e=>{if(e.key==='/'&&!/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)){e.preventDefault();$('#q').focus()}});
document.addEventListener('change',e=>{const t=e.target;
 if(t.dataset&&t.dataset.s){t.checked?SEL.add(t.dataset.s):SEL.delete(t.dataset.s);bulkBar()}
 else if(t.id==='bMv'&&t.value){S.items.forEach(i=>SEL.has(i.id)&&(i.c=t.value));SEL.clear();save();render()}});
document.addEventListener('click',async e=>{
 const tg=e.target.closest('[data-tg]');if(tg){S.open=S.open||{};S.open[tg.dataset.tg]=!S.open[tg.dataset.tg];save();render();return}
 const b=e.target.closest('[data-a]');if(!b)return;const a=b.dataset.a,i=S.items.find(x=>x.id===b.dataset.id),c=S.colls.find(x=>x.id===S.view);
 if(a==='pin'){i.pin=!i.pin;save();render()}
 else if(a==='newSub'&&c){const n=await ask('New subfolder in “'+c.n+'”',{val:''});if(!n||!n.trim())return;const em=await ask('Emoji',{val:'📁'});const k={id:uid(),n:n.trim(),e:em||'📁',p:c.id};S.colls.push(k);S.open=S.open||{};S.open[c.id]=true;S.view=k.id;save();render()}
 else if(a==='ren'&&c){const n=await ask('Rename collection',{val:c.n});if(n&&n.trim()){c.n=n.trim();save();render()}}
 else if(a==='homeRef'){const L=S.items.filter(x=>x.d);if(!L.length)return;await runPool(L,snapshot,4,(d,t)=>{prog(`Refreshing ${d}/${t}…`);if(d%3===0)render()});prog('');save();render()}
 else if(a==='homeOpen'){openMany(S.items.filter(x=>x.d&&x.s!=='done'))}
 else if(a==='selAll'){list().forEach(x=>SEL.add(x.id));render()}
 else if(a==='selClr'){SEL.clear();render()}
 else if(a==='bDay'){S.items.forEach(x=>SEL.has(x.id)&&(x.d=true));SEL.clear();save();render()}
 else if(a==='bDel'){if(await ask('Delete '+SEL.size+' links?',{ok:'Delete'})){if(typeof autoBackup==='function')autoBackup('before delete',true);S.items=S.items.filter(x=>!SEL.has(x.id));SEL.clear();save();render()}}
 else if(a==='useHome'){try{i.u=new URL(i.u).origin+'/';i.h={st:'ok',at:now()};save();render()}catch(e){}}
 else if(a==='cleanEmpty'){const E2=emptyColls();if(!E2.length)return;if(await ask('Remove '+E2.length+' empty folders?',{msg:'Folders with no links inside them (subfolders included) are removed. No links are touched.',ok:'Remove'})){if(typeof autoBackup==='function')autoBackup('before cleaning folders',true);const ids=new Set(E2.map(c=>c.id));S.colls=S.colls.filter(c=>!ids.has(c.id));S.view='home';save();render()}}
 else if(a==='exp'||a==='bExp')openExp(a==='bExp');
 else if(a==='xClose')$('#dExp').close();
 else if(a==='xGo')doExport();
});
