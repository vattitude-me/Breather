import { useState, useEffect } from 'react';
import {
  Reminder, DayOfWeek,
  COLORS, PRESET_REMINDERS, DAYS_OF_WEEK,
} from '@breather/shared';
import { loadReminders, saveReminders } from '../../lib/storage';
import Logo from '../components/Logo';
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
    if (!title.trim()) newErrors.title = 'Enter a title';
    if (intervalMinutes < 1) newErrors.interval = 'Min 1 minute';
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
          <h1 style={{ color: COLORS.text, fontSize: '20px', fontWeight: 800, margin: 0 }}>Edit</h1>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button onClick={handleDelete} style={{
            width: '36px', height: '36px', borderRadius: '10px', backgroundColor: COLORS.dangerLight,
            border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={COLORS.danger} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
          <button onClick={handleSave} style={{
            width: '36px', height: '36px', borderRadius: '10px', backgroundColor: COLORS.primary,
            border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </button>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {/* Title + Icon */}
        <div className="settings-card">
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: COLORS.textSecondary, marginBottom: '6px', display: 'block' }}>Title</label>
              <input className="form-input" value={title} onChange={(e) => { setTitle(e.target.value); setErrors((p) => ({ ...p, title: undefined })); }}
                placeholder="e.g. Stretch, Drink Water" style={{ ...errors.title ? { borderColor: COLORS.danger } : {} }} />
              {errors.title && <p style={{ fontSize: '11px', color: COLORS.danger, margin: '4px 0 0' }}>{errors.title}</p>}
            </div>
          </div>
          <div style={{ marginTop: '12px' }}>
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
    </div>
  );
}
