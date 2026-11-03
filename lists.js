/* ===== GitHub lists: parse, import, sync · program inventory · release notes ===== */
const RES_OWN=/^(features|topics|sponsors|orgs|marketplace|collections|trending|about|login|signup|pricing|enterprise|settings|apps|search|explore|notifications|pulls|issues|readme|site|security|contact|customer-stories|resources|solutions|why-github|open-source|team|events)$/i;
const ghRepo=u=>{const m=String(u).match(/^https?:\/\/(?:www\.)?github\.com\/([^\/#?\s]+)\/([^\/#?\s]+)(\/(?:tree|blob)\/[^#?\s]*)?/i);return !m||RES_OWN.test(m[1])?null:{o:m[1],r:m[2].replace(/\.git$/,''),p:(m[3]||'').replace(/\/+$/,'')}};
const repoUrl=rp=>`https://github.com/${rp.o}/${rp.r}${rp.p}`;
const repoKey=rp=>(rp.o+'/'+rp.r+rp.p).toLowerCase();
const cleanMd=s=>String(s||'').replace(/!\[[^\]]*\]\([^)]*\)/g,'').replace(/\[([^\]]*)\]\([^)]*\)/g,'$1').replace(/~~/g,'').replace(/<[^>]+>/g,'').replace(/\\([\\`*_{}\[\]()#+\-.!|])/g,'$1').replace(/[`*]/g,'').replace(/(^|\s)_+|_+(?=\s|$)/g,'$1').trim();
const mdLinks=s=>[...String(s).replace(/!\[[^\]]*\]\([^)]*\)/g,'').matchAll(/\[([^\]]*)\]\((https?:\/\/[^)\s]+)(?:\s+"[^"]*")?\)/g)].map(m=>({t:cleanMd(m[1]),u:m[2]}));
const ghH=()=>S.ghToken?{Authorization:'Bearer '+S.ghToken,Accept:'application/vnd.github+json'}:{Accept:'application/vnd.github+json'};
function parseList(md){
 const out=[],seen=new Set();let stack=[],title='',inT=false,hd=[];
 const cells=l=>l.replace(/^\s*\|/,'').replace(/\|\s*$/,'').split(/(?<!\\)\|/).map(c=>c.trim());
 const bad=v=>!v||/^(\?+|n\/a|-+|—|none|unknown|down)$/i.test(v);
 const strk=c=>/^\s*~~[\s\S]*~~\s*$/.test(c||'');
 const lab=x=>/^(link|here|url|page|site|website|demo)?$/i.test(x.t)?dom(x.u):x.t;
 const mk=(main,all,o)=>{const rp=ghRepo(main.u),url=rp?repoUrl(rp):main.u;let k=rp?repoKey(rp):nk(url);const t=(o.title||'').trim()||main.t||(rp?rp.r:url);
  if(seen.has(k))k+='#'+nn(t);if(seen.has(k))return;seen.add(k);
  const sk=new Set([nk(main.u)]),x=[];
  for(const q of all){if(q===main)continue;const z=nk(q.u);if(sk.has(z))continue;sk.add(z);const qr=ghRepo(q.u);x.push({t:lab(q)||dom(q.u),u:qr?repoUrl(qr):q.u})}
  out.push({k,t,u:url,ver:o.ver||'',upd:o.upd||'',sys:o.sys||'',struck:!!o.struck,sec:o.sec,desc:o.desc||'',x:x.slice(0,3)})};
 for(const raw of String(md).split(/\r?\n/)){const l=raw.trim();
  const hm=l.match(/^(#{1,6})\s+(.+?)\s*#*$/);
  if(hm){const lv=hm[1].length,nm=cleanMd(hm[2]);if(lv===1&&!title)title=nm;stack[lv]=nm;stack.length=lv+1;inT=false;continue}
  const sec=stack.slice(2).filter(Boolean);
  if(l.startsWith('|')){const cs=cells(l);
   if(!inT){inT=true;hd=cs.map(c=>cleanMd(c).toLowerCase());continue}
   if(cs.every(c=>/^:?-{2,}:?$/.test(c)))continue;
   const ix=re=>hd.findIndex(h=>re.test(h)),iT=ix(/^(title|game|name|project|software|app|tool|port)/),iV=ix(/version/),iD=ix(/updated|date/),iS=ix(/^(system|platform|type|category)/),iL=ix(/^(link|repo|source|github|url)/);
   const all=cs.flatMap((c,k)=>mdLinks(c).map(x=>({...x,k})));
   const main=(iL>=0&&all.find(x=>x.k===iL&&ghRepo(x.u)))||all.find(x=>ghRepo(x.u))||(iL>=0&&all.find(x=>x.k===iL))||all[0];if(!main)continue;
   const ver=iV>=0?cleanMd(cs[iV]):'',upd=iD>=0?cleanMd(cs[iD]):'';
   mk(main,all,{title:iT>=0?cleanMd(cs[iT]):'',ver:bad(ver)?'':ver,upd:bad(upd)?'':upd,sys:iS>=0?cleanMd(cs[iS]):'',struck:strk(cs[iT])||strk(cs[iV])||/\[\s*~~/.test(cs[iL]||''),sec});continue}
  inT=false;
  const bm=l.match(/^(?:[-*+]|\d+[.)])\s+(.*)$/);
  if(bm){const ls=mdLinks(bm[1]),main=ls.find(x=>ghRepo(x.u))||ls[0];if(!main)continue;
   mk(main,ls,{struck:/^\s*~~/.test(bm[1]),desc:cleanMd(bm[1].replace(/\[[^\]]*\]\([^)]*\)/,'')).replace(/^[\s\-–—:]+/,'').slice(0,200),sec})}}
 return{title,entries:out}}
