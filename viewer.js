/* ===== lazy tabs · peek window · reader + highlights · status filters ===== */
const lazyUrl=(u,t)=>chrome.runtime.getURL('lazy.html')+'?u='+encodeURIComponent(u)+'&t='+encodeURIComponent(t||'');
async function openMany(L){if(!L.length)return;
 if(S.lazy===false||L.length<4){L.forEach(x=>openTab(x.u));return}
 for(const x of L){chrome.tabs.create({url:lazyUrl(x.u,x.t),active:false});await new Promise(r=>setTimeout(r,25))}}
/* ----- peek: the page on the right, a control strip right below it, the hub on the left. Two modes: browse and triage ----- */
const TR={last:''};
const PK={win:null,rem:null,tab:null,ids:[],k:0,src:'view',saved:null,sbWas:null,size:'side',reader:false,hubR:0,mode:'browse',finished:false,n0:0,kept:[],keptTab:{},busyUntil:0};
const CH=190;
const pkItem=()=>S.items.find(x=>x.id===PK.ids[PK.k]);
const SCR=()=>({w:screen.availWidth,h:screen.availHeight,l:screen.availLeft||0,t:screen.availTop||0});
/* side = to the right of wherever the hub really ended up (never on top of it); wide = full width, only when you ask for it */
const pkGeo=m=>{const s=SCR(),left=m==='wide'?s.l:(PK.hubR||s.l+Math.round(s.w*.45)),w=s.l+s.w-left;
 return{peek:{left,top:s.t,width:w,height:s.h-CH},rem:{left,top:s.t+s.h-CH,width:w,height:CH},hub:{left:s.l,top:s.t,width:Math.round(s.w*.45),height:s.h}}};
const pkTarget=(i,url)=>PK.reader?rdUrl(i.id):(url||i.u);
async function pkAlive(){if(!PK.win)return false;try{await chrome.windows.get(PK.win);return true}catch(e){PK.win=null;PK.tab=null;return false}}
async function remAlive(){if(!PK.rem)return false;try{await chrome.windows.get(PK.rem);return true}catch(e){PK.rem=null;return false}}
async function pkNav(url){
 if(await pkAlive()){await chrome.tabs.update(PK.tab,{url});return}
 const s=SCR(),first=!await remAlive();PK.busyUntil=Date.now()+800;
 if(first){PK.hubR=0;
  if(S.dock!==false){try{const c=await chrome.windows.getCurrent();PK.saved={id:c.id,l:c.left,t:c.top,w:c.width,h:c.height,st:c.state};
   if(c.state!=='normal')await chrome.windows.update(c.id,{state:'normal'});await chrome.windows.update(c.id,pkGeo('side').hub);
   const h=await chrome.windows.get(c.id),r=h.left+h.width;if(Number.isFinite(r)&&r<s.l+s.w-480)PK.hubR=r}catch(e){}}
  if(S.sbPeek!==false){PK.sbWas=!!S.sbHide;S.sbHide=true;sbApply()}PK.size='side'}
 const mode=PK.size==='wide'?'wide':'side',g=pkGeo(mode),nw=await chrome.windows.create({url,type:'popup',...g.peek,focused:false});PK.win=nw.id;PK.tab=nw.tabs[0].id;PK.size=mode;
 if(first){const rw=await chrome.windows.create({url:chrome.runtime.getURL('remote.html'),type:'popup',...g.rem,focused:true});PK.rem=rw.id}}
async function pkSize(m){if(!await pkAlive())return;PK.size=m;PK.busyUntil=Date.now()+800;
 if(m==='full'){await chrome.windows.update(PK.win,{state:'fullscreen',focused:true});return pkBar()}
 const g=pkGeo(m);await chrome.windows.update(PK.win,{state:'normal'});await chrome.windows.update(PK.win,{...g.peek,focused:true});
 if(PK.rem){await chrome.windows.update(PK.rem,{state:'normal'});await chrome.windows.update(PK.rem,{...g.rem,focused:true})}pkBar()}
