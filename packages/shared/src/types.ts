export type DayOfWeek = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

export interface Schedule {
  activeDays: DayOfWeek[];
  startHour: number; // 0-23
  endHour: number;   // 0-23
}

export interface Reminder {
  id: string;
  title: string;
  intervalMinutes: number;
  isActive: boolean;
  notificationId?: string;
  createdAt: string;
  snoozeDurationMinutes: number;
  icon: string;
  schedule: Schedule;
  breakDurationSeconds: number;
}

export interface AppSettings {
  defaultSnoozeDurationMinutes: number;
  defaultIntervalMinutes: number;
  notificationsEnabled: boolean;
  defaultSchedule: Schedule;
}

export interface ProgressEntry {
  date: string;
  completedCount: number;
  totalMinutes: number;
  sessions: number;
}

export interface ProgressData {
  entries: ProgressEntry[];
  currentStreak: number;
  longestStreak: number;
  totalSessions: number;
  totalMinutes: number;
}

export type PlantStage = 'seed' | 'sprout' | 'sapling' | 'tree' | 'flowering';

export interface PlantState {
  waterPoints: number;
  stage: PlantStage;
  lastWateredDate: string;
  lastDecayCheckDate: string;
  dailyLeavesGrown: number;
  dailyDate: string;
}

export interface Pot {
  id: string;
  name: string;
  unlockThreshold: number;
  image: string;
  colors: {
    body: string;
    accent: string;
    rim: string;
  };
  pattern?: 'solid' | 'marble' | 'porcelain' | 'stone' | 'mystery';
}

export interface PotCollectionState {
  totalBreaksCompleted: number;
  activePotId: string;
  unlockedPotIds: string[];
  lastUnlockCelebrated: string;
}

export type ReminderAction =
  | { type: 'LOAD'; payload: Reminder[] }
  | { type: 'ADD'; payload: Reminder }
  | { type: 'UPDATE'; payload: Reminder }
  | { type: 'DELETE'; payload: string }
  | { type: 'TOGGLE'; payload: string };
