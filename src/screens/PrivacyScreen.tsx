import { useNavigate } from 'react-router-dom';
import { COLORS } from '../constants';
import '../screens.css';

export default function PrivacyScreen() {
  const navigation = useNavigate();

  return (
    <div className="page">
      <div className="page-header" style={{ padding: '14px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => navigation(-1)}
            className="page-header-back"
            style={{ marginBottom: 0 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
            Privacy Policy
          </h1>
        </div>
      </div>

      <div className="page-content" style={{ padding: '20px 24px' }}>
        <div className="settings-card">
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: COLORS.text, margin: '0 0 8px' }}>
            Your data stays on your device
          </h2>
          <p style={{ fontSize: '13px', color: COLORS.textSecondary, lineHeight: 1.6, margin: 0 }}>
            Breather stores all your reminders, settings, and progress data locally in your browser. Nothing is sent to any server. If you clear your browser data, your Breather data will be removed.
          </p>
        </div>

        <div className="settings-card">
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: COLORS.text, margin: '0 0 8px' }}>
            No account required
          </h2>
          <p style={{ fontSize: '13px', color: COLORS.textSecondary, lineHeight: 1.6, margin: 0 }}>
            Breather does not require sign-up, login, or any personal information to use. There are no user accounts and no passwords.
          </p>
        </div>

        <div className="settings-card">
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: COLORS.text, margin: '0 0 8px' }}>
            Analytics
          </h2>
          <p style={{ fontSize: '13px', color: COLORS.textSecondary, lineHeight: 1.6, margin: 0 }}>
            If you accept analytics cookies, we use Google Analytics to understand general usage patterns (page views, session duration). This helps us improve the app. No personally identifiable information is collected. You can change your preference at any time from Settings.
          </p>
        </div>

        <div className="settings-card">
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: COLORS.text, margin: '0 0 8px' }}>
            Notifications
          </h2>
          <p style={{ fontSize: '13px', color: COLORS.textSecondary, lineHeight: 1.6, margin: 0 }}>
            Breather uses browser notifications to remind you to take breaks. This requires your permission and can be disabled at any time from your browser settings or within the app.
          </p>
        </div>

        <div className="settings-card">
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: COLORS.text, margin: '0 0 8px' }}>
            Third-party services
          </h2>
          <p style={{ fontSize: '13px', color: COLORS.textSecondary, lineHeight: 1.6, margin: 0 }}>
            Breather is hosted on Vercel. If analytics are enabled, Google Analytics is used. No other third-party services receive your data.
          </p>
        </div>

        <div className="settings-card">
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: COLORS.text, margin: '0 0 8px' }}>
            Changes to this policy
          </h2>
          <p style={{ fontSize: '13px', color: COLORS.textSecondary, lineHeight: 1.6, margin: 0 }}>
            If we make changes to this policy, they will be reflected here. Last updated: April 2026.
          </p>
        </div>
      </div>
    </div>
  );
}
