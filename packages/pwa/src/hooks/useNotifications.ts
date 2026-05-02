import { useEffect } from 'react';
import { useRemindersContext } from '../context/RemindersContext';
import { requestPermissions, resyncAllTimers, scheduleReminder } from '../services/notifications';
import { waterPlant } from '@breather/shared';

const ALERTS_SENT_KEY = '@breather_alerts_sent';
const COMPLETED_KEY = '@breather_completed';

export function useNotifications() {
  const { reminders, isLoading } = useRemindersContext();

  useEffect(() => {
    requestPermissions();

    if (!('serviceWorker' in navigator)) return;
    const handler = (event: MessageEvent) => {
      if (event.data?.type === 'NOTIFICATION_ACTION') {
        const { action } = event.data;
        if (action === 'complete') {
          const current = parseInt(localStorage.getItem(COMPLETED_KEY) || '0', 10);
          localStorage.setItem(COMPLETED_KEY, String(current + 1));
          waterPlant();
        }
        const alerts = parseInt(localStorage.getItem(ALERTS_SENT_KEY) || '0', 10);
        localStorage.setItem(ALERTS_SENT_KEY, String(alerts + 1));
      }
    };
    navigator.serviceWorker.addEventListener('message', handler);
    return () => {
      navigator.serviceWorker.removeEventListener('message', handler);
    };
  }, []);

  // Resync timers when the page regains focus or becomes visible
  // This catches missed notifications from browser throttling background tabs/windows
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') resyncAllTimers();
    };
    const handleFocus = () => resyncAllTimers();

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleFocus);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // On load and when reminders change: set up page-side timers AND sync to SW
  useEffect(() => {
    if (isLoading) return;

    const activeReminders = reminders.filter((r) => r.isActive);

    for (const r of activeReminders) {
      scheduleReminder(r).catch(console.error);
    }

    if ('serviceWorker' in navigator && activeReminders.length > 0) {
      navigator.serviceWorker.ready.then((reg) => {
        if (reg.active) {
          reg.active.postMessage({
            type: 'SYNC_REMINDERS',
            payload: {
              reminders: activeReminders.map((r) => ({
                id: r.notificationId || `web_${r.id}`,
                title: r.title,
                icon: r.icon,
                intervalMs: r.intervalMinutes * 60 * 1000,
                schedule: r.schedule,
              })),
            },
          });
        }
      });
    }
  }, [reminders, isLoading]);
}
