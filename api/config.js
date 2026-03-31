import { config as appConfig, assertConfig } from "./_lib/config.js";
import { allowMethods, sendJson, withCors } from "./_lib/http.js";

export default async function handler(request, response) {
  withCors(response);

  if (request.method === "OPTIONS") {
    response.status(204).end();
    return;
  }

  if (request.method !== "GET") {
    allowMethods(response, ["GET", "OPTIONS"]);
    sendJson(response, 405, { error: "Method not allowed" });
    return;
  }

  try {
    assertConfig(["vapidPublicKey"]);
    sendJson(response, 200, {
      vapidPublicKey: appConfig.vapidPublicKey
    });
  } catch (error) {
    sendJson(response, error.statusCode || 500, {
      error: error.message || "Unexpected server error"
    });
  }
}
