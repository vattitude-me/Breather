export const COLORS = {
  primary: '#4A90D9',
  primaryLight: '#E8F1FB',
  secondary: '#7BC67E',
  secondaryLight: '#E8F8E9',
  background: '#F8F9FA',
  surface: '#FFFFFF',
  text: '#1A1A2E',
  textSecondary: '#6B7280',
  danger: '#EF4444',
  dangerLight: '#FEE2E2',
  border: '#E5E7EB',
  disabled: '#D1D5DB',
};

export const PRESET_REMINDERS = [
  { title: 'Stretch', icon: '🧘', defaultInterval: 30 },
  { title: 'Drink Water', icon: '💧', defaultInterval: 45 },
  { title: 'Walk', icon: '🚶', defaultInterval: 60 },
  { title: 'Eye Break', icon: '👁️', defaultInterval: 20 },
  { title: 'Deep Breath', icon: '🌬️', defaultInterval: 15 },
];

export const INTERVAL_PRESETS = [15, 30, 45, 60, 90, 120];

export const SNOOZE_OPTIONS = [5, 10, 15, 30];

export const STORAGE_KEYS = {
  REMINDERS: '@stretch_reminders',
  SETTINGS: '@stretch_settings',
};

export const DEFAULT_SETTINGS = {
  defaultSnoozeDurationMinutes: 10,
  defaultIntervalMinutes: 30,
  notificationsEnabled: true,
};
