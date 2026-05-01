import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';
import webpush from 'web-push';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

webpush.setVapidDetails(
  'mailto:breakly-app@example.com',
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

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
}

function isWithinSchedule(schedule?: StoredData['reminders'][0]['schedule']): boolean {
  if (!schedule) return true;
  const now = new Date();
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayName = days[now.getUTCDay()];
  const hour = now.getUTCHours();
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
    const keys: string[] = [];
    let cursor = 0;
    do {
      const [nextCursor, batch] = await redis.scan(cursor, { match: 'push:*', count: 100 });
      cursor = nextCursor as number;
      keys.push(...(batch as string[]));
    } while (cursor !== 0);

    let sent = 0;
    let failed = 0;
    let skippedActive = 0;

    for (const key of keys) {
      const raw = await redis.get<string>(key);
      if (!raw) continue;

      const data: StoredData = typeof raw === 'string' ? JSON.parse(raw) : raw;

      if (data.lastActiveAt && (Date.now() - data.lastActiveAt) < ACTIVE_THRESHOLD_MS) {
        skippedActive++;
        continue;
      }

      const activeReminders = data.reminders.filter((r) => isWithinSchedule(r.schedule));
      if (activeReminders.length === 0) continue;

      const reminder = activeReminders[0];
      const payload = JSON.stringify({
        title: `${reminder.icon} ${reminder.title}`,
        body: `Time for your ${reminder.title.toLowerCase()} break!`,
        icon: '/pwa-192x192.png',
        data: { reminderId: reminder.id, title: reminder.title },
      });

      try {
        await webpush.sendNotification(data.subscription, payload);
        sent++;
      } catch (error: any) {
        if (error.statusCode === 410 || error.statusCode === 404) {
          await redis.del(key);
        }
        failed++;
      }
    }

    return res.status(200).json({ sent, failed, skippedActive, total: keys.length });
  } catch (error) {
    console.error('Send notifications error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
