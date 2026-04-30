import { COLORS } from '../constants';

interface WelcomeModalProps {
  onDismiss: () => void;
}

export default function WelcomeModal({ onDismiss }: WelcomeModalProps) {
  const handleGetStarted = () => {
    localStorage.setItem('@breakly_onboarded', 'true');
    onDismiss();
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.4)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '24px',
    }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '32px 24px',
        maxWidth: '340px',
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
      }}>
        <h2 style={{
          fontSize: '22px',
          fontWeight: 700,
          color: COLORS.text,
          marginBottom: '12px',
        }}>
          Hey, welcome to Breakly
        </h2>

        <p style={{
          fontSize: '14px',
          color: COLORS.textSecondary,
          lineHeight: 1.6,
          marginBottom: '24px',
        }}>
          A gentle reminder app that nudges you to stretch, move, and rest — only on the days and hours you choose. Nothing else, nothing fancy. Just a healthier you at work.
        </p>

        <button
          onClick={handleGetStarted}
          style={{
            width: '100%',
            padding: '14px',
            background: COLORS.primary,
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: '15px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Let's go
        </button>
      </div>
    </div>
  );
}
