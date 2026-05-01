import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { endpoint } = req.body;

    if (!endpoint) {
      return res.status(400).json({ error: 'Missing endpoint' });
    }

    const key = `push:${Buffer.from(endpoint).toString('base64url').slice(0, 64)}`;
    const raw = await redis.get<string>(key);
    if (!raw) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
    data.lastActiveAt = Date.now();

    await redis.set(key, JSON.stringify(data), { ex: 60 * 60 * 24 * 30 });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Heartbeat error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
