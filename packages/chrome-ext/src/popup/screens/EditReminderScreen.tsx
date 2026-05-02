import { useState, useEffect } from 'react';
import {
  Reminder, DayOfWeek,
  COLORS, PRESET_REMINDERS, DAYS_OF_WEEK,
} from '@breather/shared';
import { loadReminders, saveReminders } from '../../lib/storage';
import type { Screen } from '../App';

interface Props { navigate: (s: Screen) => void; reminderId: string; }

export default function EditReminderScreen({ navigate, reminderId }: Props) {
  const [reminder, setReminder] = useState<Reminder | null>(null);
  const [title, setTitle] = useState('');
  const [intervalMinutes, setIntervalMinutes] = useState(30);
  const [intervalUnit, setIntervalUnit] = useState<'minutes' | 'hours'>('minutes');
  const [intervalValue, setIntervalValue] = useState('30');
  const [icon, setIcon] = useState('🧘');
  const [activeDays, setActiveDays] = useState<DayOfWeek[]>([]);
  const [startHour, setStartHour] = useState(8);
  const [endHour, setEndHour] = useState(17);
  const [errors, setErrors] = useState<{ title?: string; interval?: string; days?: string }>({});

  useEffect(() => {
    loadReminders().then((all) => {
      const found = all.find((r) => r.id === reminderId);
      if (found) {
        setReminder(found);
        setTitle(found.title);
        setIcon(found.icon);
        setActiveDays([...found.schedule.activeDays]);
        setStartHour(found.schedule.startHour);
        setEndHour(found.schedule.endHour);
        if (found.intervalMinutes >= 60) {
          setIntervalUnit('hours');
          setIntervalValue(String(Math.floor(found.intervalMinutes / 60)));
        } else {
          setIntervalUnit('minutes');
          setIntervalValue(String(found.intervalMinutes));
        }
        setIntervalMinutes(found.intervalMinutes);
      }
    });
  }, [reminderId]);

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

  const handleSave = async () => {
    const newErrors: typeof errors = {};
    if (!title.trim()) newErrors.title = 'Please enter a reminder title';
    if (intervalMinutes < 1) newErrors.interval = 'Minimum interval is 1 minute';
    if (activeDays.length === 0) newErrors.days = 'Select at least one day';
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    setErrors({});

    const all = await loadReminders();
    const updated = all.map((r) => r.id === reminderId ? {
      ...r, title: title.trim(), icon, intervalMinutes,
      schedule: { activeDays, startHour, endHour },
    } : r);
    await saveReminders(updated);
    const updatedReminder = updated.find((r) => r.id === reminderId);
    if (updatedReminder?.isActive) {
      chrome.runtime.sendMessage({ type: 'SCHEDULE_REMINDER', reminder: updatedReminder });
    }
    navigate({ name: 'home' });
  };

  const handleDelete = async () => {
    if (!reminder) return;
    if (!confirm(`Delete "${reminder.title}"?`)) return;
    const all = await loadReminders();
    await saveReminders(all.filter((r) => r.id !== reminderId));
    chrome.runtime.sendMessage({ type: 'CANCEL_REMINDER', id: reminderId });
    navigate({ name: 'home' });
  };

  if (!reminder) return <div style={{ padding: '24px', textAlign: 'center', color: COLORS.textSecondary }}>Loading...</div>;

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
          <h1 style={{ color: COLORS.text, fontSize: '20px', fontWeight: 800, margin: 0 }}>Edit Reminder</h1>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <button onClick={handleDelete} style={{
            width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#FEE2E2',
            border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
          <button onClick={handleSave} style={{
            width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#D4503C',
            border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </button>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column' }}>
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

        <button onClick={handleSave} className="btn btn-primary" style={{ marginTop: '8px' }}>Update Reminder</button>
      </div>
    </div>
  );
}
