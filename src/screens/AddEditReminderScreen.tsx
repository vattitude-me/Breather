import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { nanoid } from 'nanoid';
import { useRemindersContext } from '../context/RemindersContext';
import { scheduleReminder, cancelReminder } from '../services/notifications';
import { PRESET_REMINDERS, DAYS_OF_WEEK, DEFAULT_SCHEDULE } from '../constants';
import { Reminder, DayOfWeek } from '../types';
import '../screens.css';

export default function AddEditReminderScreen() {
  const navigation = useNavigate();
  const { reminderId } = useParams<{ reminderId: string }>();
  const location = useLocation();
  const { reminders, settings, dispatch } = useRemindersContext();

  // Determine mode from URL path
  const isEditing = location.pathname.startsWith('/edit-reminder');
  const existingReminder = isEditing && reminderId 
    ? reminders.find((r) => r.id === reminderId) 
    : undefined;

  const [title, setTitle] = useState(existingReminder?.title || '');
  const [intervalMinutes, setIntervalMinutes] = useState(
    existingReminder?.intervalMinutes || settings.defaultIntervalMinutes
  );
  const [intervalUnit, setIntervalUnit] = useState<'minutes' | 'hours'>(
    (existingReminder?.intervalMinutes || settings.defaultIntervalMinutes) >= 60
      ? 'hours'
      : 'minutes'
  );
  const [intervalValue, setIntervalValue] = useState(
    (existingReminder?.intervalMinutes || settings.defaultIntervalMinutes) >= 60
      ? String(Math.floor((existingReminder?.intervalMinutes || settings.defaultIntervalMinutes) / 60))
      : String(existingReminder?.intervalMinutes || settings.defaultIntervalMinutes)
  );
  const [icon, setIcon] = useState(existingReminder?.icon || '🧘');
  const [showCustom, setShowCustom] = useState(isEditing);
  const [activeDays, setActiveDays] = useState<DayOfWeek[]>(
    existingReminder?.schedule?.activeDays || settings.defaultSchedule?.activeDays || DEFAULT_SCHEDULE.activeDays as unknown as DayOfWeek[]
  );
  const [startHour, setStartHour] = useState(
    existingReminder?.schedule?.startHour ?? settings.defaultSchedule?.startHour ?? DEFAULT_SCHEDULE.startHour
  );
  const [endHour, setEndHour] = useState(
    existingReminder?.schedule?.endHour ?? settings.defaultSchedule?.endHour ?? DEFAULT_SCHEDULE.endHour
  );

  useEffect(() => {
    const numValue = parseInt(intervalValue) || 0;
    setIntervalMinutes(intervalUnit === 'hours' ? numValue * 60 : numValue);
  }, [intervalValue, intervalUnit]);

  const toggleDay = (day: DayOfWeek) => {
    setActiveDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const formatHour = (hour: number): string => {
    if (hour === 0) return '12 AM';
    if (hour === 12) return '12 PM';
    if (hour < 12) return `${hour} AM`;
    return `${hour - 12} PM`;
  };

  const handleQuickStart = async (preset: typeof PRESET_REMINDERS[0]) => {
    const reminder: Reminder = {
      id: nanoid(),
      title: preset.title,
      intervalMinutes: preset.defaultInterval,
      isActive: true,
      snoozeDurationMinutes: settings.defaultSnoozeDurationMinutes,
      icon: preset.icon,
      createdAt: new Date().toISOString(),
      schedule: settings.defaultSchedule || DEFAULT_SCHEDULE as any,
    };

    try {
      const notificationId = await scheduleReminder(reminder);
      reminder.notificationId = notificationId;
    } catch (e) {
      console.error('Failed to schedule reminder:', e);
    }

    dispatch({ type: 'ADD', payload: reminder });
    navigation('/home');
  };

  const handleIntervalPreset = (minutes: number) => {
    if (minutes >= 60) {
      setIntervalUnit('hours');
      setIntervalValue(String(minutes / 60));
    } else {
      setIntervalUnit('minutes');
      setIntervalValue(String(minutes));
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      alert('Please enter a reminder title.');
      return;
    }
    if (intervalMinutes < 15) {
      alert('Interval must be at least 15 minutes.');
      return;
    }
    if (activeDays.length === 0) {
      alert('Please select at least one active day.');
      return;
    }

    const reminder: Reminder = {
      id: existingReminder?.id || nanoid(),
      title: title.trim(),
      intervalMinutes,
      isActive: true,
      snoozeDurationMinutes: settings.defaultSnoozeDurationMinutes,
      icon,
      createdAt: existingReminder?.createdAt || new Date().toISOString(),
      schedule: {
        activeDays,
        startHour,
        endHour,
      },
    };

    try {
      if (existingReminder?.notificationId) {
        await cancelReminder(existingReminder.notificationId);
      }
      const notificationId = await scheduleReminder(reminder);
      reminder.notificationId = notificationId;
    } catch (e) {
      console.error('Failed to schedule reminder:', e);
    }

    dispatch({
      type: isEditing ? 'UPDATE' : 'ADD',
      payload: reminder,
    });

    navigation('/home');
  };

  const handleDelete = async () => {
    if (!existingReminder) return;

    if (!window.confirm(`Delete "${existingReminder.title}"?`)) return;

    try {
      if (existingReminder.notificationId) {
        await cancelReminder(existingReminder.notificationId);
      }
    } catch (e) {
      console.error('Failed to cancel reminder:', e);
    }
    dispatch({ type: 'DELETE', payload: existingReminder.id });
    navigation('/home');
  };

  return (
    <div className="page">
      <div className="page-header" style={{ padding: '14px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => navigation(-1)}
              className="page-header-back"
              style={{ marginBottom: 0 }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1A1A2E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1A1A2E', margin: 0 }}>
              {isEditing ? 'Edit Reminder' : 'Add Reminder'}
            </h1>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {isEditing && (
              <button
                onClick={handleDelete}
                className="page-header-back"
                style={{ marginBottom: 0 }}
                title="Delete Reminder"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
            )}
            <button
              onClick={handleSave}
              className="page-header-back"
              style={{ marginBottom: 0 }}
              title={isEditing ? 'Update Reminder' : 'Create Reminder'}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D4503C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="page-content">
        {/* Quick Start - only show when creating new */}
        {!isEditing && (
          <div className="settings-section">
            <h2 className="hero-title">Quick Start</h2>
            <p className="hero-subtitle">Tap a preset to instantly create a reminder</p>
            <div className="presets-grid">
              {PRESET_REMINDERS.map((preset) => (
                <button
                  key={preset.title}
                  className="preset-card"
                  onClick={() => handleQuickStart(preset)}
                >
                  <div className="preset-card-icon">{preset.icon}</div>
                  <div className="preset-card-title">{preset.title}</div>
                  <div className="preset-card-interval">
                    Every {preset.defaultInterval >= 60
                      ? `${preset.defaultInterval / 60}h`
                      : `${preset.defaultInterval}m`}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Custom / Edit Section */}
        {!isEditing && !showCustom && (
          <>
            <div className="divider-section">
              <div className="divider-line" />
              <span className="divider-text">or</span>
              <div className="divider-line" />
            </div>

            <button
              className="custom-toggle"
              onClick={() => setShowCustom(true)}
            >
              <span className="custom-toggle-text">Create Custom Reminder</span>
              <span className="custom-toggle-arrow">›</span>
            </button>
          </>
        )}

        {(showCustom || isEditing) && (
          <>
            {!isEditing && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1A1A2E', margin: 0 }}>Custom Reminder</h2>
                <button
                  className="collapse-text"
                  onClick={() => setShowCustom(false)}
                >
                  Hide
                </button>
              </div>
            )}

            {/* Title */}
            <div className="settings-card">
              <div className="settings-card-header">
                <span className="settings-card-label">Title</span>
              </div>
              <input
                type="text"
                className="form-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What do you want to be reminded about?"
              />
            </div>

            {/* Icon */}
            <div className="settings-card">
              <div className="settings-card-header">
                <span className="settings-card-label">Icon</span>
              </div>
              <div className="icon-row">
                {PRESET_REMINDERS.map((p) => (
                  <button
                    key={p.icon}
                    className={`icon-btn ${icon === p.icon ? 'active' : ''}`}
                    onClick={() => setIcon(p.icon)}
                  >
                    <span className="icon-text">{p.icon}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Interval */}
            <div className="settings-card">
              <div className="settings-card-header">
                <span className="settings-card-label">Remind me every</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                <input
                  type="text"
                  className="form-input"
                  value={intervalValue}
                  onChange={(e) => setIntervalValue(e.target.value.replace(/\D/g, ''))}
                  placeholder="30"
                  style={{ flex: 1 }}
                />
                <div style={{ display: 'flex', borderRadius: '12px', overflow: 'hidden', border: '1px solid #F0E6E0' }}>
                  <button
                    className={`chip ${intervalUnit === 'minutes' ? 'active' : ''}`}
                    onClick={() => setIntervalUnit('minutes')}
                    style={{ borderRadius: 0, padding: '10px 18px' }}
                  >
                    Min
                  </button>
                  <button
                    className={`chip ${intervalUnit === 'hours' ? 'active' : ''}`}
                    onClick={() => setIntervalUnit('hours')}
                    style={{ borderRadius: 0, padding: '10px 18px' }}
                  >
                    Hours
                  </button>
                </div>
              </div>
              <div className="chips-row">
                {[30, 45, 60, 90, 120].map((minutes) => (
                  <button
                    key={minutes}
                    className={`chip ${intervalMinutes === minutes ? 'active' : ''}`}
                    onClick={() => handleIntervalPreset(minutes)}
                  >
                    {minutes >= 60 ? `${minutes / 60}h` : `${minutes}m`}
                  </button>
                ))}
              </div>
            </div>

            {/* Schedule - Days */}
            <div className="settings-card">
              <div className="settings-card-header">
                <span className="settings-card-label">Active Days</span>
              </div>
              <div className="days-row" style={{ marginBottom: '12px' }}>
                {DAYS_OF_WEEK.map((day) => (
                  <button
                    key={day}
                    className={`day-chip ${activeDays.includes(day as DayOfWeek) ? 'active' : ''}`}
                    onClick={() => toggleDay(day as DayOfWeek)}
                  >
                    {day}
                  </button>
                ))}
              </div>
              <div className="day-shortcuts">
                <button
                  className="shortcut-btn"
                  onClick={() => setActiveDays(['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] as DayOfWeek[])}
                >
                  Weekdays
                </button>
                <button
                  className="shortcut-btn"
                  onClick={() => setActiveDays(['Sat', 'Sun'] as DayOfWeek[])}
                >
                  Weekends
                </button>
                <button
                  className="shortcut-btn"
                  onClick={() => setActiveDays(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as DayOfWeek[])}
                >
                  Every Day
                </button>
              </div>
            </div>

            {/* Schedule - Time Range */}
            <div className="settings-card">
              <div className="settings-card-header">
                <span className="settings-card-label">Active Hours</span>
              </div>
              <div className="time-range-container">
                <div className="time-picker-group">
                  <span className="time-label">From</span>
                  <div className="time-control">
                    <button
                      className="time-arrow"
                      onClick={() => setStartHour((h) => Math.max(7, h - 1))}
                    >
                      −
                    </button>
                    <span className="time-value">{formatHour(startHour)}</span>
                    <button
                      className="time-arrow"
                      onClick={() => setStartHour((h) => Math.min(endHour - 1, h + 1))}
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
                      onClick={() => setEndHour((h) => Math.max(startHour + 1, h - 1))}
                    >
                      −
                    </button>
                    <span className="time-value">{formatHour(endHour)}</span>
                    <button
                      className="time-arrow"
                      onClick={() => setEndHour((h) => Math.min(19, h + 1))}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
              <p className="time-hint">
                Reminders will only fire between {formatHour(startHour)} and {formatHour(endHour)}
              </p>
            </div>

          </>
        )}
      </div>
    </div>
  );
}