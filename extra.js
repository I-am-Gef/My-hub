/* ===== helpers ===== */
const hash=s=>{let h=5381;for(let k=0;k<s.length;k++)h=((h<<5)+h+s.charCodeAt(k))|0;return h.toString(36)};
const ago=t=>{if(!t)return'never';const m=Math.floor((now()-t)/6e4);return m<1?'just now':m<60?m+'m ago':m<1440?Math.floor(m/60)+'h ago':Math.floor(m/1440)+'d ago'};
const nk=u=>{try{const x=new URL(u);x.hash='';[...x.searchParams.keys()].forEach(k=>/^(utm_|fbclid|gclid)/.test(k)&&x.searchParams.delete(k));return(x.hostname.replace(/^www\./,'')+x.pathname.replace(/\/+$/,'')+x.search).toLowerCase()}catch(e){return u}};
const isLocal=h=>/^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(h)||/\.local$/.test(h)||!h.includes('.');
const RUN={stop:false};
async function runPool(items,fn,n,onp){RUN.stop=false;let k=0,d=0;
 await Promise.all(Array.from({length:n},async()=>{while(!RUN.stop&&k<items.length){const it=items[k++];try{await fn(it)}catch(e){}onp&&onp(++d,items.length)}}))}
const prog=t=>{const e=$('#prog');if(e)e.innerHTML=t?t+' <button class="btn" data-a="stop">Stop</button>':''};
const NOPERM='I couldn’t reach even example.com, so every result would be wrong. Either you’re offline, or the extension has no permission to read other sites yet: open chrome://extensions → My Hub Companion → Details → Site access → “On all sites”, then reload the extension.';

/* ===== GitHub ===== */
async function ghLatest(i,g){
 const repo=g[1]+'/'+g[2].replace(/\.git$/,''),old=i.gl||{};
 const H={init:{headers:S.ghToken?{Authorization:'Bearer '+S.ghToken,Accept:'application/vnd.github+json'}:{Accept:'application/vnd.github+json'}}};
 const gj=async p=>{const r=await tfetch('https://api.github.com/repos/'+repo+p,12000,H);
  if(r.status===403||r.status===429)throw new Error('GitHub rate limit: add a token (🔑) or wait');return r.ok?r.json():null};
 try{
  const meta=await gj('');if(!meta){i.gl={...old,err:'repository not found'};return}
  const rel=await gj('/releases/latest');let tag=rel?rel.tag_name:'',at=rel?Date.parse(rel.published_at):0;
  if(!tag){const t=await gj('/tags?per_page=1');if(t&&t[0])tag=t[0].name}
  const push=Date.parse(meta.pushed_at)||0;
  i.gl={tag,at,push,arch:meta.archived,chk:now()};
  i.sn={at:now(),desc:(meta.archived?'📦 ARCHIVED · ':'')+(meta.description||'').slice(0,220),heads:[],hs:'p'+push,changed:(old.push?old.push!==push:false)||!!(i.sn&&i.sn.changed),gh:true};
 }catch(e){i.gl={...old,err:e.message}}
}