chrome.windows.onRemoved.addListener(async id=>{const wasKept=PK.kept.includes(id);PK.kept=PK.kept.filter(x=>x!==id);delete PK.keptTab[id];if(wasKept){if(PK.kept.length>=2)wallLayout();return}if(id!==PK.win&&id!==PK.rem)return;const other=id===PK.win?PK.rem:PK.win;PK.win=null;PK.rem=null;PK.tab=null;PK.reader=false;PK.hubR=0;PK.mode='browse';PK.finished=false;
 if(other){try{await chrome.windows.remove(other)}catch(e){}}
 const o=PK.saved;PK.saved=null;
 if(o){try{await chrome.windows.update(o.id,{state:'normal'});await chrome.windows.update(o.id,{left:o.l,top:o.t,width:o.w,height:o.h});if(o.st==='maximized')await chrome.windows.update(o.id,{state:'maximized'})}catch(e){}}
 if(PK.sbWas!==null){S.sbHide=PK.sbWas;PK.sbWas=null;sbApply();save()}
 if(PK.kept.length){try{await chrome.windows.update(PK.kept[PK.kept.length-1],{focused:true})}catch(e){}}   /* a kept page must never end up hidden behind the hub */
 pkBar()});
async function pkOpen(id,url,ids,src){const i=S.items.find(x=>x.id===id);if(!i)return;
 PK.mode='browse';PK.finished=false;
 PK.ids=ids||(S.view==='home'&&!q?[id]:list().map(x=>x.id));if(!PK.ids.includes(id))PK.ids=[id];PK.k=PK.ids.indexOf(id);PK.src=src||'view';if(url)PK.reader=false;
 await pkNav(pkTarget(i,url));pkBar()}
async function pkMove(d){const n=PK.ids.length;if(n<2||!PK.win||PK.mode==='triage')return;PK.k=(PK.k+d+n)%n;const i=pkItem();if(!i)return;await pkNav(pkTarget(i));trackOpen(i.id);pkBar()}
async function pkDone(){const i=pkItem();if(!i)return;i.s='done';
 if(PK.src==='queue'){S.queue=(S.queue||[]).filter(x=>x!==i.id);PK.ids=PK.ids.filter(x=>x!==i.id);PK.k=Math.min(PK.k,PK.ids.length-1)}
 save();render();
 if(PK.src==='queue'){if(!PK.ids.length)return pkClose();await pkNav(pkTarget(pkItem()));pkBar()}else pkMove(1)}
const pkClose=async()=>{if(PK.win){try{await chrome.windows.remove(PK.win)}catch(e){}}else if(PK.rem){try{await chrome.windows.remove(PK.rem)}catch(e){}}};
/* triage = the same side window, with sorting controls in the strip */
function triStart(arg){
 if(S.viewer===false){ask('Triage uses the side window',{msg:'Turn on “Open links in a side peek window” in ⚙ Settings first.'});return}
 const v=S.view,L=Array.isArray(arg)?arg.filter(i=>i.s!=='done'):((S.colls.some(c=>c.id===v)||['attn','never'].includes(v))?list():S.items.filter(i=>i.c==='inbox')).filter(i=>i.s!=='done').sort((a,b)=>a.a-b.a);
 if(!L.length){ask('Nothing to triage here',{msg:'Open the Inbox or a folder that has links to sort.'});return}
 if(typeof autoBackup==='function')autoBackup('before triage',true);
 PK.mode='triage';PK.ids=L.map(i=>i.id);PK.k=0;PK.src='triage';PK.n0=L.length;PK.finished=false;PK.reader=false;
 pkNav(pkTarget(L[0])).then(pkBar)}
async function triNext(){PK.k++;if(PK.k>=PK.ids.length){PK.finished=true;pkBar();return}await pkNav(pkTarget(pkItem()));pkBar()}
/* keep this page open (music, a video…) as a mini player: a small window whose zoom follows its size, then carry on with the next link */
async function miniFit(winId){const tab=PK.keptTab[winId];if(!tab)return;
 try{const w=await chrome.windows.get(winId),f=Math.max(.25,Math.min(1,w.width/900));
  if(w.state!=='normal'||w.width>=900){await chrome.tabs.setZoomSettings(tab,{mode:'automatic',scope:'per-origin'});await chrome.tabs.setZoom(tab,0)}   /* big again: back to 100% */
  else{await chrome.tabs.setZoomSettings(tab,{mode:'manual',scope:'per-tab'});await chrome.tabs.setZoom(tab,f)}}catch(e){}}
