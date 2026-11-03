/* ===== gallery (thumbnails) · hover preview · read-next queue · auto previews ===== */
let GRIDMODE=false;const PV={busy:false};
const inQ=id=>(S.queue||[]).includes(id);
const hueOf=s=>{let h=0;for(const c of String(s))h=(h*31+c.charCodeAt(0))%360;return h};
const ytId=u=>{const m=String(u).match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/);return m?m[1]:''};
function thumbOf(i){const y=ytId(i.u);if(y)return `https://i.ytimg.com/vi/${y}/hqdefault.jpg`;if(i.sn&&i.sn.img)return i.sn.img;
 const g=gh(i.u);if(g[1])return `https://opengraph.githubassets.com/1/${g[1]}/${g[2].replace(/\.git$/,'')}`;return''}
function tile(i){const sn=i.sn,h=i.h,b=[],d=dom(i.u),hu=hueOf(d),src=thumbSrc(i);
 b.push(`<button class="b s" data-a="cyc" data-id="${i.id}">${ST[i.s]}</button>`);
 if(h&&HB[h.st])b.push(`<span class="b stale">${HB[h.st][0]} ${HB[h.st][1]}</span>`);
 if((sn&&sn.changed)||i.lc)b.push('<span class="b stale">🆕</span>');
 if(outdated(i))b.push('<span class="b stale">⚠️ update</span>');
 if(i.ls&&/\d/.test(i.ls.ver||''))b.push(`<span class="b">📋 ${E(i.ls.ver)}</span>`);
 if(sn&&sn.rt)b.push(`<span class="b">⏱ ${sn.rt} min</span>`);
 if(i.hl&&i.hl.length)b.push(`<button class="b" data-a="hlView" data-id="${i.id}">🖍 ${i.hl.length}</button>`);
 (i.x||[]).forEach(l=>b.push(`<a class="b s" href="${E(l.u)}" data-oid="${i.id}" target="_blank" rel="noopener" title="${E(l.u)}">${E(l.t)} ↗</a>`));
 return `<div class="gt ${i.s==='done'?'done':''}" data-hid="${i.id}"><div class="th" style="background:linear-gradient(135deg,hsl(${hu} 55% 38%),hsl(${(hu+40)%360} 55% 26%))" data-a="peek" data-id="${i.id}"><span class="tl">${E((i.t.trim()[0]||'?').toUpperCase())}</span><span class="td">${E(d)}</span>${src?`<img class="${blurOf(i)}" src="${E(src)}" loading="lazy" referrerpolicy="no-referrer" alt="">`:''}
 <input type="checkbox" class="sel gsel" data-s="${i.id}" ${SEL.has(i.id)?'checked':''}><div class="ga"><button data-a="rdOpen" data-id="${i.id}" title="Reader: the page as clean text, with highlights">📖</button><button class="${inQ(i.id)?'on':''}" data-a="qadd" data-id="${i.id}" title="Add to / remove from Read next">📚</button><button data-a="day" data-id="${i.id}" title="Daily">${i.d?'☀️':'🌑'}</button><button data-a="pin" data-id="${i.id}" title="Pin">${i.pin?'📌':'📍'}</button><button data-a="anon" data-id="${i.id}" title="Open anonymously (private window). Shift+click a title does the same">🕶</button><button data-a="adult" data-id="${i.id}" title="Blur this thumbnail (18+)">🙈</button><button data-a="edit" data-id="${i.id}" title="Edit">✏️</button><button data-a="del" data-id="${i.id}" title="Delete">🗑</button></div></div>
 <div class="gi"><img class="fav" src="${fav(i.u)}" alt=""><div style="min-width:0"><a class="gtt" href="${E(i.u)}" data-oid="${i.id}" target="_blank" rel="noopener">${E(i.t)}</a><div class="dom">${E(d)}${['all','today','attn','chg','upd','never'].includes(S.view)||S.view.startsWith('L:')?' · '+E((S.colls.find(c=>c.id===i.c)||{n:''}).n):''}</div><div class="gb">${b.join('')}</div></div></div></div>`}
{const _c=card;card=function(i){return GRIDMODE?tile(i):_c(i)}}
const railHtml=(L,key)=>{if(key)HG[key]=L.map(i=>i.id);return L.length?`<div class="rail" ${key?`data-grp="${key}"`:''}>${L.map(tile).join('')}</div>`:'<div class="empty">Nothing yet.</div>'};
{const _r=render;render=function(){GRIDMODE=!!S&&S.vmode!=='list'&&!(S.view==='home'&&!q);_r.apply(this,arguments);const l=$('#list');if(l)l.classList.toggle('grid',GRIDMODE);if(GRIDMODE)pvKick()}}
$('.bar').insertAdjacentHTML('beforeend','<button class="btn" data-a="vmode" title="Switch between gallery and list">▦ / ☰</button>');
/* ----- previews: fetch each site’s own preview image + text (anonymous), a few at a time ----- */
async function pvKick(){if(PV.busy||S.autoPv===false)return;
 const L=list().filter(i=>!i.sn&&!i.pv&&/^https?:/.test(i.u)&&!thumbOf(i)).slice(0,40);if(!L.length)return;
 PV.busy=true;if(!await probe()){PV.busy=false;return}
 await runPool(L,async i=>{i.pv=Date.now();await snapshot(i,true)},3,(d,t)=>{if(d%8===0&&d<t){prog(`Fetching previews ${d}/${t}…`);render()}});
 PV.busy=false;{const e=document.getElementById('prog');if(e&&/^Fetching previews/.test(e.textContent))prog('')}save();render()}
