import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Reminder, PlantState,
  COLORS, PLANT_STAGES, PLANT_MAX_POINTS, PLANT_MOTIVATIONS, WELLNESS_TIPS,
  PRESET_REMINDERS, PlantStage,
} from '@breather/shared';
import { loadReminders, saveReminders, loadPlant, checkDecay, waterPlant } from '../../lib/storage';
import type { Screen } from '../App';

const STAGE_EMOJI: Record<PlantStage, string> = {
  seed: '🌰', sprout: '🌱', sapling: '🌿', tree: '🌳', flowering: '🌸',
};
const STAGE_LABELS: Record<PlantStage, string> = {
  seed: 'Seed', sprout: 'Sprout', sapling: 'Sapling', tree: 'Tree', flowering: 'Bloom',
};
const CARD_COLORS = [COLORS.cardPink, COLORS.cardPeach, COLORS.cardMint, COLORS.cardLavender];

const WATER_DROPS = [
  { left: '25%', delay: '0s' }, { left: '45%', delay: '0.15s' }, { left: '65%', delay: '0.3s' },
  { left: '35%', delay: '0.1s' }, { left: '55%', delay: '0.25s' }, { left: '75%', delay: '0.05s' },
  { left: '20%', delay: '0.2s' },
];

function isWithinSchedule(schedule?: Reminder['schedule']): boolean {
  if (!schedule) return true;
  const now = new Date();
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
  const dayName = days[now.getDay()];
  const hour = now.getHours();
  if (!schedule.activeDays.includes(dayName as never)) return false;
  if (hour < schedule.startHour || hour >= schedule.endHour) return false;
  return true;
}

