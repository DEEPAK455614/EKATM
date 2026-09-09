const CACHE='ekatm-yatra-field-shell-v3';
const SHELL=['/','/field','/survey','/admin','/admin/field-ops','/manifest.webmanifest','/icon.svg'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).catch(()=>null));self.skipWaiting();});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener('fetch',event=>{
  const req=event.request;
  const url=new URL(req.url);
  if(req.method!=='GET'||url.pathname.startsWith('/api/'))return;
  event.respondWith(fetch(req).then(res=>{const copy=res.clone();caches.open(CACHE).then(c=>c.put(req,copy)).catch(()=>{});return res;}).catch(async()=>{
    const exact=await caches.match(req);if(exact)return exact;
    if(url.pathname.startsWith('/field'))return (await caches.match('/field'))||(await caches.match('/'));
    if(url.pathname.startsWith('/survey'))return (await caches.match('/survey'))||(await caches.match('/'));
    if(url.pathname.startsWith('/admin/field-ops'))return (await caches.match('/admin/field-ops'))||(await caches.match('/admin'));
    return (await caches.match('/'));
  }));
});
