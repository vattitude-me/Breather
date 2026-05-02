import { useState, useEffect } from 'react';
import {
  Reminder, DayOfWeek,
  COLORS, PRESET_REMINDERS, DAYS_OF_WEEK, DEFAULT_SCHEDULE, DEFAULT_SETTINGS,
} from '@breather/shared';
import { loadReminders, saveReminders } from '../../lib/storage';
import Logo from '../components/Logo';
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
    if (!title.trim()) newErrors.title = 'Enter a title';
    if (intervalMinutes < 1) newErrors.interval = 'Min 1 minute';
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
      {/* Header */}
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
          <Logo />
          <h1 style={{ color: COLORS.text, fontSize: '20px', fontWeight: 800, margin: 0 }}>Add</h1>
        </div>
        {showCustom && (
          <button onClick={handleSave} style={{
            width: '36px', height: '36px', borderRadius: '10px', backgroundColor: COLORS.primary,
            border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </button>
        )}
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column' }}>
        {/* Quick Start */}
        {!showCustom && (
          <>
            <p style={{ fontSize: '13px', color: COLORS.textSecondary, marginBottom: '14px' }}>Tap a preset or create your own</p>
            <div className="presets-grid">
              {PRESET_REMINDERS.map((preset) => (
                <button key={preset.title} className="preset-card" onClick={() => handleQuickStart(preset)}>
                  <div className="preset-card-icon">{preset.icon}</div>
                  <div className="preset-card-title">{preset.title}</div>
                  <div className="preset-card-interval">Every {preset.defaultInterval >= 60 ? `${preset.defaultInterval / 60}h` : `${preset.defaultInterval}m`}</div>
                </button>
              ))}
            </div>
            <div className="divider-section"><div className="divider-line" /><span className="divider-text">or</span><div className="divider-line" /></div>
            <button className="custom-toggle" onClick={() => setShowCustom(true)}>
              <span className="custom-toggle-text">Custom Reminder</span>
              <span className="custom-toggle-arrow">+</span>
            </button>
          </>
        )}

        {showCustom && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Title + Icon */}
            <div className="settings-card">
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: COLORS.textSecondary, marginBottom: '6px', display: 'block' }}>Title</label>
                <input className="form-input" value={title} onChange={(e) => { setTitle(e.target.value); setErrors((p) => ({ ...p, title: undefined })); }}
                  placeholder="e.g. Stretch, Drink Water" style={{ ...errors.title ? { borderColor: COLORS.danger } : {} }} />
                {errors.title && <p style={{ fontSize: '11px', color: COLORS.danger, margin: '4px 0 0' }}>{errors.title}</p>}
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: COLORS.textSecondary, marginBottom: '6px', display: 'block' }}>Icon</label>
                <div className="icon-row">
                  {PRESET_REMINDERS.slice(0, 4).map((p) => (
                    <button key={p.icon} className={`icon-btn ${icon === p.icon ? 'active' : ''}`} onClick={() => setIcon(p.icon)}>
                      <span className="icon-text">{p.icon}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Interval */}
            <div className="settings-card">
              <label style={{ fontSize: '12px', fontWeight: 600, color: COLORS.textSecondary, marginBottom: '8px', display: 'block' }}>Every</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input className="form-input" value={intervalValue}
                  onChange={(e) => { setIntervalValue(e.target.value.replace(/\D/g, '')); setErrors((p) => ({ ...p, interval: undefined })); }}
                  placeholder="30" inputMode="numeric"
                  style={{ flex: 1, ...(errors.interval ? { borderColor: COLORS.danger } : {}) }} />
                <div style={{ display: 'flex', borderRadius: '10px', overflow: 'hidden', border: `1px solid ${COLORS.border}` }}>
                  <button className={`chip ${intervalUnit === 'minutes' ? 'active' : ''}`} onClick={() => setIntervalUnit('minutes')} style={{ borderRadius: 0, padding: '8px 14px', fontSize: '12px' }}>Min</button>
                  <button className={`chip ${intervalUnit === 'hours' ? 'active' : ''}`} onClick={() => setIntervalUnit('hours')} style={{ borderRadius: 0, padding: '8px 14px', fontSize: '12px' }}>Hr</button>
                </div>
              </div>
              {errors.interval && <p style={{ fontSize: '11px', color: COLORS.danger, margin: '0 0 8px' }}>{errors.interval}</p>}
            </div>

            {/* Schedule */}
            <div className="settings-card">
              <label style={{ fontSize: '12px', fontWeight: 600, color: COLORS.textSecondary, marginBottom: '8px', display: 'block' }}>Days</label>
              <div className="days-row">
                {DAYS_OF_WEEK.map((day) => (
                  <button key={day} className={`day-chip ${activeDays.includes(day) ? 'active' : ''}`}
                    onClick={() => { toggleDay(day); setErrors((p) => ({ ...p, days: undefined })); }}>
                    {day.charAt(0)}
                  </button>
                ))}
              </div>
              {errors.days && <p style={{ fontSize: '11px', color: COLORS.danger, margin: '0 0 8px' }}>{errors.days}</p>}
              <div className="day-shortcuts" style={{ marginTop: '8px' }}>
                <button className="shortcut-btn" onClick={() => setActiveDays(['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] as DayOfWeek[])}>Weekdays</button>
                <button className="shortcut-btn" onClick={() => setActiveDays(['Sat', 'Sun'] as DayOfWeek[])}>Weekends</button>
                <button className="shortcut-btn" onClick={() => setActiveDays(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as DayOfWeek[])}>All</button>
              </div>
            </div>

            {/* Hours */}
            <div className="settings-card">
              <label style={{ fontSize: '12px', fontWeight: 600, color: COLORS.textSecondary, marginBottom: '8px', display: 'block' }}>Hours</label>
              <div className="time-range-container">
                <div className="time-picker-group">
                  <select className="time-select" value={startHour} onChange={(e) => setStartHour(Number(e.target.value))}>
                    {Array.from({ length: 24 }, (_, i) => i).filter((h) => h < endHour).map((h) => (
                      <option key={h} value={h}>{formatHour(h)}</option>
                    ))}
                  </select>
                </div>
                <span className="time-separator">to</span>
                <div className="time-picker-group">
                  <select className="time-select" value={endHour} onChange={(e) => setEndHour(Number(e.target.value))}>
                    {Array.from({ length: 24 }, (_, i) => i).filter((h) => h > startHour).map((h) => (
                      <option key={h} value={h}>{formatHour(h)}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
