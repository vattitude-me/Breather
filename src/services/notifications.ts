import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { Reminder } from '../types';

export async function requestPermissions(): Promise<boolean> {
  if (!Device.isDevice) {
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return false;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  return true;
}

export async function registerNotificationCategories(): Promise<void> {
  await Notifications.setNotificationCategoryAsync('reminder', [
    {
      identifier: 'acknowledge',
      buttonTitle: '✓ Done',
      options: { opensAppToForeground: false },
    },
    {
      identifier: 'snooze',
      buttonTitle: '⏰ Snooze',
      options: { opensAppToForeground: false },
    },
    {
      identifier: 'dismiss',
      buttonTitle: 'Dismiss',
      options: { opensAppToForeground: false, isDestructive: true },
    },
  ]);
}

export async function scheduleReminder(reminder: Reminder): Promise<string> {
  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: `${reminder.icon} ${reminder.title}`,
      body: `Time for your ${reminder.title.toLowerCase()} break!`,
      categoryIdentifier: 'reminder',
      data: { reminderId: reminder.id },
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: reminder.intervalMinutes * 60,
      repeats: true,
    },
  });

  return notificationId;
}

export async function cancelReminder(notificationId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

export async function snoozeReminder(reminder: Reminder): Promise<string> {
  if (reminder.notificationId) {
    await cancelReminder(reminder.notificationId);
  }

  const snoozeId = await Notifications.scheduleNotificationAsync({
    content: {
      title: `${reminder.icon} ${reminder.title}`,
      body: `Snoozed reminder: ${reminder.title}`,
      categoryIdentifier: 'reminder',
      data: { reminderId: reminder.id, isSnoozed: true },
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: reminder.snoozeDurationMinutes * 60,
      repeats: false,
    },
  });

  return snoozeId;
}

export async function cancelAllReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
