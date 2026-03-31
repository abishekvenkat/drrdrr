export function sendJson(response, statusCode, payload) {
  response.status(statusCode).json(payload);
}

export async function readRawBody(request) {
  if (typeof request.body === "string") {
    return request.body;
  }

  if (Buffer.isBuffer(request.body)) {
    return request.body.toString("utf8");
  }

  if (request.body && typeof request.body === "object") {
    return JSON.stringify(request.body);
  }

  return await new Promise((resolve, reject) => {
    const chunks = [];

    request.on("data", (chunk) => {
      chunks.push(Buffer.from(chunk));
    });

    request.on("end", () => {
      resolve(Buffer.concat(chunks).toString("utf8"));
    });

    request.on("error", reject);
  });
}

export function allowMethods(response, methods) {
  response.setHeader("Allow", methods.join(", "));
}

export function withCors(response) {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
}
