import { useState, useCallback } from 'react';
import {
  Reminder, DayOfWeek,
  COLORS, PRESET_REMINDERS, DAYS_OF_WEEK, DEFAULT_SCHEDULE, INTERVAL_PRESETS,
} from '@breather/shared';
import { loadReminders, saveReminders } from '../../lib/storage';
import type { Screen } from '../App';

const ICONS = ['🧘', '💧', '🚶', '👁️', '🧍', '🌬️', '💪', '☕', '🍎', '🎵'];

interface Props { navigate: (s: Screen) => void; }

export default function AddReminderScreen({ navigate }: Props) {
  const [showCustom, setShowCustom] = useState(false);
  const [title, setTitle] = useState('');
  const [icon, setIcon] = useState('🧘');
  const [interval, setInterval_] = useState(30);
  const [activeDays, setActiveDays] = useState<DayOfWeek[]>([...DEFAULT_SCHEDULE.activeDays]);
  const [startHour, setStartHour] = useState(DEFAULT_SCHEDULE.startHour);
  const [endHour, setEndHour] = useState(DEFAULT_SCHEDULE.endHour);
  const [error, setError] = useState('');

  const createReminder = useCallback(async (r: Omit<Reminder, 'id' | 'createdAt' | 'notificationId'>) => {
    const reminder: Reminder = {
      ...r,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    const existing = await loadReminders();
    existing.push(reminder);
    await saveReminders(existing);
    chrome.runtime.sendMessage({ type: 'SCHEDULE_REMINDER', reminder });
    navigate({ name: 'home' });
  }, [navigate]);

  const handlePreset = (preset: typeof PRESET_REMINDERS[0]) => {
    createReminder({
      title: preset.title,
      icon: preset.icon,
      intervalMinutes: preset.defaultInterval,
      isActive: true,
      snoozeDurationMinutes: 10,
      schedule: { activeDays: [...DEFAULT_SCHEDULE.activeDays], startHour: DEFAULT_SCHEDULE.startHour, endHour: DEFAULT_SCHEDULE.endHour },
    });
  };

  const handleSave = () => {
    if (!title.trim()) { setError('Give your reminder a name'); return; }
    if (interval < 1) { setError('Interval must be at least 1 minute'); return; }
    if (activeDays.length === 0) { setError('Select at least one day'); return; }
    if (startHour >= endHour) { setError('End hour must be after start hour'); return; }
    createReminder({
      title: title.trim(),
      icon,
      intervalMinutes: interval,
      isActive: true,
      snoozeDurationMinutes: 10,
      schedule: { activeDays, startHour, endHour },
    });
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

  return (
    <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button onClick={() => navigate({ name: 'home' })} style={{ background: COLORS.border, border: 'none', borderRadius: '8px', width: '28px', height: '28px', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          ←
        </button>
        <h2 style={{ fontSize: '16px', fontWeight: 800, color: COLORS.text, margin: 0 }}>Add Reminder</h2>
      </div>

      {/* Quick Start Presets */}
      {!showCustom && (
        <>
          <div style={{ fontSize: '11px', fontWeight: 600, color: COLORS.textSecondary, marginBottom: '-4px' }}>Quick Start</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            {PRESET_REMINDERS.map((p) => (
              <button
                key={p.title}
                onClick={() => handlePreset(p)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '10px', borderRadius: '10px',
                  border: `1px solid ${COLORS.border}`, backgroundColor: COLORS.surface,
                  cursor: 'pointer', textAlign: 'left',
                }}
              >
                <span style={{ fontSize: '20px' }}>{p.icon}</span>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: COLORS.text }}>{p.title}</div>
                  <div style={{ fontSize: '9px', color: COLORS.textSecondary }}>Every {p.defaultInterval}m</div>
                </div>
              </button>
            ))}
          </div>

          <button onClick={() => setShowCustom(true)} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: `1px dashed ${COLORS.primary}`, background: COLORS.primaryLight, cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: COLORS.primary }}>
            ✏️ Create Custom Reminder
          </button>
        </>
      )}

      {/* Custom Form */}
      {showCustom && (
        <>
          {/* Title */}
          <div>
            <label style={{ fontSize: '10px', fontWeight: 600, color: COLORS.textSecondary, display: 'block', marginBottom: '4px' }}>Reminder Name</label>
            <input
              value={title} onChange={(e) => { setTitle(e.target.value); setError(''); }}
              placeholder="e.g. Stretch, Drink Water..."
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
            <label style={{ fontSize: '10px', fontWeight: 600, color: COLORS.textSecondary, display: 'block', marginBottom: '4px' }}>Interval (minutes)</label>
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

          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setShowCustom(false)} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: `1px solid ${COLORS.border}`, background: COLORS.surface, cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: COLORS.textSecondary }}>
              Cancel
            </button>
            <button onClick={handleSave} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', background: COLORS.primary, cursor: 'pointer', fontSize: '12px', fontWeight: 700, color: '#FFF' }}>
              Save
            </button>
          </div>
        </>
      )}
    </div>
  );
}
