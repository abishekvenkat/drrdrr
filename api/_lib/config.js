export const config = {
  vapidPublicKey: process.env.VAPID_PUBLIC_KEY || "",
  vapidPrivateKey: process.env.VAPID_PRIVATE_KEY || "",
  vapidSubject: process.env.VAPID_SUBJECT || "mailto:you@example.com",
  apiToken: process.env.API_TOKEN || ""
};

export function assertConfig(keys) {
  const missing = keys.filter((key) => !config[key]);
  if (missing.length > 0) {
    const error = new Error(`Missing environment variables: ${missing.join(", ")}`);
    error.statusCode = 500;
    throw error;
  }
}