async function pkKeep(){if(!await pkAlive())return;const s=SCR(),w=PK.win,tab=PK.tab;PK.kept.push(w);PK.keptTab[w]=tab;PK.busyUntil=Date.now()+900;
 if(PK.kept.length>=2&&S.wall!==false)await wallLayout();
 else{try{await chrome.windows.update(w,{state:'normal'});await chrome.windows.update(w,{left:s.l+12,top:s.t+s.h-300,width:420,height:270,focused:true})}catch(e){}
  await miniFit(w)}
 if(PK.rem){try{await chrome.windows.update(PK.rem,{focused:true})}catch(e){}}try{await chrome.scripting.executeScript({target:{tabId:tab},func:()=>scrollTo(0,0)})}catch(e){}
 PK.win=null;PK.tab=null;
 if(PK.mode==='triage'){await triNext();return}
 if(PK.ids.length>1){PK.k=(PK.k+1)%PK.ids.length;await pkNav(pkTarget(pkItem()));pkBar()}else{PK.finished=true;pkBar()}}   /* nothing else in this list: the side window stays open, ready for the next link you click */
/* video wall: 2 or more kept windows tile the screen (above the control strip) so they never cover each other */
function wallGrid(n,W,H){let best=null;for(let c=1;c<=n;c++){const r=Math.ceil(n/c),w=W/c,h=H/r,sc=Math.min(w,h*16/9)*Math.min(h,w*9/16);if(!best||sc>best.sc)best={c,r,sc}}return best}
async function wallLayout(){const L=PK.kept.slice();if(L.length<2||S.wall===false)return;
 const s=SCR(),H=s.h-((PK.rem&&await remAlive())?CH:0),{c,r}=wallGrid(L.length,s.w,H);PK.busyUntil=Date.now()+1500;
 for(let k=0;k<L.length;k++){const row=Math.floor(k/c),col=k%c,inRow=row===r-1?L.length-(r-1)*c:c,w=Math.floor(s.w/inRow),h=Math.floor(H/r);
  try{await chrome.windows.update(L[k],{state:'normal'});await chrome.windows.update(L[k],{left:s.l+col*w,top:s.t+row*h,width:w,height:h,focused:true})}catch(e){}
  await miniFit(L[k])}}
/* resizing or restoring a mini player re-fits it; the OS minimize / maximize buttons keep both windows consistent */
chrome.windows.onBoundsChanged.addListener(async w=>{
 if(PK.kept.includes(w.id)){miniFit(w.id);return}
 if(Date.now()<PK.busyUntil||(w.id!==PK.win&&w.id!==PK.rem))return;
 try{const x=await chrome.windows.get(w.id);
  if(w.id===PK.win){
   if(x.state==='maximized'&&PK.size!=='wide')await pkSize('wide');
   else if(x.state==='minimized'&&PK.rem)await chrome.windows.update(PK.rem,{state:'minimized'});
   else if(x.state==='normal'&&PK.rem){const r=await chrome.windows.get(PK.rem);if(r.state==='minimized')await chrome.windows.update(PK.rem,{state:'normal'})}}
  else if(w.id===PK.rem){
   if(x.state==='maximized')await pkSize(PK.size==='full'?'side':PK.size);
   else if(x.state==='minimized'&&PK.win)await chrome.windows.update(PK.win,{state:'minimized'});
   else if(x.state==='normal'&&PK.win){const r=await chrome.windows.get(PK.win);if(r.state==='minimized')await chrome.windows.update(PK.win,{state:'normal'})}}}catch(e){}});
