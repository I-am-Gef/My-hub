const $=s=>document.querySelector(s),E=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const id=new URLSearchParams(location.search).get('id');
let item=null,paras=[],err='',pOpen=false;
const getS=async()=>(await chrome.storage.local.get('hub1')).hub1;
const host=u=>{try{return new URL(u).hostname.replace(/^www\./,'')}catch(e){return''}};
const ago=t=>{const m=Math.floor((Date.now()-t)/6e4);return m<1?'just now':m<60?m+'m ago':m<1440?Math.floor(m/60)+'h ago':Math.floor(m/1440)+'d ago'};
async function mutate(f){const S=await getS(),it=S&&S.items.find(x=>x.id===id);if(!it)return;f(it);await chrome.storage.local.set({hub1:S});item=it}
function draw(){const hl=(item.hl||[]).map(h=>E(h.t)),words=paras.reduce((n,[,t])=>n+t.split(/\s+/).length,0);
 const body=paras.length?paras.map(([n,t])=>{let s=E(t);hl.forEach(h=>{if(h&&s.includes(h))s=s.split(h).join('<mark>'+h+'</mark>')});return /^H/.test(n)?`<h3>${s}</h3>`:`<p>${n==='LI'?'• ':''}${s}</p>`}).join(''):`<p class="m">${err?'Could not load this page: '+E(err):'There is no readable text on this page (it probably needs JavaScript, or it is a game, a video or an app). Use “Original ↗”.'}</p>`;
 $('#a').innerHTML=`<h1>${E(item.t)}</h1><div class="meta">${E(host(item.u))}${words>150?' · about '+Math.max(1,Math.round(words/220))+' min read':''}</div>${body}`;
 $('#hn').textContent=(item.hl||[]).length;
 const sd=$('#side');sd.hidden=!pOpen;sd.innerHTML=`<b>Highlights</b>${(item.hl||[]).map((h,k)=>`<div class="hl"><button data-d="${k}" title="Remove this highlight">🗑</button>${E(h.t)}<small>${ago(h.at)}</small></div>`).join('')||'<p class="m">Select any text and press 🖍 Highlight (or the H key).</p>'}${(item.hl||[]).length?'<p><button id="cp">Copy all</button></p>':''}`}
async function init(){const S=await getS();item=S&&S.items.find(x=>x.id===id);
 if(!item){$('#a').innerHTML='<p class="m">This link is no longer in your hub.</p>';return}
 document.title='📖 '+item.t;$('#ti').textContent=item.t;$('#og').href=item.u;
 try{const r=await fetch(item.u,{credentials:'include'});if(!r.ok)throw new Error('HTTP '+r.status);
  const d=new DOMParser().parseFromString(await r.text(),'text/html');d.querySelectorAll('script,style,noscript,nav,header,footer,aside,form,svg,iframe').forEach(e=>e.remove());
  const root=d.querySelector('article,main,[role=main]')||d.body;
  root.querySelectorAll('h1,h2,h3,h4,p,li,pre,blockquote').forEach(e=>{const t=e.textContent.replace(/\s+/g,' ').trim();if(t.length>(/^H/.test(e.tagName)?1:25))paras.push([e.tagName,t])});
  if(!paras.length){const t=(root.textContent||'').replace(/\s+/g,' ').trim();if(t.length>200)paras.push(['P',t.slice(0,8000)])}
  paras=paras.slice(0,500)}catch(e){err=e.message}
 draw()}
/* highlighting: select text, press the little button that appears (or H) */
let pending=[];
function selLines(){const s=getSelection();if(!s||!s.rangeCount||!$('#a').contains(s.anchorNode))return[];return String(s).split(/\n+/).map(x=>x.replace(/\s+/g,' ').trim()).filter(x=>x.length>=4)}
function showHb(){const L=selLines(),b=$('#hb');if(!L.length){b.style.display='none';return}pending=L;const r=getSelection().getRangeAt(0).getBoundingClientRect();
 b.style.display='block';b.style.left=Math.max(8,Math.min(innerWidth-120,r.left+r.width/2-50))+'px';b.style.top=Math.max(48,r.top-40)+'px'}
async function addHl(){if(!pending.length)return;const add=pending.slice();pending=[];$('#hb').style.display='none';
 await mutate(it=>{it.hl=it.hl||[];add.forEach(t=>{if(!it.hl.some(h=>h.t===t))it.hl.push({t:t.slice(0,600),at:Date.now()})})});
 try{getSelection().removeAllRanges()}catch(e){}pOpen=true;draw()}
document.addEventListener('mouseup',()=>setTimeout(showHb,0));
document.addEventListener('keyup',e=>{if(e.key==='h'||e.key==='H'){if(selLines().length){pending=selLines();addHl()}}});
$('#hb').addEventListener('mousedown',e=>e.preventDefault());$('#hb').addEventListener('click',addHl);
$('#hp').onclick=()=>{pOpen=!pOpen;if(item)draw()};
const fs=n=>{const v=Math.max(13,Math.min(30,(+localStorage.getItem('rdfs')||18)+n));localStorage.setItem('rdfs',v);document.documentElement.style.setProperty('--fs',v+'px')};
document.documentElement.style.setProperty('--fs',(+localStorage.getItem('rdfs')||18)+'px');$('#fm').onclick=()=>fs(-1);$('#fp').onclick=()=>fs(1);
document.addEventListener('click',async e=>{const d=e.target.closest('[data-d]');
 if(d){await mutate(it=>it.hl.splice(+d.dataset.d,1));draw()}
 else if(e.target.id==='cp'){try{await navigator.clipboard.writeText((item.hl||[]).map(h=>'• '+h.t).join('\n'))}catch(err){}}});
init();
