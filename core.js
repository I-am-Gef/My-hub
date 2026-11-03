const $=s=>document.querySelector(s);
const E=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const now=()=>Date.now(),DAY=864e5;
const ST={todo:'To do',doing:'In progress',ref:'Reference',done:'Done'},ORD=['todo','doing','ref','done'];
const DEF=()=>({view:'today',colls:[{id:'inbox',n:'Inbox',e:'📥'},{id:'daily',n:'Daily reads',e:'☀️'},{id:'projects',n:'Parked Sessions',e:'🗂'},{id:'gh',n:'GitHub & software',e:'🧰'}],items:SEED?[
{id:'a1',t:'Awesome lists (example)',u:'https://github.com/sindresorhus/awesome',w:'Curated lists I follow. Mark the tools I really use.',c:'gh',s:'ref',g:['github'],d:false,v:'',k:0,a:now()},
{id:'a2',t:'Hacker News (example)',u:'https://news.ycombinator.com',w:'Morning scan, 10 minutes max.',c:'daily',s:'ref',g:['news'],d:true,v:'',k:0,a:now()}]:[]});
let S=null,q='',editId=null;
const save=()=>store.save(S);
const uid=()=>Math.random().toString(36).slice(2,9);
const norm=u=>{u=u.trim();return /^https?:\/\//i.test(u)?u:'https://'+u};
const dom=u=>{try{return new URL(u).hostname.replace(/^www\./,'')}catch(e){return ''}};
const gh=u=>(u.match(/github\.com\/([^\/#?]+)\/([^\/#?]+)/i)||[]);
const autoT=u=>{try{const x=new URL(u),p=x.pathname.split('/').filter(Boolean).pop();return dom(u)+(p?' / '+decodeURIComponent(p):'')}catch(e){return u}};
const openTab=u=>{if(typeof chrome!=='undefined'&&chrome.tabs)chrome.tabs.create({url:u,active:false});else window.open(u,'_blank','noopener')};
function ask(title,o={}){return new Promise(r=>{const d=$('#dAsk'),inp=$('#aI'),val=o.val===undefined?null:o.val;
 $('#aT').textContent=title;$('#aM').textContent=o.msg||'';inp.style.display=val===null?'none':'';inp.value=val||'';$('#aOk').textContent=o.ok||'OK';
 const done=v=>{d.close();r(v)};$('#aOk').onclick=()=>done(val===null?true:inp.value);$('#aNo').onclick=()=>done(null);d.oncancel=()=>r(null);
 d.showModal();if(val!==null)inp.focus()})}
function list(){
  let it=S.items;
  if(S.view==='today')it=it.filter(i=>i.d);
  else if(S.view!=='all')it=it.filter(i=>i.c===S.view);
  const s=q.toLowerCase();
  if(s)it=it.filter(i=>(i.t+i.u+i.w+i.g.join(' ')).toLowerCase().includes(s));
  return it.slice().sort((a,b)=>ORD.indexOf(a.s)-ORD.indexOf(b.s)||b.a-a.a);
}
function render(){
  const cn=id=>S.items.filter(i=>i.c===id).length;
  $('#side').innerHTML='<h1>🧭 My Hub</h1>'+
   `<button class="nav ${S.view==='today'?'on':''}" data-v="today"><span>☀️ Today</span><span>${S.items.filter(i=>i.d).length}</span></button>`+
   `<button class="nav ${S.view==='all'?'on':''}" data-v="all"><span>📚 Everything</span><span>${S.items.length}</span></button>`+
   S.colls.map(c=>`<button class="nav ${S.view===c.id?'on':''}" data-v="${c.id}"><span>${E(c.e)} ${E(c.n)}</span><span>${cn(c.id)}</span></button>`).join('')+
   '<button class="nav" data-a="newColl"><span>+ New collection</span></button>';
  const c=S.colls.find(x=>x.id===S.view),L=list();
  const name=S.view==='today'?'☀️ Today':S.view==='all'?'📚 Everything':c?c.e+' '+c.n:'';
  $('#head').innerHTML=`<div class="t"><h2>${E(name)}</h2><span>${L.length?'<button class="btn" data-a="openAll">Open all ↗</button>':''}${c&&c.id!=='inbox'?' <button class="btn" data-a="delColl">🗑</button>':''}</span></div><p class="sub">${S.view==='today'?'Your daily set: links flagged ☀️.':S.view==='inbox'?'Triage: give each link a collection and a reason, or delete it.':' '}</p>`;
  $('#list').innerHTML=L.length?L.map(card).join(''):'<div class="empty">Nothing here yet. Use “+ Add” or “Paste tabs”.</div>';
}
function card(i){
  const g=gh(i.u),col=S.colls.find(c=>c.id===i.c);
  let ghl='';
  if(g[1]){const dd=i.k?Math.floor((now()-i.k)/DAY):null,st=dd===null||dd>30;
    ghl=`<span class="b ${st?'stale':''}">${i.v?'v'+E(i.v)+' · ':''}${dd===null?'never checked':'checked '+dd+'d ago'}</span><a class="b" target="_blank" rel="noopener" href="https://github.com/${E(g[1])}/${E(g[2])}/releases">Releases ↗</a><button class="b" data-a="chk" data-id="${i.id}">✓ Checked</button>`}
  return `<div class="card ${i.s==='done'?'done':''}"><div class="t"><div><a href="${E(i.u)}" target="_blank" rel="noopener">${E(i.t)}</a> <span class="dom">${E(dom(i.u))}</span></div>
  <div class="act"><button title="Daily" data-a="day" data-id="${i.id}">${i.d?'☀️':'🌑'}</button><button title="Edit" data-a="edit" data-id="${i.id}">✏️</button><button title="Delete" data-a="del" data-id="${i.id}">🗑</button></div></div>
  <div class="why">${E(i.w)}</div>
  <div class="meta"><button class="b s" data-a="cyc" data-id="${i.id}">${ST[i.s]}</button>${S.view==='all'||S.view==='today'?`<span class="b">${col?E(col.e+' '+col.n):''}</span>`:''}${i.g.map(t=>`<span class="b">#${E(t)}</span>`).join('')}${ghl}</div></div>`;
}
const opts=(sel,v)=>{sel.innerHTML=S.colls.map(c=>`<option value="${c.id}">${E(c.e+' '+cpath(c.id))}</option>`).join('');sel.value=v};
function openEdit(id){
  editId=id;const i=S.items.find(x=>x.id===id)||{t:'',u:'',w:'',c:S.colls.some(c=>c.id===S.view)?S.view:'inbox',s:'todo',g:[],d:S.view==='today',v:''};
  $('#eT').textContent=id?'Edit link':'Add link';
  $('#eU').value=i.u;$('#eN').value=i.t;$('#eW').value=i.w;opts($('#eC'),i.c);$('#eS').value=i.s;$('#eG').value=i.g.join(', ');$('#eV').value=i.v;$('#eD').checked=i.d;
  $('#dEdit').showModal();
}
document.addEventListener('click',async e=>{
  const v=e.target.closest('[data-v]');if(v){S.view=v.dataset.v;save();render();return}
  const b=e.target.closest('[data-a]');if(!b)return;
  const a=b.dataset.a,id=b.dataset.id,i=S.items.find(x=>x.id===id);
  if(a==='new')openEdit(null);
  else if(a==='edit')openEdit(id);
  else if(a==='close')b.closest('dialog').close();
  else if(a==='save'){
    const u=$('#eU').value.trim();if(!u)return;const url=norm(u);
    const o={t:$('#eN').value.trim()||autoT(url),u:url,w:$('#eW').value.trim(),c:$('#eC').value,s:$('#eS').value,g:$('#eG').value.split(',').map(x=>x.trim()).filter(Boolean),d:$('#eD').checked,v:$('#eV').value.trim()};
    if(editId)Object.assign(S.items.find(x=>x.id===editId),o);else S.items.unshift({id:uid(),k:0,a:now(),...o});
    $('#dEdit').close();save();render();
  }
  else if(a==='del'){if(await ask('Delete this link?',{msg:i.t,ok:'Delete'})){S.items=S.items.filter(x=>x.id!==id);save();render()}}
  else if(a==='day'){i.d=!i.d;save();render()}
  else if(a==='cyc'){i.s=ORD[(ORD.indexOf(i.s)+1)%4];save();render()}
  else if(a==='chk'){const n=await ask('Installed version',{msg:'Leave as is to keep the current one.',val:i.v});if(n===null)return;i.k=now();if(n.trim())i.v=n.trim();save();render()}
  else if(a==='paste'){opts($('#pC'),'inbox');$('#pT').value='';$('#dPaste').showModal()}
  else if(a==='doPaste'){
    const us=$('#pT').value.split(/\s+/).filter(x=>/\./.test(x));
    us.forEach(x=>{const u=norm(x);S.items.unshift({id:uid(),t:autoT(u),u,w:'',c:$('#pC').value,s:'todo',g:[],d:false,v:'',k:0,a:now()})});
    $('#dPaste').close();S.view=$('#pC').value;save();render();
  }
  else if(a==='newColl'){const n=await ask('New collection',{msg:'Name',val:''});if(!n||!n.trim())return;const em=await ask('Emoji',{val:'📁'});const c={id:uid(),n:n.trim(),e:em||'📁'};S.colls.push(c);S.view=c.id;save();render()}
  else if(a==='delColl'){if(await ask('Delete this collection?',{msg:'Its links move to Inbox.',ok:'Delete'})){S.items.forEach(x=>{if(x.c===S.view)x.c='inbox'});{const pp=(S.colls.find(c=>c.id===S.view)||{}).p;S.colls.forEach(c=>{if(c.p===S.view)c.p=pp})}S.colls=S.colls.filter(c=>c.id!==S.view);S.view='inbox';save();render()}}
  else if(a==='openAll'){const L=list().filter(x=>x.s!=='done');if(L.length>8&&!await ask('Open '+L.length+' tabs?',{ok:'Open'}))return;openMany(L)}
  else if(a==='backup'){$('#bT').value=JSON.stringify(S,null,1);$('#dBack').showModal()}
  else if(a==='copy'){try{await navigator.clipboard.writeText($('#bT').value)}catch(e){$('#bT').select()}}
  else if(a==='restore'){try{const d=JSON.parse($('#bT').value);if(!d.items||!d.colls)throw 0;S=d;save();$('#dBack').close();render()}catch(e){await ask('Invalid backup',{msg:'That text is not a valid backup.'})}}
});
$('#q').addEventListener('input',e=>{q=e.target.value;render()});
(async()=>{const d=await store.load();S=(d&&d.items&&d.colls)?d:DEF();S.view='home';S.open=S.open||{};
 if(store.watch)store.watch(n=>{if(n&&n.items){S=n;render()}});render()})();
