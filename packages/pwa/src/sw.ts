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

const navigationRoute = new NavigationRoute(createHandlerBoundToURL('index.html'));
registerRoute(navigationRoute);

registerRoute(
  /^https:\/\/fonts\.googleapis\.com\/.*/i,
  new CacheFirst({
    cacheName: 'google-fonts-cache',
    plugins: [
      new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  }),
  'GET'
);

interface ScheduledReminder {
  id: string;
  title: string;
  icon: string;
  intervalMs: number;
  nextFireTime: number;
  schedule?: {
    activeDays: string[];
    startHour: number;
    endHour: number;
  };
}

const scheduledReminders = new Map<string, ScheduledReminder>();
let checkTimer: ReturnType<typeof setTimeout> | null = null;

function isWithinSchedule(schedule?: ScheduledReminder['schedule']): boolean {
  if (!schedule) return true;
  const now = new Date();
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayName = days[now.getDay()];
  const hour = now.getHours();
  if (!schedule.activeDays.includes(dayName)) return false;
  if (hour < schedule.startHour || hour >= schedule.endHour) return false;
  return true;
}

function checkAndFire() {
  const now = Date.now();
  let nearestMs = Infinity;

  const breakPrompts = [
    'Your body will thank you!',
    'A small pause goes a long way.',
    'Time to stretch and reset.',
    'Step away for a moment — you have earned it.',
    'Quick break? Your plant is thirsty too!',
  ];

  for (const [id, reminder] of scheduledReminders) {
    if (now >= reminder.nextFireTime) {
      if (isWithinSchedule(reminder.schedule)) {
        const body = breakPrompts[Math.floor(Math.random() * breakPrompts.length)];
        self.registration.showNotification(`${reminder.icon} Time for a ${reminder.title.toLowerCase()} break`, {
          body,
          tag: `breather_${id}`,
          requireInteraction: true,
          icon: '/pwa-192x192.png',
          badge: '/pwa-192x192.png',
          data: { reminderId: id, title: reminder.title },
          actions: [
            { action: 'complete', title: '🌱 Done! Water plant' },
            { action: 'snooze', title: '💤 Snooze' },
          ],
        } as unknown as NotificationOptions);
        notifyClients(id, 'alert');
      }
      while (reminder.nextFireTime <= now) {
        reminder.nextFireTime += reminder.intervalMs;
      }
    }
    const timeUntil = reminder.nextFireTime - now;
    if (timeUntil < nearestMs) nearestMs = timeUntil;
  }

  scheduleNextCheck(nearestMs);
}

function scheduleNextCheck(nearestMs: number = 30000) {
  if (checkTimer) clearTimeout(checkTimer);
  if (scheduledReminders.size === 0) { checkTimer = null; return; }
  const delay = Math.min(nearestMs, 30000);
  checkTimer = setTimeout(() => checkAndFire(), delay);
}

function notifyClients(reminderId: string, action: string) {
  self.clients.matchAll({ type: 'window' }).then((clients) => {
    clients.forEach((client) => {
      client.postMessage({ type: 'NOTIFICATION_ACTION', reminderId, action });
    });
  });
}

self.addEventListener('message', (event) => {
  const { type, payload } = event.data || {};

  if (type === 'SCHEDULE_REMINDER') {
    const { id, title, icon, intervalMs, nextFireTime, schedule } = payload;
    scheduledReminders.set(id, {
      id,
      title,
      icon,
      intervalMs,
      nextFireTime: nextFireTime || (Date.now() + intervalMs),
      schedule,
    });
    checkAndFire();
  }

  if (type === 'CANCEL_REMINDER') {
    scheduledReminders.delete(payload.id);
  }

  if (type === 'CANCEL_ALL') {
    scheduledReminders.clear();
  }

  if (type === 'SYNC_REMINDERS') {
    scheduledReminders.clear();
    for (const r of payload.reminders) {
      // Calculate next clock-aligned fire time
      const now = Date.now();
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const msSinceMidnight = now - todayStart.getTime();
      const cyclesPassed = Math.floor(msSinceMidnight / r.intervalMs);
      const nextFireTime = todayStart.getTime() + (cyclesPassed + 1) * r.intervalMs;

      scheduledReminders.set(r.id, {
        id: r.id,
        title: r.title,
        icon: r.icon,
        intervalMs: r.intervalMs,
        nextFireTime,
        schedule: r.schedule,
      });
    }
    if (scheduledReminders.size > 0) checkAndFire();
  }
});

self.addEventListener('push', (event) => {
  if (!event.data) return;

  const payload = event.data.json();
  const title = payload.title || '🌱 Time for a break';
  const options = {
    body: payload.body || 'Your body will thank you!',
    icon: payload.icon || '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    requireInteraction: true,
    data: payload.data || {},
    actions: [
      { action: 'complete', title: '🌱 Done! Water plant' },
      { action: 'snooze', title: '💤 Snooze' },
    ],
  } as unknown as NotificationOptions;

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  const action = event.action;
  const data = event.notification.data || {};
  event.notification.close();

  // Snooze just dismisses — the next scheduled fire will handle it
  // Any other click (body click, "Done" button) counts as complete → water plant
  const resolvedAction = action === 'snooze' ? 'snooze' : 'complete';
  notifyClients(data.reminderId || '', resolvedAction);

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      if (clients.length > 0) {
        clients[0].focus();
      } else {
        // No open window — open with a flag so the app waters on load
        self.clients.openWindow('/?action=water');
      }
    })
  );
});
