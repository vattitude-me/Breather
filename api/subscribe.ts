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
    const { subscription, reminders, tzOffset } = req.body;

    if (!subscription?.endpoint || !subscription?.keys) {
      return res.status(400).json({ error: 'Invalid subscription' });
    }

    const key = `push:${Buffer.from(subscription.endpoint).toString('base64url').slice(0, 64)}`;

    await redis.set(key, JSON.stringify({
      subscription,
      reminders: reminders || [],
      updatedAt: Date.now(),
      lastActiveAt: Date.now(),
      tzOffset: tzOffset ?? new Date().getTimezoneOffset(),
    }), { ex: 60 * 60 * 24 * 30 });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Subscribe error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
