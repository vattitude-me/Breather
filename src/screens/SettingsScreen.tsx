import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRemindersContext } from '../context/RemindersContext';
import { cancelAllReminders, scheduleReminder } from '../services/notifications';
import { COLORS, SNOOZE_OPTIONS, INTERVAL_PRESETS, DAYS_OF_WEEK, DEFAULT_SCHEDULE } from '../constants';
import { DayOfWeek } from '../types';
import '../screens.css';

export default function SettingsScreen() {
  const { settings, updateSettings, reminders, dispatch } = useRemindersContext();
  const navigation = useNavigate();
  const [notificationsEnabled, setNotificationsEnabled] = useState(settings.notificationsEnabled);

  const schedule = settings.defaultSchedule || DEFAULT_SCHEDULE;

  const handleToggleNotifications = async (value: boolean) => {
    setNotificationsEnabled(value);
    updateSettings({ ...settings, notificationsEnabled: value });

    if (!value) {
      await cancelAllReminders();
      const updatedReminders = reminders.map((r) => ({
        ...r,
        isActive: false,
        notificationId: undefined,
      }));
      updatedReminders.forEach((r) => dispatch({ type: 'UPDATE', payload: r }));
    } else {
      for (const reminder of reminders) {
        if (reminder.isActive) {
          try {
            const notificationId = await scheduleReminder(reminder);
            dispatch({ type: 'UPDATE', payload: { ...reminder, notificationId } });
          } catch (e) {
            console.error('Failed to schedule reminder:', e);
          }
        }
      }
    }
  };

  const handleDefaultInterval = (minutes: number) => {
    updateSettings({ ...settings, defaultIntervalMinutes: minutes });
  };

  const handleDefaultSnooze = (minutes: number) => {
    updateSettings({ ...settings, defaultSnoozeDurationMinutes: minutes });
  };

  const toggleDefaultDay = (day: DayOfWeek) => {
    const currentDays = schedule.activeDays as DayOfWeek[];
    const newDays = currentDays.includes(day)
      ? currentDays.filter((d) => d !== day)
      : [...currentDays, day];
    updateSettings({
      ...settings,
      defaultSchedule: { ...schedule, activeDays: newDays },
    });
  };

  const setDefaultStartHour = (hour: number) => {
    updateSettings({
      ...settings,
      defaultSchedule: { ...schedule, startHour: hour },
    });
  };

  const setDefaultEndHour = (hour: number) => {
    updateSettings({
      ...settings,
      defaultSchedule: { ...schedule, endHour: hour },
    });
  };

  const formatHour = (hour: number): string => {
    if (hour === 0) return '12 AM';
    if (hour === 12) return '12 PM';
    if (hour < 12) return `${hour} AM`;
    return `${hour - 12} PM`;
  };

  const handleResetAll = async () => {
    if (!window.confirm('This will delete all your reminders. This action cannot be undone.')) return;

    await cancelAllReminders();
    reminders.forEach((r) => dispatch({ type: 'DELETE', payload: r.id }));
  };

  return (
    <div className="page">
      <div className="page-header" style={{ padding: '16px 24px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
          Settings
        </h1>
      </div>

      <div className="page-content">
        {/* Notifications */}
        <div className="settings-section">
          <h2 className="settings-section-title">Notifications</h2>
          <div className="settings-row">
            <div style={{ flex: 1 }}>
              <div className="settings-row-label">Enable Notifications</div>
              <div className="settings-row-description">Turn off to pause all reminders</div>
            </div>
            <label style={{ position: 'relative', display: 'inline-block', width: '51px', height: '31px' }}>
              <input
                type="checkbox"
                checked={notificationsEnabled}
                onChange={(e) => handleToggleNotifications(e.target.checked)}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span style={{
                position: 'absolute',
                cursor: 'pointer',
                inset: 0,
                backgroundColor: notificationsEnabled ? COLORS.primary : COLORS.disabled,
                borderRadius: '31px',
                transition: '0.3s',
              }}>
                <span style={{
                  position: 'absolute',
                  left: notificationsEnabled ? '23px' : '3px',
                  top: '3px',
                  width: '25px',
                  height: '25px',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '50%',
                  transition: '0.3s',
                }} />
              </span>
            </label>
          </div>
        </div>

        {/* Default Interval */}
        <div className="settings-section">
          <h2 className="settings-section-title">Default Interval</h2>
          <p className="settings-section-description">Used when creating new reminders</p>
          <div className="chips-row">
            {INTERVAL_PRESETS.map((minutes) => (
              <button
                key={minutes}
                className={`chip ${settings.defaultIntervalMinutes === minutes ? 'active' : ''}`}
                onClick={() => handleDefaultInterval(minutes)}
              >
                {minutes >= 60 ? `${minutes / 60}h` : `${minutes}m`}
              </button>
            ))}
          </div>
        </div>

        {/* Default Snooze Duration */}
        <div className="settings-section">
          <h2 className="settings-section-title">Default Snooze Duration</h2>
          <p className="settings-section-description">How long to snooze when you tap Snooze</p>
          <div className="chips-row">
            {SNOOZE_OPTIONS.map((minutes) => (
              <button
                key={minutes}
                className={`chip ${settings.defaultSnoozeDurationMinutes === minutes ? 'active' : ''}`}
                onClick={() => handleDefaultSnooze(minutes)}
              >
                {minutes}m
              </button>
            ))}
          </div>
        </div>

        {/* Default Schedule */}
        <div className="settings-section">
          <h2 className="settings-section-title">Default Schedule</h2>
          <p className="settings-section-description">Default active days and hours for new reminders</p>

          <span className="sub-label">Active Days</span>
          <div className="days-row">
            {DAYS_OF_WEEK.map((day) => (
              <button
                key={day}
                className={`day-chip ${(schedule.activeDays as readonly string[]).includes(day) ? 'active' : ''}`}
                onClick={() => toggleDefaultDay(day as DayOfWeek)}
              >
                {day}
              </button>
            ))}
          </div>

          <span className="sub-label">Active Hours</span>
          <div className="time-range-container">
            <div className="time-picker-group">
              <span className="time-label">From</span>
              <div className="time-control">
                <button
                  className="time-arrow"
                  onClick={() => setDefaultStartHour(Math.max(0, schedule.startHour - 1))}
                >
                  −
                </button>
                <span className="time-value">{formatHour(schedule.startHour)}</span>
                <button
                  className="time-arrow"
                  onClick={() => setDefaultStartHour(Math.min(schedule.endHour - 1, schedule.startHour + 1))}
                >
                  +
                </button>
              </div>
            </div>

            <span className="time-separator">→</span>

            <div className="time-picker-group">
              <span className="time-label">To</span>
              <div className="time-control">
                <button
                  className="time-arrow"
                  onClick={() => setDefaultEndHour(Math.max(schedule.startHour + 1, schedule.endHour - 1))}
                >
                  −
                </button>
                <span className="time-value">{formatHour(schedule.endHour)}</span>
                <button
                  className="time-arrow"
                  onClick={() => setDefaultEndHour(Math.min(23, schedule.endHour + 1))}
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Data */}
        <div className="settings-section">
          <h2 className="settings-section-title">Data</h2>
          <button className="btn btn-danger" onClick={handleResetAll}>
            Reset All Reminders
          </button>
        </div>

        {/* About */}
        <div className="settings-section">
          <h2 className="settings-section-title">About</h2>
          <div className="about-card">
            <div className="about-app-name">Breakly</div>
            <div className="about-version">Version 1.0.0</div>
            <div className="about-divider" />
            <p className="about-description">
              Breakly helps you build healthier work habits by reminding you to stretch, hydrate, move, and rest your eyes throughout the day.
            </p>
            <p className="about-description">
              Designed for professionals who spend long hours at their desk. Small breaks, big impact.
            </p>
            <div className="about-divider" />
            <div className="about-footer">Made with care for your wellbeing.</div>
          </div>
        </div>
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
        <button className="bottom-nav-item" onClick={() => navigation('/progress')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
          <span>Progress</span>
        </button>
        <button className="bottom-nav-item active" onClick={() => navigation('/settings')}>
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