/* ===== backup & restore ===== */
const BK={pending:null};
const slim=(d,withSn)=>{const o=JSON.parse(JSON.stringify(d));if(!withSn)o.items.forEach(i=>{delete i.sn});delete o.view;delete o.ghToken;return o};
const bkList=async()=>(await chrome.storage.local.get('hub1_bk')).hub1_bk||[];
async function autoBackup(why,force){
 if(!S||!S.items.length)return;const snap=slim(S),n=S.items.length;   // snapshot first, before anything changes
 const L=await bkList();if(L[0]&&((!force&&now()-L[0].at<DAY)||(force&&L[0].why===why&&now()-L[0].at<3e5)))return;
 L.unshift({at:now(),why:why||'daily',n,data:snap});await chrome.storage.local.set({hub1_bk:L.slice(0,10)});if(typeof folderWrite==='function')folderWrite().catch(()=>{})}
function dl(name,text,type){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type:type||'application/json'}));a.download=name;document.body.appendChild(a);a.click();a.remove()}
const today=()=>new Date().toISOString().slice(0,10);
function mergeIn(d){const have=new Set(S.items.map(i=>nk(i.u)));let n=0,c=0;
 d.colls.forEach(k=>{if(!S.colls.some(x=>x.id===k.id)){S.colls.push(k);c++}});
 d.items.forEach(i=>{if(!have.has(nk(i.u))){if(S.items.some(x=>x.id===i.id))i.id=uid();S.items.push(i);have.add(nk(i.u));n++}});
 return{n,c}}
async function bkOpen(){
 const L=await bkList(),days=S.lastFile?Math.floor((now()-S.lastFile)/DAY):null;
 $('#dBk').innerHTML=`<h3 style="margin:0">Backup &amp; restore</h3>
 <p class="sub">${days===null?'You have never saved a backup file.':'Last backup file: '+(days?days+' days ago':'today')+'.'} Your links live inside this browser profile. If the extension is removed or the profile is reset they are gone, so a file kept elsewhere (cloud drive, USB, e-mail to yourself) is the only safe copy.</p>
 <div class="grp"><b>Save</b><div class="row" style="justify-content:flex-start;flex-wrap:wrap"><button class="btn p" data-a="bkFull">💾 Full backup (.json)</button><button class="btn" data-a="bkLinks">⭐ Links as favorites (.html)…</button><button class="btn" data-a="bkTxt">📄 Just the URLs (.txt)</button></div>
 <label class="chk"><input type="checkbox" id="bkSn"> Include page snapshots in the full backup (bigger file)</label>
 <p class="sub">Full backup keeps everything: notes, tags, folders, daily flags, versions and link checks. Favorites files open in any browser.</p></div>
 <div class="grp"><b>Restore</b><div class="row" style="justify-content:flex-start"><input type="file" id="bkF" accept=".json,.html,.htm"></div><div id="bkR"></div></div>
 <div class="grp"><b>Automatic copies</b> <span class="sub">(kept in this browser: one per day, and before risky actions such as importing or deleting)</span>
 ${L.length?L.map((b,k)=>`<div class="ir"><span>${new Date(b.at).toLocaleString()} · ${b.n} links · ${E(b.why)}</span><button class="btn" data-a="bkUse" data-k="${k}">Restore</button><button class="btn" data-a="bkDl" data-k="${k}">Download</button></div>`).join(''):'<div class="sub">None yet.</div>'}</div>
 <div class="row"><button class="btn" data-a="bkClose">Close</button></div>`;
 if(!$('#dBk').open)$('#dBk').showModal()}
async function bkReplace(){const d=BK.pending;if(!d)return;
 if(!await ask('Replace everything?',{msg:'Your current '+S.items.length+' links will be replaced by the '+d.items.length+' in the backup. A safety copy is saved first.',ok:'Replace'}))return;
 await autoBackup('before restore',true);
 const keep={ghToken:S.ghToken,lastFile:S.lastFile};
 S=Object.assign({},JSON.parse(JSON.stringify(d)),keep,{view:'home',open:{}});
 if(!S.colls.some(c=>c.id==='inbox'))S.colls.unshift({id:'inbox',n:'Inbox',e:'📥'});
 save();$('#dBk').close();render()}
document.body.insertAdjacentHTML('beforeend','<dialog id="dBk"></dialog>');
document.addEventListener('change',async e=>{const t=e.target;if(t.id!=='bkF'||!t.files[0])return;
 const f=t.files[0],txt=await f.text(),box=$('#bkR');
 if(/\.html?$/i.test(f.name)){box.innerHTML='<p class="sub">That is a bookmarks file. Use <b>⬇ Import bookmarks</b> for it, so the links get filtered, tested and organized.</p>';return}
 try{const o=JSON.parse(txt),d=o.data||o;if(!Array.isArray(d.items)||!Array.isArray(d.colls))throw 0;BK.pending=d;
  box.innerHTML=`<p class="sub">Backup from ${o.at?new Date(o.at).toLocaleString():'an unknown date'} · ${d.items.length} links · ${d.colls.length} collections.</p><div class="row" style="justify-content:flex-start"><button class="btn p" data-a="bkMerge">Merge (add what’s missing)</button><button class="btn" data-a="bkReplace">Replace everything</button></div><p class="sub">A safety copy of your current data is saved automatically first.</p>`}
 catch(err){box.innerHTML='<p class="sub">That file isn’t a valid My Hub backup.</p>'}});
document.addEventListener('click',async e=>{
 const b=e.target.closest('[data-a]');if(!b||!b.dataset.a.startsWith('bk'))return;const a=b.dataset.a;
 if(a==='bk')bkOpen();
 else if(a==='bkClose')$('#dBk').close();
 else if(a==='bkFull'){dl('my-hub-backup-'+today()+'.json',JSON.stringify({app:'my-hub',v:3,at:now(),data:slim(S,$('#bkSn').checked)},null,1));S.lastFile=now();save();bkOpen()}
 else if(a==='bkTxt'){dl('my-hub-urls-'+today()+'.txt',S.items.map(i=>i.u).join('\n'),'text/plain')}
 else if(a==='bkLinks'){$('#dBk').close();openExp(false)}
 else if(a==='bkMerge'&&BK.pending){await autoBackup('before restore',true);const r=mergeIn(JSON.parse(JSON.stringify(BK.pending)));save();render();$('#bkR').innerHTML=`<p class="sub">Merged: ${r.n} new links and ${r.c} new collections added.</p>`}
 else if(a==='bkReplace')bkReplace();
 else if(a==='bkUse'){const L=await bkList();BK.pending=L[+b.dataset.k].data;bkReplace()}
 else if(a==='bkDl'){const L=await bkList(),x=L[+b.dataset.k];dl('my-hub-auto-'+new Date(x.at).toISOString().slice(0,10)+'.json',JSON.stringify({app:'my-hub',v:3,at:x.at,data:x.data},null,1))}
});
{const t=setInterval(()=>{if(S){clearInterval(t);autoBackup('daily')}},400)}
