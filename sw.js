/* hue PWA Service Worker（アプリ殻をキャッシュしてオフライン起動＆インストール可能に） */
const CACHE = "hue-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./hue_icon_180.png",
  "./hue_icon_192.png",
  "./hue_icon_512.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) =>
    Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  e.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).catch(() => caches.match("./index.html")))
  );
});
