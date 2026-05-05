import { useState, useEffect, useCallback } from 'react';
import { PlantState, loadPlantState, checkDecay, checkDailyReset, waterPlant, progressInStage } from '@breather/shared';

const STAGE_LABELS: Record<string, string> = {
  seed: 'Seed',
  sprout: 'Sprout',
  sapling: 'Sapling',
  tree: 'Tree',
  flowering: 'In Bloom',
};

const DECAY_MESSAGES = [
  { icon: '🥀', text: 'Your plant missed you! Water it to bring it back.' },
  { icon: '🍂', text: 'Your plant lost some leaves overnight. Give it some love!' },
  { icon: '😢', text: 'Your plant is wilting! Take a break to help it grow.' },
  { icon: '💔', text: 'Your plant needs you! Acknowledge a break to revive it.' },
  { icon: '🌧️', text: 'Your plant weathered a dry spell. Time to water it!' },
];

function sendDecayNotification(missedDays: number, pointsLost: number) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  const msg = DECAY_MESSAGES[Math.floor(Math.random() * DECAY_MESSAGES.length)];
  const dayText = missedDays === 1 ? '1 day' : `${missedDays} days`;

  new Notification(`${msg.icon} Your plant needs water!`, {
    body: `${msg.text}\n${dayText} missed - lost ${pointsLost} water points.`,
    icon: '/logo192.png',
    tag: 'plant-decay',
  });
}

export function usePlantState() {
  const [plantState, setPlantState] = useState<PlantState>(() => {
    const state = loadPlantState();
    const result = checkDecay(state);
    return checkDailyReset(result.state);
  });
  const [leafDrop, setLeafDrop] = useState(false);

  useEffect(() => {
    const state = loadPlantState();
    const result = checkDecay(state);
    const resetState = checkDailyReset(result.state);
    setPlantState(resetState);
    if (result.decayed && result.pointsLost > 0) {
      sendDecayNotification(result.missedDays, result.pointsLost);
    }
  }, []);

  useEffect(() => {
    const handler = () => {
      const loaded = loadPlantState();
      setPlantState(checkDailyReset(loaded));
    };
    window.addEventListener('plant-updated', handler);
    return () => window.removeEventListener('plant-updated', handler);
  }, []);

  const water = useCallback(() => {
    const updated = waterPlant();
    setPlantState(updated);
    return updated;
  }, []);

  const triggerLeafDrop = useCallback(() => {
    setLeafDrop(true);
    setTimeout(() => {
      setLeafDrop(false);
    }, 3000);
  }, []);

  return {
    plantState,
    water,
    stageLabel: STAGE_LABELS[plantState.stage] || 'Seed',
    progress: progressInStage(plantState.waterPoints),
    dailyLeaves: plantState.dailyLeavesGrown,
    leafDrop,
    triggerLeafDrop,
  };
}
