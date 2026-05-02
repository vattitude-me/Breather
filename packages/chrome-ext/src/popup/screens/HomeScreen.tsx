import { useState, useEffect, useCallback } from 'react';
import {
  Reminder, PlantState, PlantStage,
  COLORS, APP_NAME, PLANT_STAGES, PLANT_MAX_POINTS, PLANT_MOTIVATIONS, WELLNESS_TIPS,
} from '@breather/shared';
import { loadReminders, saveReminders, loadPlant, checkDecay, waterPlant } from '../../lib/storage';
import type { Screen } from '../App';

const STAGE_EMOJI: Record<PlantStage, string> = { seed: '🌰', sprout: '🌱', sapling: '🌿', tree: '🌳', flowering: '🌸' };
const STAGE_LABELS: Record<PlantStage, string> = { seed: 'Seed', sprout: 'Sprout', sapling: 'Sapling', tree: 'Tree', flowering: 'Bloom' };
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
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  return `${minutes} min`;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function getFormattedDate(): string {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

interface Props { navigate: (s: Screen) => void; }

export default function HomeScreen({ navigate }: Props) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [plant, setPlant] = useState<PlantState | null>(null);
  const [motivation, setMotivation] = useState<{ icon: string; text: string } | null>(null);
  const [isWatering, setIsWatering] = useState(false);
  const [nextBreakMs, setNextBreakMs] = useState<number | null>(null);

  useEffect(() => {
    loadReminders().then(setReminders);
    loadPlant().then(async (p) => setPlant(await checkDecay(p)));
    chrome.runtime.sendMessage({ type: 'GET_NEXT_ALARM' }, (response) => {
      if (response?.scheduledTime) setNextBreakMs(response.scheduledTime - Date.now());
    });
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setNextBreakMs((prev) => (prev !== null ? Math.max(0, prev - 1000) : null));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const handleWater = useCallback(async () => {
    const updated = await waterPlant();
    setPlant(updated);
    chrome.runtime.sendMessage({ type: 'SYNC_PLANT', plant: updated });
    setMotivation(PLANT_MOTIVATIONS[Math.floor(Math.random() * PLANT_MOTIVATIONS.length)]);
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

  const handleDelete = useCallback(async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return;
    const updated = reminders.filter((r) => r.id !== id);
    setReminders(updated);
    await saveReminders(updated);
    chrome.runtime.sendMessage({ type: 'CANCEL_REMINDER', id });
  }, [reminders]);

  const hasActiveReminders = reminders.some((r) => r.isActive);
  const hasOutsideHours = reminders.some((r) => r.isActive && !isWithinSchedule(r.schedule));
  const activeInSchedule = reminders.filter((r) => r.isActive && isWithinSchedule(r.schedule));
  const tip = WELLNESS_TIPS[Math.floor(Date.now() / (1000 * 60 * 60 * 3)) % WELLNESS_TIPS.length];

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header — matches PWA page-header */}
      <div style={{
        backgroundColor: COLORS.background,
        padding: '14px 20px',
        borderBottom: `1px solid ${COLORS.border}`,
        minHeight: '56px',
        display: 'flex',
        alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '20px' }}>🌱</span>
          <h1 style={{ color: COLORS.text, fontSize: '20px', fontWeight: 800, margin: 0 }}>{APP_NAME}</h1>
        </div>
      </div>

      {/* Content — matches PWA page-content */}
      <div style={{
        flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden',
        padding: '16px 20px', display: 'flex', flexDirection: 'column',
      }}>
        {/* Greeting */}
        <p style={{ fontSize: '13px', color: COLORS.textSecondary, margin: '0 0 14px', fontWeight: 500 }}>
          {getGreeting()} · {getFormattedDate()}
        </p>

        {/* My Routines — SAME order as PWA: routines first */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: COLORS.text, margin: 0 }}>My Break Routines</h2>
            <button onClick={() => navigate({ name: 'add-reminder' })} style={{ background: 'none', border: 'none', color: COLORS.primary, fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
              + Add New
            </button>
          </div>

          {reminders.length === 0 ? (
            <button
              onClick={() => navigate({ name: 'add-reminder' })}
              style={{
                width: '100%', backgroundColor: COLORS.primaryLight, borderRadius: '14px',
                padding: '28px', border: `2px dashed ${COLORS.primary}`,
                display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer',
              }}
            >
              <div style={{ width: '48px', height: '48px', borderRadius: '24px', backgroundColor: 'rgba(232, 97, 77, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '24px', color: COLORS.primary, fontWeight: 600 }}>+</span>
              </div>
              <span style={{ fontSize: '15px', fontWeight: 700, color: COLORS.text, marginBottom: '4px' }}>Create a break routine</span>
              <span style={{ fontSize: '13px', color: COLORS.textSecondary }}>Set reminders to stretch, move, and rest</span>
            </button>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: reminders.length <= 2 ? 'column' : 'row',
              flexWrap: reminders.length <= 2 ? 'nowrap' : 'wrap',
              gap: '10px',
            }}>
              {reminders.map((item, index) => {
                const useListLayout = reminders.length <= 2;
                const statusColor = !item.isActive ? COLORS.disabled : isWithinSchedule(item.schedule) ? '#4CAF50' : COLORS.secondary;
                const statusText = !item.isActive ? 'Paused' : isWithinSchedule(item.schedule) ? 'Active' : 'Outside hours';

                return useListLayout ? (
                  <div key={item.id} style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    backgroundColor: CARD_COLORS[index % CARD_COLORS.length],
                    borderRadius: '14px', padding: '12px 14px',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                  }}>
                    <button onClick={() => navigate({ name: 'edit-reminder', reminderId: item.id })} style={{
                      width: '42px', height: '42px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.7)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', flexShrink: 0,
                    }}>
                      <span style={{ fontSize: '20px' }}>{item.icon}</span>
                    </button>
                    <button onClick={() => navigate({ name: 'edit-reminder', reminderId: item.id })} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: COLORS.text }}>{item.title}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                        <span style={{ fontSize: '12px', color: COLORS.textSecondary }}>Every {formatInterval(item.intervalMinutes)}</span>
                        <div style={{ width: '3px', height: '3px', borderRadius: '50%', backgroundColor: COLORS.disabled }} />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <div style={{ width: '6px', height: '6px', borderRadius: '3px', backgroundColor: statusColor }} />
                          <span style={{ fontSize: '11px', color: statusColor === '#4CAF50' ? '#4CAF50' : COLORS.textSecondary, fontWeight: 500 }}>{statusText}</span>
                        </div>
                      </div>
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      <button onClick={() => handleDelete(item.id, item.title)} style={{
                        width: '32px', height: '32px', borderRadius: '10px', backgroundColor: 'rgba(239, 68, 68, 0.08)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer',
                      }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={COLORS.danger} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                      <label style={{ position: 'relative', display: 'inline-block', width: '46px', height: '28px' }}>
                        <input type="checkbox" checked={item.isActive} onChange={() => handleToggle(item.id)} style={{ opacity: 0, width: 0, height: 0 }} />
                        <span style={{ position: 'absolute', cursor: 'pointer', inset: 0, backgroundColor: item.isActive ? COLORS.primary : COLORS.disabled, borderRadius: '28px', transition: '0.3s' }}>
                          <span style={{ position: 'absolute', left: item.isActive ? '21px' : '3px', top: '3px', width: '22px', height: '22px', backgroundColor: '#FFFFFF', borderRadius: '50%', transition: '0.3s' }} />
                        </span>
                      </label>
                    </div>
                  </div>
                ) : (
                  <div key={item.id} style={{ width: 'calc(50% - 5px)' }}>
                    <div style={{
                      borderRadius: '14px', padding: '14px',
                      backgroundColor: CARD_COLORS[index % CARD_COLORS.length],
                      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <button onClick={() => navigate({ name: 'edit-reminder', reminderId: item.id })} style={{
                          width: '40px', height: '40px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.7)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer',
                        }}>
                          <span style={{ fontSize: '20px' }}>{item.icon}</span>
                        </button>
                        <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '26px' }}>
                          <input type="checkbox" checked={item.isActive} onChange={() => handleToggle(item.id)} style={{ opacity: 0, width: 0, height: 0 }} />
                          <span style={{ position: 'absolute', cursor: 'pointer', inset: 0, backgroundColor: item.isActive ? COLORS.primary : COLORS.disabled, borderRadius: '26px', transition: '0.3s' }}>
                            <span style={{ position: 'absolute', left: item.isActive ? '20px' : '3px', top: '3px', width: '20px', height: '20px', backgroundColor: '#FFFFFF', borderRadius: '50%', transition: '0.3s' }} />
                          </span>
                        </label>
                      </div>
                      <button onClick={() => navigate({ name: 'edit-reminder', reminderId: item.id })} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', width: '100%' }}>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: COLORS.text }}>{item.title}</div>
                        <div style={{ fontSize: '11px', color: COLORS.textSecondary, marginTop: '2px' }}>Every {formatInterval(item.intervalMinutes)}</div>
                      </button>
                      <div style={{ display: 'flex', alignItems: 'center', marginTop: '8px', gap: '6px' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '3px', backgroundColor: statusColor }} />
                        <span style={{ fontSize: '11px', color: COLORS.textSecondary, fontWeight: 500, flex: 1 }}>{statusText}</span>
                        <button onClick={() => handleDelete(item.id, item.title)} style={{
                          width: '28px', height: '28px', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.08)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer',
                        }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={COLORS.danger} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Virtual Plant — matches PWA exactly */}
        {plant && (
          <div
            className={isWatering ? 'water-animation' : ''}
            style={{
              position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center',
              padding: '16px', backgroundColor: COLORS.surface, borderRadius: '14px', border: `1px solid ${COLORS.border}`,
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
            <div onClick={handleWater} style={{ fontSize: '48px', marginBottom: '4px', cursor: 'pointer' }}>{STAGE_EMOJI[plant.stage]}</div>
            {motivation && (
              <div style={{ fontSize: '13px', fontWeight: 600, color: COLORS.accent, marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px', animation: 'fadeIn 0.3s ease' }}>
                <span style={{ fontSize: '16px' }}>{motivation.icon}</span>
                {motivation.text}
              </div>
            )}
            <div style={{ fontSize: '14px', fontWeight: 700, color: COLORS.text, marginTop: motivation ? '2px' : '4px' }}>{STAGE_LABELS[plant.stage]}</div>
            <div style={{ fontSize: '11px', color: COLORS.textSecondary, marginTop: '2px' }}>{plant.waterPoints} / {PLANT_MAX_POINTS} waters</div>
            {/* Stage progress bar — matches PWA */}
            <div style={{ width: '92%', marginTop: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', padding: '0 4px' }}>
                {PLANT_STAGES.map((s) => {
                  const reached = plant.waterPoints >= s.minPoints;
                  const isCurrent = plant.stage === s.stage;
                  return (
                    <div key={s.stage} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', flex: 1 }}>
                      <span style={{ fontSize: isCurrent ? '20px' : '16px', filter: reached ? 'none' : 'grayscale(1)', opacity: reached ? 1 : 0.35, transition: 'all 0.3s ease' }}>
                        {STAGE_EMOJI[s.stage]}
                      </span>
                      <span style={{ fontSize: '9px', color: isCurrent ? COLORS.accent : reached ? COLORS.textSecondary : COLORS.disabled, fontWeight: isCurrent ? 700 : 500 }}>
                        {STAGE_LABELS[s.stage]}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div style={{ height: '6px', backgroundColor: COLORS.border, borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${Math.round((plant.waterPoints / PLANT_MAX_POINTS) * 100)}%`, height: '100%', backgroundColor: COLORS.accent, borderRadius: '3px', transition: 'width 0.4s ease' }} />
              </div>
            </div>
          </div>
        )}

        {/* Countdown Widget — matches PWA */}
        {reminders.length > 0 && (
          <>
            {nextBreakMs !== null && nextBreakMs > 0 && activeInSchedule.length > 0 ? (
              <div style={{ marginTop: '16px', padding: '16px', backgroundColor: COLORS.primaryLight, borderRadius: '14px', border: `1px solid ${COLORS.border}`, textAlign: 'center' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Next Break</div>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: '2px', marginBottom: '6px' }}>
                  {(() => {
                    const totalSecs = Math.floor(nextBreakMs / 1000);
                    const h = Math.floor(totalSecs / 3600);
                    const m = Math.floor((totalSecs % 3600) / 60);
                    const s = totalSecs % 60;
                    return (
                      <>
                        {h > 0 && (<><span style={{ fontSize: '28px', fontWeight: 800, color: COLORS.primary, fontVariantNumeric: 'tabular-nums' }}>{pad(h)}</span><span style={{ fontSize: '13px', fontWeight: 600, color: COLORS.textSecondary, marginRight: '4px' }}>h</span></>)}
                        <span style={{ fontSize: '28px', fontWeight: 800, color: COLORS.primary, fontVariantNumeric: 'tabular-nums' }}>{pad(m)}</span>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: COLORS.textSecondary, marginRight: '4px' }}>m</span>
                        <span style={{ fontSize: '28px', fontWeight: 800, color: COLORS.primary, fontVariantNumeric: 'tabular-nums' }}>{pad(s)}</span>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: COLORS.textSecondary }}>s</span>
                      </>
                    );
                  })()}
                </div>
              </div>
            ) : hasActiveReminders && hasOutsideHours ? (
              <div style={{ marginTop: '16px', padding: '16px 20px', backgroundColor: COLORS.secondaryLight, borderRadius: '14px', border: `1px solid ${COLORS.border}`, textAlign: 'center' }}>
                <div style={{ fontSize: '20px', marginBottom: '6px' }}>😴</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: COLORS.text }}>Breaks paused</div>
                <div style={{ fontSize: '11px', color: COLORS.textSecondary, marginTop: '4px' }}>Your reminders are outside their scheduled hours. They will resume automatically.</div>
              </div>
            ) : !hasActiveReminders ? (
              <div style={{ marginTop: '16px', padding: '16px 20px', backgroundColor: COLORS.cardMint, borderRadius: '14px', border: `1px solid ${COLORS.border}`, textAlign: 'center' }}>
                <div style={{ fontSize: '20px', marginBottom: '6px' }}>⏸️</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: COLORS.text }}>All reminders paused</div>
                <div style={{ fontSize: '11px', color: COLORS.textSecondary, marginTop: '4px' }}>Toggle a reminder on to start getting break alerts.</div>
              </div>
            ) : null}
          </>
        )}

        {/* Tip of the Day — pushed to bottom like PWA */}
        <div style={{
          marginTop: 'auto', backgroundColor: COLORS.accentLight, borderRadius: '12px',
          padding: '14px', borderLeft: `3px solid ${COLORS.accent}`,
        }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: COLORS.accent, marginBottom: '4px' }}>Tip</div>
          <p style={{ fontSize: '12px', color: COLORS.text, lineHeight: 1.5, margin: 0 }}>{tip}</p>
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav style={{
        display: 'flex', borderTop: `1px solid ${COLORS.border}`, backgroundColor: COLORS.surface,
        padding: '8px 0 12px', flexShrink: 0,
      }}>
        <button style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', border: 'none', background: 'none', cursor: 'pointer', color: COLORS.primary }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
          <span style={{ fontSize: '10px', fontWeight: 600 }}>Home</span>
        </button>
        <button onClick={() => navigate({ name: 'progress' })} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', border: 'none', background: 'none', cursor: 'pointer', color: COLORS.textSecondary }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>
          <span style={{ fontSize: '10px', fontWeight: 500 }}>Progress</span>
        </button>
        <button onClick={() => navigate({ name: 'settings' })} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', border: 'none', background: 'none', cursor: 'pointer', color: COLORS.textSecondary }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
          <span style={{ fontSize: '10px', fontWeight: 500 }}>Settings</span>
        </button>
      </nav>
    </div>
  );
}
