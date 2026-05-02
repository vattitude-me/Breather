import { useState, useEffect, useCallback } from 'react';
import {
  PlantState, PlantStage,
  COLORS, PLANT_STAGES, PLANT_MAX_POINTS, PLANT_MOTIVATIONS, WELLNESS_TIPS,
  stageFromPoints,
} from '@breather/shared';
import './popup.css';

const STAGE_EMOJI: Record<PlantStage, string> = {
  seed: '🌰', sprout: '🌱', sapling: '🌿', tree: '🌳', flowering: '🌸',
};

const STAGE_LABELS: Record<PlantStage, string> = {
  seed: 'Seed', sprout: 'Sprout', sapling: 'Sapling', tree: 'Tree', flowering: 'Bloom',
};

const WATER_DROPS = [
  { left: '25%', delay: '0s' },
  { left: '45%', delay: '0.15s' },
  { left: '65%', delay: '0.3s' },
  { left: '35%', delay: '0.1s' },
  { left: '55%', delay: '0.25s' },
  { left: '75%', delay: '0.05s' },
  { left: '20%', delay: '0.2s' },
];

export default function App() {
  const [plant, setPlant] = useState<PlantState | null>(null);
  const [motivation, setMotivation] = useState<{ icon: string; text: string } | null>(null);
  const [nextBreakMs, setNextBreakMs] = useState<number | null>(null);
  const [isWatering, setIsWatering] = useState(false);

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
        setIsWatering(true);
        setTimeout(() => setIsWatering(false), 1500);
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

  const stageLabel = STAGE_LABELS[plant.stage];
  const overallProgress = Math.round((plant.waterPoints / PLANT_MAX_POINTS) * 100);

  const formatCountdown = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000);
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    const pad = (n: number) => String(n).padStart(2, '0');
    return { h, m: pad(m), s: pad(s), hPad: pad(h) };
  };

  const tip = WELLNESS_TIPS[Math.floor(Date.now() / (1000 * 60 * 60 * 3)) % WELLNESS_TIPS.length];

  return (
    <div style={{ padding: '16px', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '12px' }}>
        <h1 style={{ fontSize: '18px', fontWeight: 800, color: COLORS.primary, margin: '0 0 2px' }}>
          Breather
        </h1>
        <p style={{ fontSize: '11px', color: COLORS.textSecondary, margin: 0 }}>
          Take better breaks
        </p>
      </div>

      {/* Plant Status */}
      <div
        className={isWatering ? 'water-animation' : ''}
        style={{
          position: 'relative',
          textAlign: 'center',
          padding: '14px',
          backgroundColor: COLORS.surface,
          borderRadius: '14px',
          border: `1px solid ${COLORS.border}`,
          marginBottom: '10px',
        }}
      >
        {/* Watering animation */}
        {isWatering && (
          <div className="water-drops">
            {WATER_DROPS.map((drop, i) => (
              <span
                key={i}
                className="water-drop"
                style={{ left: drop.left, top: '5%', animationDelay: drop.delay }}
              >
                💧
              </span>
            ))}
            <div className="water-splash" />
          </div>
        )}

        <div style={{ fontSize: '48px', marginBottom: '4px' }}>
          {STAGE_EMOJI[plant.stage]}
        </div>

        {/* Motivation message */}
        {motivation && (
          <div style={{
            fontSize: '12px',
            fontWeight: 600,
            color: COLORS.accent,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            marginBottom: '4px',
            animation: 'fadeIn 0.3s ease',
          }}>
            <span style={{ fontSize: '14px' }}>{motivation.icon}</span>
            {motivation.text}
          </div>
        )}

        <div style={{ fontSize: '14px', fontWeight: 700, color: COLORS.text }}>{stageLabel}</div>
        <div style={{ fontSize: '11px', color: COLORS.textSecondary, marginTop: '2px' }}>
          {plant.waterPoints} / {PLANT_MAX_POINTS} waters
        </div>

        {/* Stage progress bar with icons */}
        <div style={{ width: '92%', margin: '10px auto 0' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '5px',
            padding: '0 2px',
          }}>
            {PLANT_STAGES.map((s) => {
              const reached = plant.waterPoints >= s.minPoints;
              const isCurrent = plant.stage === s.stage;
              return (
                <div key={s.stage} style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '1px',
                  flex: 1,
                }}>
                  <span style={{
                    fontSize: isCurrent ? '18px' : '14px',
                    filter: reached ? 'none' : 'grayscale(1)',
                    opacity: reached ? 1 : 0.35,
                    transition: 'all 0.3s ease',
                  }}>
                    {STAGE_EMOJI[s.stage]}
                  </span>
                  <span style={{
                    fontSize: '8px',
                    color: isCurrent ? COLORS.accent : reached ? COLORS.textSecondary : COLORS.disabled,
                    fontWeight: isCurrent ? 700 : 500,
                  }}>
                    {STAGE_LABELS[s.stage]}
                  </span>
                </div>
              );
            })}
          </div>
          <div style={{
            height: '6px',
            backgroundColor: COLORS.border,
            borderRadius: '3px',
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${overallProgress}%`,
              height: '100%',
              backgroundColor: COLORS.accent,
              borderRadius: '3px',
              transition: 'width 0.4s ease',
            }} />
          </div>
        </div>
      </div>

      {/* Countdown */}
      {nextBreakMs !== null && nextBreakMs > 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '12px',
          backgroundColor: COLORS.primaryLight,
          borderRadius: '12px',
          marginBottom: '10px',
          border: `1px solid ${COLORS.border}`,
        }}>
          <div style={{ fontSize: '10px', fontWeight: 600, color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
            Next Break
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: '2px' }}>
            {(() => {
              const t = formatCountdown(nextBreakMs);
              return (
                <>
                  {t.h > 0 && (
                    <>
                      <span style={{ fontSize: '24px', fontWeight: 800, color: COLORS.primary, fontVariantNumeric: 'tabular-nums' }}>{t.hPad}</span>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: COLORS.textSecondary, marginRight: '3px' }}>h</span>
                    </>
                  )}
                  <span style={{ fontSize: '24px', fontWeight: 800, color: COLORS.primary, fontVariantNumeric: 'tabular-nums' }}>{t.m}</span>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: COLORS.textSecondary, marginRight: '3px' }}>m</span>
                  <span style={{ fontSize: '24px', fontWeight: 800, color: COLORS.primary, fontVariantNumeric: 'tabular-nums' }}>{t.s}</span>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: COLORS.textSecondary }}>s</span>
                </>
              );
            })()}
          </div>
        </div>
      ) : (
        <div style={{
          textAlign: 'center',
          padding: '12px',
          backgroundColor: COLORS.secondaryLight,
          borderRadius: '12px',
          marginBottom: '10px',
          border: `1px solid ${COLORS.border}`,
        }}>
          <div style={{ fontSize: '18px', marginBottom: '4px' }}>😴</div>
          <div style={{ fontSize: '12px', fontWeight: 600, color: COLORS.text }}>
            No upcoming break
          </div>
          <div style={{ fontSize: '10px', color: COLORS.textSecondary, marginTop: '2px' }}>
            Your reminders will fire on schedule.
          </div>
        </div>
      )}

      {/* Water Button */}
      <button
        onClick={handleWater}
        style={{
          width: '100%',
          padding: '12px',
          borderRadius: '12px',
          border: 'none',
          backgroundColor: COLORS.accent,
          color: '#FFFFFF',
          fontSize: '14px',
          fontWeight: 700,
          cursor: 'pointer',
          marginBottom: '10px',
        }}
      >
        💧 Water Plant
      </button>

      {/* Tip of the Day */}
      <div style={{
        backgroundColor: COLORS.accentLight,
        borderRadius: '10px',
        padding: '10px 12px',
        borderLeft: `3px solid ${COLORS.accent}`,
        marginBottom: '8px',
      }}>
        <div style={{ fontSize: '10px', fontWeight: 700, color: COLORS.accent, marginBottom: '3px' }}>Tip</div>
        <p style={{ fontSize: '10px', color: COLORS.text, lineHeight: 1.4, margin: 0 }}>
          {tip}
        </p>
      </div>

      {/* Quick info footer */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '10px',
        color: COLORS.textSecondary,
      }}>
        <span>Last watered: {plant.lastWateredDate || 'Never'}</span>
        <span>Stage {PLANT_STAGES.findIndex((s) => s.stage === plant.stage) + 1}/5</span>
      </div>
    </div>
  );
}
