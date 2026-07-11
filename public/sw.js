/* LegoTaxi push service worker — notificações estilo Uber no ecrã bloqueado. */

// Cache name for app shell
const CACHE_NAME = "legotaxi-v1";
const APP_SHELL_URLS = [
  "/",
  "/pedir",
  "/app-icon.png",
];

/* ── Install: cache app shell ── */
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL_URLS))
  );
  self.skipWaiting();
});

/* ── Activate: clean old caches ── */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

/* ── Fetch: cache-first for app shell ── */
self.addEventListener("fetch", (event) => {
  const { request } = event;
  // Only cache GET requests for app shell files
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  const isAppShell = APP_SHELL_URLS.some((u) =>
    url.pathname === u || url.pathname.startsWith("/_tanstack_start")
  );
  if (!isAppShell) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      });
    })
  );
});

/* ── Push: mostra notificação estilo Uber ── */
self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { title: "LegoTaxi", body: event.data ? event.data.text() : "" };
  }

  const title = payload.title || "LegoTaxi";
  const body = payload.body || "";
  const url = payload.url || "/pedir";
  const tag = payload.tag || "legotaxi-ride";

  // Ícones baseados no tipo de evento (estilo Uber)
  const iconMap = {
    accepted: "/app-icon.png",
    arriving: "/app-icon.png",
    in_progress: "/app-icon.png",
    completed: "/app-icon.png",
    cancelled: "/app-icon.png",
  };

  const options = {
    body,
    icon: iconMap[payload.type] || "/app-icon.png",
    badge: "/app-icon.png",
    image: payload.image || undefined,
    tag,
    renotify: true,
    requireInteraction: payload.requireInteraction !== false,
    vibrate: [200, 100, 200],
    data: { url, type: payload.type, timestamp: Date.now() },
    // Acções (estilo Uber — acções rápidas)
    actions: [
      {
        action: "view",
        title: "Abrir App",
      },
      ...(payload.type === "cancelled" ? [] : [
        {
          action: "dismiss",
          title: "Ignorar",
        },
      ]),
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

/* ── Notification click: abre a app ── */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || "/pedir";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Se já existe uma janela aberta, navegar para lá
      for (const client of clientList) {
        if ("navigate" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // Senão, abrir nova janela
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    })
  );
});

/* ── Notification action ── */
self.addEventListener("notificationaction", (event) => {
  const { action } = event;
  const targetUrl = (event.notification.data && event.notification.data.url) || "/pedir";

  if (action === "view") {
    event.notification.close();
    event.waitUntil(
      self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
        for (const client of clientList) {
          if ("navigate" in client) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }
        if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
      })
    );
  } else if (action === "dismiss") {
    event.notification.close();
  }
});
