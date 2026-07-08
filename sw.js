/* hue PWA Service Worker v2
   方針：
   - HTML（画面本体）は「ネット優先」。更新したら開くだけで最新が出る。オフライン時のみキャッシュ。
   - アイコン等の静的ファイルは「キャッシュ優先」で軽快に。
   - 古いキャッシュは activate 時に自動削除。 */
const CACHE = "hue-v2";
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
  if (url.origin !== self.location.origin) return; // 外部CDN(MediaPipe等)はそのまま

  const isHTML = req.mode === "navigate" ||
                 (req.headers.get("accept") || "").includes("text/html");

  if (isHTML) {
    // ネット優先：最新のindex.htmlを取りに行き、取れたらキャッシュも更新。ダメならキャッシュ。
    e.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put("./index.html", copy)).catch(() => {});
        return res;
      }).catch(() => caches.match(req).then((hit) => hit || caches.match("./index.html")))
    );
  } else {
    // 静的ファイルはキャッシュ優先。なければ取得してキャッシュ。
    e.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      }).catch(() => hit))
    );
  }
});