async function fetchList(src){
 const s=String(src).trim(),m=s.match(/github\.com\/([^\/\s]+)\/([^\/#?\s]+)(?:\/(?:blob|tree)\/([^\/]+)\/([^#?]+))?/i)||s.match(/^([\w.-]+)\/([\w.-]+)$/);
 if(!m)throw new Error('paste a GitHub repository address, e.g. https://github.com/owner/repo');
 const o=m[1],r=m[2].replace(/\.git$/,''),ref=m[3],path=m[4],H={Accept:'application/vnd.github.raw+json'};if(S.ghToken)H.Authorization='Bearer '+S.ghToken;
 const get=async u=>{const x=await tfetch(u,20000,{init:{headers:H}});return x.ok?x.text():null};
 let t=path?await get(`https://raw.githubusercontent.com/${o}/${r}/${ref}/${path}`):await get(`https://api.github.com/repos/${o}/${r}/readme`);
 if(t===null&&!path)t=await get(`https://raw.githubusercontent.com/${o}/${r}/HEAD/README.md`);
 if(t===null)throw new Error('the repository is not public or has no README');
 return{o,r,text:t}}
async function lstSync(id){const L=(S.lists||[]).find(x=>x.id===id);if(!L)return null;
 const p=parseList((await fetchList(L.o+'/'+L.r)).text),byK=new Map(p.entries.map(e=>[e.k,e]));let vc=0,gone=0,back=0;
 S.items.forEach(i=>{if(!i.ls||i.ls.id!==id)return;const e=byK.get(i.ls.k);
  if(!e||e.struck){if(!i.ls.gone){i.ls.gone=true;i.lc={gone:true,at:Date.now()};gone++}return}
  if(i.ls.gone){delete i.ls.gone;back++}
  if(e.ver&&i.ls.ver!==e.ver){i.lc={from:i.ls.ver||'?',to:e.ver,at:Date.now()};i.ls.ver=e.ver;vc++}
  if(e.upd)i.ls.upd=e.upd});
 const fresh=p.entries.filter(e=>!L.seen.includes(e.k));L.at=Date.now();L.news=fresh.length;return{L,p,fresh,vc,gone,back}}
let LST=null;
document.body.insertAdjacentHTML('beforeend','<dialog id="dLst"></dialog><dialog id="dRn"></dialog>');
const lst0=()=>`<h3 style="margin:0">Track a GitHub list</h3><p class="sub">Paste the address of a repository whose README is a list of projects (an “awesome” list, a table of ports…). Every entry becomes a link you can monitor, grouped by the list’s own sections. Later you can sync to see new entries, removed entries and version changes.</p><input id="lsU" placeholder="https://github.com/owner/repo"><div class="sub" id="lsE"></div><div class="row"><button class="btn" data-a="close">Cancel</button><button class="btn p" data-a="lstRead">Read list</button></div>`;
function lstOpen(){LST=null;$('#dLst').innerHTML=lst0();$('#dLst').showModal()}
async function lstRead(){const el=$('#lsE');el.textContent='Reading…';
 try{const r=await fetchList($('#lsU').value),ex=(S.lists||[]).find(x=>x.o.toLowerCase()===r.o.toLowerCase()&&x.r.toLowerCase()===r.r.toLowerCase());
  if(ex){$('#dLst').close();return lstSyncRun(ex.id)}
  const p=parseList(r.text);if(!p.entries.length){el.textContent='I could not find any links in that README.';return}
  const gen=!p.title||p.title.length<2||/^(disclaimer|readme|read me|table of contents|contents|toc|introduction|intro|about|welcome|notice|warning|license|description|overview)$/i.test(p.title);
  LST={o:r.o,r:r.r,title:p.title||r.r,name:gen?r.r:p.title,entries:p.entries,list:null};$('#dLst').innerHTML=lst1();lstCnt()}
 catch(e){el.textContent='Could not read that list: '+e.message}}
function lst1(msg){const inHub=new Set(S.items.map(i=>nk(i.u))),gs=new Map(),SP=['🔗 Already in your hub (will be linked to this list)','🚫 Marked as removed/down in the list'];
 LST.entries.forEach((e,n)=>{e.n=n;e.hub=inHub.has(nk(e.u));const g=e.hub?SP[0]:e.struck?SP[1]:(e.sec.length?e.sec[e.sec.length-1]:'General');if(!gs.has(g))gs.set(g,[]);gs.get(g).push(e)});
 const keys=[...gs.keys()].sort((a,b)=>SP.includes(a)-SP.includes(b)),two=LST.entries.filter(e=>e.x.length).length;
 return `<h3 style="margin:0">${LST.list?'New in':'Track'} “${E(LST.list?LST.title:LST.name)}”</h3><p class="sub">${msg?E(msg)+' ':''}${LST.entries.length} entries found${two?' · '+two+' have a second link':''}. Tick what to add; the list is re-checked whenever you sync it.</p>
 ${LST.list?'':`<label>List name (it becomes the folder name)</label><input id="lsName" value="${E(LST.name)}">`}
 <label>Folders</label><div class="row" style="justify-content:flex-start;flex-wrap:wrap;margin:0"><label class="chk" style="margin:0 12px 0 0"><input type="radio" name="lOrg" value="near" checked> by section</label><label class="chk" style="margin:0 12px 0 0"><input type="radio" name="lOrg" value="alpha"> A–Z letters (good for long flat lists)</label><label class="chk" style="margin:0 12px 0 0"><input type="radio" name="lOrg" value="full"> full heading path</label><label class="chk" style="margin:0"><input type="radio" name="lOrg" value="flat"> one folder</label></div>
 <label>When an entry has two links (e.g. source + ▶ Play) the main link is…</label><div class="row" style="justify-content:flex-start;flex-wrap:wrap;margin:0"><label class="chk" style="margin:0 12px 0 0"><input type="radio" name="lMain" value="src" checked> the source (GitHub: gets monitored)</label><label class="chk" style="margin:0"><input type="radio" name="lMain" value="play"> the other link (play / demo)</label></div><div class="sub">The other link stays on the card as a button.</div>
 <div class="box">${keys.map(g=>{const on=g!==SP[1];return `<div class="grp"><label class="chk" style="margin:0"><input type="checkbox" data-lg="1" ${on?'checked':''}> ${E(g)} (${gs.get(g).length})</label><details><summary class="sub">show</summary>${gs.get(g).map(e=>`<div class="ir"><input type="checkbox" data-lr="${e.n}" ${on?'checked':''}><span><b>${E(e.t)}</b> <small>${[e.sys,e.ver&&'v'+e.ver,e.upd,e.u.replace(/^https?:\/\/(www\.)?/,''),e.x.length&&'+ '+e.x.map(l=>l.t).join(', ')].filter(Boolean).map(E).join(' · ')}</small></span></div>`).join('')}</details></div>`}).join('')}</div>
 <div class="row"><button class="btn" data-a="close">Cancel</button><button class="btn p" id="lsDo" data-a="lstDo"></button></div>`}
const lstCnt=()=>{const b=$('#lsDo');if(b)b.textContent='Import '+document.querySelectorAll('#dLst [data-lr]:checked').length+' selected'};
function lstImport(){
 if(typeof autoBackup==='function')autoBackup('before list import',true);
 const org=document.querySelector('input[name=lOrg]:checked').value,play=document.querySelector('input[name=lMain]:checked').value==='play';
 let L=LST.list;
 if(!L){const nm=($('#lsName')&&$('#lsName').value.trim())||LST.title;L={id:uid(),o:LST.o,r:LST.r,title:nm,at:Date.now(),seen:[]};L.cid=ensPath(['GitHub lists',nm]);S.lists=S.lists||[];S.lists.push(L)}
 const have=new Map(S.items.map(i=>[nk(i.u),i])),slug=L.title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');let first='';
 for(const c of document.querySelectorAll('#dLst [data-lr]:checked')){const e=LST.entries[+c.dataset.lr],ex=have.get(nk(e.u)),ls={id:L.id,k:e.k,ver:e.ver,upd:e.upd};
  if(ex){if(!ex.ls)ex.ls=ls;if(!ex.x&&e.x.length)ex.x=e.x;continue}
  const sec=e.sec.length?e.sec[e.sec.length-1]:'General',ch=(e.t.trim()[0]||'#').toUpperCase();
  const path=org==='flat'?[L.title]:org==='full'?[L.title,...e.sec]:org==='alpha'?[L.title,/[A-Z]/.test(ch)?ch:'#']:[L.title,sec],cid=ensPath(['GitHub lists',...path]);first=first||cid;
  let u=e.u,xs=e.x.slice();if(play&&xs.length){const f=xs.shift();xs.unshift({t:'Source',u:e.u});u=f.u}
  const note=`From “${L.title}”${e.sec.length?' › '+sec:''}${e.ver?' · listed '+e.ver:''}${e.upd?' · updated '+e.upd:''}${e.desc?' · '+e.desc:''}.`;
  const it={id:uid(),t:e.t,u,x:xs.length?xs:undefined,w:note,c:cid,s:'ref',g:['list',slug,...(e.sys?[e.sys.toLowerCase().replace(/\s+/g,'-')]:[])],d:false,v:'',k:0,a:Date.now(),ls};S.items.push(it);have.set(nk(u),it)}
 LST.entries.forEach(e=>{if(!L.seen.includes(e.k))L.seen.push(e.k)});L.news=0;
 save();$('#dLst').close();if(first)S.view=first;S.open=S.open||{};render()}
async function lstSyncRun(id){prog('Syncing list…');
 try{const r=await lstSync(id);prog('');save();render();
  const msg=`${r.vc} version change(s), ${r.gone} removed from the list${r.back?', '+r.back+' back':''}, ${r.fresh.length} new entr${r.fresh.length===1?'y':'ies'}.`;
  if(r.fresh.length){LST={o:r.L.o,r:r.L.r,title:r.L.title,entries:r.fresh,list:r.L};$('#dLst').innerHTML=lst1(msg);if(!$('#dLst').open)$('#dLst').showModal();lstCnt()}
  else await ask('Synced “'+r.L.title+'”',{msg})}
 catch(e){prog('');await ask('Could not sync',{msg:e.message})}}
async function lstSyncAll(){const out=[];for(const L of (S.lists||[]).slice()){prog('Syncing '+L.title+'…');try{const r=await lstSync(L.id);out.push(`${r.L.title}: ${r.vc} version change(s), ${r.gone} removed, ${r.fresh.length} new`)}catch(e){out.push(L.title+': '+e.message)}}
 prog('');save();render();if(out.length)await ask('Lists synced',{msg:out.join(' · ')+'. New entries show on each list’s row.'})}
const lcid=L=>{if(L.cid&&S.colls.some(c=>c.id===L.cid))return L.cid;const id='f_'+hash(['GitHub lists',L.title].join('\u0001'));return S.colls.some(c=>c.id===id)?id:null};
const listName=id=>{const L=(S.lists||[]).find(x=>x.id===id);if(!L)return'';const c=S.colls.find(x=>x.id===lcid(L));return c?c.n:L.title};
function lstHome(){const Ls=S.lists||[];
 if(!Ls.length)return '';
 return `<h3 class="sec">📋 Tracked lists <button class="b" data-a="lstSyncAll">↻ sync all</button> <button class="b" data-a="lstNew">+ track another</button></h3>`+Ls.map(L=>{
  const m=S.items.filter(i=>i.ls&&i.ls.id===L.id),ch=m.filter(i=>i.lc).length,up=m.filter(outdated).length,op=!!(S.open&&S.open['L_'+L.id]),cid=lcid(L),nm=listName(L.id),gh_=`https://github.com/${E(L.o)}/${E(L.r)}`;let panel='';
  if(op){const secs=cid?S.colls.filter(c=>c.p===cid):[],tot=id=>deep(id).reduce((s,x)=>s+cnt(x),0),need=m.filter(i=>i.lc||outdated(i)).slice(0,8);
   panel=`<div class="card" style="margin:0 0 8px 18px"><div class="meta" style="margin:0 0 8px"><button class="b s" data-v="L:${L.id}">🧾 all ${m.length} entries</button>${cid?`<button class="b" data-v="${cid}">📁 open folder</button>`:''}<a class="b" href="${gh_}" target="_blank" rel="noopener">GitHub ↗</a><button class="b" data-a="lstRen" data-lid="${L.id}">✏️ rename</button></div>${secs.length?`<div class="meta" style="margin:0 0 8px">${secs.map(c=>`<button class="b" data-v="${c.id}">${E(c.e+' '+c.n)} (${tot(c.id)})</button>`).join('')}</div>`:''}${need.length?'<div class="sub">Needs a look:</div>'+need.map(glance).join(''):'<div class="sub">Nothing changed since you last looked.</div>'}</div>`}
  return `<div class="ir2"><button class="b" data-a="lstTog" data-lid="${L.id}">${op?'▾':'▸'}</button><a href="${gh_}" target="_blank" rel="noopener">${E(nm)} ↗</a><span class="dom">${m.length} monitored${ch?' · '+ch+' changed':''}${up?' · '+up+' to update':''}${L.news?' · '+L.news+' new':''} · synced ${ago(L.at)}</span><button class="b" data-a="lstSync" data-lid="${L.id}">${L.news?'review':'↻ sync'}</button><button class="b" data-a="lstDel" data-lid="${L.id}">stop</button></div>`+panel}).join('')}
const nn=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]/g,'');
/* ----- release notes ----- */
async function rnOpen(i){const g=gh(i.u);if(!g[1])return;const d=$('#dRn');d.innerHTML='<h3 style="margin:0">What’s new</h3><p class="sub">Loading…</p>';if(!d.open)d.showModal();
 try{const r=await tfetch(`https://api.github.com/repos/${g[1]}/${g[2].replace(/\.git$/,'')}/releases?per_page=15`,15000,{init:{headers:ghH()}});
  if(r.status===403||r.status===429)throw new Error('GitHub rate limit: add a token in ⚙ Settings, or wait');
  const rel=r.ok?await r.json():[],out=[];for(const x of rel){if(i.v&&nvr(x.tag_name)===nvr(i.v))break;out.push(x)}
  d.innerHTML=`<h3 style="margin:0">What’s new in ${E(i.t)}</h3><p class="sub">You have ${E(i.v||'?')}. ${out.length?out.length+' newer release(s):':'No newer releases with notes were found.'}</p><div class="box">${out.slice(0,8).map(x=>`<div class="grp"><b>${E(x.name||x.tag_name)}</b> <span class="dom">${new Date(x.published_at).toLocaleDateString()}</span><pre style="white-space:pre-wrap;font:inherit;font-size:13px;margin:4px 0">${E((x.body||'(no notes)').slice(0,1500))}</pre></div>`).join('')}</div><div class="row"><a class="btn" target="_blank" rel="noopener" href="https://github.com/${E(g[1])}/${E(g[2])}/releases">All releases ↗</a><button class="btn p" data-a="close">Close</button></div>`}
 catch(e){d.innerHTML=`<h3 style="margin:0">What’s new</h3><p class="sub">${E(e.message)}</p><div class="row"><button class="btn p" data-a="close">Close</button></div>`}}
/* ----- wiring ----- */
document.addEventListener('change',e=>{const t=e.target;
 if(t.dataset&&t.dataset.lg){t.closest('.grp').querySelectorAll('[data-lr]').forEach(c=>c.checked=t.checked);lstCnt()}
 else if(t.dataset&&t.dataset.lr!==undefined)lstCnt()});
document.addEventListener('click',async e=>{const b=e.target.closest('[data-a]');if(!b)return;const a=b.dataset.a,i=S.items.find(x=>x.id===b.dataset.id);
 if(a==='lstNew')lstOpen();else if(a==='lstRead')lstRead();else if(a==='lstDo')lstImport();
 else if(a==='lstSync')lstSyncRun(b.dataset.lid);else if(a==='lstSyncAll')lstSyncAll();
 else if(a==='lstDel'){const L=(S.lists||[]).find(x=>x.id===b.dataset.lid);if(L&&await ask('Stop tracking “'+listName(L.id)+'”?',{msg:'Your links stay; they just stop being compared with the list.',ok:'Stop tracking'})){S.items.forEach(x=>{if(x.ls&&x.ls.id===L.id){delete x.ls;delete x.lc}});S.lists=S.lists.filter(x=>x!==L);save();render()}}
 else if(a==='lstTog'){S.open=S.open||{};S.open['L_'+b.dataset.lid]=!S.open['L_'+b.dataset.lid];save();render()}
 else if(a==='lstRen'){const L=(S.lists||[]).find(x=>x.id===b.dataset.lid),c=L&&S.colls.find(x=>x.id===lcid(L));if(!c)return;const n=await ask('Rename the list folder',{val:c.n});if(n&&n.trim()){c.n=n.trim();save();render()}}
 else if(a==='lcSeen'&&i){delete i.lc;save();render()}
 else if(a==='use'&&i){let v=i.ls&&/\d/.test(i.ls.ver||'')?i.ls.ver:'';if(!v){const n=await ask('Which version do you have?',{val:''});if(!n||!n.trim())return;v=n.trim()}i.v=v;i.k=Date.now();save();render()}
 else if(a==='bUse'){let n=0,m=0;S.items.forEach(x=>{if(!SEL.has(x.id))return;if(x.ls&&/\d/.test(x.ls.ver||'')){x.v=x.ls.ver;x.k=Date.now();n++}else m++});SEL.clear();save();render();if(m)await ask('Some were skipped',{msg:m+' selected link(s) have no listed version. Use “✓ I use this” on each to type it.'})}
 else if(a==='rn'&&i)rnOpen(i);
});
