/* ============================================================
   sw.js — offline support for the digital business card
   ------------------------------------------------------------
   IMPORTANT: the page itself is served NETWORK-FIRST, so whenever
   you upload a new index.html the phone picks it up immediately.
   Everything else (and the page when offline) comes from cache.
   After the first visit the site opens with no internet and the
   Save Contact file still works. Requires HTTPS.
   ------------------------------------------------------------
   After changing any file here, change CACHE to a new name
   (e.g. "ctlo-cache-v4") and re-upload this file.
   ============================================================ */

var CACHE = "ctlo-cache-v4";
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
    }).then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(k){ return k !== CACHE; })
            .map(function(k){ return caches.delete(k); })
      );
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function(e){
  var req = e.request;
  if (req.method !== "GET") return;

  var accept = req.headers.get("accept") || "";
  var isPage = req.mode === "navigate" || accept.indexOf("text/html") > -1;

  /* The page: always try the network first, fall back to cache offline */
  if (isPage){
    e.respondWith(
      fetch(req).then(function(res){
        var copy = res.clone();
        caches.open(CACHE).then(function(c){ c.put("./index.html", copy); });
        return res;
      }).catch(function(){
        return caches.match("./index.html");
      })
    );
    return;
  }

  /* Everything else: cache first, then network */
  e.respondWith(
    caches.match(req).then(function(hit){
      return hit || fetch(req).then(function(res){
        if (res.ok && req.url.indexOf(self.location.origin) === 0){
          var copy = res.clone();
          caches.open(CACHE).then(function(c){ c.put(req, copy); });
        }
        return res;
      });
    })
  );
});
