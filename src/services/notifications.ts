import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Reminder } from '../types';

const ALERTS_SENT_KEY = '@breakly_alerts_sent';
const webTimers: Map<string, ReturnType<typeof setInterval>> = new Map();

export async function getAlertsSent(): Promise<number> {
  const val = await AsyncStorage.getItem(ALERTS_SENT_KEY);
  return val ? parseInt(val, 10) : 0;
}

async function incrementAlertsSent(): Promise<void> {
  const current = await getAlertsSent();
  await AsyncStorage.setItem(ALERTS_SENT_KEY, String(current + 1));
}

function isWeb(): boolean {
  return Platform.OS === 'web';
}

async function requestWebPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

export async function requestPermissions(): Promise<boolean> {
  if (isWeb()) {
    return requestWebPermission();
  }

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
  if (isWeb()) return;

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
  if (isWeb()) {
    return scheduleWebReminder(reminder);
  }

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

function scheduleWebReminder(reminder: Reminder): string {
  const id = `web_${reminder.id}`;

  cancelWebTimer(id);

  const intervalMs = reminder.intervalMinutes * 60 * 1000;
  const timer = setInterval(() => {
    if (Notification.permission === 'granted') {
      new Notification(`${reminder.icon} ${reminder.title}`, {
        body: `Time for your ${reminder.title.toLowerCase()} break!`,
        tag: reminder.id,
        requireInteraction: true,
      });
      incrementAlertsSent();
    }
  }, intervalMs);

  webTimers.set(id, timer);
  return id;
}

function cancelWebTimer(id: string): void {
  const existing = webTimers.get(id);
  if (existing) {
    clearInterval(existing);
    webTimers.delete(id);
  }
}

export async function cancelReminder(notificationId: string): Promise<void> {
  if (isWeb()) {
    cancelWebTimer(notificationId);
    return;
  }
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

export async function snoozeReminder(reminder: Reminder): Promise<string> {
  if (reminder.notificationId) {
    await cancelReminder(reminder.notificationId);
  }

  if (isWeb()) {
    const id = `web_snooze_${reminder.id}`;
    const snoozeMs = reminder.snoozeDurationMinutes * 60 * 1000;
    const timer = setTimeout(() => {
      if (Notification.permission === 'granted') {
        new Notification(`${reminder.icon} ${reminder.title}`, {
          body: `Snoozed reminder: ${reminder.title}`,
          tag: reminder.id,
          requireInteraction: true,
        });
      }
      webTimers.delete(id);
    }, snoozeMs);
    webTimers.set(id, timer as unknown as ReturnType<typeof setInterval>);
    return id;
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
  if (isWeb()) {
    webTimers.forEach((timer) => clearInterval(timer));
    webTimers.clear();
    return;
  }
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export function getNextFireTime(reminder: Reminder): Date | null {
  if (!reminder.isActive) return null;
  const createdAt = new Date(reminder.createdAt).getTime();
  const now = Date.now();
  const intervalMs = reminder.intervalMinutes * 60 * 1000;
  const elapsed = now - createdAt;
  const cyclesCompleted = Math.floor(elapsed / intervalMs);
  const nextFire = new Date(createdAt + (cyclesCompleted + 1) * intervalMs);
  return nextFire;
}
