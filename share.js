/* Android "Share → My Hub" : the PWA share_target opens index.html?url=…&text=…&title=… ; add it to the Inbox. */
(function(){
 const p=new URLSearchParams(location.search);if(![...p.keys()].length)return;
 const m=((p.get('url')||'')+' '+(p.get('text')||'')).match(/https?:\/\/[^\s]+/);if(!m)return;
 const u=m[0],title=p.get('title')||autoT(u);
 const t=setInterval(()=>{if(typeof S==='undefined'||!S||!S.items)return;clearInterval(t);
  if(!S.items.some(i=>i.u===u))S.items.unshift({id:uid(),t:title,u,w:'',c:'inbox',s:'todo',g:[],d:false,v:'',k:0,a:now()});
  S.view='inbox';save();render();history.replaceState(null,'',location.pathname)},100);
})();
/* phones: start with the sidebar hidden (☰ opens it as an overlay) */
(function(){const t=setInterval(()=>{if(typeof S==='undefined'||!S)return;clearInterval(t);
 if(innerWidth<700&&S.sbHide===undefined){S.sbHide=true;save();document.body.classList.add('sbh')}},100)})();
