import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const ACTIVE_THRESHOLD_MS = 2 * 60 * 1000;

interface StoredData {
  subscription: {
    endpoint: string;
    keys: { p256dh: string; auth: string };
  };
  reminders: Array<{
    id: string;
    title: string;
    icon: string;
    intervalMinutes: number;
    schedule?: {
      activeDays: string[];
      startHour: number;
      endHour: number;
    };
  }>;
  updatedAt: number;
  lastActiveAt?: number;
  tzOffset?: number;
}

function isWithinSchedule(schedule?: StoredData['reminders'][0]['schedule'], tzOffset?: number): boolean {
  if (!schedule) return true;
  const now = new Date();
  const offsetMs = (tzOffset ?? -600) * 60 * 1000;
  const localNow = new Date(now.getTime() - offsetMs);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayName = days[localNow.getUTCDay()];
  const hour = localNow.getUTCHours();
  if (!schedule.activeDays.includes(dayName)) return false;
  if (hour < schedule.startHour || hour >= schedule.endHour) return false;
  return true;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const CRON_SECRET = process.env.CRON_SECRET;
  if (CRON_SECRET) {
    const auth = req.headers.authorization;
    if (auth !== `Bearer ${CRON_SECRET}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  try {
    // @ts-ignore - dynamic import, no type declarations
    const webpush = (await import('web-push')).default;
    webpush.setVapidDetails(
      'mailto:breakly-app@example.com',
      process.env.VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!
    );

    const keys: string[] = [];
    let cursor = 0;
    do {
      const [nextCursor, batch] = await redis.scan(cursor, { match: 'push:*', count: 100 });
      cursor = nextCursor as unknown as number;
      keys.push(...(batch as string[]));
    } while (cursor !== 0);

    console.log(`Found ${keys.length} push subscriptions`);

    let sent = 0;
    let failed = 0;
    let skippedActive = 0;

    const allData = await Promise.all(keys.map((key) => redis.get<string>(key)));
    const pushJobs: Promise<void>[] = [];

    for (let i = 0; i < keys.length; i++) {
      const raw = allData[i];
      if (!raw) continue;

      const key = keys[i];
      const data: StoredData = typeof raw === 'string' ? JSON.parse(raw) : raw;

      if (data.lastActiveAt && (Date.now() - data.lastActiveAt) < ACTIVE_THRESHOLD_MS) {
        skippedActive++;
        continue;
      }

      const activeReminders = data.reminders.filter((r) => isWithinSchedule(r.schedule, data.tzOffset));
      if (activeReminders.length === 0) continue;

      const reminder = activeReminders[0];
      const payload = JSON.stringify({
        title: `${reminder.icon} ${reminder.title}`,
        body: `Time for your ${reminder.title.toLowerCase()} break!`,
        icon: '/pwa-192x192.png',
        data: { reminderId: reminder.id, title: reminder.title },
      });

      pushJobs.push(
        Promise.race([
          webpush.sendNotification(data.subscription, payload)
            .then(() => { sent++; }),
          new Promise<void>((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000)),
        ]).catch(async (error: any) => {
          if (error?.statusCode === 410 || error?.statusCode === 404) {
            await redis.del(key);
          }
          failed++;
        })
      );
    }

    await Promise.all(pushJobs);

    return res.status(200).json({ sent, failed, skippedActive, total: keys.length });
  } catch (error) {
    console.error('Send notifications error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