/* ===== snapshot + change detection ===== */
async function snapshot(i,anon){
 const g=gh(i.u);if(g[1])return ghLatest(i,g);
 try{
  const r=await tfetch(i.u,15000,{cred:anon?'omit':'include'});
  if(!r.ok){i.sn={...(i.sn||{}),at:now(),err:'HTTP '+r.status};return}
  const d=new DOMParser().parseFromString(await r.text(),'text/html');
  d.querySelectorAll('script,style,noscript').forEach(e=>e.remove());
  const m=s=>{const e=d.querySelector(s);return e?(e.content||e.textContent||'').trim():''};
  const heads=[...new Set([...d.querySelectorAll('h1,h2,h3')].map(e=>e.textContent.replace(/\s+/g,' ').trim()).filter(x=>x.length>12&&x.length<160))].slice(0,5);
  let img=m('meta[property="og:image"],meta[name="twitter:image"],meta[property="twitter:image"]');
  if(!img){const l=d.querySelector('link[rel=image_src]');img=l?l.getAttribute('href'):''}
  if(!img){const f=[...d.querySelectorAll('article img,main img,img')].find(x=>{const s=x.getAttribute('src')||'';return s&&!/^data:/.test(s)&&!/(sprite|logo|icon|pixel|blank|1x1|avatar)/i.test(s)&&(+x.getAttribute('width')||200)>=120});img=f?f.getAttribute('src'):''}
  try{if(img)img=new URL(img,r.url).href.replace(/^http:/,'https:')}catch(e){img=''}
  const sn={at:now(),title:(d.title||'').trim().slice(0,120),desc:(m('meta[name=description]')||m('meta[property="og:description"]')).slice(0,220),img,heads};
  sn.hs=hash(sn.title+sn.desc+heads.join('|'));{const b=d.querySelector('article,main,[role=main]')||d.body,wc=((b&&b.textContent)||'').trim().split(/\s+/).length;sn.rt=wc>250?Math.max(1,Math.round(wc/220)):0}
  sn.changed=i.sn&&i.sn.hs?(i.sn.hs!==sn.hs||!!i.sn.changed):false;
  i.sn=sn;
 }catch(e){i.sn={...(i.sn||{}),at:now(),err:e.name==='AbortError'?'timed out':'could not load'}}
}

