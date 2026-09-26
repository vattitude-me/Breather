import { BreathPattern, ReminderSlotId } from './types';

export const APP_NAME = 'Breather';
export const APP_VERSION = '4.0.0';
export const PWA_URL = 'https://breather.vattitude.ca';

export const STORAGE_KEYS = {
  GARDEN: '@breather_garden',
  PWA_ACTIVE: '@breather_pwa_active',
} as const;

export const LEGACY_KEYS = {
  PROGRESS: '@breather_progress',
  POT_COLLECTION: '@breather_pot_collection',
} as const;

export const SESSION_MINUTE_OPTIONS = [1, 3, 5];
export const DEFAULT_SESSION_MINUTES = 3;

export const FULL_BLOOM_LEAVES = 12;
export const SESSION_HISTORY_DAYS = 60;

export const SPROUT_NAME_SUGGESTIONS = ['Pip', 'Moss', 'Clover', 'Fern'];

export const REMINDER_SLOTS: { id: ReminderSlotId; label: string; time: string }[] = [
  { id: 'morning', label: 'Morning', time: '08:30' },
  { id: 'midday', label: 'Midday', time: '12:00' },
  { id: 'evening', label: 'Evening', time: '18:00' },
];

export const BREATH_PATTERNS: BreathPattern[] = [
  {
    id: 'calm',
    name: 'Calm',
    short: '4 · 4 · 6',
    phases: [
      { label: 'Breathe in', seconds: 4, expanded: true },
      { label: 'Hold', seconds: 4, expanded: true },
      { label: 'Breathe out', seconds: 6, expanded: false },
    ],
  },
  {
    id: 'box',
    name: 'Box',
    short: '4 · 4 · 4 · 4',
    phases: [
      { label: 'Breathe in', seconds: 4, expanded: true },
      { label: 'Hold', seconds: 4, expanded: true },
      { label: 'Breathe out', seconds: 4, expanded: false },
      { label: 'Rest', seconds: 4, expanded: false },
    ],
  },
  {
    id: 'even',
    name: 'Even',
    short: '5 · 5',
    phases: [
      { label: 'Breathe in', seconds: 5, expanded: true },
      { label: 'Breathe out', seconds: 5, expanded: false },
    ],
  },
];
