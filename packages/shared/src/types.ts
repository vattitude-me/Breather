export type ReminderSlotId = 'morning' | 'midday' | 'evening';

export interface DailyReminder {
  enabled: boolean;
  slot: ReminderSlotId;
  time: string; // 'HH:MM', local time
}

export interface Session {
  at: string; // ISO timestamp
  seconds: number;
}

export interface Garden {
  version: 2;
  onboarded: boolean;
  sproutName: string;
  sessionMinutes: number;
  patternId: string;
  reminder: DailyReminder;
  chime: boolean;
  haptics: boolean;
  leaves: number;
  totalSeconds: number;
  days: string[]; // local 'YYYY-MM-DD' keys with at least one session, ascending
  sessions: Session[]; // newest first, trimmed to SESSION_HISTORY_DAYS
}

export interface BreathPhase {
  label: string;
  seconds: number;
  expanded: boolean;
}

export interface BreathPattern {
  id: string;
  name: string;
  short: string;
  phases: BreathPhase[];
}

export interface WeekDay {
  key: string;
  letter: string;
  done: boolean;
  isToday: boolean;
  isFuture: boolean;
}
