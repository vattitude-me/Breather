import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useRemindersContext } from '../context/RemindersContext';
import { incrementCompleted } from '../services/notifications';
import { COLORS, DEFAULT_BREAK_DURATION_SECONDS, waterPlant } from '@breather/shared';
import '../screens.css';

type Phase = 'counting' | 'complete';

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
            <p className="active-break-subtitle">Relax, breathe, and be present</p>
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
