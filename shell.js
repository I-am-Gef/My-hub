/* ===== shell: top bar · sidebar (program-style menu) · dropdowns · Home · settings · tooltips · projects ===== */
/* ----- thumbnails: page / letter / blurred, plus per-link or per-folder 18+ ----- */
function isAdult(i){if(i.adult)return true;let c=S.colls.find(x=>x.id===i.c),g=0;while(c&&g++<20){if(c.adult)return true;c=S.colls.find(x=>x.id===c.p)}return false}
const thumbSrc=i=>S.thumb==='letter'?'':thumbOf(i);
const blurOf=i=>isAdult(i)?'bl':S.thumb==='blur'?'bl bm':'';
/* ----- sidebar visibility ----- */
const sbApply=()=>document.body.classList.toggle('sbh',!!S.sbHide);
const sbToggle=()=>{S.sbHide=!S.sbHide;save();sbApply()};
/* ----- top bar: ☰ · search · + Add · view · ⋯ ----- */
{const bar=$('.bar'),q0=$('#q');[...bar.children].forEach(c=>{if(c!==q0)c.remove()});
 bar.insertAdjacentHTML('afterbegin','<button class="btn ic" data-a="sbTog" title="Show or hide the sidebar (Ctrl/⌘+B)">☰</button>');
 q0.placeholder='Search your links…  ( / )';q0.title='Search your links. Press / from anywhere to jump here';
 bar.insertAdjacentHTML('beforeend','<button class="btn p" data-a="new">＋ Add link</button><button class="btn" data-menu="tools" title="Tools: triage, import, export, backup, track a list, share…">🧰 Tools</button><button class="btn" id="vmB" data-a="vmode"></button><button class="btn ic" data-menu="bar">⋯</button>')}
/* ----- dropdown menus ----- */
const MENUS={
 sel:()=>[{i:'🗂',l:'Open in this window',a:'bOpenHere',t:'Open the selected links as tabs here (each loads when you click it)'},{i:'🗗',l:'Open in a new window',a:'bOpenNew',t:'Open the selected links together in a separate window'},{i:'🕶',l:'Anonymous window',a:'bOpenAnon',t:'Open the selected links in a private (incognito) window'}],
 dailies:()=>[{i:'🗂',l:'In this window',a:'homeOpen',t:'Open your daily links as tabs here (each loads when you click it)'},{i:'🗗',l:'In a new window',a:'homeOpenNew'},{i:'🕶',l:'Anonymous window',a:'homeOpenAnon',t:'Open your daily links in a private (incognito) window'}],
 proj:b=>[{i:'🗂',l:'In this window',a:'prjOpen',cid:b.dataset.cid,t:'Open every link of this parked session as tabs here, in its order'},{i:'🗗',l:'In a new window',a:'prjOpenNew',cid:b.dataset.cid},{i:'🕶',l:'Anonymous window',a:'prjOpenAnon',cid:b.dataset.cid,t:'Open every link of this parked session in a private (incognito) window'}],
 openall:()=>[{i:'🗂',l:'In this window',a:'openAll',t:'Open every link as tabs here, in the order shown (each loads when you click it)'},{i:'🗗',l:'In a new window',a:'openAllNew',t:'Open every link together in a separate window, in the order shown'},{i:'🕶',l:'Anonymous window',a:'openAllAnon',t:'Open every link in a private (incognito) window, in the order shown'}],
 tools:()=>[{i:'🧭',l:'Triage',a:'tri',t:'Sort unsorted links one by one in the side window'},{i:'⬇',l:'Import bookmarks',a:'imp',t:'Bring in your browser favorites, filtered and tested'},{i:'⬆',l:'Export favorites',a:'exp',t:'Save links as a bookmarks file for any browser'},{i:'💾',l:'Backup & restore',a:'bk',t:'Save or restore everything'},{i:'📋',l:'Track a GitHub list',a:'lstNew',t:'Follow a README list and its changes'},{i:'🔗',l:'Share as read-only page',a:'shareOpen',t:'Make a standalone page from a folder or a selection'},{i:'🔍',l:'Quick find',a:'palOpen',t:'Jump to a folder or a link (Ctrl/⌘+K)'}],
 bar:()=>[{i:'↻',l:'Refresh previews & snapshots',a:'refreshAll',t:'Fetch fresh descriptions, images and changes for the links in this view'},{i:'🩺',l:'Check links',a:'healthAll',t:'Test whether the links in this view still work'},{i:'☑',l:'Select all in this view',a:'selAll',t:'Tick every link shown'},{i:'🔎',l:'Filter by status',a:'fltO',t:'Show only links with a given status'}],
 col:()=>{const c=S.colls.find(x=>x.id===S.view);if(!c)return[];return[{i:'➕',l:'New subfolder',a:'newSub'},{i:'✏️',l:'Rename',a:'ren'},{i:'🙈',l:c.adult?'Stop blurring thumbnails':'Blur thumbnails (18+)',a:'colAdult',t:'Hide previews of every link in this folder'},{i:'🧭',l:'Triage this folder',a:'tri',t:'Sort the links of this folder one by one in the side window'},{i:'▶',l:'Go through this folder',a:'goThrough',t:'Look at its links one by one in the side window'},{i:'🔗',l:'Share as read-only page…',a:'shareOpen'},{i:'🏷',l:'Suggest folders…',a:'sugOpen',t:'Propose folders by where you keep links from the same site'},...(!['inbox','projects'].includes(c.id)?['-',{i:'🗑',l:'Delete folder…',a:'colDel',t:'Choose whether to keep or delete what is inside'}]:[])]}};
