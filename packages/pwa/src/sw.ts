/// <reference lib="webworker" />
declare const self: ServiceWorkerGlobalScope;

import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { CacheFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

self.skipWaiting();
clientsClaim();
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

const navigationRoute = new NavigationRoute(createHandlerBoundToURL('index.html'), {
  denylist: [/\.(png|jpg|svg|ico|webp)$/],
});
registerRoute(navigationRoute);

registerRoute(
  /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
  new CacheFirst({
    cacheName: 'google-fonts-cache',
    plugins: [
      new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  }),
  'GET'
);

// One gentle reminder a day. The page keeps this in sync via SET_DAILY_REMINDER;
// the page also runs its own timer, and both use the same tag so only one shows.
interface DailyReminderState {
  time: string; // 'HH:MM'
  lastDay: string; // last local date with a session
  title: string;
  body: string;
}

let reminder: DailyReminderState | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;

function todayKey(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function nextFire(time: string): number {
  const [h, m] = time.split(':').map(Number);
  const next = new Date();
  next.setHours(h, m, 0, 0);
  if (next.getTime() <= Date.now()) next.setDate(next.getDate() + 1);
  return next.getTime();
}

function arm() {
  if (timer) clearTimeout(timer);
  timer = null;
  if (!reminder) return;
  const current = reminder;
  timer = setTimeout(() => {
    if (current.lastDay !== todayKey()) {
      self.registration.showNotification(current.title, {
        body: current.body,
        tag: 'breather_daily',
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
      });
    }
    arm();
  }, nextFire(current.time) - Date.now());
}

self.addEventListener('message', (event) => {
  const { type, payload } = event.data || {};
  if (type === 'SET_DAILY_REMINDER') {
    reminder = payload;
    arm();
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const client = clients[0];
      if (client) {
        client.postMessage({ type: 'OPEN_BREATHE' });
        return client.focus().then(() => undefined);
      }
      return self.clients.openWindow('/breathe').then(() => undefined);
    })
  );
});
