import {
  Reminder, AppSettings, PlantState, ProgressEntry,
  STORAGE_KEYS, DEFAULT_SETTINGS, PLANT_STAGES, PLANT_MAX_POINTS, PLANT_DECAY_PER_DAY,
} from '@breather/shared';

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

function daysBetween(a: string, b: string): number {
  return Math.floor(Math.abs(new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

function stageFromPoints(points: number) {
  for (let i = PLANT_STAGES.length - 1; i >= 0; i--) {
    if (points >= PLANT_STAGES[i].minPoints) return PLANT_STAGES[i].stage;
  }
  return 'seed' as const;
}

const DEFAULT_PLANT: PlantState = { waterPoints: 0, stage: 'seed', lastWateredDate: '', lastDecayCheckDate: '', dailyLeavesGrown: 0, dailyDate: '' };

async function get<T>(key: string, fallback: T): Promise<T> {
  const result = await chrome.storage.local.get(key);
  return result[key] ?? fallback;
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

export async function loadPlant(): Promise<PlantState> {
  return get<PlantState>(STORAGE_KEYS.PLANT, { ...DEFAULT_PLANT });
}

export async function savePlant(state: PlantState): Promise<void> {
  await set(STORAGE_KEYS.PLANT, state);
}

export async function checkDecay(state: PlantState): Promise<PlantState> {
  const today = getToday();
  if (state.lastDecayCheckDate === today) return state;
  if (!state.lastWateredDate) return { ...state, lastDecayCheckDate: today };

  const missed = daysBetween(state.lastWateredDate, today) - 1;
  if (missed <= 0) return { ...state, lastDecayCheckDate: today };

  const pointsLost = Math.min(state.waterPoints, missed * PLANT_DECAY_PER_DAY);
  const newPoints = Math.max(0, state.waterPoints - pointsLost);
  const updated: PlantState = {
    ...state,
    waterPoints: newPoints,
    stage: stageFromPoints(newPoints),
    lastDecayCheckDate: today,
  };
  await savePlant(updated);
  return updated;
}

export async function waterPlant(): Promise<PlantState> {
  let state = await loadPlant();
  state = await checkDecay(state);

  const today = getToday();
  const newPoints = Math.min(PLANT_MAX_POINTS, state.waterPoints + 1);
  const dailyLeavesGrown = (state.dailyDate === today ? state.dailyLeavesGrown : 0) + 1;
  const updated: PlantState = {
    waterPoints: newPoints,
    stage: stageFromPoints(newPoints),
    lastWateredDate: today,
    lastDecayCheckDate: state.lastDecayCheckDate,
    dailyLeavesGrown,
    dailyDate: today,
  };
  await savePlant(updated);
  return updated;
}

export async function loadProgress(): Promise<ProgressEntry[]> {
  return get<ProgressEntry[]>(STORAGE_KEYS.PROGRESS, []);
}

export async function saveProgress(entries: ProgressEntry[]): Promise<void> {
  await set(STORAGE_KEYS.PROGRESS, entries);
}

export async function recordCompletion(intervalMinutes: number): Promise<void> {
  const entries = await loadProgress();
  const today = getToday();
  const idx = entries.findIndex((e) => e.date === today);
  if (idx >= 0) {
    entries[idx].completedCount += 1;
    entries[idx].sessions += 1;
    entries[idx].totalMinutes += intervalMinutes;
  } else {
    entries.push({ date: today, completedCount: 1, sessions: 1, totalMinutes: intervalMinutes });
  }
  await saveProgress(entries);
}

export function computeStreak(entries: ProgressEntry[]): number {
  if (entries.length === 0) return 0;
  const sorted = [...entries].filter((e) => e.completedCount > 0).sort((a, b) => b.date.localeCompare(a.date));
  if (sorted.length === 0) return 0;

  const today = getToday();
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  if (sorted[0].date !== today && sorted[0].date !== yesterday) return 0;

  let streak = 1;
  for (let i = 1; i < sorted.length; i++) {
    const diff = daysBetween(sorted[i].date, sorted[i - 1].date);
    if (diff === 1) streak++;
    else break;
  }
  return streak;
}