chrome.tabs.onUpdated.addListener((id,ch)=>{if(ch.status==='complete'){const k=Object.keys(PK.keptTab).find(x=>PK.keptTab[x]===id);if(k)miniFit(+k)}});
/* the strip below the page is its own small window; it reads this state and sends commands back */
function pkBar(){const i=PK.win&&pkItem(),tri=PK.mode==='triage';let st={open:false};
 if(PK.rem&&PK.finished)st=tri?{open:true,mode:'triage',fin:true,n0:PK.n0}:{open:true,mode:'browse',fin:true,kept:PK.kept.length};
 else if(i){st={open:true,mode:PK.mode,id:i.id,title:i.t,url:i.u,tab:PK.tab,k:PK.k+1,n:PK.ids.length,d:!!i.d,pin:!!i.pin,q:inQ(i.id),src:PK.src,size:PK.size,reader:PK.reader,kept:PK.kept.length};
  if(tri){const sg=suggestFor(i);st.def=sg?sg.c:(TR.last||i.c);st.sug=!!sg;st.colls=S.colls.map(c=>[c.id,c.e+' '+cpath(c.id)])}}
 chrome.storage.local.set({pk_state:st})}
async function pkDelete(){const i=pkItem();if(!i)return;if(typeof autoBackup==='function')autoBackup('before delete',true);
 S.items=S.items.filter(x=>x.id!==i.id);S.queue=(S.queue||[]).filter(x=>x!==i.id);SEL.delete(i.id);PK.ids=PK.ids.filter(x=>x!==i.id);save();render();
 if(PK.mode==='triage'&&PK.k>=PK.ids.length){PK.finished=true;pkBar();return}
 if(!PK.ids.length){await pkClose();return}PK.k=Math.min(PK.k,PK.ids.length-1);await pkNav(pkTarget(pkItem()));pkBar()}
async function pkLoadedTitle(url){   /* the title the tab itself shows, like when you save a tab */
 for(let k=0;k<16;k++){try{const t=await chrome.tabs.get(PK.tab);if(t.status==='complete'&&t.title&&t.title!==url&&!/^https?:/i.test(t.title))return t.title.trim().slice(0,200)}catch(e){break}await new Promise(r=>setTimeout(r,400))}
 try{const r=await tfetch(url,10000),d=new DOMParser().parseFromString(await r.text(),'text/html');return(d.title||(d.querySelector('meta[property="og:title"]')||{}).content||'').trim().slice(0,200)}catch(e){return''}}
async function pkCmd(m){const i=pkItem();
 switch(m.pk){case'prev':await pkMove(-1);break;case'next':await pkMove(1);break;case'size':await pkSize(m.m);break;case'done':await pkDone();break;case'close':await pkClose();break;
  case'day':if(i){i.d=!i.d;save();render()}break;case'pin':if(i){i.pin=!i.pin;save();render()}break;
  case'q':if(i){S.queue=S.queue||[];S.queue=inQ(i.id)?S.queue.filter(x=>x!==i.id):[...S.queue,i.id];save();render()}break;
  case'reader':PK.reader=!PK.reader;if(i)await pkNav(pkTarget(i));break;
  case'keep':await pkKeep();break;
  case'wall':await wallLayout();break;
  case'tab':if(i)chrome.tabs.create({url:i.u,active:false});break;
  case'del':case'tdel':await pkDelete();return;
  case'tmove':case'tdone':case'tday':if(i){if(m.c&&S.colls.some(c=>c.id===m.c)){i.c=m.c;TR.last=m.c}if(m.pk==='tdone')i.s='done';if(m.pk==='tday')i.d=true;save();render();await triNext()}return;
  case'tskip':await triNext();return;
  case'anon':if(i)await openAnon([i]);break;
  case'setUrl':if(i&&/^https?:\/\//i.test(m.url||'')){i.u=m.url;delete i.h;PK.reader=false;const tm=m.tm||'keep';
   if(tm==='custom'&&(m.title||'').trim())i.t=m.title.trim();
   await pkNav(i.u);if(tm==='auto'){const t=await pkLoadedTitle(i.u);if(t)i.t=t}
   save();render()}break}
 pkBar()}
