import { useState } from 'react';
import { useRemindersContext } from '../context/RemindersContext';
import { APP_VERSION } from '@breather/shared/src/constants';

export default function SettingsScreen() {
  const { settings, updateSettings, dispatch } = useRemindersContext();
  const [tapCount, setTapCount] = useState(0);
  const [devMode, setDevMode] = useState(false);

  const handleToggleNotifications = () => {
    updateSettings({ ...settings, notificationsEnabled: !settings.notificationsEnabled });
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to delete all reminders? This cannot be undone.')) {
      dispatch({ type: 'LOAD', payload: [] });
    }
  };

  const handleVersionTap = () => {
    const newCount = tapCount + 1;
    setTapCount(newCount);
    if (newCount >= 5) {
      setDevMode(true);
      setTapCount(0);
    }
  };

  return (
    <div>
      <header className="header">
        <div className="header-title">
          <span>🌱</span> Settings
        </div>
      </header>

      <div style={{ padding: 20 }}>
        <div className="settings-item">
          <span className="settings-label">Notifications</span>
          <button
            className={`toggle ${settings.notificationsEnabled ? 'active' : ''}`}
            onClick={handleToggleNotifications}
          />
        </div>

        <div className="settings-item">
          <span className="settings-label">Privacy Policy</span>
          <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }}>
            View
          </button>
        </div>

        <div className="settings-item" style={{ borderColor: '#FEE2E2' }}>
          <span className="settings-label">Reset All Reminders</span>
          <button className="btn btn-danger" style={{ padding: '6px 12px', fontSize: 12 }} onClick={handleReset}>
            Reset
          </button>
        </div>

        <div
          className="settings-item"
          style={{ cursor: 'pointer', justifyContent: 'center' }}
          onClick={handleVersionTap}
        >
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            Breather Extension v{APP_VERSION}
          </span>
        </div>

        {devMode && (
          <div className="card" style={{ marginTop: 16, padding: 16 }}>
            <div className="section-title">Dev Mode</div>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>
              Developer controls enabled. Use the PWA full tab for dev features.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
