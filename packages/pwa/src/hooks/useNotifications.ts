import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRemindersContext } from '../context/RemindersContext';
import { requestPermissions, resyncAllTimers, scheduleReminder } from '../services/notifications';
import { DEFAULT_BREAK_DURATION_SECONDS, STORAGE_KEYS } from '@breather/shared';

export function useNotifications() {
  const { reminders, isLoading } = useRemindersContext();
  const navigate = useNavigate();

  useEffect(() => {
    requestPermissions();

    // If opened from a notification click with no client window open
    const params = new URLSearchParams(window.location.search);
    if (params.get('action') === 'break') {
      const reminderId = params.get('reminderId') || '';
      const title = params.get('title') || '';
      window.history.replaceState({}, '', window.location.pathname);
      navigate(`/active-break?reminderId=${reminderId}&title=${encodeURIComponent(title)}`);
      return;
    }
    // Legacy support for older ?action=water links
    if (params.get('action') === 'water') {
      window.history.replaceState({}, '', window.location.pathname);
      navigate('/active-break?title=Break');
      return;
    }

    if (!('serviceWorker' in navigator)) return;
    const handler = (event: MessageEvent) => {
      if (event.data?.type === 'NOTIFICATION_ACTION') {
        const { reminderId, action } = event.data;
        if (action === 'complete') {
          const reminder = reminders.find((r) =>
            r.id === reminderId || r.notificationId === reminderId || `web_${r.id}` === reminderId
          );
          const duration = reminder?.breakDurationSeconds || DEFAULT_BREAK_DURATION_SECONDS;
          navigate(`/active-break?reminderId=${reminder?.id || reminderId}&title=${encodeURIComponent(reminder?.title || 'Break')}&duration=${duration}`);
        }
      }
    };
    navigator.serviceWorker.addEventListener('message', handler);
    return () => {
      navigator.serviceWorker.removeEventListener('message', handler);
    };
  }, [navigate, reminders]);

  // Resync timers when the page regains focus or becomes visible
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

  // Write a heartbeat to localStorage so the Chrome extension knows the PWA is
  // actively handling notifications and can skip its own.
  useEffect(() => {
    if (Notification.permission !== 'granted') return;

    const writeHeartbeat = () => {
      localStorage.setItem(STORAGE_KEYS.PWA_ACTIVE, String(Date.now()));
      window.dispatchEvent(new Event('breather-local-change'));
    };
    writeHeartbeat();
    const interval = setInterval(writeHeartbeat, 30_000);
    return () => clearInterval(interval);
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
