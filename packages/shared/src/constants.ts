export const COLORS = {
  primary: '#D4503C',
  primaryLight: '#FDE8E4',
  secondary: '#C47A30',
  secondaryLight: '#FEF3E2',
  accent: '#0E8A7D',
  accentLight: '#E0F7F5',
  background: '#FFF9F5',
  surface: '#FFFFFF',
  text: '#1A1A2E',
  textSecondary: '#5C6370',
  danger: '#DC2626',
  dangerLight: '#FEE2E2',
  border: '#F0E6E0',
  disabled: '#9CA3AF',
  cardPink: '#FCE4EC',
  cardPeach: '#FFF3E0',
  cardMint: '#E0F2F1',
  cardLavender: '#EDE7F6',
};

export const APP_NAME = 'Breather';
export const APP_VERSION = '3.12.5';

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

export const INTERVAL_PRESETS = [1, 5, 15, 30, 45, 60, 90, 120];

export const SNOOZE_OPTIONS = [5, 10, 15, 30];

export const BREAK_DURATION_OPTIONS = [30, 60, 90, 120, 180, 300];
export const DEFAULT_BREAK_DURATION_SECONDS = 60;

export const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

export const DEFAULT_SCHEDULE = {
  activeDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] as ('Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun')[],
  startHour: 8,
  endHour: 17,
};

export const STORAGE_KEYS = {
  REMINDERS: '@breather_reminders',
  SETTINGS: '@breather_settings',
  PROGRESS: '@breather_progress',
  PROGRESS_SECTIONS: '@breather_progress_sections',
  PLANT: '@breather_plant',
  POT_COLLECTION: '@breather_pot_collection',
  DEV_MODE: '@breather_dev_mode',
};

export const PLANT_STAGES = [
  { stage: 'seed' as const, minPoints: 0 },
  { stage: 'sprout' as const, minPoints: 2 },
  { stage: 'sapling' as const, minPoints: 4 },
  { stage: 'tree' as const, minPoints: 6 },
  { stage: 'flowering' as const, minPoints: 8 },
];

export const PLANT_MAX_POINTS = 10;
export const PLANT_DECAY_PER_DAY = 2;

export const PLANT_DAILY_COLORS = [
  { leaf: '#43A047', leafDark: '#2E7D32', stem: '#2E7D32' },
  { leaf: '#26A69A', leafDark: '#00897B', stem: '#00897B' },
  { leaf: '#66BB6A', leafDark: '#388E3C', stem: '#388E3C' },
  { leaf: '#4DB6AC', leafDark: '#00796B', stem: '#00796B' },
  { leaf: '#81C784', leafDark: '#4CAF50', stem: '#4CAF50' },
  { leaf: '#009688', leafDark: '#00695C', stem: '#00695C' },
  { leaf: '#8BC34A', leafDark: '#558B2F', stem: '#558B2F' },
];

export const DEFAULT_SETTINGS = {
  defaultSnoozeDurationMinutes: 10,
  defaultIntervalMinutes: 30,
  notificationsEnabled: true,
  defaultSchedule: DEFAULT_SCHEDULE,
};

export const PLANT_MOTIVATIONS = [
  { icon: '💧', text: 'Nice! Your plant says thanks!' },
  { icon: '🌱', text: 'Growing stronger!' },
  { icon: '✨', text: 'You are doing amazing!' },
  { icon: '🌿', text: 'Fresh vibes!' },
  { icon: '☀️', text: 'Sunshine for your plant!' },
  { icon: '🌸', text: 'Beauty takes patience!' },
  { icon: '💪', text: 'Keep it up, plant hero!' },
  { icon: '🎉', text: 'Another drop of love!' },
  { icon: '🍃', text: 'Feel that breeze?' },
  { icon: '🌻', text: 'Blooming with joy!' },
  { icon: '💚', text: 'Your plant loves you!' },
  { icon: '🦋', text: 'A butterfly noticed!' },
  { icon: '🌈', text: 'Colourful progress!' },
  { icon: '⭐', text: 'Star gardener!' },
  { icon: '🐝', text: 'The bees approve!' },
];

export const POTS_CATALOG = [
  { id: 'classic-terracotta', name: 'Classic Terracotta', unlockThreshold: 0, image: '/pots/terracotta.png', colors: { body: '#C47A30', accent: '#D4894A', rim: '#A0622A' }, pattern: 'solid' as const },
  { id: 'woven-rattan', name: 'Woven Rattan', unlockThreshold: 15, image: '/pots/rattan.png', colors: { body: '#C49A6C', accent: '#A67C52', rim: '#D4AA7C' }, pattern: 'solid' as const },
  { id: 'hammered-copper', name: 'Hammered Copper', unlockThreshold: 50, image: '/pots/copper.png', colors: { body: '#B87333', accent: '#2E8B7B', rim: '#CD853F' }, pattern: 'solid' as const },
  { id: 'vintage-galvanized', name: 'Vintage Galvanized', unlockThreshold: 120, image: '/pots/galvanized.png', colors: { body: '#808080', accent: '#696969', rim: '#A9A9A9' }, pattern: 'stone' as const },
  { id: 'rustic-stone', name: 'Rustic Stone', unlockThreshold: 250, image: '/pots/stone.png', colors: { body: '#6B6B6B', accent: '#888888', rim: '#4A4A4A' }, pattern: 'stone' as const },
  { id: 'carrara-marble', name: 'Carrara Marble', unlockThreshold: 500, image: '/pots/marble.png', colors: { body: '#E8E8E8', accent: '#9E9E9E', rim: '#F5F5F5' }, pattern: 'marble' as const },
  { id: 'matte-black-geo', name: 'Matte Black Geo', unlockThreshold: 1000, image: '/pots/matte-black.png', colors: { body: '#2C2C2C', accent: '#444444', rim: '#1A1A1A' }, pattern: 'solid' as const },
];

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