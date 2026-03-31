# drrdrr

Minimal personal PWA + Web Push bridge for sending notifications from a terminal to an installed mobile web app, with no server-side database.

## How it works

1. The installed PWA subscribes the phone to Web Push.
2. You copy the subscription JSON from the phone and save it on your Mac.
3. `POST /v1/:VAPID_PUBLIC_KEY` sends a message and that subscription to Web Push.
4. The service worker shows the notification and stores it locally in IndexedDB with a timestamp.

## Local development

1. Generate VAPID keys:

   ```bash
   npx web-push generate-vapid-keys
   ```

2. Create `.env.local` from `.env.example`.
3. Set a strong `API_TOKEN` for send requests.
4. Install dependencies:

   ```bash
   npm install
   ```

5. Run with Vercel dev:

   ```bash
   npx vercel dev
   ```

## Deploy

1. Import this folder into Vercel.
2. Add the same environment variables in Vercel project settings.
3. Deploy.
4. Open the deployed URL on iPhone Safari.
5. Use `Share -> Add to Home Screen`.
6. Launch the installed app and tap `Enable Push`.
7. Tap `Copy Subscription JSON` and save that JSON on your Mac as `subscription.json`.

The app uses the provided `drricon-light` PNG/SVG assets for the manifest, home screen icon, and notification icon.

## Send a notification

```bash
DRRDRR_BASE_URL=https://drrdrr.vercel.app \
DRRDRR_VAPID_PUBLIC_KEY=YOUR_VAPID_PUBLIC_KEY \
DRRDRR_API_TOKEN=YOUR_API_TOKEN \
DRRDRR_SUBSCRIPTION_FILE=./subscription.json \
node scripts/push.mjs "Hello from Node"
```

## Notes

- On iOS, Web Push requires iOS 16.4+ and an installed Home Screen web app.
- The send API now requires both the public VAPID key in the path and a private bearer token in the `Authorization` header.
- The server is stateless. If the phone's push subscription changes, copy the new subscription JSON back to your Mac.
