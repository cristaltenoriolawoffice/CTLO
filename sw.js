/* ============================================================
   sw.js — offline support for the digital business card
   After the first visit the site files (and contact.vcf) are
   cached, so the page still opens with no internet and
   “Save Contact” keeps working — the .vcf is served from cache.
   Requires HTTPS.
   ------------------------------------------------------------
   To refresh the cached files later, change CACHE to a new name
   (e.g. "ctlo-cache-v2") and re-upload this file.
   ============================================================ */

var CACHE = "ctlo-cache-v2";
var ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "./contact.vcf"
];

self.addEventListener("install", function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(c){
      return c.addAll(ASSETS);
    }).then(function(){
      return self.skipWaiting();
    })
  );
});

self.addEventListener("activate", function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(k){ return k !== CACHE; })
            .map(function(k){ return caches.delete(k); })
      );
    }).then(function(){
      return self.clients.claim();
    })
  );
});

self.addEventListener("fetch", function(e){
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request).then(function(hit){
      return hit || fetch(e.request).then(function(res){
        if (res.ok && e.request.url.indexOf(self.location.origin) === 0){
          var copy = res.clone();
          caches.open(CACHE).then(function(c){ c.put(e.request, copy); });
        }
        return res;
      }).catch(function(){
        return caches.match("./index.html");
      });
    })
  );
});
