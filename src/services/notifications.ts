import { Reminder } from '../types';
import { loadProgress, saveProgress } from './storage';

const ALERTS_SENT_KEY = '@breakly_alerts_sent';
const webTimers: Map<string, number> = new Map();
const webScheduledAt: Map<string, number> = new Map();

export async function getAlertsSent(): Promise<number> {
  try {
    const val = localStorage.getItem(ALERTS_SENT_KEY);
    return val ? parseInt(val, 10) : 0;
  } catch {
    return 0;
  }
}

async function incrementAlertsSent(): Promise<void> {
  const current = await getAlertsSent();
  localStorage.setItem(ALERTS_SENT_KEY, String(current + 1));
  await updateProgressOnAlert();
}

async function updateProgressOnAlert(): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  const progressStr = await loadProgress();
  
  let progress = progressStr ? JSON.parse(progressStr) : {
    entries: [],
    currentStreak: 0,
    longestStreak: 0,
    totalSessions: 0,
    totalMinutes: 0,
  };

  let todayEntry = progress.entries.find((e: { date: string }) => e.date === today);
  if (!todayEntry) {
    todayEntry = { date: today, completedCount: 0, totalMinutes: 0, sessions: 0 };
    progress.entries.push(todayEntry);
  }

  todayEntry.completedCount += 1;
  todayEntry.totalMinutes += 5;
  todayEntry.sessions = Math.max(todayEntry.sessions, 1);

  progress.totalSessions = progress.entries.reduce((sum: number, e: { sessions: number }) => sum + e.sessions, 0);
  progress.totalMinutes = progress.entries.reduce((sum: number, e: { totalMinutes: number }) => sum + e.totalMinutes, 0);

  // Calculate streak
  const sorted = [...progress.entries]
    .filter((e: { completedCount: number }) => e.completedCount > 0)
    .sort((a: { date: string }, b: { date: string }) => b.date.localeCompare(a.date));

  let streak = 0;
  if (sorted.length > 0) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (sorted[0].date === today || sorted[0].date === yesterday) {
      streak = 1;
      for (let i = 1; i < sorted.length; i++) {
        const prev = new Date(sorted[i - 1].date);
        const curr = new Date(sorted[i].date);
        const diff = (prev.getTime() - curr.getTime()) / 86400000;
        if (diff === 1) streak++;
        else break;
      }
    }
  }

  progress.currentStreak = streak;
  progress.longestStreak = Math.max(progress.longestStreak, streak);

  await saveProgress(JSON.stringify(progress));
}

export async function requestPermissions(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  
  const result = await Notification.requestPermission();
  return result === 'granted';
}

export async function scheduleReminder(reminder: Reminder): Promise<string> {
  const id = `web_${reminder.id}`;
  
  // Cancel any existing timer for this reminder
  cancelWebTimer(id);
  
  // Request permission first
  await requestPermissions();
  
  const intervalMs = reminder.intervalMinutes * 60 * 1000;
  
  function fireNotification() {
    if (Notification.permission === 'granted') {
      new Notification(`${reminder.icon} ${reminder.title}`, {
        body: `Time for your ${reminder.title.toLowerCase()} break!`,
        tag: `${reminder.id}_${Date.now()}`,
        requireInteraction: true,
      });
      incrementAlertsSent();
    }
  }
  
  // Schedule the first notification after the interval
  window.setTimeout(() => {
    fireNotification();
    // Then set up recurring notifications
    const recurringTimer = window.setInterval(fireNotification, intervalMs);
    webTimers.set(id, recurringTimer);
  }, intervalMs);
  
  webScheduledAt.set(id, Date.now());
  
  return id;
}

function cancelWebTimer(id: string): void {
  const existing = webTimers.get(id);
  if (existing) {
    window.clearInterval(existing);
    webTimers.delete(id);
  }
  // Also clear any pending timeout
  const pendingTimers = Array.from(webTimers.entries());
  for (const [timerId, timer] of pendingTimers) {
    if (timerId === id) {
      window.clearTimeout(timer);
    }
  }
}

export async function cancelReminder(notificationId: string): Promise<void> {
  cancelWebTimer(notificationId);
}

export async function snoozeReminder(reminder: Reminder): Promise<string> {
  if (reminder.notificationId) {
    await cancelReminder(reminder.notificationId);
  }
  
  const id = `web_snooze_${reminder.id}`;
  const snoozeMs = reminder.snoozeDurationMinutes * 60 * 1000;
  
  const timer = window.setTimeout(() => {
    if (Notification.permission === 'granted') {
      new Notification(`${reminder.icon} ${reminder.title}`, {
        body: `Snoozed reminder: ${reminder.title}`,
        tag: reminder.id,
        requireInteraction: true,
      });
    }
    webTimers.delete(id);
  }, snoozeMs);
  
  webTimers.set(id, timer as unknown as number);
  return id;
}

export async function cancelAllReminders(): Promise<void> {
  webTimers.forEach((timer) => {
    window.clearInterval(timer);
    window.clearTimeout(timer);
  });
  webTimers.clear();
  webScheduledAt.clear();
}

export function getNextFireTime(reminder: Reminder): Date | null {
  if (!reminder.isActive || !reminder.notificationId) return null;
  
  const id = reminder.notificationId;
  const scheduledTime = webScheduledAt.get(id);
  const baseTime = scheduledTime || new Date(reminder.createdAt).getTime();
  const now = Date.now();
  const intervalMs = reminder.intervalMinutes * 60 * 1000;
  const elapsed = now - baseTime;
  const cyclesCompleted = Math.floor(elapsed / intervalMs);
  const nextFire = new Date(baseTime + (cyclesCompleted + 1) * intervalMs);
  
  return nextFire;
}