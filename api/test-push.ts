import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const steps: string[] = [];
  const start = Date.now();

  // Step 1: Test Redis
  try {
    steps.push(`start: ${Date.now() - start}ms`);
    const { Redis } = await import('@upstash/redis');
    steps.push(`redis-import: ${Date.now() - start}ms`);

    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });

    const keys: string[] = [];
    let cursor: unknown = 0;
    do {
      const [nextCursor, batch] = await redis.scan(cursor as number, { match: 'push:*', count: 100 });
      cursor = nextCursor;
      keys.push(...(batch as string[]));
    } while (cursor !== 0);
    steps.push(`redis-scan: ${Date.now() - start}ms, found ${keys.length} keys`);
  } catch (e: any) {
    steps.push(`redis-error: ${Date.now() - start}ms, ${e.message}`);
  }

  // Step 2: Test web-push import
  try {
    // @ts-ignore
    const wp = await import('web-push');
    steps.push(`webpush-import: ${Date.now() - start}ms, keys: ${Object.keys(wp).join(',')}`);

    const webpush = wp.default || wp;
    steps.push(`webpush-default: ${Date.now() - start}ms, type: ${typeof webpush?.sendNotification}`);
  } catch (e: any) {
    steps.push(`webpush-error: ${Date.now() - start}ms, ${e.message}`);
  }

  steps.push(`total: ${Date.now() - start}ms`);
  return res.status(200).json({ steps });
}