function closeMenu(){document.querySelectorAll('.menu').forEach(m=>m.remove())}
function menuOpen(btn,items){closeMenu();const m=document.createElement('div');m.className='menu';
 m.innerHTML=items.map(x=>x==='-'?'<hr>':`<button data-a="${x.a}" ${x.cid?`data-cid="${x.cid}"`:''} title="${E(x.t||x.l)}"><span>${x.i}</span>${E(x.l)}</button>`).join('');document.body.appendChild(m);
 const r=btn.getBoundingClientRect();m.style.top=(r.bottom+m.offsetHeight+12>innerHeight?Math.max(8,r.top-m.offsetHeight-6):r.bottom+6)+'px';m.style.left=Math.max(8,Math.min(r.left,innerWidth-m.offsetWidth-8))+'px'}
document.addEventListener('click',e=>{const mb=e.target.closest('[data-menu]');
 if(mb){const f=MENUS[mb.dataset.menu];const had=document.querySelector('.menu');closeMenu();if(!had&&f)menuOpen(mb,f(mb));return}
 if(e.target.closest('.menu'))setTimeout(closeMenu,0);else closeMenu()},true);
/* ----- sidebar: navigation · collections · tools ----- */
function sidebar(){
 const anc=new Set();{let c=S.colls.find(x=>x.id===S.view),g=0;while(c&&c.p&&g++<20){anc.add(c.p);c=S.colls.find(x=>x.id===c.p)}}
 const row=(c,d)=>{const k=S.colls.some(x=>x.p===c.id),op=!!(S.open&&S.open[c.id])||anc.has(c.id);
  return `<div class="nr" style="padding-left:${d*14}px"><i class="tg" ${k?`data-tg="${c.id}"`:''}>${k?(op?'▾':'▸'):''}</i><button class="nav ${S.view===c.id?'on':''}" data-v="${c.id}" title="${E(cpath(c.id))}"><span>${E(c.e)} ${E(c.n)}</span><span>${cnt(c.id)}</span></button></div>`+(k&&op?S.colls.filter(x=>x.p===c.id).map(x=>row(x,d+1)).join(''):'')};
 const nv=(v,i,l,n,t)=>`<button class="nav ${S.view===v?'on':''}" data-v="${v}" title="${E(t)}"><span>${i} ${l}</span><span>${n}</span></button>`;
 const tl=(a,i,l,t)=>`<button class="nav" data-a="${a}" title="${E(t)}"><span>${i} ${l}</span></button>`;
 const nvN=S.items.filter(neverOpened).length,ec=emptyColls().length;
 $('#side').innerHTML=`<div class="sbt"><b>🧭 My Hub</b><button class="btn ic" data-a="setOpen" title="Settings">⚙</button></div>`+
  nv('home','🏠','Home','','Your start page')+nv('today','☀️','Today',S.items.filter(i=>i.d).length,'Links you flagged as daily')+nv('all','📚','Everything',S.items.length,'Every link you have')+nv('attn','🩺','Needs attention',S.items.filter(attn).length,'Links that failed a check')+(nvN?nv('never','👻','Never opened',nvN,'Links saved but never opened from here'):'')+
  `<div class="sgl"><span>Collections</span><button class="b" data-a="newColl" title="Create a new collection">＋</button></div>`+S.colls.filter(isRoot).map(c=>row(c,0)).join('')+(ec?`<button class="nav" data-a="cleanEmpty" title="Remove folders that have no links inside"><span>🧹 Clean ${ec} empty folders</span></button>`:'')}
