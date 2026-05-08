import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useRemindersContext } from '../context/RemindersContext';
import { incrementCompleted } from '../services/notifications';
import { COLORS, DEFAULT_BREAK_DURATION_SECONDS, waterPlant } from '@breather/shared';
import '../screens.css';

type Phase = 'counting' | 'complete';

interface BreakGuidance {
  subtitle: string;
  instructions: string[];
  animationClass: string;
}

function getBreakGuidance(title: string): BreakGuidance {
  const key = title.toLowerCase();

  if (key.includes('stretch')) {
    return {
      subtitle: 'Loosen up those muscles',
      instructions: [
        'Roll your shoulders back slowly',
        'Reach your arms overhead and hold',
        'Gently tilt your neck side to side',
        'Twist your torso left and right',
      ],
      animationClass: 'break-anim-stretch',
    };
  }

  if (key.includes('water') || key.includes('hydra') || key.includes('drink')) {
    return {
      subtitle: 'Time to hydrate',
      instructions: [
        'Take a nice big sip of water',
        'Refill your glass if it is empty',
        'Your body needs 8 glasses a day',
        'Hydration boosts focus and energy',
      ],
      animationClass: 'break-anim-water',
    };
  }

  if (key.includes('eye') || key.includes('blink')) {
    return {
      subtitle: 'Rest your eyes',
      instructions: [
        'Close your eyes gently for 5 seconds',
        'Look at something 20 feet away',
        'Blink slowly 10 times',
        'Gently massage your temples',
      ],
      animationClass: 'break-anim-eyes',
    };
  }

  if (key.includes('walk') || key.includes('move') || key.includes('step')) {
    return {
      subtitle: 'Get moving',
      instructions: [
        'Stand up and take a short walk',
        'Walk to a window and look outside',
        'Do 10 steps in place',
        'Shake out your arms and legs',
      ],
      animationClass: 'break-anim-walk',
    };
  }

  if (key.includes('posture')) {
    return {
      subtitle: 'Check your posture',
      instructions: [
        'Sit up straight, feet flat on floor',
        'Pull your shoulders back and down',
        'Align your ears over your shoulders',
        'Unclench your jaw and relax your face',
      ],
      animationClass: 'break-anim-posture',
    };
  }

  if (key.includes('breath') || key.includes('deep')) {
    return {
      subtitle: 'Breathe deeply',
      instructions: [
        'Inhale slowly through your nose for 4 seconds',
        'Hold your breath for 4 seconds',
        'Exhale slowly through your mouth for 6 seconds',
        'Repeat and feel the calm',
      ],
      animationClass: 'break-anim-breathe',
    };
  }

  return {
    subtitle: 'Relax, breathe, and be present',
    instructions: [
      'Step away from your screen',
      'Take a few deep breaths',
      'Notice how your body feels',
      'Return when you are ready',
    ],
    animationClass: 'break-anim-default',
  };
}

export default function ActiveBreakScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { reminders } = useRemindersContext();

  const reminderId = searchParams.get('reminderId');
  const titleParam = searchParams.get('title') || 'Break';
  const durationParam = parseInt(searchParams.get('duration') || '0', 10);

  const reminder = reminders.find((r) => r.id === reminderId);
  const breakTitle = reminder?.title || titleParam;
  const breakIcon = reminder?.icon || '🧘';
  const totalSeconds = durationParam || reminder?.breakDurationSeconds || DEFAULT_BREAK_DURATION_SECONDS;

  const guidance = getBreakGuidance(breakTitle);

  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const [phase, setPhase] = useState<Phase>('counting');
  const [paused, setPaused] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (phase !== 'counting' || paused) return;

    timerRef.current = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setPhase('complete');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, paused]);

  useEffect(() => {
    if (phase !== 'counting' || paused) return;
    const stepInterval = Math.max(5000, (totalSeconds * 1000) / guidance.instructions.length);
    const id = window.setInterval(() => {
      setCurrentStep((s) => (s + 1) % guidance.instructions.length);
    }, stepInterval);
    return () => window.clearInterval(id);
  }, [phase, paused, totalSeconds, guidance.instructions.length]);

  useEffect(() => {
    if (phase === 'complete') {
      waterPlant();
      incrementCompleted();
      const t = setTimeout(() => {
        navigate('/home', { state: { justCompletedBreak: true } });
      }, 1500);
      return () => clearTimeout(t);
    }
  }, [phase, navigate]);

  const handleSkip = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    navigate('/home');
  };

  const handlePause = () => setPaused((p) => !p);

  const progressPct = ((totalSeconds - secondsLeft) / totalSeconds) * 100;
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeDisplay = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <div className="active-break-screen">
      {/* Break complete message */}
      {phase === 'complete' && (
        <div className="active-break-complete">
          <span className="active-break-complete-icon">✓</span>
          <h2 className="active-break-complete-title">Break Complete!</h2>
          <p className="active-break-complete-subtitle">Heading back to your plant...</p>
        </div>
      )}

      {/* Counting phase UI */}
      {phase === 'counting' && (
        <>
          <div className="active-break-header">
            <span className="active-break-icon">{breakIcon}</span>
            <h1 className="active-break-title">Time to {breakTitle}</h1>
            <p className="active-break-subtitle">{guidance.subtitle}</p>
          </div>

          <div className="active-break-timer-container">
            <svg className="active-break-ring" viewBox="0 0 200 200">
              <circle cx="100" cy="100" r="88" fill="none" stroke={COLORS.border} strokeWidth="6" />
              <circle
                cx="100" cy="100" r="88"
                fill="none"
                stroke={COLORS.accent}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 88}
                strokeDashoffset={2 * Math.PI * 88 * (1 - progressPct / 100)}
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
            </svg>
            <div className="active-break-timer-text">
              <span className="active-break-time">{timeDisplay}</span>
              <span className="active-break-time-label">{paused ? 'Paused' : 'remaining'}</span>
            </div>
            <div className={`active-break-pulse ${guidance.animationClass}`} />
          </div>

          {/* Contextual instruction */}
          <div style={{
            textAlign: 'center',
            padding: '12px 24px',
            minHeight: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <p key={currentStep} style={{
              fontSize: '14px',
              fontWeight: 500,
              color: COLORS.accent,
              margin: 0,
              animation: 'fadeIn 0.5s ease',
            }}>
              {guidance.instructions[currentStep]}
            </p>
          </div>

          <div className="active-break-controls">
            <button className="active-break-btn-secondary" onClick={handlePause}>
              {paused ? 'Resume' : 'Pause'}
            </button>
            <button className="active-break-btn-skip" onClick={handleSkip}>
              Skip
            </button>
          </div>
        </>
      )}
    </div>
  );
}
