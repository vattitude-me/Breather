# Breakly — Push Notification Server Setup

This guide sets up background push notifications so reminders fire even when the app is closed.

---

## Step 1: Create Upstash Redis Database (Free)

1. Go to [https://console.upstash.com](https://console.upstash.com)
2. Sign up / log in (GitHub or Google sign-in works)
3. Click **"Create Database"**
4. Choose:
   - **Name:** `breakly-push`
   - **Region:** Select closest to your users (e.g., `us-east-1` or `eu-west-1`)
   - **Type:** Regional (free tier)
5. Once created, go to the database details page
6. Copy these two values from the **REST API** section:
   - `UPSTASH_REDIS_REST_URL` — looks like `https://xxxxx.upstash.io`
   - `UPSTASH_REDIS_REST_TOKEN` — a long string

---

## Step 2: Set Vercel Environment Variables

1. Go to your Vercel project dashboard: [https://vercel.com](https://vercel.com)
2. Navigate to **Settings → Environment Variables**
3. Add the following variables (set for all environments: Production, Preview, Development):

| Variable | Value |
|----------|-------|
| `VAPID_PUBLIC_KEY` | `BO3Pt4ViMdlExya89ipT20Mgso6GjdjoIIm-wVpfAwN_-5r4B7orYctxS3x0cpgzD8CCUUXdkLM75xCVf7u4E5A` |
| `VAPID_PRIVATE_KEY` | `M1hPa3ezBpUEM3ca3AGCPpO1ahPIz_GdU-6qBwmeG0U` |
| `UPSTASH_REDIS_REST_URL` | *(from Step 1)* |
| `UPSTASH_REDIS_REST_TOKEN` | *(from Step 1)* |
| `CRON_SECRET` | *(generate any random string, e.g. run `openssl rand -hex 32`)* |

4. Click **Save** for each

---

## Step 3: Cron Job Configuration

The `vercel.json` already includes a cron job that fires every 15 minutes:

```json
"crons": [{ "path": "/api/send-notifications", "schedule": "*/15 * * * *" }]
```

**Important:** This requires the **Vercel Pro plan** ($20/month). On the free Hobby plan, cron is limited to once daily.

### Free Alternative: Upstash QStash

If you're on the Hobby plan, use QStash (free tier: 500 messages/day):

1. Go to [https://console.upstash.com/qstash](https://console.upstash.com/qstash)
2. Click **"Create Schedule"**
3. Set:
   - **Destination:** `https://breakly-eight.vercel.app/api/send-notifications`
   - **Schedule:** `*/15 * * * *`
   - **Header:** `Authorization: Bearer <your-CRON_SECRET-value>`
4. Save — QStash will call your endpoint every 15 minutes for free

---

## Step 4: Redeploy

After setting env vars, trigger a redeploy:
- Push any commit, or
- Go to Vercel → Deployments → click "Redeploy" on the latest

---

## How It Works

```
User opens app
  → Browser creates a push subscription (unique per device)
  → App sends subscription + active reminders to /api/subscribe
  → Stored in Upstash Redis

Every 15 minutes (cron):
  → /api/send-notifications runs
  → Reads all subscriptions from Redis
  → For each: checks if any reminder is within schedule
  → Sends push notification via Web Push protocol
  → Browser receives push → service worker shows notification
  → Works even if app is fully closed
```

---

## Verify It's Working

1. Open the deployed app, enable notifications, add a reminder
2. Check Redis in Upstash console — you should see a `push:*` key
3. Manually trigger: `curl -H "Authorization: Bearer <CRON_SECRET>" https://breakly-eight.vercel.app/api/send-notifications`
4. You should receive a notification on your device

---

## Notes

- Subscriptions auto-expire after 30 days of no activity
- If a device uninstalls the PWA, the push service returns 410 → subscription is auto-removed
- The VAPID public key is embedded in the client code (`src/services/pushSubscription.ts`)
- No user data is stored — only anonymous push endpoints and reminder titles/schedules