/* ----- list header ----- */
function headHtml(v,c,L,name,sub,chips){return `<div class="hd"><h2>${E(name)}</h2><div class="hdr">${sortSelHtml(c)}${L.length?'<button class="btn" data-menu="openall" title="Open every link of this view as tabs, in the order shown">↗ Open all ▾</button>':''}${c?'<button class="btn ic" data-menu="col" title="Folder actions">⋯</button>':''}</div></div>${sub.trim()?`<p class="sub">${sub}</p>`:''}${chips?`<div class="meta" style="margin:0 0 12px">${chips}</div>`:''}`}
/* ----- selection bar ----- */
function bulkBar(){let e=$('#bulk');if(!e){document.body.insertAdjacentHTML('beforeend','<div id="bulk"></div>');e=$('#bulk')}
 e.style.display=SEL.size?'flex':'none';
 e.innerHTML=SEL.size?`<b>${SEL.size} selected</b><button class="btn" data-a="selAll" title="Tick every link in this view">All in view</button><select id="bMv" title="Move the selected links to a folder"><option value="">Move to…</option>${S.colls.map(c=>`<option value="${c.id}">${E(c.e+' '+cpath(c.id))}</option>`).join('')}</select><span class="sp1"></span><button class="btn" data-menu="sel" title="Open the selected links as tabs">↗ Open ▾</button><button class="btn" data-a="bDay" title="Flag as daily">☀️ Daily</button><button class="btn" data-a="bUse" title="Set my installed version from the list">✓ I use these</button><button class="btn" data-a="bCp" title="Save text copies">💾 Copies</button><button class="btn" data-a="bExp" title="Export as a bookmarks file">⬆ Export</button><button class="btn" data-a="bShare" title="Make a read-only page">🔗 Share</button><button class="btn" data-a="bDel" title="Delete the selected links">🗑 Delete</button><button class="btn ic" data-a="selClr" title="Clear the selection">✕</button>`:''}
/* ----- Home: every block follows the gallery / list setting ----- */
const homeOn=k=>!(S.home&&S.home[k]===false);
const itemsHtml=(L,full,key)=>{if(!L.length)return'';if(S.vmode==='list'){if(key)HG[key]=L.map(i=>i.id);const h=full?L.map(card).join(''):L.map(glance).join('');return key?`<div data-grp="${key}">${h}</div>`:h}return railHtml(L,key)};
function homeInsights(){const top=S.items.filter(i=>i.o).sort((a,b)=>b.o-a.o).slice(0,6),n=S.items.filter(neverOpened).length;if(!top.length&&!n)return'';
 return '<h3 class="sec">📈 Most opened <span class="dom">counted when you open links from here</span> '+(top.length?'<button class="b" data-a="usageReset" title="Forget the open counts and start counting again">↺ reset</button>':'')+'</h3>'+itemsHtml(top,false,'usage')+(n?`<p class="sub" style="margin-top:10px">👻 ${n} links you saved but never opened. <button class="b" data-v="never">review them</button> <button class="b" data-a="tri">triage</button></p>`:'')}
function projectsHome(){const P=S.colls.filter(c=>c.proj);if(!P.length)return'';
 return `<h3 class="sec">🗂 Parked Sessions <span class="dom">named groups of links to come back to: a research, a shopping list, school work…</span> <button class="b" data-a="prjNew" title="Create an empty parked session">＋ new session</button></h3>`+P.map(c=>{const its=S.items.filter(i=>deep(c.id).includes(i.c));
  return `<div class="ir2"><span class="fvs">${its.slice(0,4).map(i=>`<img class="fav" src="${fav(i.u)}" alt="">`).join('')}</span><button class="linkb" data-v="${c.id}" title="Open this parked session">${E(c.e+' '+c.n)}</button><span class="dom">${its.length} links${c.note?' · '+E(c.note):''}</span><button class="b s" data-a="prjGo" data-cid="${c.id}" title="Look at its links one by one in the side window, in the saved order">▶ Go through</button><button class="b s" data-a="prjTri" data-cid="${c.id}" title="Sort its links one by one: move, done, daily or delete each">🧭 Triage</button><button class="b" data-menu="proj" data-cid="${c.id}" title="Open every link of this parked session as tabs, in its order">↗ open all ▾</button><button class="b" data-a="prjRen" data-cid="${c.id}" title="Rename this parked session">✏️</button><button class="b" data-a="prjDel" data-cid="${c.id}" title="Delete this parked session">🗑</button></div>`}).join('')}
