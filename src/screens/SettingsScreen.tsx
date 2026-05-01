import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRemindersContext } from '../context/RemindersContext';
import { cancelAllReminders, scheduleReminder } from '../services/notifications';
import { getInstallPrompt, onInstallPromptChange } from '../services/installPrompt';
import { hasAnalyticsConsent, setAnalyticsConsent } from '../services/analytics';
import { COLORS, APP_VERSION } from '../constants';
import '../screens.css';

function InfoTooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  return (
    <span style={{ position: 'relative', display: 'inline-flex', marginLeft: '6px' }}>
      <button
        onClick={() => setShow(!show)}
        onBlur={() => setShow(false)}
        style={{
          width: '16px', height: '16px', borderRadius: '8px',
          background: '#F0E6E0', border: 'none', cursor: 'pointer',
          fontSize: '10px', fontWeight: 700, color: '#9CA3AF',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >?</button>
      {show && (
        <span style={{
          position: 'absolute', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
          background: '#1A1A2E', color: '#FFF', fontSize: '11px', padding: '8px 12px',
          borderRadius: '8px', whiteSpace: 'nowrap', zIndex: 10,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}>{text}</span>
      )}
    </span>
  );
}

export default function SettingsScreen() {
  const { settings, updateSettings, reminders, dispatch } = useRemindersContext();
  const navigation = useNavigate();
  const [notificationsEnabled, setNotificationsEnabled] = useState(settings.notificationsEnabled);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(hasAnalyticsConsent);
  const [installPrompt, setInstallPrompt] = useState<any>(getInstallPrompt);
  const [isInstalled, setIsInstalled] = useState(
    () => window.matchMedia('(display-mode: standalone)').matches
  );

  useEffect(() => {
    if (isInstalled) return;
    return onInstallPromptChange((prompt) => {
      if (prompt) setInstallPrompt(prompt);
      else setIsInstalled(true);
    });
  }, [isInstalled]);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const result = await installPrompt.userChoice;
    if (result.outcome === 'accepted') {
      setIsInstalled(true);
    }
    setInstallPrompt(null);
  };

  const handleToggleNotifications = async (value: boolean) => {
    setNotificationsEnabled(value);
    updateSettings({ ...settings, notificationsEnabled: value });

    if (!value) {
      await cancelAllReminders();
      const updatedReminders = reminders.map((r) => ({
        ...r,
        isActive: false,
        notificationId: undefined,
      }));
      updatedReminders.forEach((r) => dispatch({ type: 'UPDATE', payload: r }));
    } else {
      for (const reminder of reminders) {
        if (reminder.isActive) {
          try {
            const notificationId = await scheduleReminder(reminder);
            dispatch({ type: 'UPDATE', payload: { ...reminder, notificationId } });
          } catch (e) {
            console.error('Failed to schedule reminder:', e);
          }
        }
      }
    }
  };


  const handleResetAll = async () => {
    if (!window.confirm('This will delete all your reminders. This action cannot be undone.')) return;

    await cancelAllReminders();
    reminders.forEach((r) => dispatch({ type: 'DELETE', payload: r.id }));
  };

  return (
    <div className="page">
      <div className="page-header" style={{ padding: '16px 24px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
          Settings
        </h1>
      </div>

      <div className="page-content" style={{ padding: '16px 20px' }}>
        {/* Notifications */}
        <div className="settings-card">
          <div className="settings-card-row">
            <span className="settings-card-label">Notifications</span>
            <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '26px' }}>
              <input
                type="checkbox"
                checked={notificationsEnabled}
                onChange={(e) => handleToggleNotifications(e.target.checked)}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span style={{
                position: 'absolute', cursor: 'pointer', inset: 0,
                backgroundColor: notificationsEnabled ? COLORS.primary : COLORS.disabled,
                borderRadius: '26px', transition: '0.3s',
              }}>
                <span style={{
                  position: 'absolute',
                  left: notificationsEnabled ? '20px' : '3px', top: '3px',
                  width: '20px', height: '20px',
                  backgroundColor: '#FFFFFF', borderRadius: '50%', transition: '0.3s',
                }} />
              </span>
            </label>
          </div>
        </div>


        {/* Install App */}
        {!isInstalled && (
          <div className="settings-card">
            <div className="settings-card-header">
              <span className="settings-card-label">Install App</span>
              <InfoTooltip text="Pin Breather to your taskbar/dock like a native app" />
            </div>
            <p style={{ fontSize: '12px', color: COLORS.textSecondary, margin: '0 0 12px' }}>
              Install Breather to your desktop for quick access - runs in its own window like a native app.
            </p>
            {installPrompt ? (
              <button
                className="btn"
                onClick={handleInstall}
                style={{
                  fontSize: '14px',
                  padding: '12px',
                  backgroundColor: COLORS.primary,
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '10px',
                  width: '100%',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                ⬇ Install to Desktop
              </button>
            ) : (
              <div style={{
                backgroundColor: '#F8F4F2',
                borderRadius: '10px',
                padding: '14px',
              }}>
                <p style={{ fontSize: '13px', fontWeight: 600, color: COLORS.text, margin: '0 0 8px' }}>
                  How to install:
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <span style={{ fontSize: '16px', flexShrink: 0 }}>🌐</span>
                    <div>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: COLORS.text }}>Chrome / Edge</span>
                      <p style={{ fontSize: '11px', color: COLORS.textSecondary, margin: '2px 0 0' }}>
                        Click the install icon (⊕) in the address bar, or Menu &rarr; "Install Breather"
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <span style={{ fontSize: '16px', flexShrink: 0 }}>🍎</span>
                    <div>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: COLORS.text }}>Safari (Mac/iOS)</span>
                      <p style={{ fontSize: '11px', color: COLORS.textSecondary, margin: '2px 0 0' }}>
                        Tap Share &rarr; "Add to Home Screen"
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <span style={{ fontSize: '16px', flexShrink: 0 }}>🦊</span>
                    <div>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: COLORS.text }}>Firefox</span>
                      <p style={{ fontSize: '11px', color: COLORS.textSecondary, margin: '2px 0 0' }}>
                        Not supported - use Chrome or Edge for install
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Analytics */}
        <div className="settings-card">
          <div className="settings-card-row">
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span className="settings-card-label">Analytics</span>
              <InfoTooltip text="Help improve Breather with anonymous usage data" />
            </div>
            <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '26px' }}>
              <input
                type="checkbox"
                checked={analyticsEnabled}
                onChange={(e) => {
                  setAnalyticsEnabled(e.target.checked);
                  setAnalyticsConsent(e.target.checked);
                }}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span style={{
                position: 'absolute', cursor: 'pointer', inset: 0,
                backgroundColor: analyticsEnabled ? COLORS.primary : COLORS.disabled,
                borderRadius: '26px', transition: '0.3s',
              }}>
                <span style={{
                  position: 'absolute',
                  left: analyticsEnabled ? '20px' : '3px', top: '3px',
                  width: '20px', height: '20px',
                  backgroundColor: '#FFFFFF', borderRadius: '50%', transition: '0.3s',
                }} />
              </span>
            </label>
          </div>
        </div>

        {/* Privacy & Legal */}
        <div className="settings-card">
          <button
            onClick={() => navigation('/privacy')}
            className="settings-card-row"
            style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <span className="settings-card-label">Privacy Policy</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={COLORS.textSecondary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>

        {/* Reset */}
        <div className="settings-card">
          <button className="btn btn-danger" onClick={handleResetAll} style={{ fontSize: '14px', padding: '12px' }}>
            Reset All Reminders
          </button>
        </div>

        {/* About */}
        <div style={{ textAlign: 'center', padding: '16px 0 8px', color: '#9CA3AF', fontSize: '12px' }}>
          <span style={{ fontWeight: 600, color: COLORS.primary }}>Breather</span> v{APP_VERSION} - Small breaks, big impact.
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        <button className="bottom-nav-item" onClick={() => navigation('/home')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <span>Home</span>
        </button>
        <button className="bottom-nav-item" onClick={() => navigation('/progress')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
          <span>Progress</span>
        </button>
        <button className="bottom-nav-item active" onClick={() => navigation('/settings')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          <span>Settings</span>
        </button>
      </nav>
    </div>
  );
}