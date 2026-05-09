import { PlantState, PlantStage } from '@breather/shared/src/types';
import { PLANT_STAGES, PLANT_MAX_POINTS, PLANT_DECAY_PER_DAY } from '@breather/shared/src/constants';
import { loadPlantState, savePlantState } from './storage';

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
  await savePlantState(updated);
  return updated;
}

export async function checkDailyReset(state: PlantState): Promise<PlantState> {
  const today = getToday();
  if (state.dailyDate && state.dailyDate !== today) {
    const updated = { ...state, dailyLeavesGrown: 0, dailyDate: today };
    await savePlantState(updated);
    return updated;
  }
  if (!state.dailyDate) return { ...state, dailyDate: today };
  return state;
}

export async function waterPlant(): Promise<PlantState> {
  const loaded = await loadPlantState();
  const decayed = await checkDecay(loaded);
  const state = await checkDailyReset(decayed);

  const newPoints = Math.min(PLANT_MAX_POINTS, state.waterPoints + 1);
  const newLeaves = state.dailyLeavesGrown + 1;
  const today = getToday();
  const updated: PlantState = {
    waterPoints: newPoints,
    stage: stageFromPoints(newPoints),
    lastWateredDate: today,
    lastDecayCheckDate: state.lastDecayCheckDate,
    dailyLeavesGrown: newLeaves,
    dailyDate: today,
  };
  await savePlantState(updated);
  return updated;
}