function home(){
 const hr=new Date().getHours(),gr=hr<5?'Good night':hr<12?'Good morning':hr<18?'Good afternoon':'Good evening';
 const day=S.items.filter(i=>i.d),chg=S.items.filter(i=>(i.sn&&i.sn.changed)||i.lc),upd=S.items.filter(outdated),att=S.items.filter(attn),inb=S.items.filter(i=>i.c==='inbox'),pins=S.items.filter(i=>i.pin);
 const tile_=(v,ic,l,n,w,t)=>`<button class="tile ${w&&n?'w':''}" data-v="${v}" title="${E(t)}"><b>${n}</b><span>${ic} ${l}</span></button>`;
 let h=`<div class="hero"><div><h1>${gr} 👋</h1><p class="sub" style="margin:2px 0 0">${new Date().toLocaleDateString(undefined,{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</p></div><div class="row" style="margin:0"><button class="btn p" data-a="homeRef" title="Fetch the latest headlines for your daily links">↻ Refresh dailies</button><button class="btn" data-menu="dailies" title="Open your daily links as tabs">↗ Open dailies ▾</button></div></div>
 <div class="tiles">${tile_('today','☀️','Daily links',day.length,0,'Links flagged as daily')+tile_('chg','🆕','Changed',chg.length,1,'Links whose page or list entry changed')+tile_('upd','⚠️','Updates',upd.length,1,'Programs where a newer version exists')+tile_('attn','🩺','Need attention',att.length,1,'Links that failed a check')+tile_('inbox','📥','To sort (Inbox)',inb.length,0,'New links waiting for a folder')+tile_('all','📚','All links',S.items.length,0,'Every link you have')}</div>`;
 if(S.items.length&&(!S.lastFile||now()-S.lastFile>14*DAY))h+=`<div class="card">💾 ${S.lastFile?'Your last backup file is '+Math.floor((now()-S.lastFile)/DAY)+' days old.':'You have never saved a backup file.'} <button class="btn p" data-a="bk">Back up now</button></div>`;
 if(!S.items.length)h+='<div class="card"><b>Start here</b><ol><li>Open <b>Tools → Import bookmarks</b> in the sidebar to bring in your old favorites. They are tested first, and your folders are kept.</li><li>Use the toolbar button on any tab to save it with a note on why.</li><li>Press 🌑 on sites you check every day, then <b>↻ Refresh dailies</b>.</li></ol></div>';
 if(homeOn('media')&&typeof mediaBlock==='function')h+=mediaBlock();
 if(homeOn('queue'))h+=queueHome();
 if(homeOn('projects'))h+=projectsHome();
 if(homeOn('lists'))h+=lstHome();
 if(homeOn('pins')&&pins.length)h+='<h3 class="sec">📌 Pinned</h3>'+itemsHtml(pins,true,'pins');
 if(homeOn('chg')){if(chg.length)h+='<h3 class="sec">🆕 Changed since you last looked</h3>'+itemsHtml(chg.slice(0,12),true,'chg');if(upd.length)h+='<h3 class="sec">⚠️ Programs with updates</h3>'+itemsHtml(upd.slice(0,12),true,'upd')}
 if(homeOn('routine'))h+=routineHtml(day);
 if(homeOn('recent')){const cut=S.recentCut||0,r=S.items.filter(i=>i.a>cut).sort((a,b)=>b.a-a.a).slice(0,8);
  if(r.length)h+='<h3 class="sec">🕘 Recently added <button class="b" data-a="recentClear" title="Empty this list; links you add from now on will show up here">✕ clear</button></h3>'+itemsHtml(r,false,'recent')}
 if(homeOn('usage'))h+=homeInsights();
 if(homeOn('collections')){const tot=id=>deep(id).reduce((s,x)=>s+cnt(x),0);h+=`<h3 class="sec">📁 Collections</h3><div class="tiles">${S.colls.filter(isRoot).map(c=>`<button class="tile" data-v="${c.id}" title="${E(c.n)}"><b>${tot(c.id)}</b><span>${E(c.e+' '+c.n)}</span></button>`).join('')}</div>`}
 return h+'<p class="sub" style="margin-top:24px"><button class="b" data-a="setOpen" title="Choose which blocks Home shows">⚙ Customize this page</button></p>'}
