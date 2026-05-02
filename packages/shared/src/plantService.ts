import { PlantState, PlantStage } from './types';
import { STORAGE_KEYS, PLANT_STAGES, PLANT_MAX_POINTS, PLANT_DECAY_PER_DAY } from './constants';

const DEFAULT_PLANT: PlantState = {
  waterPoints: 0,
  stage: 'seed',
  lastWateredDate: '',
  lastDecayCheckDate: '',
};

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

function daysBetween(dateA: string, dateB: string): number {
  const a = new Date(dateA).getTime();
  const b = new Date(dateB).getTime();
  return Math.floor(Math.abs(b - a) / 86400000);
}

export function stageFromPoints(points: number): PlantStage {
  for (let i = PLANT_STAGES.length - 1; i >= 0; i--) {
    if (points >= PLANT_STAGES[i].minPoints) return PLANT_STAGES[i].stage;
  }
  return 'seed';
}

export function loadPlantState(): PlantState {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PLANT);
    if (data) return JSON.parse(data);
  } catch { /* use default */ }
  return { ...DEFAULT_PLANT };
}

export function savePlantState(state: PlantState): void {
  localStorage.setItem(STORAGE_KEYS.PLANT, JSON.stringify(state));
  window.dispatchEvent(new Event('plant-updated'));
}

export interface DecayResult {
  state: PlantState;
  decayed: boolean;
  missedDays: number;
  pointsLost: number;
}

export function checkDecay(state: PlantState): DecayResult {
  const today = getToday();
  if (state.lastDecayCheckDate === today) {
    return { state, decayed: false, missedDays: 0, pointsLost: 0 };
  }
  if (!state.lastWateredDate) {
    return { state: { ...state, lastDecayCheckDate: today }, decayed: false, missedDays: 0, pointsLost: 0 };
  }

  const missed = daysBetween(state.lastWateredDate, today) - 1;
  if (missed <= 0) {
    return { state: { ...state, lastDecayCheckDate: today }, decayed: false, missedDays: 0, pointsLost: 0 };
  }

  const pointsLost = Math.min(state.waterPoints, missed * PLANT_DECAY_PER_DAY);
  const newPoints = Math.max(0, state.waterPoints - pointsLost);
  const updated: PlantState = {
    ...state,
    waterPoints: newPoints,
    stage: stageFromPoints(newPoints),
    lastDecayCheckDate: today,
  };
  savePlantState(updated);
  return { state: updated, decayed: true, missedDays: missed, pointsLost };
}

export function waterPlant(): PlantState {
  const loaded = loadPlantState();
  const { state } = checkDecay(loaded);

  const newPoints = Math.min(PLANT_MAX_POINTS, state.waterPoints + 1);
  const updated: PlantState = {
    waterPoints: newPoints,
    stage: stageFromPoints(newPoints),
    lastWateredDate: getToday(),
    lastDecayCheckDate: state.lastDecayCheckDate,
  };
  savePlantState(updated);
  return updated;
}

export function progressInStage(points: number): number {
  const stageIndex = PLANT_STAGES.findIndex((s) => s.stage === stageFromPoints(points));
  const currentMin = PLANT_STAGES[stageIndex].minPoints;
  const nextMin = stageIndex < PLANT_STAGES.length - 1
    ? PLANT_STAGES[stageIndex + 1].minPoints
    : PLANT_MAX_POINTS;
  const range = nextMin - currentMin;
  if (range === 0) return 100;
  return Math.round(((points - currentMin) / range) * 100);
}
