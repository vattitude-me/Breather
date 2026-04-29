export const COLORS = {
  primary: '#E8614D',
  primaryLight: '#FDE8E4',
  secondary: '#F4A261',
  secondaryLight: '#FEF3E2',
  accent: '#2EC4B6',
  accentLight: '#E0F7F5',
  background: '#FFF9F5',
  surface: '#FFFFFF',
  text: '#1A1A2E',
  textSecondary: '#6B7280',
  danger: '#EF4444',
  dangerLight: '#FEE2E2',
  border: '#F0E6E0',
  disabled: '#D1D5DB',
  cardPink: '#FCE4EC',
  cardPeach: '#FFF3E0',
  cardMint: '#E0F2F1',
  cardLavender: '#EDE7F6',
};

export const APP_NAME = 'Breakly';

export const CATEGORIES = [
  { title: 'Targeted', icon: '🎯', color: '#FCE4EC' },
  { title: 'Posture', icon: '🧍', color: '#FFF3E0' },
  { title: 'Relax & Unwind', icon: '🧘', color: '#E0F2F1' },
  { title: 'At The Office', icon: '💼', color: '#EDE7F6' },
];

export const PRESET_REMINDERS = [
  { title: 'Stretch', icon: '🧘', defaultInterval: 60 },
  { title: 'Drink Water', icon: '💧', defaultInterval: 60 },
  { title: 'Walk', icon: '🚶', defaultInterval: 60 },
  { title: 'Eye Break', icon: '👁️', defaultInterval: 20 },
  { title: 'Posture Check', icon: '🧍', defaultInterval: 45 },
  { title: 'Deep Breath', icon: '🌬️', defaultInterval: 30 },
];

export const INTERVAL_PRESETS = [15, 30, 45, 60, 90, 120];

export const SNOOZE_OPTIONS = [5, 10, 15, 30];

export const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

export const DEFAULT_SCHEDULE = {
  activeDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] as ('Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun')[],
  startHour: 8,
  endHour: 17,
};

export const STORAGE_KEYS = {
  REMINDERS: '@breakly_reminders',
  SETTINGS: '@breakly_settings',
  PROGRESS: '@breakly_progress',
};

export const DEFAULT_SETTINGS = {
  defaultSnoozeDurationMinutes: 10,
  defaultIntervalMinutes: 30,
  notificationsEnabled: true,
  defaultSchedule: DEFAULT_SCHEDULE,
};