/* ----- settings ----- */
function setOpen(){const kb=Math.round(JSON.stringify(TX).length/1024),tm=S.thumb||'page',vm=S.vmode==='list'?'list':'grid';
 const ck=(id,on,txt,tip)=>`<label class="chk" title="${E(tip||'')}"><input type="checkbox" id="${id}" ${on?'checked':''}> ${txt}</label>`;
 const rd=(n,v,cur,txt)=>`<label class="chk"><input type="radio" name="${n}" value="${v}" ${cur===v?'checked':''}> ${txt}</label>`;
 const hm=[['media','Now playing'],['queue','Read next'],['projects','Parked Sessions'],['lists','Tracked GitHub lists'],['pins','Pinned'],['chg','Changes & updates'],['routine','Routine'],['recent','Recently added'],['usage','Most opened'],['collections','Collections']];
 $('#dSet').innerHTML=`<h3 style="margin:0">⚙ Settings</h3>
 <div class="sgrp"><b>Appearance</b><div class="sub">Thumbnails</div>${rd('thumb','page',tm,'Page preview (the site’s own image)')+rd('thumb','letter',tm,'Letter only (a colored tile, no image)')+rd('thumb','blur',tm,'Blurred (revealed when you hover; links marked 18+ always stay blurred)')}<div class="sub">Default view</div>${rd('vm','grid',vm,'Gallery')+rd('vm','list',vm,'List')}</div>
 <div class="sgrp"><b>Home page</b><div class="sub">Show these blocks:</div><div class="hmgrid">${hm.map(([k,l])=>ck('hm_'+k,homeOn(k),l)).join('')}</div>${S.recentCut?'<div class="row" style="justify-content:flex-start;margin-top:8px"><button class="btn" data-a="recentUndo" title="Show the links that were cleared from Recently added again">Show older links in “Recently added” again</button></div>':''}</div>
 <div class="sgrp"><b>Opening links</b>${ck('sView',S.viewer!==false,'Open links in a side “peek” window (Ctrl/⌘+click opens a normal tab)')+ck('sDock',S.dock!==false,'While peeking, move the hub to the left part of the screen')+ck('sSbP',S.sbPeek!==false,'While peeking, hide the sidebar')+ck('sLazy',S.lazy!==false,'Open many tabs lazily: with 4 or more, each loads only when you click it')+ck('sWall',S.wall!==false,'Arrange kept windows as a video wall: with 2 or more they tile the screen without covering each other')}<div class="sub">🕶 Anonymous means a private (incognito) browser window: Shift+click a title, the 🕶 button, or the “Anonymous window” entry of any Open menu. It has no side window or controls, and nothing from it is tracked. To load many tabs lazily inside it, allow this extension in private windows (chrome://extensions → Details → Allow in Incognito).</div></div>
 <div class="sgrp"><b>Automatic</b>${ck('sAuto',S.autoCheck,'Re-check my links in the background every 6 hours (40 per run, oldest first; the toolbar icon shows a badge)')+ck('sPv',S.autoPv!==false,'Fetch site previews while I browse the gallery (anonymous requests, 40 at a time)')}</div>
 <div class="sgrp"><b>GitHub</b><div class="sub">Optional token: raises GitHub’s limit from 60 to 5,000 requests per hour. Stays in this browser.</div><input id="sTok" type="password" value="${E(S.ghToken||'')}"></div>
 <div class="sgrp"><b>Backup folder</b><div class="sub">A daily automatic copy, 7 rotating files (for example inside Dropbox or Drive).</div><div class="row" style="justify-content:flex-start;flex-wrap:wrap;margin-top:4px;align-items:center"><span class="sub" id="sDir">…</span><button class="btn" data-a="dirPick">Choose folder…</button><button class="btn" data-a="dirAllow">Allow again</button><button class="btn" data-a="dirNow">Write now</button><button class="btn" data-a="dirOff">Remove</button></div></div>
 <div class="sgrp"><b>Saved page copies</b><div class="row" style="justify-content:flex-start;margin-top:4px;align-items:center"><span class="sub">${Object.keys(TX).length} pages · about ${kb} KB (not included in backups)</span><button class="btn" data-a="cpClear">Delete all copies</button></div></div>
 <div class="sgrp"><b>Keyboard shortcuts</b><div class="sub">Ctrl/⌘+B sidebar · Ctrl/⌘+K quick find · / search · J / K next / previous link while peeking · in Triage: Enter move, S skip, D delete, A done, Y daily · in the Reader: H highlights the selected text</div></div>
 <div class="row"><button class="btn p" data-a="close">Done</button></div>`;$('#dSet').showModal();dirStatus()}
document.addEventListener('change',e=>{const t=e.target;
 if(t.id==='sortSel'){const c=S.colls.find(x=>x.id===S.view);if(c)c.sort=t.value;else S.sort=t.value;save();render();return}
 if(t.name==='thumb'){S.thumb=t.value;save();render()}else if(t.name==='vm'){S.vmode=t.value;save();render()}
 else if(t.id&&t.id.startsWith('hm_')){S.home=S.home||{};S.home[t.id.slice(3)]=t.checked;save();render()}else if(t.id==='sSbP'){S.sbPeek=t.checked;save()}else if(t.id==='sWall'){S.wall=t.checked;save();if(t.checked&&typeof wallLayout==='function')wallLayout()}});
