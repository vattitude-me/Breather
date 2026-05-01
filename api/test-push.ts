import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const steps: string[] = [];
  const start = Date.now();

  try {
    // Step 1: Redis scan
    steps.push(`start: ${Date.now() - start}ms`);
    const keys: string[] = [];
    let cursor = 0;
    do {
      const [nextCursor, batch] = await redis.scan(cursor, { match: 'push:*', count: 100 });
      cursor = nextCursor as number;
      keys.push(...(batch as string[]));
    } while (cursor !== 0);
    steps.push(`redis-scan: ${Date.now() - start}ms, found ${keys.length} keys`);

    // Step 2: Fetch data
    const allData = await Promise.all(keys.map((key) => redis.get<string>(key)));
    steps.push(`redis-get: ${Date.now() - start}ms`);

    // Step 3: Import web-push
    // @ts-ignore
    const webpush = (await import('web-push')).default;
    steps.push(`webpush-import: ${Date.now() - start}ms, type: ${typeof webpush?.sendNotification}`);

    // Step 4: Set VAPID
    webpush.setVapidDetails(
      'mailto:breakly-app@example.com',
      process.env.VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!
    );
    steps.push(`vapid-setup: ${Date.now() - start}ms`);

    // Step 5: Try sending to first valid subscription
    for (let i = 0; i < allData.length; i++) {
      const raw = allData[i];
      if (!raw) continue;
      const data = typeof raw === 'string' ? JSON.parse(raw) : raw;

      const r = data.reminders?.[0];
      if (!r) continue;

      const payload = JSON.stringify({
        title: `${r.icon} ${r.title}`,
        body: `Test push from debug endpoint`,
        icon: '/pwa-192x192.png',
        data: { reminderId: r.id, title: r.title },
      });

      steps.push(`sending-to: ${data.subscription?.endpoint?.substring(0, 50)}...`);

      try {
        const result = await Promise.race([
          webpush.sendNotification(data.subscription, payload),
          new Promise((_, reject) => setTimeout(() => reject(new Error('SEND_TIMEOUT_5s')), 5000)),
        ]);
        steps.push(`send-ok: ${Date.now() - start}ms, status: ${(result as any)?.statusCode}`);
      } catch (e: any) {
        steps.push(`send-fail: ${Date.now() - start}ms, error: ${e.message}, statusCode: ${e.statusCode || 'none'}`);
      }
      break;
    }

    steps.push(`total: ${Date.now() - start}ms`);
    return res.status(200).json({ steps });
  } catch (error: any) {
    steps.push(`error: ${Date.now() - start}ms, ${error.message}`);
    return res.status(500).json({ steps, error: error.message });
  }
}
