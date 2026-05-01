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
export const APP_VERSION = '1.5.2';

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

export const WELLNESS_TIPS = [
  'Taking a 5-minute stretch break every hour can reduce back pain by up to 40% and boost focus.',
  'Looking away from your screen every 20 minutes for 20 seconds at something 20 feet away helps prevent eye strain.',
  'Standing up and walking for just 2 minutes every hour can offset the effects of prolonged sitting.',
  'Drinking water regularly throughout the day improves concentration and reduces fatigue by up to 25%.',
  'A short mindful breathing exercise can lower cortisol levels and reduce stress in under 3 minutes.',
  'Proper posture while sitting can prevent up to 80% of back, neck, and shoulder pain at work.',
  'Taking micro-breaks between tasks helps your brain consolidate information and improves creativity.',
  'Rolling your shoulders back and down every 30 minutes prevents tension headaches from building up.',
  'A 10-minute walk after lunch improves afternoon productivity and helps regulate blood sugar levels.',
  'Blinking deliberately 10 times every 20 minutes keeps your eyes moisturised and reduces digital eye fatigue.',
  'Stretching your wrists and fingers for 30 seconds every hour helps prevent repetitive strain injuries.',
  'Natural daylight exposure during breaks helps regulate your circadian rhythm and improves sleep quality.',
  'Deep belly breathing for 60 seconds activates your parasympathetic nervous system and calms anxiety.',
  'Adjusting your monitor to arm length distance and eye level reduces neck strain by up to 50%.',
  'A brief desk yoga routine can increase blood flow to the brain and sharpen your afternoon focus.',
  'Staying hydrated helps your body flush toxins and keeps joints lubricated for less stiffness.',
  'Taking the stairs instead of the lift adds up to significant cardiovascular benefit over a week.',
  'Unclenching your jaw and relaxing your tongue from the roof of your mouth releases facial tension instantly.',
  'A 5-minute gratitude pause during your workday has been shown to boost mood and team morale.',
  'Keeping a plant on your desk can reduce stress, improve air quality, and increase productivity by 15%.',
];