function formatInterval(minutes: number): string {
  if (minutes < 60) return `Every ${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `Every ${h}h ${m}m` : `Every ${h}h`;
}

interface Props { navigate: (s: Screen) => void; }

export default function HomeScreen({ navigate }: Props) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [plant, setPlant] = useState<PlantState | null>(null);
  const [motivation, setMotivation] = useState<{ icon: string; text: string } | null>(null);
  const [isWatering, setIsWatering] = useState(false);
  const [nextBreakMs, setNextBreakMs] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    loadReminders().then(setReminders);
    loadPlant().then(async (p) => {
      const updated = await checkDecay(p);
      setPlant(updated);
    });
    chrome.runtime.sendMessage({ type: 'GET_NEXT_ALARM' }, (response) => {
      if (response?.scheduledTime) setNextBreakMs(response.scheduledTime - Date.now());
    });
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setNow(Date.now());
      setNextBreakMs((prev) => (prev !== null ? Math.max(0, prev - 1000) : null));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const handleWater = useCallback(async () => {
    const updated = await waterPlant();
    setPlant(updated);
    chrome.runtime.sendMessage({ type: 'SYNC_PLANT', plant: updated });
    const msg = PLANT_MOTIVATIONS[Math.floor(Math.random() * PLANT_MOTIVATIONS.length)];
    setMotivation(msg);
    setTimeout(() => setMotivation(null), 2000);
    setIsWatering(true);
    setTimeout(() => setIsWatering(false), 1500);
  }, []);

  const handleToggle = useCallback(async (id: string) => {
    const updated = reminders.map((r) => r.id === id ? { ...r, isActive: !r.isActive } : r);
    setReminders(updated);
    await saveReminders(updated);
    const toggled = updated.find((r) => r.id === id);
    if (toggled?.isActive) {
      chrome.runtime.sendMessage({ type: 'SCHEDULE_REMINDER', reminder: toggled });
    } else {
      chrome.runtime.sendMessage({ type: 'CANCEL_REMINDER', id });
    }
  }, [reminders]);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('Delete this reminder?')) return;
    const updated = reminders.filter((r) => r.id !== id);
    setReminders(updated);
    await saveReminders(updated);
    chrome.runtime.sendMessage({ type: 'CANCEL_REMINDER', id });
  }, [reminders]);

  const activeInSchedule = reminders.filter((r) => r.isActive && isWithinSchedule(r.schedule));
  const hasActiveReminders = reminders.some((r) => r.isActive);
  const hasOutsideHours = reminders.some((r) => r.isActive && !isWithinSchedule(r.schedule));

  const tip = WELLNESS_TIPS[Math.floor(Date.now() / (1000 * 60 * 60 * 3)) % WELLNESS_TIPS.length];

  const formatCountdown = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000);
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    const pad = (n: number) => String(n).padStart(2, '0');
    return { h, m: pad(m), s: pad(s), hPad: pad(h) };
  };

  return (
    <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px', minHeight: '100%' }}>
      {/* Header */}
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '18px', fontWeight: 800, color: COLORS.primary, margin: '0 0 2px' }}>Breather</h1>
        <p style={{ fontSize: '10px', color: COLORS.textSecondary, margin: 0 }}>Take better breaks</p>
      </div>

      {/* Plant Card */}
      {plant && (
        <div
          className={isWatering ? 'water-animation' : ''}
          style={{
            position: 'relative',
            textAlign: 'center',
            padding: '12px',
            backgroundColor: COLORS.surface,
            borderRadius: '14px',
            border: `1px solid ${COLORS.border}`,
          }}
        >
          {isWatering && (
            <div className="water-drops">
              {WATER_DROPS.map((drop, i) => (
                <span key={i} className="water-drop" style={{ left: drop.left, top: '5%', animationDelay: drop.delay }}>💧</span>
              ))}
              <div className="water-splash" />
            </div>
          )}
          <div style={{ fontSize: '40px', marginBottom: '2px' }}>{STAGE_EMOJI[plant.stage]}</div>
          {motivation && (
            <div style={{ fontSize: '11px', fontWeight: 600, color: COLORS.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px', marginBottom: '2px', animation: 'fadeIn 0.3s ease' }}>
              <span style={{ fontSize: '13px' }}>{motivation.icon}</span> {motivation.text}
            </div>
          )}
          <div style={{ fontSize: '13px', fontWeight: 700, color: COLORS.text }}>{STAGE_LABELS[plant.stage]}</div>
          <div style={{ fontSize: '10px', color: COLORS.textSecondary, marginTop: '1px' }}>{plant.waterPoints} / {PLANT_MAX_POINTS} waters</div>
          {/* Stage progress */}
          <div style={{ width: '92%', margin: '8px auto 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', padding: '0 2px' }}>
              {PLANT_STAGES.map((s) => {
                const reached = plant.waterPoints >= s.minPoints;
                const isCurrent = plant.stage === s.stage;
                return (
                  <div key={s.stage} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px', flex: 1 }}>
                    <span style={{ fontSize: isCurrent ? '16px' : '12px', filter: reached ? 'none' : 'grayscale(1)', opacity: reached ? 1 : 0.35, transition: 'all 0.3s ease' }}>
                      {STAGE_EMOJI[s.stage]}
                    </span>
                    <span style={{ fontSize: '7px', color: isCurrent ? COLORS.accent : reached ? COLORS.textSecondary : COLORS.disabled, fontWeight: isCurrent ? 700 : 500 }}>
                      {STAGE_LABELS[s.stage]}
                    </span>
                  </div>
                );
              })}
            </div>
            <div style={{ height: '5px', backgroundColor: COLORS.border, borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${Math.round((plant.waterPoints / PLANT_MAX_POINTS) * 100)}%`, height: '100%', backgroundColor: COLORS.accent, borderRadius: '3px', transition: 'width 0.4s ease' }} />
            </div>
          </div>
          {/* Water button */}
          <button onClick={handleWater} style={{ marginTop: '8px', width: '100%', padding: '10px', borderRadius: '10px', border: 'none', backgroundColor: COLORS.accent, color: '#FFF', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
            💧 Water Plant
          </button>
        </div>
      )}

      {/* Countdown */}
      {reminders.length > 0 && (
        <>
          {nextBreakMs !== null && nextBreakMs > 0 && activeInSchedule.length > 0 ? (
            <div style={{ textAlign: 'center', padding: '10px', backgroundColor: COLORS.primaryLight, borderRadius: '12px', border: `1px solid ${COLORS.border}` }}>
              <div style={{ fontSize: '9px', fontWeight: 600, color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Next Break</div>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: '2px' }}>
                {(() => {
                  const t = formatCountdown(nextBreakMs);
                  return (
                    <>
                      {t.h > 0 && (<><span style={{ fontSize: '22px', fontWeight: 800, color: COLORS.primary, fontVariantNumeric: 'tabular-nums' }}>{t.hPad}</span><span style={{ fontSize: '10px', fontWeight: 600, color: COLORS.textSecondary, marginRight: '2px' }}>h</span></>)}
                      <span style={{ fontSize: '22px', fontWeight: 800, color: COLORS.primary, fontVariantNumeric: 'tabular-nums' }}>{t.m}</span>
                      <span style={{ fontSize: '10px', fontWeight: 600, color: COLORS.textSecondary, marginRight: '2px' }}>m</span>
                      <span style={{ fontSize: '22px', fontWeight: 800, color: COLORS.primary, fontVariantNumeric: 'tabular-nums' }}>{t.s}</span>
                      <span style={{ fontSize: '10px', fontWeight: 600, color: COLORS.textSecondary }}>s</span>
                    </>
                  );
                })()}
              </div>
            </div>
          ) : hasActiveReminders && hasOutsideHours ? (
            <div style={{ textAlign: 'center', padding: '10px', backgroundColor: COLORS.secondaryLight, borderRadius: '12px', border: `1px solid ${COLORS.border}` }}>
              <div style={{ fontSize: '16px', marginBottom: '2px' }}>😴</div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: COLORS.text }}>Breaks paused</div>
              <div style={{ fontSize: '9px', color: COLORS.textSecondary, marginTop: '2px' }}>Outside scheduled hours. They'll resume automatically.</div>
            </div>
          ) : !hasActiveReminders ? (
            <div style={{ textAlign: 'center', padding: '10px', backgroundColor: COLORS.cardMint, borderRadius: '12px', border: `1px solid ${COLORS.border}` }}>
              <div style={{ fontSize: '16px', marginBottom: '2px' }}>⏸️</div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: COLORS.text }}>All reminders paused</div>
              <div style={{ fontSize: '9px', color: COLORS.textSecondary, marginTop: '2px' }}>Toggle a reminder on to start getting break alerts.</div>
            </div>
          ) : null}
        </>
      )}

      {/* Reminders Section */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: COLORS.text }}>My Break Routines</span>
          <button
            onClick={() => navigate({ name: 'add-reminder' })}
            style={{ fontSize: '11px', fontWeight: 600, color: COLORS.primary, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px' }}
          >
            + Add New
          </button>
        </div>

        {reminders.length === 0 ? (
          <button
            onClick={() => navigate({ name: 'add-reminder' })}
            style={{
              width: '100%', padding: '20px', borderRadius: '12px',
              border: `2px dashed ${COLORS.border}`, background: 'none',
              cursor: 'pointer', textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '24px', marginBottom: '4px' }}>➕</div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: COLORS.textSecondary }}>Create your first break routine</div>
          </button>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {reminders.map((r, i) => {
              const withinSchedule = isWithinSchedule(r.schedule);
              const statusColor = !r.isActive ? COLORS.disabled : withinSchedule ? '#4CAF50' : COLORS.secondary;
              const statusText = !r.isActive ? 'Paused' : withinSchedule ? 'Active' : 'Outside hours';
              return (
                <div
                  key={r.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '10px', borderRadius: '12px',
                    backgroundColor: CARD_COLORS[i % CARD_COLORS.length],
                    cursor: 'pointer',
                    opacity: r.isActive ? 1 : 0.7,
                  }}
                  onClick={() => navigate({ name: 'edit-reminder', reminderId: r.id })}
                >
                  <span style={{ fontSize: '22px', flexShrink: 0 }}>{r.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: COLORS.text }}>{r.title}</div>
                    <div style={{ fontSize: '10px', color: COLORS.textSecondary }}>{formatInterval(r.intervalMinutes)}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: statusColor, flexShrink: 0 }} />
                      <span style={{ fontSize: '9px', color: statusColor, fontWeight: 600 }}>{statusText}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleToggle(r.id)}
                      style={{
                        width: '36px', height: '20px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                        backgroundColor: r.isActive ? COLORS.primary : COLORS.disabled, position: 'relative', transition: 'background 0.2s',
                      }}
                    >
                      <span style={{
                        position: 'absolute', top: '2px', width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#FFF',
                        left: r.isActive ? '18px' : '2px', transition: 'left 0.2s',
                      }} />
                    </button>
                    <button onClick={() => handleDelete(r.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', padding: '2px', color: '#DC2626' }}>
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Tip */}
      <div style={{ marginTop: 'auto', backgroundColor: COLORS.accentLight, borderRadius: '10px', padding: '8px 10px', borderLeft: `3px solid ${COLORS.accent}` }}>
        <div style={{ fontSize: '9px', fontWeight: 700, color: COLORS.accent, marginBottom: '2px' }}>Tip</div>
        <p style={{ fontSize: '9px', color: COLORS.text, lineHeight: 1.4, margin: 0 }}>{tip}</p>
      </div>
    </div>
  );
}
