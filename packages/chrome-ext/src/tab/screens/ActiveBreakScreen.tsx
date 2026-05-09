import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useRemindersContext } from '../context/RemindersContext';
import { usePlantState } from '../hooks/usePlantState';
import { usePotCollection } from '../hooks/usePotCollection';
import { recordBreakCompleted } from '../../lib/progressService';

const INSTRUCTIONS: Record<string, string[]> = {
  '🧘': ['Roll your shoulders back slowly', 'Reach both arms overhead and stretch', 'Gently tilt your head side to side', 'Twist your torso left, then right', 'Touch your toes or reach towards them', 'Stretch your wrists and fingers'],
  '💧': ['Take a slow sip of water', 'Refill your glass if it is empty', 'Remember - aim for 8 glasses a day', 'Hydration boosts your energy', 'Feel the water refresh you', 'Notice how your body feels'],
  '🚶': ['Stand up from your desk', 'Take a short walk around', 'Look out the window if you can', 'Step in place if space is limited', 'Swing your arms gently', 'Feel the movement in your legs'],
  '👁️': ['Close your eyes gently', 'Look at something 20 feet away', 'Blink deliberately 10 times', 'Gently massage around your temples', 'Cup your palms over your eyes', 'Let your eye muscles relax'],
  '🧍': ['Sit up straight in your chair', 'Pull your shoulders back and down', 'Align your ears over your shoulders', 'Unclench your jaw', 'Relax your tongue from the roof of your mouth', 'Feel your spine lengthen'],
  '🌬️': ['Breathe in deeply for 4 seconds', 'Hold your breath for 4 seconds', 'Exhale slowly for 6 seconds', 'Repeat the cycle', 'Notice the calm settling in', 'Let each breath be deeper'],
};

const DEFAULT_INSTRUCTIONS = [
  'Step away from your screen',
  'Take a few deep breaths',
  'Notice how your body feels',
  'Return refreshed and focused',
];

export default function ActiveBreakScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { reminders } = useRemindersContext();
  const { water } = usePlantState();
  const { completeBreak } = usePotCollection();

  const reminderId = searchParams.get('reminderId');
  const durationParam = searchParams.get('duration');
  const totalSeconds = durationParam ? parseInt(durationParam) : 60;

  const reminder = reminders.find((r) => r.id === reminderId);
  const icon = reminder?.icon || '🧘';
  const instructions = INSTRUCTIONS[icon] || DEFAULT_INSTRUCTIONS;

  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const [paused, setPaused] = useState(false);
  const [instructionIndex, setInstructionIndex] = useState(0);
  const [completed, setCompleted] = useState(false);
  const intervalRef = useRef<number | null>(null);

  const progress = ((totalSeconds - secondsLeft) / totalSeconds) * 100;

  useEffect(() => {
    if (paused || completed) return;
    intervalRef.current = window.setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(intervalRef.current!);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [paused, completed]);

  useEffect(() => {
    if (secondsLeft === 0 && !completed) {
      handleComplete();
    }
  }, [secondsLeft, completed]);

  useEffect(() => {
    const timer = setInterval(() => {
      setInstructionIndex((i) => (i + 1) % instructions.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [instructions.length]);

  const handleComplete = useCallback(async () => {
    setCompleted(true);
    await water();
    await completeBreak();
    await recordBreakCompleted(totalSeconds);
    setTimeout(() => navigate('/home'), 2000);
  }, [water, completeBreak, totalSeconds, navigate]);

  const handleSkip = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    navigate('/home');
  };

  const minutes = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const timeStr = `${minutes}:${secs.toString().padStart(2, '0')}`;

  const circumference = 2 * Math.PI * 88;
  const dashOffset = circumference * (1 - progress / 100);

  return (
    <div className="break-screen">
      {completed ? (
        <>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
          <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Great job!</div>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Your plant just got watered</div>
        </>
      ) : (
        <>
          <div style={{ fontSize: 36, marginBottom: 16 }}>{icon}</div>
          <div className="break-timer">
            <svg width="200" height="200" viewBox="0 0 200 200">
              <circle cx="100" cy="100" r="88" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="8" />
              <circle
                cx="100" cy="100" r="88"
                fill="none"
                stroke="var(--accent)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                transform="rotate(-90 100 100)"
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
            </svg>
            <div className="break-timer-text">{timeStr}</div>
          </div>
          <div className="break-instruction">
            {instructions[instructionIndex]}
          </div>
          <div className="break-actions">
            <button className="btn btn-secondary" onClick={() => setPaused(!paused)}>
              {paused ? '▶ Resume' : '⏸ Pause'}
            </button>
            <button className="btn btn-danger" onClick={handleSkip}>
              Skip
            </button>
          </div>
        </>
      )}
    </div>
  );
}
