import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { nanoid } from 'nanoid';
import { DayOfWeek, Reminder } from '@breather/shared/src/types';
import {
  PRESET_REMINDERS,
  BREAK_DURATION_OPTIONS,
  DAYS_OF_WEEK,
  DEFAULT_SCHEDULE,
  DEFAULT_BREAK_DURATION_SECONDS,
} from '@breather/shared/src/constants';
import { useRemindersContext } from '../context/RemindersContext';

const ICONS = ['🧘', '💧', '🚶', '👁️', '🧍', '🌬️'];
const INTERVAL_QUICK = [30, 45, 60, 90, 120];

export default function AddEditReminderScreen() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { reminders, dispatch } = useRemindersContext();
  const isEditing = Boolean(id);
  const existing = reminders.find((r) => r.id === id);

  const [title, setTitle] = useState(existing?.title || '');
  const [icon, setIcon] = useState(existing?.icon || '🧘');
  const [intervalMinutes, setIntervalMinutes] = useState(existing?.intervalMinutes || 60);
  const [breakDuration, setBreakDuration] = useState(existing?.breakDurationSeconds || DEFAULT_BREAK_DURATION_SECONDS);
  const [activeDays, setActiveDays] = useState<DayOfWeek[]>(existing?.schedule.activeDays || [...DEFAULT_SCHEDULE.activeDays]);
  const [startHour, setStartHour] = useState(existing?.schedule.startHour || DEFAULT_SCHEDULE.startHour);
  const [endHour, setEndHour] = useState(existing?.schedule.endHour || DEFAULT_SCHEDULE.endHour);
  const [showCustom, setShowCustom] = useState(isEditing);

  const handlePreset = (preset: typeof PRESET_REMINDERS[0]) => {
    const reminder: Reminder = {
      id: nanoid(),
      title: preset.title,
      icon: preset.icon,
      intervalMinutes: preset.defaultInterval,
      isActive: true,
      createdAt: new Date().toISOString(),
      snoozeDurationMinutes: 10,
      breakDurationSeconds: DEFAULT_BREAK_DURATION_SECONDS,
      schedule: { activeDays: [...DEFAULT_SCHEDULE.activeDays], startHour: DEFAULT_SCHEDULE.startHour, endHour: DEFAULT_SCHEDULE.endHour },
    };
    dispatch({ type: 'ADD', payload: reminder });
    navigate('/home');
  };

  const handleSave = () => {
    if (!title.trim()) return;
    const reminder: Reminder = {
      id: id || nanoid(),
      title: title.trim(),
      icon,
      intervalMinutes,
      isActive: existing?.isActive ?? true,
      createdAt: existing?.createdAt || new Date().toISOString(),
      snoozeDurationMinutes: 10,
      breakDurationSeconds: breakDuration,
      schedule: { activeDays, startHour, endHour },
    };
    dispatch({ type: isEditing ? 'UPDATE' : 'ADD', payload: reminder });
    navigate('/home');
  };

  const handleDelete = () => {
    if (id) {
      dispatch({ type: 'DELETE', payload: id });
      navigate('/home');
    }
  };

  const toggleDay = (day: DayOfWeek) => {
    setActiveDays((days) =>
      days.includes(day) ? days.filter((d) => d !== day) : [...days, day]
    );
  };

  const setDayPreset = (preset: 'weekdays' | 'weekends' | 'every') => {
    if (preset === 'weekdays') setActiveDays(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
    else if (preset === 'weekends') setActiveDays(['Sat', 'Sun']);
    else setActiveDays([...DAYS_OF_WEEK] as DayOfWeek[]);
  };

  return (
    <div>
      <header className="header">
        <button className="btn-icon" onClick={() => navigate('/home')}>←</button>
        <div className="header-title">
          <span>🌱</span> {isEditing ? 'Edit Reminder' : 'Add Reminder'}
        </div>
        <div className="header-actions">
          {isEditing && (
            <button className="btn-icon" onClick={handleDelete} style={{ background: '#FEE2E2' }}>🗑️</button>
          )}
          <button className="btn-icon" onClick={handleSave} style={{ background: 'var(--accent-light)' }}>✓</button>
        </div>
      </header>

      <div style={{ padding: 20 }}>
        {!isEditing && (
          <>
            <div className="section-title">Quick Start</div>
            <div className="presets-grid">
              {PRESET_REMINDERS.map((p) => (
                <div key={p.title} className="preset-card" onClick={() => handlePreset(p)}>
                  <div className="preset-icon">{p.icon}</div>
                  <div className="preset-title">{p.title}</div>
                  <div className="preset-interval">Every {p.defaultInterval}m</div>
                </div>
              ))}
            </div>

            <div className="divider">or</div>

            <button
              className="btn btn-secondary"
              onClick={() => setShowCustom(!showCustom)}
              style={{ width: '100%', marginBottom: 16 }}
            >
              {showCustom ? 'Hide custom' : 'Create custom reminder'}
            </button>
          </>
        )}

        {showCustom && (
          <>
            <div className="form-group">
              <label className="form-label">Title</label>
              <input
                className="form-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Stretch Break"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Icon</label>
              <div className="chip-group">
                {ICONS.map((ic) => (
                  <button
                    key={ic}
                    className={`chip ${icon === ic ? 'selected' : ''}`}
                    onClick={() => setIcon(ic)}
                    style={{ fontSize: 20, padding: '8px 12px' }}
                  >
                    {ic}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Interval (minutes)</label>
              <input
                className="form-input"
                type="number"
                min={1}
                max={120}
                value={intervalMinutes}
                onChange={(e) => setIntervalMinutes(Number(e.target.value))}
                style={{ marginBottom: 8 }}
              />
              <div className="chip-group">
                {INTERVAL_QUICK.map((v) => (
                  <button
                    key={v}
                    className={`chip ${intervalMinutes === v ? 'selected' : ''}`}
                    onClick={() => setIntervalMinutes(v)}
                  >
                    {v}m
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Break Duration</label>
              <div className="chip-group">
                {BREAK_DURATION_OPTIONS.map((s) => (
                  <button
                    key={s}
                    className={`chip ${breakDuration === s ? 'selected' : ''}`}
                    onClick={() => setBreakDuration(s)}
                  >
                    {s >= 60 ? `${s / 60}m` : `${s}s`}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Active Days</label>
              <div className="chip-group" style={{ marginBottom: 8 }}>
                {(DAYS_OF_WEEK as readonly string[]).map((day) => (
                  <button
                    key={day}
                    className={`chip ${activeDays.includes(day as DayOfWeek) ? 'selected' : ''}`}
                    onClick={() => toggleDay(day as DayOfWeek)}
                  >
                    {day}
                  </button>
                ))}
              </div>
              <div className="chip-group">
                <button className="chip" onClick={() => setDayPreset('weekdays')}>Weekdays</button>
                <button className="chip" onClick={() => setDayPreset('weekends')}>Weekends</button>
                <button className="chip" onClick={() => setDayPreset('every')}>Every Day</button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Active Hours</label>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>From</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <button className="btn-icon" onClick={() => setStartHour(Math.max(0, startHour - 1))}>-</button>
                    <span style={{ minWidth: 40, textAlign: 'center', fontWeight: 600 }}>{startHour}:00</span>
                    <button className="btn-icon" onClick={() => setStartHour(Math.min(23, startHour + 1))}>+</button>
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>To</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <button className="btn-icon" onClick={() => setEndHour(Math.max(startHour + 1, endHour - 1))}>-</button>
                    <span style={{ minWidth: 40, textAlign: 'center', fontWeight: 600 }}>{endHour}:00</span>
                    <button className="btn-icon" onClick={() => setEndHour(Math.min(24, endHour + 1))}>+</button>
                  </div>
                </div>
              </div>
            </div>

            <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleSave}>
              {isEditing ? 'Save Changes' : 'Create Reminder'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
