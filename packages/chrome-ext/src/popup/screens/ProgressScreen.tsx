import { useState, useEffect, useCallback } from 'react';
import {
  COLORS, STORAGE_KEYS, ProgressEntry,
} from '@breather/shared';
import { loadProgress, computeStreak } from '../../lib/storage';
import type { Screen } from '../App';

interface ProgressData {
  entries: ProgressEntry[];
  currentStreak: number;
  longestStreak: number;
  totalSessions: number;
  totalMinutes: number;
}

const DEFAULT_PROGRESS: ProgressData = {
  entries: [],
  currentStreak: 0,
  longestStreak: 0,
  totalSessions: 0,
  totalMinutes: 0,
};

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

interface Props { navigate: (s: Screen) => void; }

export default function ProgressScreen({ navigate }: Props) {
  const [progress, setProgress] = useState<ProgressData>(DEFAULT_PROGRESS);

  const load = useCallback(async () => {
    const entries = await loadProgress();
    const currentStreak = computeStreak(entries);
    const totalSessions = entries.reduce((sum, e) => sum + e.sessions, 0);
    const totalMinutes = entries.reduce((sum, e) => sum + e.totalMinutes, 0);
    let longestStreak = currentStreak;
    const sorted = [...entries].filter((e) => e.completedCount > 0).sort((a, b) => a.date.localeCompare(b.date));
    let tempStreak = 1;
    for (let i = 1; i < sorted.length; i++) {
      const prev = new Date(sorted[i - 1].date).getTime();
      const curr = new Date(sorted[i].date).getTime();
      if ((curr - prev) / 86400000 === 1) {
        tempStreak++;
        if (tempStreak > longestStreak) longestStreak = tempStreak;
      } else {
        tempStreak = 1;
      }
    }
    setProgress({ entries, currentStreak, longestStreak, totalSessions, totalMinutes });
  }, []);

  useEffect(() => { load(); }, [load]);

  const todayEntry = progress.entries.find((e) => e.date === getToday());
  const thisWeekEntries = progress.entries.filter((e) => {
    const entryDate = new Date(e.date);
    const weekAgo = new Date(Date.now() - 7 * 86400000);
    return entryDate >= weekAgo;
  });
  const thisMonthEntries = progress.entries.filter((e) => {
    const entryDate = new Date(e.date);
    const now = new Date();
    return entryDate.getMonth() === now.getMonth() && entryDate.getFullYear() === now.getFullYear();
  });

  const weekBreaks = thisWeekEntries.reduce((sum, e) => sum + e.completedCount, 0);
  const weekSessions = thisWeekEntries.reduce((sum, e) => sum + e.sessions, 0);
  const weekMinutes = thisWeekEntries.reduce((sum, e) => sum + e.totalMinutes, 0);

  const monthBreaks = thisMonthEntries.reduce((sum, e) => sum + e.completedCount, 0);
  const monthSessions = thisMonthEntries.reduce((sum, e) => sum + e.sessions, 0);
  const monthMinutes = thisMonthEntries.reduce((sum, e) => sum + e.totalMinutes, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
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
          <h1 style={{ color: COLORS.text, fontSize: '20px', fontWeight: 800, margin: 0 }}>Progress</h1>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Streak + Today */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{
            flex: 1, backgroundColor: COLORS.secondaryLight, borderRadius: '16px',
            padding: '20px 12px', textAlign: 'center', border: `1px solid ${COLORS.secondary}`,
          }}>
            <div style={{ fontSize: '28px', marginBottom: '4px' }}>🔥</div>
            <div style={{ fontSize: '32px', fontWeight: 800, color: COLORS.text }}>{progress.currentStreak}</div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: COLORS.textSecondary, marginTop: '2px' }}>Day Streak</div>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{
              flex: 1, backgroundColor: COLORS.surface, borderRadius: '12px',
              padding: '12px', textAlign: 'center', border: `1px solid ${COLORS.border}`,
            }}>
              <div style={{ fontSize: '22px', fontWeight: 700, color: COLORS.primary }}>{todayEntry?.completedCount ?? 0}</div>
              <div style={{ fontSize: '10px', fontWeight: 600, color: COLORS.textSecondary, textTransform: 'uppercase' }}>Breaks today</div>
            </div>
            <div style={{
              flex: 1, backgroundColor: COLORS.surface, borderRadius: '12px',
              padding: '12px', textAlign: 'center', border: `1px solid ${COLORS.border}`,
            }}>
              <div style={{ fontSize: '22px', fontWeight: 700, color: COLORS.accent }}>{todayEntry?.totalMinutes ?? 0}<span style={{ fontSize: '12px', fontWeight: 500 }}>m</span></div>
              <div style={{ fontSize: '10px', fontWeight: 600, color: COLORS.textSecondary, textTransform: 'uppercase' }}>Focus time</div>
            </div>
          </div>
        </div>

        {/* Weekly */}
        <div style={{
          backgroundColor: COLORS.surface, borderRadius: '14px', padding: '16px',
          border: `1px solid ${COLORS.border}`,
        }}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: COLORS.text, marginBottom: '14px' }}>This Week</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', height: '80px', alignItems: 'flex-end', gap: '4px', marginBottom: '14px' }}>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
              const dayDate = new Date();
              const currentDay = dayDate.getDay();
              const diff = i - ((currentDay + 6) % 7);
              const targetDate = new Date(dayDate.getTime() + diff * 86400000);
              const dateStr = targetDate.toISOString().split('T')[0];
              const entry = progress.entries.find((e) => e.date === dateStr);
              const height = entry ? Math.min(entry.completedCount * 20, 80) : 4;
              const isToday = dateStr === getToday();

              return (
                <div key={day} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: '6px' }}>
                  <div style={{ width: '100%', maxWidth: '20px', height: '80px', display: 'flex', alignItems: 'flex-end' }}>
                    <div style={{
                      width: '100%', height: `${height}px`, minHeight: '4px',
                      backgroundColor: entry && entry.completedCount > 0 ? COLORS.primary : COLORS.border,
                      borderRadius: '4px', transition: 'height 0.3s ease',
                    }} />
                  </div>
                  <div style={{ fontSize: '10px', fontWeight: isToday ? 700 : 500, color: isToday ? COLORS.primary : COLORS.textSecondary }}>{day.charAt(0)}</div>
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-around', paddingTop: '12px', borderTop: `1px solid ${COLORS.border}` }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '16px', fontWeight: 700, color: COLORS.primary }}>{weekBreaks}</div>
              <div style={{ fontSize: '10px', color: COLORS.textSecondary, fontWeight: 500 }}>Breaks</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '16px', fontWeight: 700, color: COLORS.primary }}>{weekSessions}</div>
              <div style={{ fontSize: '10px', color: COLORS.textSecondary, fontWeight: 500 }}>Sessions</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '16px', fontWeight: 700, color: COLORS.primary }}>{weekMinutes}<span style={{ fontSize: '10px', fontWeight: 500 }}>m</span></div>
              <div style={{ fontSize: '10px', color: COLORS.textSecondary, fontWeight: 500 }}>Time</div>
            </div>
          </div>
        </div>

        {/* Monthly */}
        <div style={{
          backgroundColor: COLORS.surface, borderRadius: '14px', padding: '16px',
          border: `1px solid ${COLORS.border}`,
        }}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: COLORS.text, marginBottom: '12px' }}>This Month</div>
          <div style={{ display: 'flex', justifyContent: 'space-around' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 700, color: COLORS.primary }}>{monthBreaks}</div>
              <div style={{ fontSize: '10px', color: COLORS.textSecondary, fontWeight: 500 }}>Breaks</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 700, color: COLORS.primary }}>{monthSessions}</div>
              <div style={{ fontSize: '10px', color: COLORS.textSecondary, fontWeight: 500 }}>Sessions</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 700, color: COLORS.primary }}>{monthMinutes}<span style={{ fontSize: '12px', fontWeight: 500 }}>m</span></div>
              <div style={{ fontSize: '10px', color: COLORS.textSecondary, fontWeight: 500 }}>Time</div>
            </div>
          </div>
        </div>

        {/* Milestones */}
        <div style={{
          backgroundColor: COLORS.surface, borderRadius: '14px', padding: '16px',
          border: `1px solid ${COLORS.border}`,
        }}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: COLORS.text, marginBottom: '12px' }}>Milestones</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { label: 'First Day', earned: progress.currentStreak >= 1 },
              { label: '3-Day Streak', earned: progress.currentStreak >= 3 },
              { label: 'Week Warrior', earned: progress.currentStreak >= 7 },
              { label: '10 Sessions', earned: progress.totalSessions >= 10 },
              { label: 'Monthly Master', earned: progress.currentStreak >= 30 },
            ].map((m) => (
              <div key={m.label} style={{
                display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px',
                borderRadius: '10px', backgroundColor: m.earned ? COLORS.accentLight : '#F9F9F9',
              }}>
                <span style={{ fontSize: '16px' }}>{m.earned ? '🏆' : '🔒'}</span>
                <span style={{ fontSize: '13px', fontWeight: m.earned ? 600 : 500, color: m.earned ? COLORS.text : COLORS.disabled }}>{m.label}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '14px', paddingTop: '12px', borderTop: `1px solid ${COLORS.border}` }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '16px', fontWeight: 700, color: COLORS.secondary }}>{progress.longestStreak}</div>
              <div style={{ fontSize: '10px', color: COLORS.textSecondary, fontWeight: 500 }}>Best streak</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '16px', fontWeight: 700, color: COLORS.secondary }}>{progress.totalSessions}</div>
              <div style={{ fontSize: '10px', color: COLORS.textSecondary, fontWeight: 500 }}>All sessions</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '16px', fontWeight: 700, color: COLORS.secondary }}>{progress.totalMinutes}<span style={{ fontSize: '10px', fontWeight: 500 }}>m</span></div>
              <div style={{ fontSize: '10px', color: COLORS.textSecondary, fontWeight: 500 }}>All time</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav style={{
        display: 'flex', borderTop: `1px solid ${COLORS.border}`, backgroundColor: COLORS.surface,
        padding: '8px 0 12px', flexShrink: 0,
      }}>
        <button onClick={() => navigate({ name: 'home' })} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', border: 'none', background: 'none', cursor: 'pointer', color: COLORS.textSecondary }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
          <span style={{ fontSize: '10px', fontWeight: 500 }}>Home</span>
        </button>
        <button style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', border: 'none', background: 'none', cursor: 'pointer', color: COLORS.primary }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>
          <span style={{ fontSize: '10px', fontWeight: 600 }}>Progress</span>
        </button>
        <button onClick={() => navigate({ name: 'settings' })} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', border: 'none', background: 'none', cursor: 'pointer', color: COLORS.textSecondary }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
          <span style={{ fontSize: '10px', fontWeight: 500 }}>Settings</span>
        </button>
      </nav>
    </div>
  );
}