/* ----- projects (parked sessions and research are the same thing now) ----- */
function migrate(){if(!S)return;
 if(S.migr>=1){if(!(S.migr>=2)){const r=S.colls.find(c=>c.id==='projects');if(r&&r.n==='Projects')r.n='Parked Sessions';S.items.forEach(i=>{if(i.g&&i.g.includes('project'))i.g=i.g.map(t=>t==='project'?'parked-session':t)});S.migr=2;save();render()}return}
 if(!S.colls.some(c=>c.id==='projects'))S.colls.push({id:'projects',n:'Parked Sessions',e:'🗂'});
 const r=S.colls.find(c=>c.id==='research');if(r&&!r.proj){r.proj=true;r.p='projects';r.e='🗂'}
 (S.sessions||[]).forEach(s=>{const id='p_'+uid(),seen=new Set();S.colls.push({id,n:s.name,e:'🗂',p:'projects',proj:true,note:s.note||''});s.tabs.forEach(t=>{const k=nk(t.u);if(seen.has(k))return;seen.add(k);S.items.push({id:uid(),t:t.t||t.u,u:t.u,w:'',c:id,s:'ref',g:['parked-session'],d:false,v:'',k:0,a:s.at||now()})})});
 delete S.sessions;S.migr=2;save();render()}
{const t=setInterval(()=>{if(S){clearInterval(t);sbApply();migrate()}},300)}
/* ----- tooltips for every button that lacks one ----- */
const TIPS={new:'Add a link by hand',vmode:'Switch between gallery and list',sbTog:'Show or hide the sidebar (Ctrl/⌘+B)',tri:'Sort unsorted links one by one in the side window',palOpen:'Jump to a folder or a link (Ctrl/⌘+K)',openAll:'Open every link of this view in tabs (each loads when you click it)',cyc:'Change status (click to cycle)',day:'Flag / unflag as daily',pin:'Pin to Home',edit:'Edit this link',del:'Delete this link',qadd:'Add to / remove from Read next',refresh:'Refresh this link’s preview and changes',chk:'Mark as checked now (and set the installed version)',cpSave:'Save a text copy of this page',cpView:'View the saved text copy',rn:'Show the release notes since your version',hlView:'Show your highlights',use:'Set my installed version from the list',lcSeen:'Dismiss this change',seen:'Dismiss this change',useNew:'Replace the address with the new one',useHome:'Point the link to the site’s home page',cad:'How often this daily link should be checked',peek:'Open in the side window',rdOpen:'Reader: the page as clean text, with highlights',adult:'Blur this thumbnail (18+)',homeRef:'Fetch the latest headlines for your daily links',homeOpen:'Open your daily links in tabs',rdone:'Mark as done for now',lstSync:'Re-read the list and compare',lstSyncAll:'Re-read every tracked list',lstNew:'Follow another GitHub list',lstDel:'Stop following this list',lstTog:'Show / hide what is in this list',lstRen:'Rename the list’s folder',qStart:'Open the queue in the side window, one by one',qClear:'Empty the queue',sesOpen:'Reopen these tabs',fltO:'Show / hide the status filters',fltC:'Remove every filter',fltT:'Add / remove this filter',selAll:'Tick every link shown',selClr:'Clear the selection',newColl:'Create a new collection',newSub:'Create a folder inside this one',ren:'Rename',prjNew:'Create an empty parked session',impBr:'Read this browser’s bookmarks',impRe:'Run a slower, stricter check on these links',impGo:'Apply the rules and start',impDo:'Add the ticked links to your hub',sugApply:'Move the ticked links',shareGo:'Download the page',dirPick:'Choose the folder for automatic backups',dirAllow:'Grant the browser permission again',dirNow:'Write a backup into the folder now',dirOff:'Stop writing backups to a folder',cpClear:'Delete every saved copy',close:'Close this window',bkFull:'Download everything as one file',bkTxt:'Download only the addresses',bkLinks:'Download as a bookmarks file',bkMerge:'Add what’s missing from the file',bkReplace:'Replace everything with the file’s contents'};
let _tp;const tipPass=()=>document.querySelectorAll('[data-a]:not([title]),[data-v]:not([title])').forEach(b=>{const t=TIPS[b.dataset.a];if(t)b.title=t});
new MutationObserver(()=>{clearTimeout(_tp);_tp=setTimeout(tipPass,40)}).observe(document.body,{childList:true,subtree:true});
/* ----- wiring ----- */
{const _r=render;render=function(){_r.apply(this,arguments);try{sbApply();const v=$('#vmB');if(v){const l=S.vmode==='list';v.textContent=l?'▦ Gallery':'☰ List';v.title=l?'Switch to the gallery view':'Switch to the list view'}}catch(e){}}}
document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='b'){e.preventDefault();sbToggle()}});
document.addEventListener('click',async e=>{const b=e.target.closest('[data-a]');if(!b)return;const a=b.dataset.a,i=S.items.find(x=>x.id===b.dataset.id),c=S.colls.find(x=>x.id===S.view),cid=b.dataset.cid;
 if(a==='sbTog')sbToggle();
 else if(a==='toolsTog'){S.toolsOff=!S.toolsOff;save();render()}
 else if(a==='adult'&&i){i.adult=!i.adult;save();render()}
 else if(a==='colAdult'&&c){c.adult=!c.adult;save();render()}
 else if(a==='prjNew'){const n=await ask('New parked session',{msg:'Name (for example: school work, new pc parts, black friday list)',val:''});if(!n||!n.trim())return;const id='p_'+uid();S.colls.push({id,n:n.trim(),e:'🗂',p:'projects',proj:true,note:''});S.open=S.open||{};S.open.projects=true;S.view=id;save();render()}
 else if(a==='prjOpen'){const k=S.colls.find(x=>x.id===cid);openMany(sortItems(S.items.filter(x=>deep(cid).includes(x.c)&&x.s!=='done'),(k&&k.sort)||'saved'))}
 else if(a==='prjRen'){const k=S.colls.find(x=>x.id===cid);if(!k)return;const n=await ask('Rename parked session',{val:k.n});if(!n||!n.trim())return;k.n=n.trim();const nt=await ask('Short note (optional)',{val:k.note||''});if(nt!==null)k.note=nt.trim();save();render()}
 else if(a==='prjDel')delFolderDlg(cid);
 else if(a==='colDel')delFolderDlg(S.view);else if(a==='delKeep')delFolder(false);else if(a==='delAll')delFolder(true);
});

