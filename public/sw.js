self.importScripts("/idb.js");

const APP_NAME = "drrdrr";

async function persistPush(payload) {
  const entry = {
    id: `${payload.timestamp || Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: payload.title || APP_NAME,
    body: payload.body || "",
    createdAt: payload.timestamp || new Date().toISOString()
  };

  await self.DrrdrrDB.saveNotification(entry);
  return entry;
}

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  event.waitUntil((async () => {
    let payload = {
      title: APP_NAME,
      body: "New notification",
      timestamp: new Date().toISOString()
    };

    try {
      if (event.data) {
        payload = event.data.json();
      }
    } catch {
      payload.body = event.data ? event.data.text() : payload.body;
    }

    const entry = await persistPush(payload);

    await self.registration.showNotification(entry.title, {
      body: entry.body,
      badge: "/drricon-light.png",
      icon: "/drricon-light.png",
      tag: entry.id,
      data: {
        createdAt: entry.createdAt
      }
    });

    const clients = await self.clients.matchAll({
      type: "window",
      includeUncontrolled: true
    });

    for (const client of clients) {
      client.postMessage({
        type: "notification-received",
        entry
      });
    }
  })());
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil((async () => {
    const clientList = await self.clients.matchAll({
      type: "window",
      includeUncontrolled: true
    });

    const activeClient = clientList[0];
    if (activeClient) {
      await activeClient.focus();
      activeClient.postMessage({ type: "notification-opened" });
      return;
    }

    await self.clients.openWindow("/");
  })());
});
