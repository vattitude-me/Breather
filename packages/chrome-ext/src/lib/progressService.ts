import { ProgressData, ProgressEntry } from '@breather/shared/src/types';
import { loadProgress, saveProgress } from './storage';

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

function getYesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

export async function recordBreakCompleted(breakDurationSeconds: number): Promise<ProgressData> {
  const progress = await loadProgress();
  const today = getToday();
  const minutes = Math.round(breakDurationSeconds / 60);

  let todayEntry = progress.entries.find((e) => e.date === today);
  if (todayEntry) {
    todayEntry.completedCount += 1;
    todayEntry.totalMinutes += minutes;
    todayEntry.sessions += 1;
  } else {
    todayEntry = { date: today, completedCount: 1, totalMinutes: minutes, sessions: 1 };
    progress.entries.push(todayEntry);
  }

  const yesterday = getYesterday();
  const hadYesterday = progress.entries.some((e) => e.date === yesterday && e.completedCount > 0);
  if (todayEntry.completedCount === 1) {
    progress.currentStreak = hadYesterday ? progress.currentStreak + 1 : 1;
  }
  progress.longestStreak = Math.max(progress.longestStreak, progress.currentStreak);
  progress.totalSessions += 1;
  progress.totalMinutes += minutes;

  progress.entries = progress.entries.slice(-90);

  await saveProgress(progress);
  return progress;
}

export function getTodayEntry(progress: ProgressData): ProgressEntry | null {
  const today = getToday();
  return progress.entries.find((e) => e.date === today) || null;
}

export function getWeekEntries(progress: ProgressData): ProgressEntry[] {
  const entries: ProgressEntry[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const existing = progress.entries.find((e) => e.date === dateStr);
    entries.push(existing || { date: dateStr, completedCount: 0, totalMinutes: 0, sessions: 0 });
  }
  return entries;
}

export function getMonthEntries(progress: ProgressData): ProgressEntry[] {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  return progress.entries.filter((e) => {
    const d = new Date(e.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });
}
