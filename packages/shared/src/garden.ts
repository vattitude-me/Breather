import { BreathPattern, DailyReminder, Garden, WeekDay } from './types';
import {
  BREATH_PATTERNS,
  DEFAULT_SESSION_MINUTES,
  LEGACY_KEYS,
  REMINDER_SLOTS,
  SESSION_HISTORY_DAYS,
} from './constants';

export function dateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function shiftKey(key: string, days: number): string {
  const d = parseKey(key);
  d.setDate(d.getDate() + days);
  return dateKey(d);
}

export function createGarden(): Garden {
  const midday = REMINDER_SLOTS[1];
  return {
    version: 2,
    onboarded: false,
    sproutName: '',
    sessionMinutes: DEFAULT_SESSION_MINUTES,
    patternId: BREATH_PATTERNS[0].id,
    reminder: { enabled: true, slot: midday.id, time: midday.time },
    chime: true,
    haptics: false,
    leaves: 0,
    totalSeconds: 0,
    days: [],
    sessions: [],
  };
}

export function normalizeGarden(raw: unknown): Garden {
  const base = createGarden();
  if (!raw || typeof raw !== 'object') return base;
  const g = raw as Partial<Garden>;
  return {
    ...base,
    ...g,
    version: 2,
    reminder: { ...base.reminder, ...(g.reminder as Partial<DailyReminder> | undefined) },
    days: Array.isArray(g.days) ? g.days : [],
    sessions: Array.isArray(g.sessions) ? g.sessions : [],
  };
}

export function recordSession(g: Garden, seconds: number, now: Date = new Date()): Garden {
  const today = dateKey(now);
  const cutoff = shiftKey(today, -SESSION_HISTORY_DAYS);
  const sessions = [{ at: now.toISOString(), seconds }, ...g.sessions].filter(
    (s) => dateKey(new Date(s.at)) >= cutoff
  );
  return {
    ...g,
    leaves: g.leaves + 1,
    totalSeconds: g.totalSeconds + seconds,
    days: g.days.includes(today) ? g.days : [...g.days, today].sort(),
    sessions,
  };
}

export function didBreatheToday(g: Garden, now: Date = new Date()): boolean {
  return g.days.includes(dateKey(now));
}

// A missed day never breaks anything: the streak counts back from today, or from yesterday if today is still open.
export function currentStreak(days: string[], now: Date = new Date()): number {
  const set = new Set(days);
  let cursor = dateKey(now);
  if (!set.has(cursor)) cursor = shiftKey(cursor, -1);
  let streak = 0;
  while (set.has(cursor)) {
    streak++;
    cursor = shiftKey(cursor, -1);
  }
  return streak;
}

export function weekOverview(days: string[], now: Date = new Date()): WeekDay[] {
  const today = dateKey(now);
  const mondayOffset = (now.getDay() + 6) % 7;
  const monday = shiftKey(today, -mondayOffset);
  const set = new Set(days);
  return ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((letter, i) => {
    const key = shiftKey(monday, i);
    return { key, letter, done: set.has(key), isToday: key === today, isFuture: key > today };
  });
}

export function secondsThisWeek(g: Garden, now: Date = new Date()): number {
  const monday = weekOverview([], now)[0].key;
  return g.sessions
    .filter((s) => dateKey(new Date(s.at)) >= monday)
    .reduce((sum, s) => sum + s.seconds, 0);
}

export function nextReminderAt(reminder: DailyReminder, now: Date = new Date()): Date | null {
  if (!reminder.enabled) return null;
  const [h, m] = reminder.time.split(':').map(Number);
  const next = new Date(now);
  next.setHours(h, m, 0, 0);
  if (next.getTime() <= now.getTime()) next.setDate(next.getDate() + 1);
  return next;
}

export function getPattern(id: string): BreathPattern {
  return BREATH_PATTERNS.find((p) => p.id === id) ?? BREATH_PATTERNS[0];
}

export function greeting(now: Date = new Date()): string {
  const h = now.getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export function formatClock(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, '0')} ${suffix}`;
}

export function formatTotal(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

// Carries progress over from the pre-4.0 reminder/pot model. Returns null when there is nothing to migrate.
export function migrateLegacy(read: (key: string) => string | null): Partial<Garden> | null {
  try {
    const progress = JSON.parse(read(LEGACY_KEYS.PROGRESS) || 'null') as {
      entries?: { date: string; completedCount: number }[];
      totalMinutes?: number;
    } | null;
    const pots = JSON.parse(read(LEGACY_KEYS.POT_COLLECTION) || 'null') as {
      totalBreaksCompleted?: number;
    } | null;
    if (!progress && !pots) return null;

    const entries = (progress?.entries ?? []).filter((e) => e.completedCount > 0);
    const leaves = pots?.totalBreaksCompleted ?? entries.reduce((n, e) => n + e.completedCount, 0);
    if (leaves === 0 && entries.length === 0) return null;

    return {
      leaves,
      totalSeconds: (progress?.totalMinutes ?? 0) * 60,
      days: [...new Set(entries.map((e) => e.date))].sort(),
    };
  } catch {
    return null;
  }
}
