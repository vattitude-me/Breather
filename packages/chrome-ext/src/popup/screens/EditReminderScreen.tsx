import { useState, useEffect } from 'react';
import {
  Reminder, DayOfWeek,
  COLORS, DAYS_OF_WEEK, INTERVAL_PRESETS,
} from '@breather/shared';
import { loadReminders, saveReminders } from '../../lib/storage';
import type { Screen } from '../App';

const ICONS = ['🧘', '💧', '🚶', '👁️', '🧍', '🌬️', '💪', '☕', '🍎', '🎵'];

interface Props { navigate: (s: Screen) => void; reminderId: string; }

export default function EditReminderScreen({ navigate, reminderId }: Props) {
  const [reminder, setReminder] = useState<Reminder | null>(null);
  const [title, setTitle] = useState('');
  const [icon, setIcon] = useState('🧘');
  const [interval, setInterval_] = useState(30);
  const [activeDays, setActiveDays] = useState<DayOfWeek[]>([]);
  const [startHour, setStartHour] = useState(8);
  const [endHour, setEndHour] = useState(17);
  const [error, setError] = useState('');

  useEffect(() => {
    loadReminders().then((all) => {
      const found = all.find((r) => r.id === reminderId);
      if (found) {
        setReminder(found);
        setTitle(found.title);
        setIcon(found.icon);
        setInterval_(found.intervalMinutes);
        setActiveDays([...found.schedule.activeDays]);
        setStartHour(found.schedule.startHour);
        setEndHour(found.schedule.endHour);
      }
    });
  }, [reminderId]);

  const handleSave = async () => {
    if (!title.trim()) { setError('Give your reminder a name'); return; }
    if (interval < 1) { setError('Interval must be at least 1 minute'); return; }
    if (activeDays.length === 0) { setError('Select at least one day'); return; }
    if (startHour >= endHour) { setError('End hour must be after start hour'); return; }

    const all = await loadReminders();
    const updated = all.map((r) => r.id === reminderId ? {
      ...r,
      title: title.trim(),
      icon,
      intervalMinutes: interval,
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
    if (!confirm('Delete this reminder?')) return;
    const all = await loadReminders();
    await saveReminders(all.filter((r) => r.id !== reminderId));
    chrome.runtime.sendMessage({ type: 'CANCEL_REMINDER', id: reminderId });
    navigate({ name: 'home' });
  };

  const toggleDay = (day: DayOfWeek) => {
    setActiveDays((prev) => prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]);
  };

  const formatHour = (h: number) => {
    if (h === 0) return '12 AM';
    if (h < 12) return `${h} AM`;
    if (h === 12) return '12 PM';
    return `${h - 12} PM`;
  };

  if (!reminder) return <div style={{ padding: '24px', textAlign: 'center', color: COLORS.textSecondary }}>Loading...</div>;

  return (
    <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button onClick={() => navigate({ name: 'home' })} style={{ background: COLORS.border, border: 'none', borderRadius: '8px', width: '28px', height: '28px', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            ←
          </button>
          <h2 style={{ fontSize: '16px', fontWeight: 800, color: COLORS.text, margin: 0 }}>Edit Reminder</h2>
        </div>
        <button onClick={handleDelete} style={{ padding: '6px 10px', borderRadius: '8px', border: 'none', backgroundColor: COLORS.dangerLight, cursor: 'pointer', fontSize: '11px', fontWeight: 600, color: COLORS.danger }}>
          Delete
        </button>
      </div>

      {/* Title */}
      <div>
        <label style={{ fontSize: '10px', fontWeight: 600, color: COLORS.textSecondary, display: 'block', marginBottom: '4px' }}>Reminder Name</label>
        <input
          value={title} onChange={(e) => { setTitle(e.target.value); setError(''); }}
          style={{ width: '100%', padding: '10px', borderRadius: '10px', border: `1px solid ${COLORS.border}`, fontSize: '13px', color: COLORS.text, boxSizing: 'border-box' }}
        />
      </div>

      {/* Icon */}
      <div>
        <label style={{ fontSize: '10px', fontWeight: 600, color: COLORS.textSecondary, display: 'block', marginBottom: '4px' }}>Icon</label>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {ICONS.map((ic) => (
            <button key={ic} onClick={() => setIcon(ic)} style={{
              width: '32px', height: '32px', borderRadius: '8px', border: icon === ic ? `2px solid ${COLORS.primary}` : `1px solid ${COLORS.border}`,
              backgroundColor: icon === ic ? COLORS.primaryLight : COLORS.surface, cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {ic}
            </button>
          ))}
        </div>
      </div>

      {/* Interval */}
      <div>
        <label style={{ fontSize: '10px', fontWeight: 600, color: COLORS.textSecondary, display: 'block', marginBottom: '4px' }}>Interval</label>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {INTERVAL_PRESETS.map((v) => (
            <button key={v} onClick={() => setInterval_(v)} style={{
              padding: '6px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 600, cursor: 'pointer',
              border: interval === v ? `2px solid ${COLORS.primary}` : `1px solid ${COLORS.border}`,
              backgroundColor: interval === v ? COLORS.primaryLight : COLORS.surface,
              color: interval === v ? COLORS.primary : COLORS.text,
            }}>
              {v < 60 ? `${v}m` : `${v / 60}h`}
            </button>
          ))}
        </div>
      </div>

      {/* Active Days */}
      <div>
        <label style={{ fontSize: '10px', fontWeight: 600, color: COLORS.textSecondary, display: 'block', marginBottom: '4px' }}>Active Days</label>
        <div style={{ display: 'flex', gap: '3px' }}>
          {DAYS_OF_WEEK.map((day) => (
            <button key={day} onClick={() => toggleDay(day)} style={{
              flex: 1, padding: '6px 0', borderRadius: '8px', fontSize: '10px', fontWeight: 600, cursor: 'pointer',
              border: activeDays.includes(day) ? `2px solid ${COLORS.primary}` : `1px solid ${COLORS.border}`,
              backgroundColor: activeDays.includes(day) ? COLORS.primaryLight : COLORS.surface,
              color: activeDays.includes(day) ? COLORS.primary : COLORS.textSecondary,
            }}>
              {day.charAt(0)}
            </button>
          ))}
        </div>
      </div>

      {/* Hours */}
      <div>
        <label style={{ fontSize: '10px', fontWeight: 600, color: COLORS.textSecondary, display: 'block', marginBottom: '4px' }}>Active Hours</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <button onClick={() => setStartHour(Math.max(0, startHour - 1))} style={{ width: '24px', height: '24px', borderRadius: '6px', border: `1px solid ${COLORS.border}`, background: COLORS.surface, cursor: 'pointer', fontSize: '12px' }}>−</button>
            <span style={{ fontSize: '11px', fontWeight: 600, color: COLORS.text, minWidth: '44px', textAlign: 'center' }}>{formatHour(startHour)}</span>
            <button onClick={() => setStartHour(Math.min(23, startHour + 1))} style={{ width: '24px', height: '24px', borderRadius: '6px', border: `1px solid ${COLORS.border}`, background: COLORS.surface, cursor: 'pointer', fontSize: '12px' }}>+</button>
          </div>
          <span style={{ fontSize: '11px', color: COLORS.textSecondary }}>to</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <button onClick={() => setEndHour(Math.max(1, endHour - 1))} style={{ width: '24px', height: '24px', borderRadius: '6px', border: `1px solid ${COLORS.border}`, background: COLORS.surface, cursor: 'pointer', fontSize: '12px' }}>−</button>
            <span style={{ fontSize: '11px', fontWeight: 600, color: COLORS.text, minWidth: '44px', textAlign: 'center' }}>{formatHour(endHour)}</span>
            <button onClick={() => setEndHour(Math.min(24, endHour + 1))} style={{ width: '24px', height: '24px', borderRadius: '6px', border: `1px solid ${COLORS.border}`, background: COLORS.surface, cursor: 'pointer', fontSize: '12px' }}>+</button>
          </div>
        </div>
      </div>

      {error && <div style={{ fontSize: '11px', color: COLORS.danger, fontWeight: 600 }}>{error}</div>}

      <button onClick={handleSave} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: 'none', background: COLORS.primary, cursor: 'pointer', fontSize: '12px', fontWeight: 700, color: '#FFF' }}>
        Save Changes
      </button>
    </div>
  );
}
