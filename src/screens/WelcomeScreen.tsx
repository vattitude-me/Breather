import { useNavigate } from 'react-router-dom';
import { COLORS } from '../constants';
import '../screens.css';

export default function WelcomeScreen() {
  const navigation = useNavigate();

  const handleGetStarted = () => {
    localStorage.setItem('@breakly_onboarded', 'true');
    navigation('/home');
  };

  return (
    <div className="page" style={{ background: COLORS.background }}>
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 24px',
        textAlign: 'center',
      }}>
        {/* App Icon */}
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '20px',
          background: COLORS.primary,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '36px',
          color: 'white',
          fontWeight: 800,
          marginBottom: '24px',
          boxShadow: '0 8px 24px rgba(232, 97, 77, 0.3)',
        }}>
          B
        </div>

        <h1 style={{ fontSize: '28px', fontWeight: 800, color: COLORS.text, marginBottom: '8px' }}>
          Breakly
        </h1>
        <p style={{ fontSize: '16px', color: COLORS.textSecondary, marginBottom: '40px', lineHeight: 1.5 }}>
          Your friendly nudge to take better breaks
        </p>

        {/* Features */}
        <div style={{ width: '100%', maxWidth: '320px', marginBottom: '40px' }}>
          <FeatureRow icon="⏰" text="Set reminders to stretch, drink water, walk, or rest your eyes" />
          <FeatureRow icon="📅" text="Only get nudged during your working hours" />
          <FeatureRow icon="🔒" text="100% private — nothing leaves your device" />
          <FeatureRow icon="⚡" text="Ready in seconds — tap a preset and you're done" />
        </div>

        {/* CTA */}
        <button
          onClick={handleGetStarted}
          style={{
            width: '100%',
            maxWidth: '280px',
            padding: '16px',
            background: COLORS.primary,
            color: 'white',
            border: 'none',
            borderRadius: '14px',
            fontSize: '16px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(232, 97, 77, 0.35)',
          }}
        >
          Get Started
        </button>

        <p style={{ fontSize: '12px', color: COLORS.textSecondary, marginTop: '16px' }}>
          No account needed. Completely free.
        </p>
      </div>
    </div>
  );
}

function FeatureRow({ icon, text }: { icon: string; text: string }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px',
      marginBottom: '16px',
      textAlign: 'left',
    }}>
      <span style={{ fontSize: '20px', flexShrink: 0 }}>{icon}</span>
      <p style={{ fontSize: '14px', color: COLORS.text, lineHeight: 1.4, margin: 0 }}>{text}</p>
    </div>
  );
}