chrome.runtime.onMessage.addListener(m=>{if(m&&m.pk)pkCmd(m)});
const HG={};   /* the list a tile belongs to on Home, so next / previous work from there too */
const ctxIds=(el,id)=>{const g=el.closest&&el.closest('[data-grp]');return g&&HG[g.dataset.grp]&&HG[g.dataset.grp].includes(id)?HG[g.dataset.grp]:undefined};
/* anonymous = a private (incognito) window. Normal click: peek. Shift+click or the 🕶 button: anonymous */
const ANON={win:null};
async function openAnon(L){L=L.filter(x=>/^https?:/i.test(x.u));if(!L.length)return;
 if(L.length>12&&!await ask('Open '+L.length+' pages anonymously?',{msg:'They all load at once in one private window.',ok:'Open'}))return;
 const urls=L.map(x=>x.u);
 try{if(ANON.win){try{await chrome.windows.get(ANON.win);for(const u of urls)await chrome.tabs.create({windowId:ANON.win,url:u,active:false});await chrome.windows.update(ANON.win,{focused:true});return}catch(e){ANON.win=null}}
  const w=await chrome.windows.create({url:urls,incognito:true,focused:true});ANON.win=(w&&w.id)||null}
 catch(e){ask('The browser did not open a private window',{msg:String(e&&e.message||e)})}}
document.addEventListener('click',e=>{const a=e.target.closest&&e.target.closest('a[data-oid]');
 if(!a||e.button!==0||e.ctrlKey||e.metaKey)return;const it=S.items.find(x=>x.id===a.dataset.oid);
 if(e.shiftKey){e.preventDefault();openAnon([{u:a.href,t:it?it.t:a.href}]);return}
 if(S.viewer===false)return;e.preventDefault();pkOpen(a.dataset.oid,a.href,ctxIds(a,a.dataset.oid))},true);
document.addEventListener('keydown',e=>{if(!PK.win||document.querySelector('dialog[open]')||/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName))return;
 if(e.key==='j'||e.key==='J')pkMove(1);else if(e.key==='k'||e.key==='K')pkMove(-1)});
/* ----- reader: the page as clean text, with highlights. Opens in the peek window (or a new tab when not peeking) ----- */
const rdUrl=id=>chrome.runtime.getURL('reader.html')+'?id='+encodeURIComponent(id);
async function rdOpen(id){const i=S.items.find(x=>x.id===id);if(!i)return;
 if(S.viewer===false){chrome.tabs.create({url:rdUrl(id)});return}
 const alive=await pkAlive();
 if(alive&&PK.mode==='triage'&&PK.ids[PK.k]!==id){chrome.tabs.create({url:rdUrl(id)});return}   /* don't disturb a triage in progress */
 if(!alive||PK.mode!=='triage'){PK.mode='browse';PK.finished=false;PK.ids=(S.view==='home'&&!q)?[id]:list().map(x=>x.id);if(!PK.ids.includes(id))PK.ids=[id];PK.k=PK.ids.indexOf(id);PK.src='view'}
 PK.reader=true;await pkNav(rdUrl(id));pkBar()}
document.body.insertAdjacentHTML('beforeend','<dialog id="dHl"></dialog>');
function hlOpen(i){$('#dHl').innerHTML=`<h3 style="margin:0">🖍 Highlights · ${E(i.t)}</h3><div class="box">${(i.hl||[]).map((h,k)=>`<div class="ir"><span><mark>${E(h.t)}</mark> <small>${ago(h.at)}</small></span><button class="btn" data-a="hlDel" data-id="${i.id}" data-k="${k}" title="Remove this highlight">🗑</button></div>`).join('')||'<p class="sub">No highlights yet. Open 📖 Reader, select text and press 🖍.</p>'}</div><div class="row"><button class="btn" data-a="hlCopy" data-id="${i.id}">Copy all</button><button class="btn p" data-a="close">Close</button></div>`;if(!$('#dHl').open)$('#dHl').showModal()}
/* ----- status filters ----- */
let FLT=new Set(),FLTV='',FLTOFF=false,FLTOPEN=false;
const hs=(...s)=>i=>!!(i.h&&s.includes(i.h.st));
const FD={'w:todo':['To do',i=>i.s==='todo'],'w:doing':['In progress',i=>i.s==='doing'],'w:ref':['Reference',i=>i.s==='ref'],'w:done':['Done',i=>i.s==='done'],
 'h:ok':['✓ alive',hs('ok')],'h:moved':['↪ moved',hs('moved')],'h:page':['📄 page gone',hs('page','soft')],'h:dead':['❌ dead',hs('dead')],'h:down':['⚠️ down',hs('down')],'h:timeout':['⏱ timeout',hs('timeout')],'h:error':['server error',hs('error')],'h:unsure':['❓ can’t verify',hs('unsure')],'h:none':['not checked yet',i=>!i.h],
 'f:chg':['🆕 changed',i=>!!((i.sn&&i.sn.changed)||i.lc)],'f:upd':['⚠️ update available',i=>outdated(i)],'f:day':['☀️ daily',i=>!!i.d],'f:pin':['📌 pinned',i=>!!i.pin],'f:q':['📚 In Read next',i=>inQ(i.id)],'f:hl':['🖍 has highlights',i=>!!(i.hl&&i.hl.length)],'f:never':['👻 never opened',i=>neverOpened(i)],'f:cp':['💾 has a copy',i=>!!i.cp],'f:ls':['📋 from a list',i=>!!i.ls],'f:x':['▶ has a second link',i=>!!(i.x&&i.x.length)]};
