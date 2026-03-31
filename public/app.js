const permissionValue = document.querySelector("[data-permission]");
const installValue = document.querySelector("[data-install]");
const endpointValue = document.querySelector("[data-endpoint]");
const statusValue = document.querySelector("[data-status]");
const notificationList = document.querySelector("[data-notification-list]");
const subscriptionField = document.querySelector("[data-subscription]");
const subscribeButton = document.querySelector("[data-subscribe]");
const copyButton = document.querySelector("[data-copy-subscription]");
const clearButton = document.querySelector("[data-clear]");

function setStatus(message, tone = "neutral") {
  statusValue.textContent = message;
  statusValue.dataset.tone = tone;
}

function updatePermissionState() {
  permissionValue.textContent = Notification.permission;
  installValue.textContent = window.matchMedia("(display-mode: standalone)").matches
    ? "installed"
    : "browser tab";
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index);
  }

  return outputArray;
}

async function renderNotifications() {
  const entries = await window.DrrdrrDB.listNotifications();
  notificationList.innerHTML = "";

  if (entries.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty";
    empty.textContent = "No notifications saved yet.";
    notificationList.append(empty);
    return;
  }

  for (const entry of entries) {
    const item = document.createElement("li");
    const body = document.createElement("p");
    const timeElement = document.createElement("time");
    const time = new Date(entry.createdAt).toLocaleString();
    body.textContent = entry.body;
    timeElement.dateTime = entry.createdAt;
    timeElement.textContent = time;
    item.append(body, timeElement);
    notificationList.append(item);
  }
}

async function getSubscriptionMetadata() {
  const response = await fetch("/api/config");
  if (!response.ok) {
    throw new Error("Failed to load VAPID public key");
  }

  return await response.json();
}

function renderSubscriptionText(subscription) {
  subscriptionField.value = subscription
    ? JSON.stringify(subscription.toJSON(), null, 2)
    : "";
}

async function ensureServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    throw new Error("Service workers are not supported on this device.");
  }

  const registration = await navigator.serviceWorker.register("/sw.js");
  await navigator.serviceWorker.ready;
  return registration;
}

async function subscribe() {
  if (!("PushManager" in window)) {
    throw new Error("Push API is not supported on this device.");
  }

  updatePermissionState();

  if (window.matchMedia("(display-mode: standalone)").matches === false) {
    setStatus("Install this PWA to the home screen before enabling push on iPhone.", "warn");
  }

  const permission = await Notification.requestPermission();
  updatePermissionState();

  if (permission !== "granted") {
    throw new Error("Notification permission was not granted.");
  }

  const [metadata, registration] = await Promise.all([
    getSubscriptionMetadata(),
    ensureServiceWorker()
  ]);

  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(metadata.vapidPublicKey)
    });
  }

  const endpoint = subscription.endpoint;
  endpointValue.textContent = endpoint.length > 39 ? `${endpoint.slice(0, 36)}...` : endpoint;
  renderSubscriptionText(subscription);
  setStatus("Push subscription is active on this device. Copy the JSON below to your Mac.", "ok");
}

async function bootstrap() {
  updatePermissionState();

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.addEventListener("message", (event) => {
      if (event.data?.type === "notification-received") {
        renderNotifications();
      }
    });

    try {
      const registration = await ensureServiceWorker();
      const existing = await registration.pushManager.getSubscription();
      if (existing) {
        endpointValue.textContent = existing.endpoint.length > 39
          ? `${existing.endpoint.slice(0, 36)}...`
          : existing.endpoint;
        renderSubscriptionText(existing);
      }
    } catch (error) {
      setStatus(error.message, "warn");
    }
  }

  await renderNotifications();
}

subscribeButton.addEventListener("click", async () => {
  subscribeButton.disabled = true;

  try {
    await subscribe();
  } catch (error) {
    setStatus(error.message, "error");
  } finally {
    subscribeButton.disabled = false;
  }
});

copyButton.addEventListener("click", async () => {
  if (!subscriptionField.value) {
    setStatus("Enable push first so this device has a subscription to copy.", "warn");
    return;
  }

  await navigator.clipboard.writeText(subscriptionField.value);
  setStatus("Subscription JSON copied. Save it on your Mac as subscription.json.", "ok");
});

clearButton.addEventListener("click", async () => {
  await window.DrrdrrDB.clearNotifications();
  await renderNotifications();
  setStatus("Local notification history cleared on this device.", "neutral");
});

window.addEventListener("load", () => {
  bootstrap().catch((error) => {
    setStatus(error.message, "error");
  });
});
