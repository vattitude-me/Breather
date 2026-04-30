import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { STORAGE_KEYS } from '../constants';
import { ProgressData, ProgressEntry } from '../types';
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

export default function ProgressScreen() {
  const navigation = useNavigate();
  const [progress, setProgress] = useState<ProgressData>(DEFAULT_PROGRESS);
  const [activeTab, setActiveTab] = useState<'overview' | 'charts'>('overview');

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

  const streakMessage = progress.currentStreak >= 7
    ? "You're unstoppable!"
    : progress.currentStreak >= 3
      ? "Great momentum! Keep going!"
      : "Keep it up! You're on fire!";

  return (
    <div className="page">
      {/* Tabs */}
      <div className="tab-row">
        <button
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`tab ${activeTab === 'charts' ? 'active' : ''}`}
          onClick={() => setActiveTab('charts')}
        >
          Charts
        </button>
      </div>

      <div className="page-content">
        {activeTab === 'overview' ? (
          <>
            {/* Streak Card */}
            <div className="streak-card">
              <div className="streak-fire">🔥</div>
              <div className="streak-number">{progress.currentStreak}</div>
              <div className="streak-label">Day Streak</div>
              <div className="streak-message">{streakMessage}</div>
            </div>

            {/* Today's Stats */}
            <div className="today-row">
              <div className="today-card">
                <div className="today-card-icon">📋</div>
                <div className="today-card-number">{todayEntry?.sessions ?? 0}</div>
                <div className="today-card-label">Total Sessions</div>
              </div>
              <div className="today-card">
                <div className="today-card-icon">🎯</div>
                <div className="today-card-number">{todayEntry?.completedCount ?? 0}</div>
                <div className="today-card-label">Today's Focus</div>
              </div>
            </div>

            {/* This Week */}
            <div className="period-card">
              <div className="period-header">
                <span className="period-icon">📅</span>
                <span className="period-title">This Week</span>
              </div>
              <div className="period-stats-row">
                <div className="period-stat">
                  <div className="period-stat-number">{weekSessions}</div>
                  <div className="period-stat-label">Sessions</div>
                </div>
                <div className="period-stat">
                  <div className="period-stat-number">{weekBreaks}</div>
                  <div className="period-stat-label">Breaks</div>
                </div>
                <div className="period-stat">
                  <div className="period-stat-number">{weekMinutes}</div>
                  <div className="period-stat-label">Minutes</div>
                </div>
              </div>
            </div>

            {/* This Month */}
            <div className="period-card">
              <div className="period-header">
                <span className="period-icon">📆</span>
                <span className="period-title">This Month</span>
              </div>
              <div className="period-stats-row">
                <div className="period-stat">
                  <div className="period-stat-number">{monthSessions}</div>
                  <div className="period-stat-label">Sessions</div>
                </div>
                <div className="period-stat">
                  <div className="period-stat-number">{monthBreaks}</div>
                  <div className="period-stat-label">Breaks</div>
                </div>
                <div className="period-stat">
                  <div className="period-stat-number">{monthMinutes}</div>
                  <div className="period-stat-label">Minutes</div>
                </div>
              </div>
            </div>

            {/* Achievements */}
            <div className="period-card">
              <div className="period-header">
                <span className="period-icon">🏆</span>
                <span className="period-title">Achievements</span>
              </div>
              <div className="achievements-list">
                <div className="achievement-item">
                  <span className="achievement-badge">{progress.currentStreak >= 1 ? '✅' : '⬜'}</span>
                  <span className="achievement-text">First Day</span>
                </div>
                <div className="achievement-item">
                  <span className="achievement-badge">{progress.currentStreak >= 3 ? '✅' : '⬜'}</span>
                  <span className="achievement-text">3-Day Streak</span>
                </div>
                <div className="achievement-item">
                  <span className="achievement-badge">{progress.currentStreak >= 7 ? '✅' : '⬜'}</span>
                  <span className="achievement-text">Week Warrior</span>
                </div>
                <div className="achievement-item">
                  <span className="achievement-badge">{progress.totalSessions >= 10 ? '✅' : '⬜'}</span>
                  <span className="achievement-text">10 Sessions</span>
                </div>
                <div className="achievement-item">
                  <span className="achievement-badge">{progress.currentStreak >= 30 ? '✅' : '⬜'}</span>
                  <span className="achievement-text">Monthly Master</span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Weekly Activity Chart */}
            <div className="chart-card">
              <div className="chart-title">Weekly Activity</div>
              <div className="bar-chart">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
                  const dayDate = new Date();
                  const currentDay = dayDate.getDay();
                  const diff = i - ((currentDay + 6) % 7);
                  const targetDate = new Date(dayDate.getTime() + diff * 86400000);
                  const dateStr = targetDate.toISOString().split('T')[0];
                  const entry = progress.entries.find((e) => e.date === dateStr);
                  const height = entry ? Math.min(entry.completedCount * 20, 80) : 4;

                  return (
                    <div key={day} className="bar-col">
                      <div className="bar-track">
                        <div
                          className={`bar ${entry && entry.completedCount > 0 ? 'filled' : ''}`}
                          style={{ height }}
                        />
                      </div>
                      <div className="bar-label">{day.charAt(0)}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Best Streak */}
            <div className="period-card">
              <div className="period-header">
                <span className="period-icon">⭐</span>
                <span className="period-title">Personal Best</span>
              </div>
              <div className="period-stats-row">
                <div className="period-stat">
                  <div className="period-stat-number">{progress.longestStreak}</div>
                  <div className="period-stat-label">Best Streak</div>
                </div>
                <div className="period-stat">
                  <div className="period-stat-number">{progress.totalSessions}</div>
                  <div className="period-stat-label">All Sessions</div>
                </div>
                <div className="period-stat">
                  <div className="period-stat-number">{progress.totalMinutes}</div>
                  <div className="period-stat-label">All Minutes</div>
                </div>
              </div>
            </div>
          </>
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
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
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