/* ----- delete a folder: keep or delete what is inside ----- */
let DELID='';document.body.insertAdjacentHTML('beforeend','<dialog id="dDel"></dialog>');
function delFolderDlg(id){const c=S.colls.find(x=>x.id===id);if(!c)return;DELID=id;const ids=deep(id),n=S.items.filter(i=>ids.includes(i.c)).length,own=cnt(id),sub=ids.length-1,pl=(k,w)=>k+' '+w+(k===1?'':'s');
 $('#dDel').innerHTML=`<h3 style="margin:0">Delete “${E(c.n)}”?</h3><p class="sub">It holds ${pl(n,'link')}${sub?' and '+pl(sub,'subfolder'):''}.</p>
 <button class="choice" data-a="delKeep"><b>Delete only the folder</b><small>Its ${pl(own,'link')} go to the Inbox${sub?'; subfolders move up one level':''}.</small></button>
 <button class="choice bad" data-a="delAll"><b>Delete the folder and everything inside</b><small>${pl(n,'link')}${sub?' and '+pl(sub,'subfolder'):''} are removed (a safety copy is saved first).</small></button>
 <div class="row"><button class="btn" data-a="close">Cancel</button></div>`;$('#dDel').showModal()}
function delFolder(all){const c=S.colls.find(x=>x.id===DELID);if(!c)return;if(typeof autoBackup==='function')autoBackup('before deleting a folder',true);const ids=deep(DELID);
 if(all){const rm=new Set(S.items.filter(i=>ids.includes(i.c)).map(i=>i.id));S.items=S.items.filter(i=>!rm.has(i.id));S.queue=(S.queue||[]).filter(x=>!rm.has(x));rm.forEach(x=>SEL.delete(x));S.colls=S.colls.filter(x=>!ids.includes(x.id))}
 else{S.items.forEach(i=>{if(i.c===DELID)i.c='inbox'});S.colls.forEach(x=>{if(x.p===DELID)x.p=c.p});S.colls=S.colls.filter(x=>x.id!==DELID)}
 if((all?ids:[DELID]).includes(S.view))S.view='home';save();$('#dDel').close();render()}

/* ----- order of links: also the order used by “Open all”, the side window and projects ----- */
const SORTS=[['status','By status, newest first'],['saved','Saved order (oldest first)'],['savedr','Saved order, reversed'],['new','Newest first'],['az','A → Z'],['site','Grouped by site']];
const inProject=c=>{let g=0;while(c&&g++<20){if(c.proj)return true;c=S.colls.find(x=>x.id===c.p)}return false};
const sortMode=c=>(c&&c.sort)||(c&&inProject(c)?'saved':null)||S.sort||'status';
function sortSelHtml(c){const m=sortMode(c);return `<select id="sortSel" title="Order of the links (also used by “Open all” and the side window)">${SORTS.map(([v,l])=>`<option value="${v}" ${v===m?'selected':''}>${l}</option>`).join('')}</select>`}
function sortItems(L,mode){mode=mode||sortMode(S.colls.find(x=>x.id===S.view));
 const sv=(a,b)=>(a.a-b.a)||((a.o??0)-(b.o??0));
 if(mode==='saved')return L.sort(sv);if(mode==='savedr')return L.sort((a,b)=>sv(b,a));if(mode==='new')return L.sort((a,b)=>b.a-a.a);
 if(mode==='az')return L.sort((a,b)=>a.t.localeCompare(b.t));
 if(mode==='site'){const first={};L.slice().sort(sv).forEach((i,k)=>{const d=dom(i.u);if(first[d]===undefined)first[d]=k});return L.sort((a,b)=>(first[dom(a.u)]-first[dom(b.u)])||sv(a,b))}
 return L.sort((a,b)=>ORD.indexOf(a.s)-ORD.indexOf(b.s)||b.a-a.a)}

/* ----- search field: ✕ inside the field, Esc, and any navigation clears it ----- */
{const q0=$('#q'),wrap=document.createElement('div');wrap.className='sw';q0.parentNode.insertBefore(wrap,q0);wrap.appendChild(q0);
 wrap.insertAdjacentHTML('beforeend','<button class="qx" data-a="qclr" hidden title="Clear the search (Esc)">✕</button>')}
