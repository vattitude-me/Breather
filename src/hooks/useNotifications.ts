import { useEffect } from 'react';
import { useRemindersContext } from '../context/RemindersContext';
import { requestPermissions } from '../services/notifications';

export function useNotifications() {
  const { reminders, isLoading } = useRemindersContext();

  useEffect(() => {
    requestPermissions();

    if (!('serviceWorker' in navigator)) return;
    const handler = (event: MessageEvent) => {
      if (event.data?.type === 'NOTIFICATION_FIRED') {
        // Trigger a storage event so alert count refreshes
        const key = '@breakly_alerts_sent';
        const current = parseInt(localStorage.getItem(key) || '0', 10);
        localStorage.setItem(key, String(current + 1));
      }
    };
    navigator.serviceWorker.addEventListener('message', handler);
    return () => navigator.serviceWorker.removeEventListener('message', handler);
  }, []);

  useEffect(() => {
    if (isLoading) return;
    if (!('serviceWorker' in navigator)) return;

    const activeReminders = reminders.filter((r) => r.isActive && r.notificationId);
    if (activeReminders.length === 0) return;

    navigator.serviceWorker.ready.then((reg) => {
      if (reg.active) {
        reg.active.postMessage({
          type: 'SYNC_REMINDERS',
          payload: {
            reminders: activeReminders.map((r) => ({
              id: r.notificationId,
              title: r.title,
              icon: r.icon,
              intervalMs: r.intervalMinutes * 60 * 1000,
              schedule: r.schedule,
            })),
          },
        });
      }
    });
  }, [reminders, isLoading]);
}
