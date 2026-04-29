import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import type { EventSubscription } from 'expo-modules-core';
import { useRemindersContext } from '../context/RemindersContext';
import {
  requestPermissions,
  registerNotificationCategories,
  snoozeReminder,
} from '../services/notifications';

export function useNotifications() {
  const { reminders, dispatch } = useRemindersContext();
  const responseListener = useRef<EventSubscription | null>(null);

  useEffect(() => {
    requestPermissions();
    registerNotificationCategories();

    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const { actionIdentifier } = response;
        const reminderId = response.notification.request.content.data?.reminderId as string;

        if (!reminderId) return;

        const reminder = reminders.find((r) => r.id === reminderId);
        if (!reminder) return;

        switch (actionIdentifier) {
          case 'snooze':
            snoozeReminder(reminder).then((newId) => {
              dispatch({
                type: 'UPDATE',
                payload: { ...reminder, notificationId: newId },
              });
            });
            break;
          case 'acknowledge':
          case 'dismiss':
          default:
            break;
        }
      }
    );

    return () => {
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [reminders, dispatch]);
}
