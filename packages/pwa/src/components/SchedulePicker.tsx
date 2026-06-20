import { COLORS, DAYS_OF_WEEK } from '@breather/shared';
import { DayOfWeek } from '@breather/shared/src/types';

interface SchedulePickerProps {
  activeDays: DayOfWeek[];
  startHour: number;
  endHour: number;
  onDaysChange: (days: DayOfWeek[]) => void;
  onStartHourChange: (hour: number) => void;
  onEndHourChange: (hour: number) => void;
}

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => i);

function formatHour(hour: number): string {
  if (hour === 0) return '12 AM';
  if (hour === 12) return '12 PM';
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
}

export default function SchedulePicker({
  activeDays, startHour, endHour,
  onDaysChange, onStartHourChange, onEndHourChange,
}: SchedulePickerProps) {
  const toggleDay = (day: DayOfWeek) => {
    if (activeDays.includes(day)) {
      if (activeDays.length > 1) {
        onDaysChange(activeDays.filter((d) => d !== day));
      }
    } else {
      const ordered = DAYS_OF_WEEK.filter((d) => activeDays.includes(d) || d === day);
      onDaysChange(ordered as DayOfWeek[]);
    }
  };

  return (
    <div>
      {/* Day selector */}
      <div style={{ marginBottom: '14px' }}>
        <div style={{
          fontSize: '12px', fontWeight: 600, color: COLORS.textSecondary,
          marginBottom: '8px',
        }}>
          Active days
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          {DAYS_OF_WEEK.map((day) => {
            const active = activeDays.includes(day as DayOfWeek);
            return (
              <button
                key={day}
                onClick={() => toggleDay(day as DayOfWeek)}
                style={{
                  flex: 1,
                  padding: '8px 0',
                  borderRadius: '8px',
                  border: `1.5px solid ${active ? COLORS.primary : COLORS.border}`,
                  backgroundColor: active ? COLORS.primary : 'white',
                  color: active ? 'white' : COLORS.textSecondary,
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>

      {/* Time range */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: '12px', fontWeight: 600, color: COLORS.textSecondary,
            marginBottom: '6px',
          }}>
            From
          </div>
          <select
            value={startHour}
            onChange={(e) => {
              const val = Number(e.target.value);
              onStartHourChange(val);
              if (val >= endHour) onEndHourChange(val + 1);
            }}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '10px',
              border: `1.5px solid ${COLORS.border}`,
              fontSize: '13px',
              fontWeight: 600,
              color: COLORS.text,
              backgroundColor: 'white',
              cursor: 'pointer',
              appearance: 'auto',
            }}
          >
            {HOUR_OPTIONS.filter((h) => h < 23).map((h) => (
              <option key={h} value={h}>{formatHour(h)}</option>
            ))}
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: '12px', fontWeight: 600, color: COLORS.textSecondary,
            marginBottom: '6px',
          }}>
            To
          </div>
          <select
            value={endHour}
            onChange={(e) => onEndHourChange(Number(e.target.value))}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '10px',
              border: `1.5px solid ${COLORS.border}`,
              fontSize: '13px',
              fontWeight: 600,
              color: COLORS.text,
              backgroundColor: 'white',
              cursor: 'pointer',
              appearance: 'auto',
            }}
          >
            {HOUR_OPTIONS.filter((h) => h > startHour).map((h) => (
              <option key={h} value={h}>{formatHour(h)}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
