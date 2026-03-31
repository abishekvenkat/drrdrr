import { readFile } from "node:fs/promises";

const [, , message, subscriptionFileArg, baseUrlArg, keyArg, tokenArg] = process.argv;

if (!message) {
  console.error("Usage: node scripts/push.mjs 'hello world' [subscriptionFile] [baseUrl] [vapidPublicKey] [apiToken]");
  process.exit(1);
}

const subscriptionFile = subscriptionFileArg || process.env.DRRDRR_SUBSCRIPTION_FILE || "./subscription.json";
const baseUrl = baseUrlArg || process.env.DRRDRR_BASE_URL || "http://localhost:3000";
const key = keyArg || process.env.DRRDRR_VAPID_PUBLIC_KEY;
const token = tokenArg || process.env.DRRDRR_API_TOKEN;

if (!key) {
  console.error("Missing VAPID public key. Pass it as argv[4] or set DRRDRR_VAPID_PUBLIC_KEY.");
  process.exit(1);
}

if (!token) {
  console.error("Missing API token. Pass it as argv[5] or set DRRDRR_API_TOKEN.");
  process.exit(1);
}

let subscription;

try {
  subscription = JSON.parse(await readFile(subscriptionFile, "utf8"));
} catch (error) {
  console.error(`Failed to read subscription JSON from ${subscriptionFile}: ${error.message}`);
  process.exit(1);
}

const response = await fetch(`${baseUrl.replace(/\/$/, "")}/v1/${key}`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  },
  body: JSON.stringify({
    message,
    subscription
  })
});

const payload = await response.text();

console.log(`${response.status} ${response.statusText}`);
console.log(payload);

if (!response.ok) {
  process.exit(1);
}
