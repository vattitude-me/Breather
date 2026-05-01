import { useState } from 'react';
import { COLORS } from '../constants';
import { setAnalyticsConsent } from '../services/analytics';

export default function CookieConsent() {
  const [visible, setVisible] = useState(
    () => localStorage.getItem('@breather_analytics_consent') === null
  );

  if (!visible) return null;

  const handleAccept = () => {
    setAnalyticsConsent(true);
    setVisible(false);
  };

  const handleDecline = () => {
    setAnalyticsConsent(false);
    setVisible(false);
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 2000,
      display: 'flex',
      justifyContent: 'center',
      padding: '16px',
      pointerEvents: 'none',
    }}>
      <div style={{
        maxWidth: '400px',
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        padding: '16px 20px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
        border: `1px solid ${COLORS.border}`,
        pointerEvents: 'auto',
      }}>
        <p style={{ fontSize: '13px', color: COLORS.text, lineHeight: 1.5, margin: '0 0 12px' }}>
          We use cookies to understand how Breather is used and improve the experience. No personal data is collected.
        </p>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleDecline}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '10px',
              border: `1px solid ${COLORS.border}`,
              backgroundColor: '#FFFFFF',
              fontSize: '13px',
              fontWeight: 600,
              color: COLORS.textSecondary,
              cursor: 'pointer',
            }}
          >
            Decline
          </button>
          <button
            onClick={handleAccept}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: COLORS.primary,
              fontSize: '13px',
              fontWeight: 600,
              color: '#FFFFFF',
              cursor: 'pointer',
            }}
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
