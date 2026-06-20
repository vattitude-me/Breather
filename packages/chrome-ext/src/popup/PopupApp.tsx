import { useState, useEffect } from 'react';
import { Reminder, PlantState } from '@breather/shared/src/types';
import { STORAGE_KEYS } from '@breather/shared/src/constants';

const PWA_URL = 'https://breather-break.vercel.app';

function getNextClockAlignedTime(intervalMinutes: number): number {
  const now = Date.now();
  const intervalMs = intervalMinutes * 60 * 1000;
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const msSinceMidnight = now - todayStart.getTime();
  const cyclesPassed = Math.floor(msSinceMidnight / intervalMs);
  return todayStart.getTime() + (cyclesPassed + 1) * intervalMs;
}

function getEarliestNextBreak(reminders: Reminder[]): number | null {
  const active = reminders.filter((r) => r.isActive);
  if (active.length === 0) return null;

  let earliest = Infinity;
  for (const r of active) {
    const next = getNextClockAlignedTime(r.intervalMinutes);
    if (next < earliest) earliest = next;
  }
  return earliest === Infinity ? null : earliest;
}

export default function PopupApp() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [plant, setPlant] = useState<PlantState | null>(null);
  const [nextBreakTime, setNextBreakTime] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const loadStorage = () => {
      chrome.storage.local.get(
        [STORAGE_KEYS.REMINDERS, STORAGE_KEYS.PLANT],
        (result) => {
          const r = result[STORAGE_KEYS.REMINDERS] || [];
          setReminders(r);
          setPlant(result[STORAGE_KEYS.PLANT] || null);
          setNextBreakTime(getEarliestNextBreak(r));
        }
      );
    };

    loadStorage();

    chrome.runtime.sendMessage({ type: 'PULL_FROM_PWA' }, (response) => {
      if (response?.ok) loadStorage();
    });
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const openPWA = (path = '/home') => {
    chrome.tabs.create({ url: `${PWA_URL}${path}` });
    window.close();
  };

  const toggleReminder = (id: string) => {
    const updated = reminders.map((r) =>
      r.id === id ? { ...r, isActive: !r.isActive } : r
    );
    setReminders(updated);
    setNextBreakTime(getEarliestNextBreak(updated));
    chrome.storage.local.set({ [STORAGE_KEYS.REMINDERS]: updated });
  };

  const activeReminders = reminders.filter((r) => r.isActive);
  const breaksToday = plant?.dailyLeavesGrown || 0;

  const formatCountdown = (targetMs: number) => {
    const diff = Math.max(0, targetMs - now);
    const totalSec = Math.floor(diff / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    if (h > 0) return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="popup">
      <div className="popup-header">
        <span className="popup-logo">Breather</span>
        <button className="popup-open-btn" onClick={() => openPWA('/home')}>
          Open App ↗
        </button>
      </div>

      {nextBreakTime !== null && nextBreakTime > now && (
        <div className="popup-countdown">
          <div className="popup-countdown-label">Next break in</div>
          <div className="popup-countdown-time">
            {formatCountdown(nextBreakTime)}
          </div>
        </div>
      )}

      <div className="popup-status-row">
        <div className="popup-status-item">
          <span className="popup-status-value">{breaksToday}</span>
          <span className="popup-status-label">{breaksToday === 1 ? 'break' : 'breaks'} today</span>
        </div>
        <div className="popup-status-item">
          <span className="popup-status-value">{activeReminders.length}</span>
          <span className="popup-status-label">active {activeReminders.length === 1 ? 'reminder' : 'reminders'}</span>
        </div>
      </div>

      <div className="popup-reminders">
        {activeReminders.slice(0, 3).map((r) => (
          <div key={r.id} className="popup-reminder-row">
            <span className="popup-reminder-icon">{r.icon}</span>
            <span className="popup-reminder-title">{r.title}</span>
            <span className="popup-reminder-interval">
              {r.intervalMinutes >= 60
                ? `${r.intervalMinutes / 60}h`
                : `${r.intervalMinutes}m`}
            </span>
            <button
              className={`popup-toggle ${r.isActive ? 'active' : ''}`}
              onClick={() => toggleReminder(r.id)}
            />
          </div>
        ))}
        {activeReminders.length > 3 && (
          <div className="popup-more" onClick={() => openPWA('/home')}>
            +{activeReminders.length - 3} more
          </div>
        )}
        {reminders.length === 0 && (
          <div className="popup-empty" onClick={() => openPWA('/home')}>
            + Set up your first reminder
          </div>
        )}
      </div>

      <div className="popup-footer">
        <button className="popup-footer-link" onClick={() => openPWA('/progress')}>
          📊 Progress
        </button>
        <button className="popup-footer-link" onClick={() => openPWA('/settings')}>
          ⚙️ Settings
        </button>
      </div>
    </div>
  );
}