function fltApply(it){if(!FLT.size||FLTOFF)return it;const by={};FLT.forEach(k=>{(by[k[0]]=by[k[0]]||[]).push(FD[k][1])});
 return it.filter(i=>Object.entries(by).every(([g,ps])=>g==='f'?ps.every(p=>p(i)):ps.some(p=>p(i))))}
function fltBar(){if(S.view==='home'&&!q)return;FLTOFF=true;const base=list();FLTOFF=false;
 const act=[...FLT].map(k=>`<button class="b s" data-a="fltT" data-k="${k}">${E(FD[k][0])} ✕</button>`).join(' ');
 const panel=FLTOPEN?[['Workflow','w'],['Link health','h'],['Flags (all must match)','f']].map(([n,g])=>`<div class="meta" style="margin:4px 0"><span class="dom" style="width:130px">${n}</span>${Object.keys(FD).filter(k=>k[0]===g).map(k=>{const c=base.filter(FD[k][1]).length;return c||FLT.has(k)?`<button class="b ${FLT.has(k)?'s':''}" data-a="fltT" data-k="${k}">${E(FD[k][0])} <small>${c}</small></button>`:''}).join('')}</div>`).join(''):'';
 $('#head').insertAdjacentHTML('beforeend',`<div class="meta" style="margin:0 0 10px"><button class="b" data-a="fltO">🔎 Filter by status ${FLTOPEN?'▴':'▾'}</button>${act}${FLT.size?'<button class="b" data-a="fltC">clear all</button>':''}</div>${panel}`)}
{const _r=render;render=function(){if(FLTV!==S.view){FLT.clear();FLTV=S.view;FLTOPEN=false}_r.apply(this,arguments);try{fltBar()}catch(e){}try{pkBar()}catch(e){}}}
document.addEventListener('click',async e=>{const b=e.target.closest('[data-a]');if(!b)return;const a=b.dataset.a,k=b.dataset.k,i=S.items.find(x=>x.id===b.dataset.id);
 if(a==='fltO'){FLTOPEN=!FLTOPEN;render()}else if(a==='fltT'){FLT.has(k)?FLT.delete(k):FLT.add(k);render()}else if(a==='fltC'){FLT.clear();render()}
 else if(a==='peek'&&i){if(e.target.closest('.sel'))return;if(SEL.size){SEL.has(i.id)?SEL.delete(i.id):SEL.add(i.id);render();return}trackOpen(i.id);if(e.shiftKey)openAnon([i]);else if(S.viewer===false)window.open(i.u,'_blank','noopener');else pkOpen(i.id,null,ctxIds(b,i.id))}
 else if(a==='anon'&&i)openAnon([i])
 else if(a==='rdOpen'&&i)rdOpen(i.id);
 else if(a==='hlView'&&i)hlOpen(i);
 else if(a==='hlDel'&&i){i.hl.splice(+k,1);save();hlOpen(i);render()}
 else if(a==='hlCopy'&&i){try{await navigator.clipboard.writeText((i.hl||[]).map(h=>'• '+h.t).join('\n'))}catch(err){}}});