/* ===== link health (careful: only “dead” when we are really sure) ===== */
function extractUrls(t){const seen=new Set(),out=[];for(let u of (String(t).match(/https?:\/\/[^\s<>"'`]+/gi)||[])){
 for(;;){const l=u.slice(-1);if(/[.,;:!?'"\]]/.test(l)||(l===')'&&(u.match(/\)/g)||[]).length>(u.match(/\(/g)||[]).length))u=u.slice(0,-1);else break}
 if(u.length>8&&!seen.has(u)){seen.add(u);out.push(u)}}return out}
const HB={dead:['❌','dead'],soft:['📄','page gone, site still online'],page:['📄','page gone, site still online'],moved:['↪','moved'],unsure:['❓','can’t verify'],timeout:['⏱','timed out'],error:['⚠️','server error'],down:['⚠️','server not responding']};

/* ===== bookmark import ===== */
let IM={src:null,rows:[],opt:{},skip:{}};
async function readBrowser(){
 if(typeof chrome==='undefined'||!chrome.bookmarks)throw new Error('the extension has no bookmark permission yet. Reload it at chrome://extensions and accept the new permissions, or use the file option');
 const t=await chrome.bookmarks.getTree(),out=[];
 const walk=(n,p)=>{for(const c of n.children||[]){if(c.url)out.push({t:c.title,u:c.url,p,d:c.dateAdded||0});else walk(c,[...p,c.title])}};
 for(const root of t[0].children||[])walk(root,[]);return out}
function parseBm(html){const d=new DOMParser().parseFromString(html,'text/html'),out=[];
 const drop=/^(bookmarks? (bar|toolbar|menu)|other bookmarks|mobile bookmarks|favorites( bar)?|barra de favoritos|outros favoritos)$/i;
 const sub=(p,nm)=>nm?(drop.test(nm)?p:[...p,nm]):p;
 const walk=(dl,p)=>{let pend=null;for(const n of dl.children){
  if(n.tagName==='DL'){walk(n,sub(p,pend));pend=null;continue}if(n.tagName!=='DT')continue;
  const a=n.querySelector(':scope > a'),h=n.querySelector(':scope > h3'),s=n.querySelector(':scope > dl');
  if(a)out.push({t:a.textContent.trim(),u:a.getAttribute('href')||'',p,d:(+a.getAttribute('add_date')||0)*1000});
  if(h&&s)walk(s,sub(p,h.textContent.trim()));else if(h)pend=h.textContent.trim()}};
 const root=d.querySelector('dl');if(root)walk(root,[]);return out}
const CAT=[['ok','✅','Alive',1],['moved','↪','Moved (the new address will be imported)',1],['unsure','❓','Can’t verify (site refuses automated checks)',1],['error','⚠️','Server error (maybe temporary)',1],['down','⚠️','Server not responding (domain exists; may be temporary or a certificate problem)',1],['timeout','⏱','Timed out',1],['untested','▫️','Not tested',1],['page','📄','Page gone, but the site is still online (kept; you can point it to the site’s home)',1],['dead','❌','Dead (the domain no longer exists, or the whole site is gone)',0]];
const imp0=()=>`<h3 style="margin:0">Import bookmarks</h3><p class="sub">Step 1 · choose the source and the rules.</p>
<div class="row" style="justify-content:flex-start;align-items:center"><button class="btn p" data-a="impBr">Read this browser’s bookmarks</button><span class="sub" style="margin:0">or a bookmarks .html file:</span><input type="file" id="impF" accept=".html,.htm"></div>
<details style="margin-top:8px"><summary class="sub">…or paste any text that contains links (from a tab-export tool, a note…)</summary><textarea id="impT" rows="4" placeholder="Anything goes. Only web addresses (http/https) are picked up; titles and other text are ignored."></textarea><div class="row" style="justify-content:flex-start"><button class="btn" data-a="impPaste">Use the links in this text</button></div></details>
<div class="sub" id="impN">${IM.src?IM.src.length+' bookmarks loaded.':'File tip: Chrome/Edge/Brave → Ctrl+Shift+O → ⋮ → Export bookmarks. Firefox → Ctrl+Shift+O → Import and Backup → Export to HTML.'}</div>
<fieldset><legend class="sub">Rules</legend>
<label class="chk" title="Two links count as the same page when the site, the path and the query match after ignoring: http vs https, www, a trailing slash, #fragments, utm_/fbclid/gclid tracking parameters and upper/lower case. It is NOT a strict 1:1 comparison of the exact text."><input type="checkbox" id="oDup" checked> Skip links I already have <span class="sub">(same page, even if written slightly differently — hover for details)</span></label>
<label class="chk"><input type="checkbox" id="oWeb" checked> Skip non-web and local addresses (javascript:, file:, localhost, 192.168…)</label>
<label class="chk"><input type="checkbox" id="oTest" checked> Test every link before importing (recommended; hundreds can take a few minutes)</label>
<label class="chk"><input type="radio" name="oOrg" value="tree" checked> Keep my folder structure (folders inside folders become nested collections)</label>
<label class="chk"><input type="radio" name="oOrg" value="top"> Only top-level folders</label>
<label class="chk"><input type="radio" name="oOrg" value="inbox"> Everything into Inbox</label></fieldset>
<div class="row"><button class="btn" data-a="impClose">Cancel</button><button class="btn p" id="impGo" data-a="impGo" ${IM.src?'':'disabled'}>Apply rules and start</button></div>`;
const imp1=()=>`<h3 style="margin:0">Testing links…</h3><p class="sub" id="impP">Starting…</p><p class="sub">Keep this window open. Untested links can still be imported.</p><div class="row"><button class="btn" data-a="stop">Stop and review what I have</button></div>`;
function imp2(){const by={};IM.rows.forEach((r,n)=>{r.n=n;(by[r.h.st]=by[r.h.st]||[]).push(r)});
 return `<h3 style="margin:0">Review</h3><p class="sub">${IM.rows.length} links kept · skipped ${IM.skip.dup} duplicates and ${IM.skip.web} non-web. Tick what to import. Click a title to open it and double-check. “Re-test” runs a slower, stricter check.${CTRL.http?'':' Plain http links can’t be tested in this browser setup.'}</p><div class="box">`+
 CAT.filter(c=>by[c[0]]).map(c=>`<div class="grp"><div class="row" style="margin:0;justify-content:space-between"><label class="chk" style="margin:0"><input type="checkbox" data-g="${c[0]}" ${c[3]?'checked':''}> ${c[1]} ${c[2]} (${by[c[0]].length})</label>${['dead','page','down','timeout','unsure','error'].includes(c[0])?`<button class="btn" data-a="impRe" data-g="${c[0]}">Re-test</button>`:''}</div><details><summary class="sub">show links</summary>${by[c[0]].map(r=>`<div class="ir"><input type="checkbox" data-r="${r.n}" ${(r.sel!==undefined?r.sel:c[3])?'checked':''}><span><a href="${E(r.u)}" target="_blank" rel="noopener"><b>${E(r.t||r.u)}</b></a> <small>${E(dom(r.u))}${r.p.length?' · '+E(r.p.join(' / ')):''}${r.d?' · '+new Date(r.d).getFullYear():''}${r.h.to?' → '+E(r.h.to):''}${r.h.code?' · HTTP '+r.h.code:''}${r.h.err?' · '+E(r.h.err):''}</small></span></div>`).join('')}</details></div>`).join('')+
 `</div><div class="row"><button class="btn" data-a="impClose">Cancel</button><button class="btn p" id="impDo" data-a="impDo"></button></div>`}
const impCnt=()=>{const b=$('#impDo');if(b)b.textContent='Import '+document.querySelectorAll('#dImp [data-r]:checked').length+' selected'};
async function impStart(){
 const o={dup:$('#oDup').checked,web:$('#oWeb').checked,test:$('#oTest').checked,org:document.querySelector('input[name=oOrg]:checked').value};
 IM.opt=o;IM.skip={dup:0,web:0};
 const have=new Set(S.items.map(i=>nk(i.u))),seen=new Set(),out=[];
 for(const r of IM.src){let ok=true;
  try{const x=new URL(r.u);if(!/^https?:$/.test(x.protocol)||isLocal(x.hostname))ok=false}catch(e){ok=false}
  if(!ok&&o.web){IM.skip.web++;continue}
  const k=nk(r.u);if(o.dup&&(have.has(k)||seen.has(k))){IM.skip.dup++;continue}seen.add(k);out.push({...r})}
 IM.rows=out;
 if(o.test){$('#impB').innerHTML=imp1();
  if(!await probe()){$('#impB').innerHTML=`<h3 style="margin:0">Can’t test links</h3><p>${NOPERM}</p><div class="row"><button class="btn" data-a="impClose">Close</button></div>`;return}
  await runPool(out,r=>health(r),6,(d,t)=>{const e=$('#impP');if(e)e.textContent=`Tested ${d} of ${t}…`})}
 out.forEach(r=>{if(!r.h)r.h={st:'untested'}});
 $('#impB').innerHTML=imp2();impCnt();
}
function ensPath(p){let parent='',id='';p.forEach((n,k)=>{id='f_'+hash(p.slice(0,k+1).join('\u0001'));if(!S.colls.some(c=>c.id===id))S.colls.push({id,n,e:'📁',p:parent||undefined});parent=id});return id}
function impDo(){
 if(typeof autoBackup==='function')autoBackup('before import',true);
 const o=IM.opt;
 for(const k of [...document.querySelectorAll('#dImp [data-r]:checked')].map(c=>+c.dataset.r)){
  const r=IM.rows[k],st=r.h.st;
  const c=!r.p.length||o.org==='inbox'?'inbox':o.org==='top'?ensPath([r.p[0]]):ensPath(r.p);
  const u=st==='moved'?r.h.to:r.u,hh=st==='untested'?undefined:(st==='moved'?{st:'ok',at:r.h.at}:{...r.h});
  S.items.push({id:uid(),t:(r.t||'').trim()||autoT(u),u,w:`Imported bookmark${r.p.length?' from “'+r.p.join(' / ')+'”':''}${r.d?', saved '+new Date(r.d).getFullYear():''}.`,c,s:'todo',g:['imported'],d:false,v:'',k:0,a:r.d||now(),h:hh})}
 S.open=S.open||{};save();$('#dImp').close();S.view='inbox';render();prog('');
}

/* ===== wiring ===== */
$('.bar').insertAdjacentHTML('beforeend','<button class="btn" data-a="refreshAll" title="Fetch fresh snapshots for the links in this view">↻ Refresh view</button><button class="btn" data-a="healthAll" title="Test whether the links in this view still work">🩺 Check links</button><button class="btn" data-a="imp">⬇ Import bookmarks</button><button class="btn" data-a="exp">⬆ Export</button><button class="btn" data-a="tok" title="Optional GitHub token">🔑</button>');
$('.bar').insertAdjacentHTML('afterend','<div id="prog" class="sub"></div>');
document.body.insertAdjacentHTML('beforeend','<dialog id="dImp"><div id="impB"></div></dialog>');
document.addEventListener('change',async e=>{const t=e.target;
 if(t.id==='impF'&&t.files[0]){IM.src=parseBm(await t.files[0].text());$('#impN').textContent=IM.src.length+' bookmarks loaded from file.';$('#impGo').disabled=!IM.src.length}
 else if(t.dataset&&t.dataset.g){t.closest('.grp').querySelectorAll('[data-r]').forEach(c=>c.checked=t.checked);impCnt()}
 else if(t.dataset&&t.dataset.r!==undefined)impCnt()});
document.addEventListener('click',async e=>{
 const b=e.target.closest('[data-a]');if(!b)return;const a=b.dataset.a,i=S.items.find(x=>x.id===b.dataset.id);
 if(a==='stop')RUN.stop=true;
 else if(a==='refresh'){b.textContent='…';await snapshot(i);save();render()}
 else if(a==='refreshAll'||a==='healthAll'){const L=list();if(!L.length)return;const hc=a==='healthAll';
  if(L.length>30&&!await ask((hc?'Check ':'Refresh ')+L.length+' links?',{msg:'This may take a few minutes.',ok:'Go'}))return;
  if(hc&&!await probe()){await ask('Can’t test links',{msg:NOPERM});return}
  await runPool(L,hc?(x=>health(x)):snapshot,hc?6:4,(d,t)=>{prog((hc?'Checking ':'Refreshing ')+d+'/'+t+'…');if(d%5===0)render()});
  prog('');save();render()}
 else if(a==='seen'){i.sn.changed=false;save();render()}
 else if(a==='useNew'){i.u=i.h.to;i.h={st:'ok',at:now()};save();render()}
 else if(a==='tok'){const n=await ask('GitHub token (optional)',{msg:'Raises GitHub’s limit from 60 to 5,000 requests per hour. Stays in this browser. Empty = remove.',val:S.ghToken||''});if(n===null)return;S.ghToken=n.trim()||undefined;save()}
 else if(a==='imp'){IM={src:null,rows:[],opt:{},skip:{}};$('#impB').innerHTML=imp0();$('#dImp').showModal()}
 else if(a==='impBr'){try{IM.src=await readBrowser();$('#impN').textContent=IM.src.length+' bookmarks loaded from the browser.';$('#impGo').disabled=!IM.src.length}catch(err){$('#impN').textContent='Could not read bookmarks: '+err.message}}
 else if(a==='impPaste'){const us=extractUrls($('#impT').value);IM.src=us.map(u=>({t:'',u,p:[],d:0}));$('#impN').textContent=us.length+' links found in the text.';$('#impGo').disabled=!us.length}
 else if(a==='impGo')impStart();
 else if(a==='impDo')impDo();
 else if(a==='impRe'){document.querySelectorAll('#dImp [data-r]').forEach(c=>IM.rows[+c.dataset.r].sel=c.checked);
  const rows=IM.rows.filter(r=>r.h.st===b.dataset.g);rows.forEach(r=>r.sel=undefined);b.disabled=true;
  await runPool(rows,r=>health(r,true),4,(d,t)=>{b.textContent=`Re-testing ${d}/${t}…`});$('#impB').innerHTML=imp2();impCnt()}
 else if(a==='impClose'){RUN.stop=true;$('#dImp').close()}
});
