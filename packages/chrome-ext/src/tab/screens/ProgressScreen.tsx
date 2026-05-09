import { useState, useEffect } from 'react';
import { ProgressData } from '@breather/shared/src/types';
import { loadProgress } from '../../lib/storage';
import { getTodayEntry, getWeekEntries, getMonthEntries } from '../../lib/progressService';

const MILESTONES = [
  { label: 'First Day', target: 1, field: 'currentStreak' as const },
  { label: '3-Day Streak', target: 3, field: 'currentStreak' as const },
  { label: 'Week Warrior', target: 7, field: 'currentStreak' as const },
  { label: '10 Sessions', target: 10, field: 'totalSessions' as const },
  { label: 'Monthly Master', target: 30, field: 'currentStreak' as const },
];

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function ProgressScreen() {
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [showWeek, setShowWeek] = useState(true);
  const [showMonth, setShowMonth] = useState(true);
  const [showMilestones, setShowMilestones] = useState(true);

  useEffect(() => {
    loadProgress().then(setProgress);
  }, []);

  if (!progress) return <div className="app-loading"><div className="spinner" /></div>;

  const today = getTodayEntry(progress);
  const weekEntries = getWeekEntries(progress);
  const monthEntries = getMonthEntries(progress);
  const maxWeek = Math.max(...weekEntries.map((e) => e.completedCount), 1);

  const monthBreaks = monthEntries.reduce((sum, e) => sum + e.completedCount, 0);
  const monthSessions = monthEntries.reduce((sum, e) => sum + e.sessions, 0);
  const monthMinutes = monthEntries.reduce((sum, e) => sum + e.totalMinutes, 0);

  const weekBreaks = weekEntries.reduce((sum, e) => sum + e.completedCount, 0);
  const weekSessions = weekEntries.reduce((sum, e) => sum + e.sessions, 0);
  const weekMinutes = weekEntries.reduce((sum, e) => sum + e.totalMinutes, 0);

  return (
    <div>
      <header className="header">
        <div className="header-title">
          <span>🌱</span> Progress
        </div>
      </header>

      <div className="section" style={{ marginTop: 16 }}>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">🔥 {progress.currentStreak}</div>
            <div className="stat-label">Day Streak</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{today?.completedCount || 0}</div>
            <div className="stat-label">Breaks Today</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{today?.totalMinutes || 0}</div>
            <div className="stat-label">Focus min</div>
          </div>
        </div>
      </div>

      {showWeek && (
        <div className="section">
          <div className="card">
            <div className="section-title">This Week</div>
            <div className="bar-chart">
              {weekEntries.map((entry, i) => {
                const height = Math.max(4, (entry.completedCount / maxWeek) * 100);
                const isToday = i === 6;
                return (
                  <div key={i} className="bar-col">
                    <div
                      className={`bar ${isToday ? 'today' : ''}`}
                      style={{ height: `${height}%` }}
                    />
                    <span className="bar-label">{DAY_LABELS[i]}</span>
                  </div>
                );
              })}
            </div>
            <div className="stats-grid" style={{ marginTop: 12 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{weekBreaks}</div>
                <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Breaks</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{weekSessions}</div>
                <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Sessions</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{weekMinutes}m</div>
                <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Minutes</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showMonth && (
        <div className="section">
          <div className="card">
            <div className="section-title">This Month</div>
            <div className="stats-grid">
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{monthBreaks}</div>
                <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Breaks</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{monthSessions}</div>
                <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Sessions</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{monthMinutes}m</div>
                <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Minutes</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showMilestones && (
        <div className="section">
          <div className="card">
            <div className="section-title">Milestones</div>
            {MILESTONES.map((m) => {
              const achieved = progress[m.field] >= m.target;
              return (
                <div key={m.label} className="milestone-row">
                  <span className="milestone-icon">{achieved ? '🏆' : '🔒'}</span>
                  <span className="milestone-text">{m.label}</span>
                  {achieved && <span className="milestone-check">✓</span>}
                </div>
              );
            })}
            <div className="milestone-row" style={{ borderBottom: 'none', marginTop: 8 }}>
              <span className="milestone-icon">⭐</span>
              <span className="milestone-text">
                Best streak: {progress.longestStreak} days - Total: {progress.totalSessions} sessions, {progress.totalMinutes}m
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
