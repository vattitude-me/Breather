import { useState, useEffect } from 'react';
import { COLORS } from '@breather/shared';
import { setAnalyticsConsent } from '../services/analytics';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const alreadyAnswered = localStorage.getItem('@breather_analytics_consent') !== null;
    const onboarded = localStorage.getItem('@breather_onboarded') === 'true';
    if (alreadyAnswered || !onboarded) return;

    const timer = setTimeout(() => setVisible(true), 3000);
    return () => clearTimeout(timer);
  }, []);

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
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '10px 16px',
      backgroundColor: '#F3F0FF',
      borderTop: `1px solid ${COLORS.border}`,
    }}>
      <span style={{ fontSize: '16px', flexShrink: 0 }}>🍪</span>
      <p style={{ fontSize: '12px', color: COLORS.text, lineHeight: 1.4, margin: 0, flex: 1 }}>
        Help us improve Breather with anonymous usage data.
      </p>
      <button
        onClick={handleDecline}
        style={{
          flexShrink: 0,
          padding: '6px 10px',
          borderRadius: '8px',
          border: `1px solid ${COLORS.border}`,
          backgroundColor: '#FFFFFF',
          fontSize: '11px',
          fontWeight: 600,
          color: COLORS.textSecondary,
          cursor: 'pointer',
        }}
      >
        No
      </button>
      <button
        onClick={handleAccept}
        style={{
          flexShrink: 0,
          padding: '6px 12px',
          borderRadius: '8px',
          border: 'none',
          backgroundColor: COLORS.primary,
          color: '#FFFFFF',
          fontSize: '11px',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        Sure
      </button>
    </div>
  );
}
