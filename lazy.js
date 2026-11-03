const p=new URLSearchParams(location.search),u=p.get('u')||'',t=p.get('t')||u;
document.title=t;document.getElementById('t').textContent=t;document.getElementById('d').textContent=u;
const ic=document.createElement('link');ic.rel='icon';ic.href=chrome.runtime.getURL('/_favicon/')+'?pageUrl='+encodeURIComponent(u)+'&size=32';document.head.appendChild(ic);
const go=()=>{if(/^https?:/i.test(u))location.replace(u)};
document.getElementById('go').onclick=go;
if(document.visibilityState==='visible')setTimeout(go,150);else document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')go()});
