import { useState, useEffect, useCallback } from 'react';
import {
  PlantState, PlantStage,
  COLORS, PLANT_STAGES, PLANT_MAX_POINTS, PLANT_MOTIVATIONS,
  stageFromPoints, progressInStage,
} from '@breather/shared';

const STAGE_LABELS: Record<PlantStage, string> = {
  seed: 'Seed',
  sprout: 'Sprout',
  sapling: 'Sapling',
  tree: 'Tree',
  flowering: 'In Bloom',
};

export default function App() {
  const [plant, setPlant] = useState<PlantState | null>(null);
  const [motivation, setMotivation] = useState<{ icon: string; text: string } | null>(null);
  const [nextBreakMs, setNextBreakMs] = useState<number | null>(null);

  useEffect(() => {
    chrome.runtime.sendMessage({ type: 'GET_PLANT_STATE' }, (response) => {
      if (response) setPlant(response);
    });
    chrome.runtime.sendMessage({ type: 'GET_NEXT_ALARM' }, (response) => {
      if (response?.scheduledTime) {
        setNextBreakMs(response.scheduledTime - Date.now());
      }
    });
  }, []);

  useEffect(() => {
    if (nextBreakMs === null || nextBreakMs <= 0) return;
    const id = setInterval(() => {
      setNextBreakMs((prev) => (prev !== null ? Math.max(0, prev - 1000) : null));
    }, 1000);
    return () => clearInterval(id);
  }, [nextBreakMs]);

  const handleWater = useCallback(() => {
    chrome.runtime.sendMessage({ type: 'WATER_PLANT' }, (response) => {
      if (response) {
        setPlant(response);
        const msg = PLANT_MOTIVATIONS[Math.floor(Math.random() * PLANT_MOTIVATIONS.length)];
        setMotivation(msg);
        setTimeout(() => setMotivation(null), 2000);
      }
    });
  }, []);

  if (!plant) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: COLORS.textSecondary }}>
        Loading...
      </div>
    );
  }

  const progress = progressInStage(plant.waterPoints);
  const stageLabel = STAGE_LABELS[plant.stage];

  const formatCountdown = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000);
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    const pad = (n: number) => String(n).padStart(2, '0');
    return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
  };

  return (
    <div style={{ padding: '20px', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        <h1 style={{ fontSize: '18px', fontWeight: 800, color: COLORS.primary, margin: '0 0 4px' }}>
          Breather
        </h1>
        <p style={{ fontSize: '11px', color: COLORS.textSecondary, margin: 0 }}>
          Take better breaks
        </p>
      </div>

      {/* Plant Status */}
      <div style={{
        textAlign: 'center',
        padding: '16px',
        backgroundColor: COLORS.surface,
        borderRadius: '14px',
        border: `1px solid ${COLORS.border}`,
        marginBottom: '12px',
      }}>
        <div style={{ fontSize: '48px', marginBottom: '8px' }}>
          {plant.stage === 'seed' && '🌰'}
          {plant.stage === 'sprout' && '🌱'}
          {plant.stage === 'sapling' && '🌿'}
          {plant.stage === 'tree' && '🌳'}
          {plant.stage === 'flowering' && '🌸'}
        </div>
        <div style={{ fontSize: '14px', fontWeight: 700, color: COLORS.text }}>{stageLabel}</div>
        <div style={{ fontSize: '11px', color: COLORS.textSecondary, marginTop: '2px' }}>
          {plant.waterPoints} / {PLANT_MAX_POINTS} waters
        </div>
        {/* Progress bar */}
        <div style={{
          width: '80%',
          height: '6px',
          backgroundColor: COLORS.border,
          borderRadius: '3px',
          margin: '8px auto 0',
          overflow: 'hidden',
        }}>
          <div style={{
            width: `${progress}%`,
            height: '100%',
            backgroundColor: COLORS.accent,
            borderRadius: '3px',
            transition: 'width 0.4s ease',
          }} />
        </div>

        {motivation && (
          <div style={{
            fontSize: '12px',
            fontWeight: 600,
            color: COLORS.accent,
            marginTop: '8px',
          }}>
            {motivation.icon} {motivation.text}
          </div>
        )}
      </div>

      {/* Countdown */}
      {nextBreakMs !== null && nextBreakMs > 0 && (
        <div style={{
          textAlign: 'center',
          padding: '12px',
          backgroundColor: COLORS.primaryLight,
          borderRadius: '12px',
          marginBottom: '12px',
        }}>
          <div style={{ fontSize: '10px', fontWeight: 600, color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
            Next Break
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: COLORS.primary, fontVariantNumeric: 'tabular-nums' }}>
            {formatCountdown(nextBreakMs)}
          </div>
        </div>
      )}

      {/* Water Button */}
      <button
        onClick={handleWater}
        style={{
          width: '100%',
          padding: '14px',
          borderRadius: '12px',
          border: 'none',
          backgroundColor: COLORS.accent,
          color: '#FFFFFF',
          fontSize: '14px',
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        💧 Water Plant
      </button>

      {/* Quick info */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: '12px',
        fontSize: '11px',
        color: COLORS.textSecondary,
      }}>
        <span>Last watered: {plant.lastWateredDate || 'Never'}</span>
        <span>Stage {PLANT_STAGES.findIndex((s) => s.stage === plant.stage) + 1}/5</span>
      </div>
    </div>
  );
}
