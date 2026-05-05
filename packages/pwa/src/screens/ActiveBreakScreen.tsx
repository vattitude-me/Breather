import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useRemindersContext } from '../context/RemindersContext';
import { usePlantState } from '../hooks/usePlantState';
import { usePotCollection } from '../hooks/usePotCollection';
import { incrementCompleted } from '../services/notifications';
import { COLORS, DEFAULT_BREAK_DURATION_SECONDS } from '@breather/shared';
import Plant from '../components/Plant';
import '../screens.css';

type Phase = 'counting' | 'rewarding' | 'done';

export default function ActiveBreakScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { reminders } = useRemindersContext();
  const { plantState, progress, water } = usePlantState();
  const { activePot, completeBreak } = usePotCollection();

  const reminderId = searchParams.get('reminderId');
  const titleParam = searchParams.get('title') || 'Break';
  const durationParam = parseInt(searchParams.get('duration') || '0', 10);

  const reminder = reminders.find((r) => r.id === reminderId);
  const breakTitle = reminder?.title || titleParam;
  const breakIcon = reminder?.icon || '🧘';
  const totalSeconds = durationParam || reminder?.breakDurationSeconds || DEFAULT_BREAK_DURATION_SECONDS;

  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const [phase, setPhase] = useState<Phase>('counting');
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (phase !== 'counting' || paused) return;

    timerRef.current = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setPhase('rewarding');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, paused]);

  const handleComplete = useCallback(() => {
    water();
    completeBreak();
    incrementCompleted();
    setPhase('done');
    setTimeout(() => navigate('/home'), 3500);
  }, [water, completeBreak, navigate]);

  useEffect(() => {
    if (phase === 'rewarding') {
      const t = setTimeout(handleComplete, 300);
      return () => clearTimeout(t);
    }
  }, [phase, handleComplete]);

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
      {/* Reward overlay */}
      {(phase === 'rewarding' || phase === 'done') && (
        <div className="active-break-reward-overlay">
          <div className="active-break-watering-can">
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
              <path d="M20 55 L20 35 Q20 25 30 25 L55 25 Q60 25 60 30 L60 55 Q60 60 55 60 L25 60 Q20 60 20 55Z" fill={COLORS.accent} opacity="0.9" />
              <path d="M55 30 L70 20 L72 22 L58 33" fill={COLORS.accent} opacity="0.8" />
              <circle cx="72" cy="18" r="2" fill={COLORS.accentLight} />
              <circle cx="74" cy="22" r="1.5" fill={COLORS.accentLight} />
              <circle cx="70" cy="16" r="1.5" fill={COLORS.accentLight} />
            </svg>
          </div>
          <div className="active-break-water-stream">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="active-break-water-drop" style={{ '--drop-i': i } as React.CSSProperties} />
            ))}
          </div>
          <div className="active-break-plant-reward">
            <Plant stage={plantState.stage} progress={progress} pot={activePot} />
          </div>
          <div className="active-break-sparkles">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="active-break-sparkle" style={{ '--sparkle-i': i } as React.CSSProperties} />
            ))}
          </div>
          <p className="active-break-reward-text">Great job! Your plant is happy!</p>
        </div>
      )}

      {/* Counting phase UI */}
      {phase === 'counting' && (
        <>
          <div className="active-break-header">
            <span className="active-break-icon">{breakIcon}</span>
            <h1 className="active-break-title">Time to {breakTitle}</h1>
            <p className="active-break-subtitle">Relax, breathe, and be present</p>
          </div>

          <div className="active-break-timer-container">
            {/* Circular progress ring */}
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
            {/* Breathing pulse */}
            <div className="active-break-pulse" />
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
