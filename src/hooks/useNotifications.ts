import { useEffect } from 'react';
import { useRemindersContext } from '../context/RemindersContext';
import { requestPermissions } from '../services/notifications';
import { syncSubscriptionWithServer, startHeartbeat, stopHeartbeat } from '../services/pushSubscription';

const ALERTS_SENT_KEY = '@breakly_alerts_sent';
const COMPLETED_KEY = '@breakly_completed';

export function useNotifications() {
  const { reminders, isLoading } = useRemindersContext();

  useEffect(() => {
    requestPermissions();
    startHeartbeat();

    if (!('serviceWorker' in navigator)) return;
    const handler = (event: MessageEvent) => {
      if (event.data?.type === 'NOTIFICATION_ACTION') {
        const { action } = event.data;
        if (action === 'complete') {
          const current = parseInt(localStorage.getItem(COMPLETED_KEY) || '0', 10);
          localStorage.setItem(COMPLETED_KEY, String(current + 1));
        }
        const alerts = parseInt(localStorage.getItem(ALERTS_SENT_KEY) || '0', 10);
        localStorage.setItem(ALERTS_SENT_KEY, String(alerts + 1));
      }
    };
    navigator.serviceWorker.addEventListener('message', handler);
    return () => {
      stopHeartbeat();
      navigator.serviceWorker.removeEventListener('message', handler);
    };
  }, []);

  useEffect(() => {
    if (isLoading) return;
    if (!('serviceWorker' in navigator)) return;

    const activeReminders = reminders.filter((r) => r.isActive && r.notificationId);

    // Sync with local service worker
    if (activeReminders.length > 0) {
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
    }

    // Sync with push server for background notifications
    syncSubscriptionWithServer(
      activeReminders.map((r) => ({
        id: r.id,
        title: r.title,
        icon: r.icon,
        intervalMinutes: r.intervalMinutes,
        schedule: r.schedule,
      }))
    );
  }, [reminders, isLoading]);
}
