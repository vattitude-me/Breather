import {
  Reminder,
  AppSettings,
  ProgressData,
  PlantState,
  PotCollectionState,
} from '@breather/shared/src/types';
import {
  DEFAULT_SETTINGS,
  STORAGE_KEYS,
} from '@breather/shared/src/constants';

const DEFAULT_PLANT: PlantState = {
  waterPoints: 0,
  stage: 'seed',
  lastWateredDate: '',
  lastDecayCheckDate: '',
  dailyLeavesGrown: 0,
  dailyDate: '',
};

const DEFAULT_POT_COLLECTION: PotCollectionState = {
  totalBreaksCompleted: 0,
  activePotId: 'classic-terracotta',
  unlockedPotIds: ['classic-terracotta'],
  lastUnlockCelebrated: '',
};

const DEFAULT_PROGRESS: ProgressData = {
  entries: [],
  currentStreak: 0,
  longestStreak: 0,
  totalSessions: 0,
  totalMinutes: 0,
};

async function get<T>(key: string, fallback: T): Promise<T> {
  const result = await chrome.storage.local.get(key);
  if (result[key] !== undefined) return result[key] as T;
  return fallback;
}

async function set(key: string, value: unknown): Promise<void> {
  await chrome.storage.local.set({ [key]: value });
}

export async function loadReminders(): Promise<Reminder[]> {
  return get<Reminder[]>(STORAGE_KEYS.REMINDERS, []);
}

export async function saveReminders(reminders: Reminder[]): Promise<void> {
  await set(STORAGE_KEYS.REMINDERS, reminders);
}

export async function loadSettings(): Promise<AppSettings> {
  return get<AppSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await set(STORAGE_KEYS.SETTINGS, settings);
}

export async function loadProgress(): Promise<ProgressData> {
  return get<ProgressData>(STORAGE_KEYS.PROGRESS, DEFAULT_PROGRESS);
}

export async function saveProgress(progress: ProgressData): Promise<void> {
  await set(STORAGE_KEYS.PROGRESS, progress);
}

export async function loadPlantState(): Promise<PlantState> {
  return get<PlantState>(STORAGE_KEYS.PLANT, DEFAULT_PLANT);
}

export async function savePlantState(state: PlantState): Promise<void> {
  await set(STORAGE_KEYS.PLANT, state);
}

export async function loadPotCollection(): Promise<PotCollectionState> {
  return get<PotCollectionState>(STORAGE_KEYS.POT_COLLECTION, DEFAULT_POT_COLLECTION);
}

export async function savePotCollection(state: PotCollectionState): Promise<void> {
  await set(STORAGE_KEYS.POT_COLLECTION, state);
}

export function onStorageChange(callback: (changes: { [key: string]: chrome.storage.StorageChange }) => void) {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local') callback(changes);
  });
}