const qSync=()=>{const b=document.querySelector('.qx');if(b)b.hidden=!$('#q').value};
function qClear(focus){const q0=$('#q');q0.value='';q='';qSync();if(focus)q0.focus();render()}
$('#q').addEventListener('input',qSync);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&e.target.id==='q'){if($('#q').value){e.preventDefault();qClear(true)}else $('#q').blur()}
 else if(e.key==='/'&&!/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)){setTimeout(()=>$('#q').select(),0)}});
document.addEventListener('click',e=>{if(e.target.closest('[data-v]')&&$('#q').value){$('#q').value='';q='';qSync()}},true);   /* going anywhere (Home, a folder, a tile…) starts with an empty search */
document.addEventListener('click',e=>{if(e.target.closest('[data-a=qclr]'))qClear(true)});
{const _r=render;render=function(){_r.apply(this,arguments);try{qSync()}catch(e){}}}
TIPS.qclr='Clear the search (Esc)';

/* ----- open selected links in this window or in a new one ----- */
const selItems=()=>sortItems(S.items.filter(i=>SEL.has(i.id)));
function openNewWindow(L){if(!L.length)return;const lazy=S.lazy!==false&&L.length>=4;chrome.windows.create({url:L.map(x=>lazy?lazyUrl(x.u,x.t):x.u),focused:true})}
document.addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(!b)return;const a=b.dataset.a;
 const dailyItems=()=>sortItems(S.items.filter(x=>x.d&&x.s!=='done'));
 const projItems=cid=>{const k=S.colls.find(x=>x.id===cid);return sortItems(S.items.filter(x=>deep(cid).includes(x.c)&&x.s!=='done'),(k&&k.sort)||'saved')};
 if(a==='bOpenHere')openMany(selItems());else if(a==='bOpenNew')openNewWindow(selItems());else if(a==='bOpenAnon')openAnon(selItems());
 else if(a==='openAllNew')openNewWindow(list().filter(x=>x.s!=='done'));else if(a==='openAllAnon')openAnon(list().filter(x=>x.s!=='done'));
 else if(a==='homeOpenNew')openNewWindow(dailyItems());else if(a==='homeOpenAnon')openAnon(dailyItems());
 else if(a==='prjOpenNew')openNewWindow(projItems(b.dataset.cid));else if(a==='prjOpenAnon')openAnon(projItems(b.dataset.cid));
 else if(a==='prjGo'){const L=projItems(b.dataset.cid);if(L.length)pkOpen(L[0].id,null,L.map(x=>x.id),'view')}
 else if(a==='prjTri'){const L=projItems(b.dataset.cid);if(L.length)triStart(L);else ask('Nothing to triage',{msg:'Everything in this parked session is already done.'})}
 else if(a==='goThrough'){const L=list().filter(x=>x.s!=='done');if(L.length)pkOpen(L[0].id,null,L.map(x=>x.id),'view')}});
TIPS.bOpenHere='Open the selected links as tabs here';TIPS.bOpenNew='Open the selected links together in a separate window';TIPS.openAllNew='Open every link together in a separate window';
TIPS.anon='Open anonymously (private window)';TIPS.bOpenAnon='Open the selected links in a private window';TIPS.openAllAnon='Open every link in a private window';TIPS.homeOpenNew='Open your daily links together in a separate window';TIPS.homeOpenAnon='Open your daily links in a private window';TIPS.prjOpenNew='Open this parked session in a separate window';TIPS.prjOpenAnon='Open this parked session in a private window';TIPS.prjGo='Look at its links one by one in the side window';TIPS.prjTri='Sort its links one by one in the side window';

/* ----- Home lists can be emptied one by one ----- */
document.addEventListener('click',async e=>{const b=e.target.closest('[data-a]');if(!b)return;const a=b.dataset.a;
 if(a==='recentClear'){S.recentCut=Date.now();save();render();toastUndo('Recently added cleared.','recentUndo')}
 else if(a==='recentUndo'){S.recentCut=0;save();render();const t=$('#prog');if(t)t.innerHTML=''}
 else if(a==='usageReset'){if(await ask('Reset “Most opened”?',{msg:'The open counts are forgotten and counting starts again. Your links are untouched.',ok:'Reset'})){S.items.forEach(i=>{i.o=0});save();render()}}});
TIPS.recentClear='Empty this list; links you add from now on will show up here';TIPS.usageReset='Forget the open counts and start counting again';TIPS.recentUndo='Show the earlier links again';

let _tu;function toastUndo(msg,act){const e=$('#prog');if(!e)return;e.innerHTML=msg+' <button class="b" data-a="'+act+'">Undo</button>';clearTimeout(_tu);_tu=setTimeout(()=>{if(e.innerHTML.includes('data-a="'+act+'"'))e.innerHTML=''},8000)}