/* ----- read-next queue ----- */
function queueHome(){const L=(S.queue||[]).map(id=>S.items.find(i=>i.id===id)).filter(Boolean);if(!L.length)return'';
 const m=L.reduce((s,i)=>s+((i.sn&&i.sn.rt)||0),0);
 return `<h3 class="sec">📚 Read next <span class="dom">${L.length} links${m?' · about '+m+' min':''}</span> <button class="b s" data-a="qStart">▶ Start</button> <button class="b" data-a="qClear">clear</button></h3>`+railHtml(L,'queue')}
/* ----- hover preview ----- */
document.body.insertAdjacentHTML('beforeend','<div id="hov" hidden></div>');
let _hv,_hid='';
document.addEventListener('mouseover',e=>{const t=e.target.closest&&e.target.closest('[data-hid]'),id=t?t.dataset.hid:'';if(id===_hid)return;_hid=id;clearTimeout(_hv);$('#hov').hidden=true;if(id)_hv=setTimeout(()=>hovShow(t,id),650)});
document.addEventListener('scroll',()=>{clearTimeout(_hv);$('#hov').hidden=true;_hid=''},true);
document.addEventListener('click',()=>{clearTimeout(_hv);$('#hov').hidden=true},true);
function hovShow(t,id){const i=S.items.find(x=>x.id===id);if(!i||!t.isConnected)return;const sn=i.sn||{},src=thumbSrc(i),h=$('#hov');
 h.innerHTML=`${src?`<img class="${isAdult(i)?'bl':''}" src="${E(src)}" referrerpolicy="no-referrer" alt="">`:''}<b>${E(i.t)}</b><div class="dom">${E(dom(i.u))}${sn.rt?' · ⏱ '+sn.rt+' min':''}</div>${sn.desc?`<p>${E(sn.desc)}</p>`:''}${(sn.heads||[]).length?`<ul>${sn.heads.slice(0,4).map(x=>`<li>${E(x)}</li>`).join('')}</ul>`:''}${i.w?`<p class="sub">📝 ${E(i.w)}</p>`:''}`;
 h.hidden=false;const r=t.getBoundingClientRect(),w=h.offsetWidth,hh=h.offsetHeight;let x=r.right+10;if(x+w>innerWidth)x=Math.max(8,r.left-w-10);
 h.style.left=x+'px';h.style.top=Math.min(Math.max(8,r.top),Math.max(8,innerHeight-hh-8))+'px'}
document.addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(!b)return;const a=b.dataset.a;
 if(a==='vmode'){S.vmode=S.vmode==='list'?'grid':'list';save();render()}
 else if(a==='qadd'){const id=b.dataset.id;S.queue=S.queue||[];S.queue=inQ(id)?S.queue.filter(x=>x!==id):[...S.queue,id];save();render()}
 else if(a==='qClear'){S.queue=[];save();render()}
 else if(a==='qStart'&&(S.queue||[]).length)pkOpen(S.queue[0],null,S.queue.slice(),'queue')});
