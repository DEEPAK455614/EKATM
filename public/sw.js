const CACHE='ekatm-survey-shell-v6';
self.addEventListener('install',event=>{event.waitUntil((async()=>{const cache=await caches.open(CACHE);await cache.addAll(['/field','/icon.svg','/manifest.webmanifest']);await self.skipWaiting();})());});
self.addEventListener('activate',event=>{event.waitUntil((async()=>{for(const key of await caches.keys()){if(key.startsWith('ekatm-')&&key!==CACHE)await caches.delete(key);}await self.clients.claim();})());});
self.addEventListener('fetch',event=>{
 const req=event.request,url=new URL(req.url);if(req.method!=='GET'||url.origin!==self.location.origin)return;
 // Never cache API, auth, admin responses or any remote database traffic.
 const fieldNavigation=req.mode==='navigate'&&url.pathname==='/field';
 const asset=url.pathname.startsWith('/_next/static/')||['/icon.svg','/manifest.webmanifest'].includes(url.pathname);
 if(!fieldNavigation&&!asset)return;
 event.respondWith((async()=>{const cache=await caches.open(CACHE);try{const response=await fetch(req);if(response.ok)await cache.put(fieldNavigation?'/field':req,response.clone());return response;}catch(error){const cached=await cache.match(fieldNavigation?'/field':req);if(cached)return cached;throw error;}})());
});
