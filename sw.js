/* Service worker de Actitudes EF.
   Sirve solo su propia carpeta: así no interfiere con las otras apps del mismo dominio. */
const CACHE = "actef-planillas-v20";
const BASE = new URL("./", self.location).pathname;           // /planillas-ef/
const BASICOS = [BASE, BASE + "index.html", BASE + "manifest.json",
                 BASE + "icon-192.png", BASE + "icon-512.png", BASE + "apple-touch-icon.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(BASICOS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys()
    .then((ks) => Promise.all(ks.filter((k) => k !== CACHE && k.startsWith("actef")).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;   // Supabase siempre a la red
  if (!url.pathname.startsWith(BASE)) return;        // otras apps del dominio: no intervenir
  e.respondWith(
    fetch(req)
      .then((r) => { const copia = r.clone(); caches.open(CACHE).then((c) => c.put(req, copia)); return r; })
      .catch(() => caches.match(req).then((r) => r || caches.match(BASE + "index.html")))
  );
});
