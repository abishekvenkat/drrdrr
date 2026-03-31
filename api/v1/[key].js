import { config as appConfig, assertConfig } from "../_lib/config.js";
import { allowMethods, readRawBody, sendJson, withCors } from "../_lib/http.js";
import webpush from "web-push";

export const config = {
  api: {
    bodyParser: false
  }
};

function buildPushPayload(message) {
  const now = new Date().toISOString();

  return JSON.stringify({
    title: "drrdrr",
    body: message,
    timestamp: now,
    receivedAt: now
  });
}

function getBearerToken(request) {
  const header = request.headers.authorization || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : "";
}

function validateSubscription(subscription) {
  if (!subscription || typeof subscription !== "object") {
    return false;
  }

  if (!subscription.endpoint || !subscription.keys?.auth || !subscription.keys?.p256dh) {
    return false;
  }

  return true;
}

function createWebPushClient() {
  webpush.setVapidDetails(
    appConfig.vapidSubject,
    appConfig.vapidPublicKey,
    appConfig.vapidPrivateKey
  );

  return webpush;
}

async function parseRequestPayload(request) {
  const rawBody = await readRawBody(request);
  const contentType = request.headers["content-type"] || "";

  if (!contentType.includes("application/json")) {
    const error = new Error("Use application/json with message and subscription.");
    error.statusCode = 400;
    throw error;
  }

  let parsed;

  try {
    parsed = JSON.parse(rawBody || "{}");
  } catch {
    const error = new Error("Invalid JSON body");
    error.statusCode = 400;
    throw error;
  }

  return {
    message: typeof parsed.message === "string" ? parsed.message.trim() : "",
    subscription: parsed.subscription
  };
}

export default async function handler(request, response) {
  withCors(response);

  if (request.method === "OPTIONS") {
    response.status(204).end();
    return;
  }

  if (request.method !== "POST") {
    allowMethods(response, ["POST", "OPTIONS"]);
    sendJson(response, 405, { error: "Method not allowed" });
    return;
  }

  try {
    assertConfig(["vapidPublicKey", "vapidPrivateKey", "vapidSubject", "apiToken"]);

    if (request.query.key !== appConfig.vapidPublicKey) {
      sendJson(response, 403, { error: "Invalid key" });
      return;
    }

    if (getBearerToken(request) !== appConfig.apiToken) {
      sendJson(response, 401, { error: "Invalid token" });
      return;
    }

    const { message, subscription } = await parseRequestPayload(request);

    if (!message) {
      sendJson(response, 400, { error: "Message body is required" });
      return;
    }

    if (!validateSubscription(subscription)) {
      sendJson(response, 400, {
        error: "A valid push subscription is required in the JSON body."
      });
      return;
    }

    const client = createWebPushClient();

    await client.sendNotification(subscription, buildPushPayload(message), {
      TTL: 60,
      urgency: "high"
    });

    sendJson(response, 200, {
      ok: true,
      message,
      delivered: 1,
      failed: 0,
      total: 1
    });
  } catch (error) {
    sendJson(response, error.statusCode || 500, {
      error: error.message || "Unexpected server error"
    });
  }
}
