import { useState, useEffect, useCallback } from 'react';
import { PlantState } from '@breather/shared/src/types';
import { PLANT_DAILY_COLORS } from '@breather/shared/src/constants';
import { loadPlantState, savePlantState, onStorageChange } from '../../lib/storage';
import { checkDecay, checkDailyReset, stageFromPoints, progressInStage, waterPlant } from '../../lib/plantService';

export function usePlantState() {
  const [plantState, setPlantState] = useState<PlantState>({
    waterPoints: 0,
    stage: 'seed',
    lastWateredDate: '',
    lastDecayCheckDate: '',
    dailyLeavesGrown: 0,
    dailyDate: '',
  });

  const load = useCallback(async () => {
    const state = await loadPlantState();
    const decayed = await checkDecay(state);
    const reset = await checkDailyReset(decayed);
    setPlantState(reset);
  }, []);

  useEffect(() => {
    load();
    onStorageChange((changes) => {
      if (changes['@breather_plant']?.newValue) {
        setPlantState(changes['@breather_plant'].newValue);
      }
    });
  }, [load]);

  const water = useCallback(async () => {
    const updated = await waterPlant();
    setPlantState(updated);
    return updated;
  }, []);

  const dayIndex = new Date().getDay();
  const colors = PLANT_DAILY_COLORS[dayIndex % PLANT_DAILY_COLORS.length];

  return {
    plantState,
    water,
    stageLabel: plantState.stage,
    progress: progressInStage(plantState.waterPoints),
    dailyLeaves: plantState.dailyLeavesGrown,
    colors,
  };
}
