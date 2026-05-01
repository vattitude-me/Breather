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
let checkInterval: ReturnType<typeof setInterval> | null = null;

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

function startCheckLoop() {
  if (checkInterval) return;
  checkInterval = setInterval(() => {
    const now = Date.now();
    for (const [id, reminder] of scheduledReminders) {
      if (now >= reminder.nextFireTime) {
        if (isWithinSchedule(reminder.schedule)) {
          self.registration.showNotification(`${reminder.icon} ${reminder.title}`, {
            body: `${reminder.title} complete — check-in!`,
            tag: `${id}_${now}`,
            requireInteraction: true,
            icon: '/pwa-192x192.png',
          });
          notifyClients(id);
        }
        reminder.nextFireTime = now + reminder.intervalMs;
      }
    }
    if (scheduledReminders.size === 0) {
      clearInterval(checkInterval!);
      checkInterval = null;
    }
  }, 30000);
}

function notifyClients(reminderId: string) {
  self.clients.matchAll({ type: 'window' }).then((clients) => {
    clients.forEach((client) => {
      client.postMessage({ type: 'NOTIFICATION_FIRED', reminderId });
    });
  });
}

self.addEventListener('message', (event) => {
  const { type, payload } = event.data || {};

  if (type === 'SCHEDULE_REMINDER') {
    const { id, title, icon, intervalMs, schedule } = payload;
    scheduledReminders.set(id, {
      id,
      title,
      icon,
      intervalMs,
      nextFireTime: Date.now() + intervalMs,
      schedule,
    });
    startCheckLoop();
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
      scheduledReminders.set(r.id, {
        id: r.id,
        title: r.title,
        icon: r.icon,
        intervalMs: r.intervalMs,
        nextFireTime: Date.now() + r.intervalMs,
        schedule: r.schedule,
      });
    }
    if (scheduledReminders.size > 0) startCheckLoop();
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      if (clients.length > 0) {
        clients[0].focus();
      } else {
        self.clients.openWindow('/');
      }
    })
  );
});
