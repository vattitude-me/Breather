import { useState, useEffect } from 'react';
import { COLORS } from '@breather/shared';

export default function NotificationPrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'default') return;

    const dismissed = sessionStorage.getItem('@breather_notif_prompt_dismissed');
    if (dismissed) return;

    const timer = setTimeout(() => setShow(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleEnable = async () => {
    const result = await Notification.requestPermission();
    if (result === 'granted') {
      setShow(false);
    } else {
      sessionStorage.setItem('@breather_notif_prompt_dismissed', 'true');
      setShow(false);
    }
  };

  const handleDismiss = () => {
    sessionStorage.setItem('@breather_notif_prompt_dismissed', 'true');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.4)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1500,
      padding: '24px',
    }}>
      <div style={{
        background: '#FFFFFF',
        borderRadius: '20px',
        padding: '28px 24px',
        maxWidth: '320px',
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
      }}>
        <div style={{ fontSize: '36px', marginBottom: '12px' }}>🔔</div>
        <h2 style={{
          fontSize: '18px',
          fontWeight: 700,
          color: COLORS.text,
          marginBottom: '8px',
        }}>
          Enable Notifications
        </h2>
        <p style={{
          fontSize: '14px',
          color: COLORS.textSecondary,
          lineHeight: 1.6,
          marginBottom: '20px',
        }}>
          Breather needs notifications to remind you to take breaks. Without them, reminders won't work when the app is in the background.
        </p>
        <button
          onClick={handleEnable}
          style={{
            width: '100%',
            padding: '14px',
            background: COLORS.primary,
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '12px',
            fontSize: '15px',
            fontWeight: 600,
            cursor: 'pointer',
            marginBottom: '10px',
          }}
        >
          Enable Notifications
        </button>
        <button
          onClick={handleDismiss}
          style={{
            width: '100%',
            padding: '12px',
            background: 'none',
            color: COLORS.textSecondary,
            border: 'none',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Not now
        </button>
      </div>
    </div>
  );
}
