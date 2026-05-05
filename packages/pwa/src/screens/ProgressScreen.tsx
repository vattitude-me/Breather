import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { COLORS, STORAGE_KEYS, ProgressData, ProgressEntry } from '@breather/shared';
import Logo from '../components/Logo';
import '../screens.css';

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

function calculateStreak(entries: ProgressEntry[]): number {
  if (entries.length === 0) return 0;

  const sorted = [...entries]
    .filter((e) => e.completedCount > 0)
    .sort((a, b) => b.date.localeCompare(a.date));

  if (sorted.length === 0) return 0;

  const today = getToday();
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  if (sorted[0].date !== today && sorted[0].date !== yesterday) return 0;

  let streak = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1].date);
    const curr = new Date(sorted[i].date);
    const diff = (prev.getTime() - curr.getTime()) / 86400000;
    if (diff === 1) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

type SectionKey = 'weekly' | 'monthly' | 'milestones';

const SECTION_LABELS: Record<SectionKey, string> = {
  weekly: 'This Week',
  monthly: 'This Month',
  milestones: 'Milestones',
};

const DEFAULT_SECTIONS: Record<SectionKey, boolean> = {
  weekly: true,
  monthly: true,
  milestones: true,
};

export default function ProgressScreen() {
  const navigation = useNavigate();
  const [progress, setProgress] = useState<ProgressData>(DEFAULT_PROGRESS);
  const [sections, setSections] = useState<Record<SectionKey, boolean>>(DEFAULT_SECTIONS);
  const [showCustomize, setShowCustomize] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PROGRESS_SECTIONS);
      if (saved) setSections(JSON.parse(saved));
    } catch { /* use defaults */ }
  }, []);

  const toggleSection = (key: SectionKey) => {
    setSections((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      localStorage.setItem(STORAGE_KEYS.PROGRESS_SECTIONS, JSON.stringify(updated));
      return updated;
    });
  };

  const loadProgress = useCallback(async () => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PROGRESS);
      if (data) {
        const parsed: ProgressData = JSON.parse(data);
        const streak = calculateStreak(parsed.entries);
        setProgress({ ...parsed, currentStreak: streak });
      } else {
        setProgress(DEFAULT_PROGRESS);
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  }, []);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  const todayEntry = progress.entries.find((e) => e.date === getToday());
  const thisWeekEntries = progress.entries.filter((e) => {
    const entryDate = new Date(e.date);
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 86400000);
    return entryDate >= weekAgo;
  });
  const thisMonthEntries = progress.entries.filter((e) => {
    const entryDate = new Date(e.date);
    const now = new Date();
    return entryDate.getMonth() === now.getMonth() && entryDate.getFullYear() === now.getFullYear();
  });

  const weekSessions = thisWeekEntries.reduce((sum, e) => sum + e.sessions, 0);
  const weekBreaks = thisWeekEntries.reduce((sum, e) => sum + e.completedCount, 0);
  const weekMinutes = thisWeekEntries.reduce((sum, e) => sum + e.totalMinutes, 0);

  const monthSessions = thisMonthEntries.reduce((sum, e) => sum + e.sessions, 0);
  const monthBreaks = thisMonthEntries.reduce((sum, e) => sum + e.completedCount, 0);
  const monthMinutes = thisMonthEntries.reduce((sum, e) => sum + e.totalMinutes, 0);


  return (
    <div className="page">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Logo />
            <h1>Progress</h1>
          </div>
          <button
            onClick={() => setShowCustomize((v) => !v)}
            aria-label="Customize sections"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '6px',
              color: COLORS.primary,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="21" x2="4" y2="14" />
              <line x1="4" y1="10" x2="4" y2="3" />
              <line x1="12" y1="21" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12" y2="3" />
              <line x1="20" y1="21" x2="20" y2="16" />
              <line x1="20" y1="12" x2="20" y2="3" />
              <line x1="1" y1="14" x2="7" y2="14" />
              <line x1="9" y1="8" x2="15" y2="8" />
              <line x1="17" y1="16" x2="23" y2="16" />
            </svg>
          </button>
        </div>
      </div>

      <div className="page-content" style={{ padding: '16px 20px' }}>
        {/* Customize Panel */}
        {showCustomize && (
          <div style={{
            backgroundColor: COLORS.surface,
            borderRadius: '14px',
            padding: '14px 16px',
            marginBottom: '16px',
            border: `1px solid ${COLORS.border}`,
          }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: COLORS.text, marginBottom: '10px' }}>Show sections</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(Object.keys(SECTION_LABELS) as SectionKey[]).map((key) => (
                <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    className="toggle"
                    checked={sections[key]}
                    onChange={() => toggleSection(key)}
                    aria-label={`Show ${SECTION_LABELS[key]}`}
                  />
                  <span style={{ fontSize: '14px', fontWeight: 500, color: COLORS.text }}>{SECTION_LABELS[key]}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Streak + Today */}
        <div style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '16px',
        }}>
          {/* Streak */}
          <div style={{
            flex: 1,
            backgroundColor: COLORS.secondaryLight,
            borderRadius: '16px',
            padding: '20px 12px',
            textAlign: 'center',
            border: `1px solid ${COLORS.secondary}`,
          }}>
            <div style={{ fontSize: '28px', marginBottom: '4px' }}>🔥</div>
            <div style={{ fontSize: '32px', fontWeight: 800, color: COLORS.text }}>{progress.currentStreak}</div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: COLORS.textSecondary, marginTop: '2px' }}>Day Streak</div>
          </div>

          {/* Today */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{
              flex: 1,
              backgroundColor: COLORS.surface,
              borderRadius: '12px',
              padding: '12px',
              textAlign: 'center',
              border: `1px solid ${COLORS.border}`,
            }}>
              <div style={{ fontSize: '22px', fontWeight: 700, color: COLORS.primary }}>{todayEntry?.completedCount ?? 0}</div>
              <div style={{ fontSize: '10px', fontWeight: 600, color: COLORS.textSecondary, textTransform: 'uppercase' }}>Breaks today</div>
            </div>
            <div style={{
              flex: 1,
              backgroundColor: COLORS.surface,
              borderRadius: '12px',
              padding: '12px',
              textAlign: 'center',
              border: `1px solid ${COLORS.border}`,
            }}>
              <div style={{ fontSize: '22px', fontWeight: 700, color: COLORS.accent }}>{todayEntry?.totalMinutes ?? 0}<span style={{ fontSize: '12px', fontWeight: 500 }}>m</span></div>
              <div style={{ fontSize: '10px', fontWeight: 600, color: COLORS.textSecondary, textTransform: 'uppercase' }}>Focus time</div>
            </div>
          </div>
        </div>

        {/* Weekly Activity Chart */}
        {sections.weekly && (
        <div style={{
          backgroundColor: COLORS.surface,
          borderRadius: '14px',
          padding: '16px',
          marginBottom: '16px',
          border: `1px solid ${COLORS.border}`,
        }}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: COLORS.text, marginBottom: '14px' }}>This Week</div>
          <div className="bar-chart">
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
                <div key={day} className="bar-col">
                  <div className="bar-track">
                    <div
                      className={`bar ${entry && entry.completedCount > 0 ? 'filled' : ''}`}
                      style={{ height }}
                    />
                  </div>
                  <div className="bar-label" style={isToday ? { color: COLORS.primary, fontWeight: 700 } : undefined}>{day.charAt(0)}</div>
                </div>
              );
            })}
          </div>
          {/* Week summary row */}
          <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '14px', paddingTop: '12px', borderTop: `1px solid ${COLORS.border}` }}>
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
        )}

        {/* Monthly Summary */}
        {sections.monthly && (
        <div style={{
          backgroundColor: COLORS.surface,
          borderRadius: '14px',
          padding: '16px',
          marginBottom: '16px',
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
        )}

        {/* Personal Best + Achievements */}
        {sections.milestones && (
        <div style={{
          backgroundColor: COLORS.surface,
          borderRadius: '14px',
          padding: '16px',
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
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 10px',
                borderRadius: '10px',
                backgroundColor: m.earned ? COLORS.accentLight : '#F9F9F9',
              }}>
                <span style={{ fontSize: '16px' }}>{m.earned ? '🏆' : '🔒'}</span>
                <span style={{
                  fontSize: '13px',
                  fontWeight: m.earned ? 600 : 500,
                  color: m.earned ? COLORS.text : COLORS.disabled,
                }}>{m.label}</span>
              </div>
            ))}
          </div>
          {/* Personal best row */}
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
        )}
      </div>

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        <button className="bottom-nav-item" onClick={() => navigation('/home')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <span>Home</span>
        </button>
        <button className="bottom-nav-item active" onClick={() => navigation('/progress')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 17l-2 4h14l-2-4" />
            <path d="M12 13V8" />
            <path d="M8 10c0-2.2 1.8-4 4-4s4 1.8 4 4" />
            <path d="M9 12c-1.5-1-2-3-1-4.5" />
            <path d="M15 12c1.5-1 2-3 1-4.5" />
          </svg>
          <span>Progress</span>
        </button>
        <button className="bottom-nav-item" onClick={() => navigation('/settings')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          <span>Settings</span>
        </button>
      </nav>
    </div>
  );
}