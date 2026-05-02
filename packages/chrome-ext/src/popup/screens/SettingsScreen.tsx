import { useState, useEffect, useCallback } from 'react';
import {
  COLORS, APP_VERSION, STORAGE_KEYS, AppSettings, Reminder,
} from '@breather/shared';
import { loadReminders, saveReminders, loadSettings, saveSettings } from '../../lib/storage';
import Logo from '../components/Logo';
import type { Screen } from '../App';

interface Props { navigate: (s: Screen) => void; }

export default function SettingsScreen({ navigate }: Props) {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [reminders, setReminders] = useState<Reminder[]>([]);

  useEffect(() => {
    loadSettings().then(setSettings);
    loadReminders().then(setReminders);
  }, []);

  const handleToggleNotifications = useCallback(async (value: boolean) => {
    if (!settings) return;
    const updated = { ...settings, notificationsEnabled: value };
    setSettings(updated);
    await saveSettings(updated);

    if (!value) {
      chrome.runtime.sendMessage({ type: 'CANCEL_ALL' });
      const updatedReminders = reminders.map((r) => ({ ...r, isActive: false }));
      setReminders(updatedReminders);
      await saveReminders(updatedReminders);
    } else {
      for (const r of reminders) {
        if (r.isActive) {
          chrome.runtime.sendMessage({ type: 'SCHEDULE_REMINDER', reminder: r });
        }
      }
    }
  }, [settings, reminders]);

  const handleResetAll = useCallback(async () => {
    if (!confirm('This will delete all your reminders. This action cannot be undone.')) return;
    chrome.runtime.sendMessage({ type: 'CANCEL_ALL' });
    setReminders([]);
    await saveReminders([]);
  }, []);

  if (!settings) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{
        backgroundColor: COLORS.background,
        padding: '14px 20px',
        borderBottom: `1px solid ${COLORS.border}`,
        minHeight: '56px',
        display: 'flex',
        alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Logo />
          <h1 style={{ color: COLORS.text, fontSize: '20px', fontWeight: 800, margin: 0 }}>Settings</h1>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Notifications */}
        <div className="settings-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="settings-card-label">Notifications</span>
            <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '26px' }}>
              <input
                type="checkbox"
                checked={settings.notificationsEnabled}
                onChange={(e) => handleToggleNotifications(e.target.checked)}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span style={{
                position: 'absolute', cursor: 'pointer', inset: 0,
                backgroundColor: settings.notificationsEnabled ? COLORS.primary : COLORS.disabled,
                borderRadius: '26px', transition: '0.3s',
              }}>
                <span style={{
                  position: 'absolute',
                  left: settings.notificationsEnabled ? '20px' : '3px', top: '3px',
                  width: '20px', height: '20px',
                  backgroundColor: '#FFFFFF', borderRadius: '50%', transition: '0.3s',
                }} />
              </span>
            </label>
          </div>
        </div>

        {/* Reset */}
        <div className="settings-card">
          <button onClick={handleResetAll} style={{
            width: '100%', padding: '12px', borderRadius: '10px', border: 'none',
            backgroundColor: COLORS.dangerLight, color: COLORS.danger,
            fontSize: '14px', fontWeight: 600, cursor: 'pointer',
          }}>
            Reset All Reminders
          </button>
        </div>

        {/* About */}
        <div style={{ textAlign: 'center', padding: '16px 0 8px', color: '#6B7280', fontSize: '12px' }}>
          <span style={{ fontWeight: 600, color: COLORS.primary }}>Breather</span> v{APP_VERSION} - Small breaks, big impact.
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav style={{
        display: 'flex', borderTop: `1px solid ${COLORS.border}`, backgroundColor: COLORS.surface,
        padding: '8px 0 12px', flexShrink: 0,
      }}>
        <button onClick={() => navigate({ name: 'home' })} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', border: 'none', background: 'none', cursor: 'pointer', color: COLORS.textSecondary }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
          <span style={{ fontSize: '10px', fontWeight: 500 }}>Home</span>
        </button>
        <button onClick={() => navigate({ name: 'progress' })} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', border: 'none', background: 'none', cursor: 'pointer', color: COLORS.textSecondary }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>
          <span style={{ fontSize: '10px', fontWeight: 500 }}>Progress</span>
        </button>
        <button style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', border: 'none', background: 'none', cursor: 'pointer', color: COLORS.primary }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
          <span style={{ fontSize: '10px', fontWeight: 600 }}>Settings</span>
        </button>
      </nav>
    </div>
  );
}
