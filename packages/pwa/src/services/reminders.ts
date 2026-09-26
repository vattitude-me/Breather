import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Garden, STORAGE_KEYS, dateKey, nextReminderAt } from '@breather/shared';

const TAG = 'breather_daily';

export async function requestPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  return (await Notification.requestPermission()) === 'granted';
}

export function notificationsBlocked(): boolean {
  return 'Notification' in window && Notification.permission === 'denied';
}

function reminderText(g: Garden) {
  return {
    title: 'Time for a slow breath',
    body: `${g.sproutName || 'Your sprout'} is ready when you are. ${g.sessionMinutes} calm ${g.sessionMinutes === 1 ? 'minute' : 'minutes'}?`,
  };
}

function show(g: Garden) {
  if (Notification.permission !== 'granted') return;
  const { title, body } = reminderText(g);
  const options = { body, tag: TAG, icon: '/pwa-192x192.png', badge: '/pwa-192x192.png' };
  if (navigator.serviceWorker?.controller) {
    navigator.serviceWorker.ready.then((reg) => reg.showNotification(title, options));
  } else {
    new Notification(title, options);
  }
}

function syncServiceWorker(g: Garden) {
  navigator.serviceWorker?.ready.then((reg) => {
    reg.active?.postMessage({
      type: 'SET_DAILY_REMINDER',
      payload: g.onboarded && g.reminder.enabled
        ? { time: g.reminder.time, lastDay: g.days[g.days.length - 1] ?? '', ...reminderText(g) }
        : null,
    });
  });
}

// Page-side timer plus a service-worker copy; the shared tag keeps them from double-notifying.
export function useDailyReminder(g: Garden) {
  const navigate = useNavigate();

  useEffect(() => {
    syncServiceWorker(g);
    let timer: number | undefined;
    const arm = () => {
      window.clearTimeout(timer);
      const next = g.onboarded ? nextReminderAt(g.reminder) : null;
      if (!next) return;
      timer = window.setTimeout(() => {
        if (!g.days.includes(dateKey())) show(g);
        arm();
      }, next.getTime() - Date.now());
    };
    arm();
    const onVisible = () => { if (document.visibilityState === 'visible') arm(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [g]);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    const onMessage = (e: MessageEvent) => {
      if (e.data?.type === 'OPEN_BREATHE') navigate('/breathe');
    };
    navigator.serviceWorker.addEventListener('message', onMessage);
    return () => navigator.serviceWorker.removeEventListener('message', onMessage);
  }, [navigate]);

  // Lets the Chrome extension know the PWA is open so it can skip its own notification.
  useEffect(() => {
    const beat = () => {
      localStorage.setItem(STORAGE_KEYS.PWA_ACTIVE, String(Date.now()));
      window.dispatchEvent(new Event('breather-local-change'));
    };
    beat();
    const id = window.setInterval(beat, 30_000);
    return () => window.clearInterval(id);
  }, []);
}
