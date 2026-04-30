import { Reminder, DayOfWeek } from '../types';
import { loadProgress, saveProgress } from './storage';

const ALERTS_SENT_KEY = '@breakly_alerts_sent';
const DAYS_MAP: DayOfWeek[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as unknown as DayOfWeek[];

// Track both initial timeouts and recurring intervals separately
const initialTimers: Map<string, number> = new Map();
const recurringTimers: Map<string, number> = new Map();
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

function isWithinSchedule(schedule: Reminder['schedule']): boolean {
  if (!schedule) return true;
  const now = new Date();
  const dayName = DAYS_MAP[now.getDay()];
  const hour = now.getHours();

  if (!schedule.activeDays.includes(dayName as DayOfWeek)) return false;
  if (hour < schedule.startHour || hour >= schedule.endHour) return false;
  return true;
}

export { isWithinSchedule };

export async function scheduleReminder(reminder: Reminder): Promise<string> {
  const id = `web_${reminder.id}`;

  // Cancel any existing timers for this reminder
  cancelWebTimer(id);

  await requestPermissions();

  const intervalMs = reminder.intervalMinutes * 60 * 1000;

  function fireNotification() {
    if (!isWithinSchedule(reminder.schedule)) return;
    if (Notification.permission !== 'granted') return;

    const title = `${reminder.icon} ${reminder.title}`;
    const options: NotificationOptions = {
      body: `Time for your ${reminder.title.toLowerCase()} break!`,
      tag: `${reminder.id}_${Date.now()}`,
      requireInteraction: true,
      icon: '/pwa-192x192.png',
    };

    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.showNotification(title, options);
      });
    } else {
      new Notification(title, options);
    }
    incrementAlertsSent();
  }

  // Store the initial timeout so it can be cancelled
  const initialTimer = window.setTimeout(() => {
    initialTimers.delete(id);
    fireNotification();
    // Set up recurring interval
    const recurringTimer = window.setInterval(fireNotification, intervalMs);
    recurringTimers.set(id, recurringTimer);
  }, intervalMs);

  initialTimers.set(id, initialTimer);
  webScheduledAt.set(id, Date.now());

  return id;
}

function cancelWebTimer(id: string): void {
  // Clear initial timeout if still pending
  const initial = initialTimers.get(id);
  if (initial) {
    window.clearTimeout(initial);
    initialTimers.delete(id);
  }
  // Clear recurring interval
  const recurring = recurringTimers.get(id);
  if (recurring) {
    window.clearInterval(recurring);
    recurringTimers.delete(id);
  }
}

export async function cancelReminder(notificationId: string): Promise<void> {
  cancelWebTimer(notificationId);
}

export async function cancelAllReminders(): Promise<void> {
  initialTimers.forEach((timer) => window.clearTimeout(timer));
  initialTimers.clear();
  recurringTimers.forEach((timer) => window.clearInterval(timer));
  recurringTimers.clear();
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
