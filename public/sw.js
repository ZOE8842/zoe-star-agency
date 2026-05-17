// ZOE Star Agency · Push-Only Service Worker
// Scope: nur Push + Notification-Click + Badge-Sync.
// EXPLIZIT KEIN fetch-Caching, KEIN Offline-Mode, KEIN App-Shell-Cache.
// Stabilitaet ueber Fancy-PWA.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Push-Empfang -> Notification + Badge setzen
self.addEventListener("push", (event) => {
  let data = {};
  try {
    if (event.data) data = event.data.json();
  } catch (_) { /* malformed payload */ }

  const title = (data && data.title) || "ZOE Star Agency";
  const body  = (data && data.body)  || "";
  const url   = (data && data.url)   || "/portal";
  const tag   = (data && data.tag)   || "zoe-default";
  const badge = (data && typeof data.badge === "number") ? data.badge : undefined;

  const showPromise = self.registration.showNotification(title, {
    body,
    tag,
    icon: "/app-icons/icon-512.png",
    badge: "/app-icons/icon-192.png",
    data: { url, type: data.type, notificationId: data.notificationId },
    renotify: false,
  });

  const badgePromise = (badge !== undefined && "setAppBadge" in self.navigator)
    ? self.navigator.setAppBadge(badge).catch(() => {})
    : Promise.resolve();

  event.waitUntil(Promise.all([showPromise, badgePromise]));
});

// Notification-Click -> richtige Page oeffnen, focus wenn schon offen
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || "/portal";

  event.waitUntil((async () => {
    const allClients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });

    // Suche bestehenden Tab mit gleicher Origin
    for (const c of allClients) {
      try {
        const u = new URL(c.url);
        if (u.origin === self.location.origin) {
          // Navigate + focus
          if ("navigate" in c) {
            try { await c.navigate(targetUrl); } catch (_) {}
          }
          return c.focus();
        }
      } catch (_) { /* skip */ }
    }
    // Sonst neuen Tab/Window
    if (self.clients.openWindow) {
      return self.clients.openWindow(targetUrl);
    }
  })());
});
