import { useState, useEffect } from 'react';
import {
  Reminder, DayOfWeek,
  COLORS, PRESET_REMINDERS, DAYS_OF_WEEK, DEFAULT_SCHEDULE, DEFAULT_SETTINGS,
} from '@breather/shared';
import { loadReminders, saveReminders } from '../../lib/storage';
import type { Screen } from '../App';

interface Props { navigate: (s: Screen) => void; }

export default function AddReminderScreen({ navigate }: Props) {
  const [title, setTitle] = useState('');
  const [intervalMinutes, setIntervalMinutes] = useState(DEFAULT_SETTINGS.defaultIntervalMinutes);
  const [intervalUnit, setIntervalUnit] = useState<'minutes' | 'hours'>('minutes');
  const [intervalValue, setIntervalValue] = useState(String(DEFAULT_SETTINGS.defaultIntervalMinutes));
  const [icon, setIcon] = useState('🧘');
  const [showCustom, setShowCustom] = useState(false);
  const [activeDays, setActiveDays] = useState<DayOfWeek[]>([...DEFAULT_SCHEDULE.activeDays]);
  const [startHour, setStartHour] = useState(DEFAULT_SCHEDULE.startHour);
  const [endHour, setEndHour] = useState(DEFAULT_SCHEDULE.endHour);
  const [errors, setErrors] = useState<{ title?: string; interval?: string; days?: string }>({});

  useEffect(() => {
    const numValue = parseInt(intervalValue) || 0;
    setIntervalMinutes(intervalUnit === 'hours' ? numValue * 60 : numValue);
  }, [intervalValue, intervalUnit]);

  const toggleDay = (day: DayOfWeek) => {
    setActiveDays((prev) => prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]);
  };

  const formatHour = (h: number) => {
    if (h === 0) return '12 AM'; if (h === 12) return '12 PM';
    return h < 12 ? `${h} AM` : `${h - 12} PM`;
  };

  const handleIntervalPreset = (minutes: number) => {
    if (minutes >= 60) { setIntervalUnit('hours'); setIntervalValue(String(minutes / 60)); }
    else { setIntervalUnit('minutes'); setIntervalValue(String(minutes)); }
  };

  const createReminder = async (r: Omit<Reminder, 'id' | 'createdAt' | 'notificationId'>) => {
    const reminder: Reminder = { ...r, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    const existing = await loadReminders();
    existing.push(reminder);
    await saveReminders(existing);
    chrome.runtime.sendMessage({ type: 'SCHEDULE_REMINDER', reminder });
    navigate({ name: 'home' });
  };

  const handleQuickStart = (preset: typeof PRESET_REMINDERS[0]) => {
    createReminder({
      title: preset.title, icon: preset.icon, intervalMinutes: preset.defaultInterval,
      isActive: true, snoozeDurationMinutes: 10,
      schedule: { activeDays: [...DEFAULT_SCHEDULE.activeDays], startHour: DEFAULT_SCHEDULE.startHour, endHour: DEFAULT_SCHEDULE.endHour },
    });
  };

  const handleSave = () => {
    const newErrors: typeof errors = {};
    if (!title.trim()) newErrors.title = 'Please enter a reminder title';
    if (intervalMinutes < 1) newErrors.interval = 'Minimum interval is 1 minute';
    if (activeDays.length === 0) newErrors.days = 'Select at least one day';
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    setErrors({});
    createReminder({
      title: title.trim(), icon, intervalMinutes, isActive: true, snoozeDurationMinutes: 10,
      schedule: { activeDays, startHour, endHour },
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header — matches PWA */}
      <div style={{
        backgroundColor: COLORS.background, padding: '14px 20px', borderBottom: `1px solid ${COLORS.border}`,
        minHeight: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={() => navigate({ name: 'home' })} className="page-header-back">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1A1A2E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <span style={{ fontSize: '20px' }}>🌱</span>
          <h1 style={{ color: COLORS.text, fontSize: '20px', fontWeight: 800, margin: 0 }}>Add Reminder</h1>
        </div>
        <button onClick={handleSave} style={{
          width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#D4503C',
          border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </button>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column' }}>
        {/* Quick Start */}
        {!showCustom && (
          <div className="settings-section">
            <h2 className="hero-title">Quick Start</h2>
            <p className="hero-subtitle">Tap a preset to instantly create a reminder</p>
            <div className="presets-grid">
              {PRESET_REMINDERS.map((preset) => (
                <button key={preset.title} className="preset-card" onClick={() => handleQuickStart(preset)}>
                  <div className="preset-card-icon">{preset.icon}</div>
                  <div className="preset-card-title">{preset.title}</div>
                  <div className="preset-card-interval">Every {preset.defaultInterval >= 60 ? `${preset.defaultInterval / 60}h` : `${preset.defaultInterval}m`}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {!showCustom && (
          <>
            <div className="divider-section"><div className="divider-line" /><span className="divider-text">or</span><div className="divider-line" /></div>
            <button className="custom-toggle" onClick={() => setShowCustom(true)}>
              <span className="custom-toggle-text">Create Custom Reminder</span>
              <span className="custom-toggle-arrow">›</span>
            </button>
          </>
        )}

        {showCustom && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1A1A2E', margin: 0 }}>Custom Reminder</h2>
              <button className="collapse-text" onClick={() => setShowCustom(false)}>Hide</button>
            </div>

            {/* Title */}
            <div className="settings-card">
              <div className="settings-card-header"><label className="settings-card-label">Title</label></div>
              <input className="form-input" value={title} onChange={(e) => { setTitle(e.target.value); setErrors((p) => ({ ...p, title: undefined })); }}
                placeholder="What do you want to be reminded about?" style={errors.title ? { borderColor: '#DC2626' } : undefined} />
              {errors.title && <p style={{ fontSize: '12px', color: '#DC2626', margin: '6px 0 0', fontWeight: 500 }}>{errors.title}</p>}
            </div>

            {/* Icon */}
            <div className="settings-card">
              <div className="settings-card-header"><span className="settings-card-label">Icon</span></div>
              <div className="icon-row">
                {PRESET_REMINDERS.map((p) => (
                  <button key={p.icon} className={`icon-btn ${icon === p.icon ? 'active' : ''}`} onClick={() => setIcon(p.icon)}>
                    <span className="icon-text">{p.icon}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Interval */}
            <div className="settings-card">
              <div className="settings-card-header"><label className="settings-card-label">Remind me every</label></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                <input className="form-input" value={intervalValue}
                  onChange={(e) => { setIntervalValue(e.target.value.replace(/\D/g, '')); setErrors((p) => ({ ...p, interval: undefined })); }}
                  placeholder="30" inputMode="numeric"
                  style={{ flex: 1, ...(errors.interval ? { borderColor: '#DC2626' } : {}) }} />
                <div style={{ display: 'flex', borderRadius: '12px', overflow: 'hidden', border: '1px solid #F0E6E0' }}>
                  <button className={`chip ${intervalUnit === 'minutes' ? 'active' : ''}`} onClick={() => setIntervalUnit('minutes')} style={{ borderRadius: 0, padding: '10px 18px' }}>Min</button>
                  <button className={`chip ${intervalUnit === 'hours' ? 'active' : ''}`} onClick={() => setIntervalUnit('hours')} style={{ borderRadius: 0, padding: '10px 18px' }}>Hours</button>
                </div>
              </div>
              {errors.interval && <p style={{ fontSize: '12px', color: '#DC2626', margin: '0 0 10px', fontWeight: 500 }}>{errors.interval}</p>}
              <div className="chips-row">
                {[30, 45, 60, 90, 120].map((m) => (
                  <button key={m} className={`chip ${intervalMinutes === m ? 'active' : ''}`} onClick={() => handleIntervalPreset(m)}>
                    {m >= 60 ? `${m / 60}h` : `${m}m`}
                  </button>
                ))}
              </div>
            </div>

            {/* Days */}
            <div className="settings-card">
              <div className="settings-card-header"><span className="settings-card-label">Active Days</span></div>
              <div className="days-row">
                {DAYS_OF_WEEK.map((day) => (
                  <button key={day} className={`day-chip ${activeDays.includes(day) ? 'active' : ''}`}
                    onClick={() => { toggleDay(day); setErrors((p) => ({ ...p, days: undefined })); }}>
                    {day}
                  </button>
                ))}
              </div>
              {errors.days && <p style={{ fontSize: '12px', color: '#DC2626', margin: '0 0 10px', fontWeight: 500 }}>{errors.days}</p>}
              <div className="day-shortcuts">
                <button className="shortcut-btn" onClick={() => setActiveDays(['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] as DayOfWeek[])}>Weekdays</button>
                <button className="shortcut-btn" onClick={() => setActiveDays(['Sat', 'Sun'] as DayOfWeek[])}>Weekends</button>
                <button className="shortcut-btn" onClick={() => setActiveDays(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as DayOfWeek[])}>Every Day</button>
              </div>
            </div>

            {/* Time Range */}
            <div className="settings-card" style={{ marginBottom: '16px' }}>
              <div className="settings-card-header"><span className="settings-card-label">Active Hours</span></div>
              <div className="time-range-container">
                <div className="time-picker-group">
                  <span className="time-label">From</span>
                  <div className="time-control">
                    <button className="time-arrow" onClick={() => setStartHour((h) => Math.max(0, h - 1))}>−</button>
                    <span className="time-value">{formatHour(startHour)}</span>
                    <button className="time-arrow" onClick={() => setStartHour((h) => Math.min(endHour - 1, h + 1))}>+</button>
                  </div>
                </div>
                <span className="time-separator">→</span>
                <div className="time-picker-group">
                  <span className="time-label">To</span>
                  <div className="time-control">
                    <button className="time-arrow" onClick={() => setEndHour((h) => Math.max(startHour + 1, h - 1))}>−</button>
                    <span className="time-value">{formatHour(endHour)}</span>
                    <button className="time-arrow" onClick={() => setEndHour((h) => Math.min(23, h + 1))}>+</button>
                  </div>
                </div>
              </div>
              <p className="time-hint">Reminders will only fire between {formatHour(startHour)} and {formatHour(endHour)}</p>
            </div>

            <button onClick={handleSave} className="btn btn-primary" style={{ marginTop: '8px' }}>Create Reminder</button>
          </>
        )}
      </div>
    </div>
  );
}
