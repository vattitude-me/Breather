import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { nanoid } from 'nanoid';
import { Reminder } from '@breather/shared/src/types';
import { BREAK_DURATION_OPTIONS, DEFAULT_SCHEDULE, DEFAULT_BREAK_DURATION_SECONDS } from '@breather/shared/src/constants';
import { useRemindersContext } from '../context/RemindersContext';

const SLIDES = [
  { icon: '🌱', title: 'Welcome to Breather', text: 'Take regular breaks to stay healthy and productive. Your virtual plant grows with every break you take.' },
  { icon: '🪴', title: 'Collect Pots', text: 'Unlock beautiful pots as you complete more breaks. Start with terracotta and work your way up to marble!' },
  { icon: '⏱️', title: 'Your Schedule', text: 'Choose how often you want to be reminded and how long your breaks should be. We will handle the rest.' },
];

const INTERVAL_OPTIONS = [15, 30, 45, 60, 90, 120];

export default function WelcomeScreen() {
  const navigate = useNavigate();
  const { dispatch } = useRemindersContext();
  const [slide, setSlide] = useState(0);
  const [showSetup, setShowSetup] = useState(false);
  const [interval, setInterval] = useState(60);
  const [breakDuration, setBreakDuration] = useState(DEFAULT_BREAK_DURATION_SECONDS);

  const handleNext = () => {
    if (slide < SLIDES.length - 1) {
      setSlide(slide + 1);
    } else {
      setShowSetup(true);
    }
  };

  const handleBack = () => {
    if (showSetup) {
      setShowSetup(false);
    } else if (slide > 0) {
      setSlide(slide - 1);
    }
  };

  const handleComplete = () => {
    const reminder: Reminder = {
      id: nanoid(),
      title: 'Stretch',
      icon: '🧘',
      intervalMinutes: interval,
      isActive: true,
      createdAt: new Date().toISOString(),
      snoozeDurationMinutes: 10,
      breakDurationSeconds: breakDuration,
      schedule: { activeDays: [...DEFAULT_SCHEDULE.activeDays], startHour: DEFAULT_SCHEDULE.startHour, endHour: DEFAULT_SCHEDULE.endHour },
    };
    dispatch({ type: 'ADD', payload: reminder });
    chrome.storage.local.set({ '@breather_onboarded': true });
    navigate('/home');
  };

  return (
    <div className="welcome-overlay">
      <div className="welcome-card">
        {!showSetup ? (
          <>
            <div className="welcome-icon">{SLIDES[slide].icon}</div>
            <div className="welcome-title">{SLIDES[slide].title}</div>
            <div className="welcome-text">{SLIDES[slide].text}</div>
            <div className="welcome-dots">
              {SLIDES.map((_, i) => (
                <div key={i} className={`welcome-dot ${i === slide ? 'active' : ''}`} />
              ))}
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              {slide > 0 && (
                <button className="btn btn-secondary" onClick={handleBack}>Back</button>
              )}
              <button className="btn btn-primary" onClick={handleNext}>
                {slide === SLIDES.length - 1 ? 'Set Up' : 'Next'}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="welcome-icon">⏱️</div>
            <div className="welcome-title">Quick Setup</div>

            <div style={{ marginBottom: 16, textAlign: 'left' }}>
              <div className="form-label">Remind me every</div>
              <div className="chip-group" style={{ justifyContent: 'center' }}>
                {INTERVAL_OPTIONS.map((v) => (
                  <button
                    key={v}
                    className={`chip ${interval === v ? 'selected' : ''}`}
                    onClick={() => setInterval(v)}
                  >
                    {v}m
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 24, textAlign: 'left' }}>
              <div className="form-label">Break duration</div>
              <div className="chip-group" style={{ justifyContent: 'center' }}>
                {BREAK_DURATION_OPTIONS.map((s) => (
                  <button
                    key={s}
                    className={`chip ${breakDuration === s ? 'selected' : ''}`}
                    onClick={() => setBreakDuration(s)}
                  >
                    {s >= 60 ? `${s / 60}m` : `${s}s`}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button className="btn btn-secondary" onClick={handleBack}>Back</button>
              <button className="btn btn-primary" onClick={handleComplete}>
                I Deserve Breaks
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
