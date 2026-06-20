import { useState } from 'react';
import { COLORS, POTS_CATALOG, DEFAULT_SCHEDULE, DEFAULT_SETTINGS, saveSettings } from '@breather/shared';
import { DayOfWeek } from '@breather/shared/src/types';
import SchedulePicker from '../components/SchedulePicker';

interface WelcomeModalProps {
  onDismiss: () => void;
}

const SLIDES = [
  {
    emoji: '🌱',
    title: 'Welcome to Breather',
    subtitle: 'Take breaks. Grow your plant.',
    description: 'Set reminders throughout your day to stretch, hydrate, and rest your eyes. Small breaks, big impact on your wellbeing.',
  },
  {
    emoji: '🪴',
    title: 'Collect Unique Pots',
    subtitle: 'Every break grows your garden.',
    description: 'Complete breaks to grow leaves on your plant and unlock beautiful collectible pots. There are 7 to discover - can you find them all?',
  },
  {
    emoji: '⏱️',
    title: 'Your Break, Your Way',
    subtitle: 'Flexible timers that fit your routine.',
    description: 'Choose how often you want reminders and how long your breaks last. From quick 30-second resets to 5-minute mindful pauses.',
  },
];

export default function WelcomeModal({ onDismiss }: WelcomeModalProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeDays, setActiveDays] = useState<DayOfWeek[]>([...DEFAULT_SCHEDULE.activeDays]);
  const [startHour, setStartHour] = useState(DEFAULT_SCHEDULE.startHour);
  const [endHour, setEndHour] = useState(DEFAULT_SCHEDULE.endHour);

  const isLastSlide = currentSlide === SLIDES.length - 1;
  const isSetupStep = currentSlide === SLIDES.length;

  const handleNext = () => {
    if (isLastSlide) {
      setCurrentSlide(SLIDES.length);
    } else {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const handleFinish = () => {
    localStorage.setItem('@breather_onboarded', 'true');
    const schedule = { activeDays, startHour, endHour };
    saveSettings({
      ...DEFAULT_SETTINGS,
      defaultSchedule: schedule,
    });
    onDismiss();
  };

  const formatDuration = (seconds: number): string => {
    if (seconds >= 60) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return secs > 0 ? `${mins}m ${secs}s` : `${mins} min`;
    }
    return `${seconds}s`;
  };

  const potPreview = POTS_CATALOG.slice(0, 3);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px',
    }}>
      <div style={{
        background: 'white',
        borderRadius: '24px',
        padding: '32px 24px 24px',
        maxWidth: '360px',
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 24px 80px rgba(0, 0, 0, 0.2)',
        animation: 'fadeIn 0.3s ease',
        overflow: 'hidden',
      }}>
        {!isSetupStep ? (
          <>
            {/* Slide content */}
            <div style={{
              fontSize: '48px',
              marginBottom: '16px',
              animation: 'fadeIn 0.4s ease',
            }}>
              {SLIDES[currentSlide].emoji}
            </div>

            <h2 style={{
              fontSize: '22px',
              fontWeight: 700,
              color: COLORS.text,
              marginBottom: '8px',
            }}>
              {SLIDES[currentSlide].title}
            </h2>

            <p style={{
              fontSize: '15px',
              fontWeight: 600,
              color: COLORS.primary,
              marginBottom: '12px',
            }}>
              {SLIDES[currentSlide].subtitle}
            </p>

            <p style={{
              fontSize: '14px',
              color: COLORS.textSecondary,
              lineHeight: 1.6,
              marginBottom: '20px',
              minHeight: '66px',
            }}>
              {SLIDES[currentSlide].description}
            </p>

            {/* Pot preview on slide 2 */}
            {currentSlide === 1 && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '12px',
                marginBottom: '20px',
              }}>
                {potPreview.map((pot, i) => (
                  <div key={pot.id} style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '14px',
                    backgroundColor: i === 0 ? COLORS.secondaryLight : COLORS.cardLavender,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: `1px solid ${COLORS.border}`,
                    position: 'relative',
                  }}>
                    <svg width="32" height="28" viewBox="0 0 40 36">
                      <path
                        d="M8 12 L8 28 Q8 32 12 32 L28 32 Q32 32 32 28 L32 12 Z"
                        fill={pot.colors.body}
                      />
                      <rect x="6" y="10" width="28" height="4" rx="2" fill={pot.colors.rim} />
                    </svg>
                    {i === 0 && (
                      <div style={{
                        position: 'absolute',
                        bottom: '-4px',
                        right: '-4px',
                        width: '18px',
                        height: '18px',
                        borderRadius: '9px',
                        backgroundColor: '#4CAF50',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <span style={{ fontSize: '10px', color: 'white' }}>✓</span>
                      </div>
                    )}
                    {i > 0 && (
                      <div style={{
                        position: 'absolute',
                        bottom: '-4px',
                        right: '-4px',
                        width: '18px',
                        height: '18px',
                        borderRadius: '9px',
                        backgroundColor: COLORS.disabled,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <span style={{ fontSize: '9px', color: 'white' }}>🔒</span>
                      </div>
                    )}
                  </div>
                ))}
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '14px',
                  backgroundColor: COLORS.cardMint,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `1px dashed ${COLORS.disabled}`,
                }}>
                  <span style={{ fontSize: '14px', color: COLORS.textSecondary, fontWeight: 600 }}>+4</span>
                </div>
              </div>
            )}

            {/* Timer preview on slide 3 */}
            {currentSlide === 2 && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '8px',
                marginBottom: '20px',
                flexWrap: 'wrap',
              }}>
                {[30, 60, 120, 300].map((sec) => (
                  <div key={sec} style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    backgroundColor: COLORS.primaryLight,
                    border: `1px solid ${COLORS.border}`,
                  }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: COLORS.primary }}>
                      {formatDuration(sec)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Dots indicator */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '8px',
              marginBottom: '20px',
            }}>
              {SLIDES.map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: i === currentSlide ? '20px' : '8px',
                    height: '8px',
                    borderRadius: '4px',
                    backgroundColor: i === currentSlide ? COLORS.primary : COLORS.border,
                    transition: 'all 0.3s ease',
                  }}
                />
              ))}
            </div>

            {/* Navigation buttons */}
            <div style={{ display: 'flex', gap: '10px' }}>
              {currentSlide > 0 && (
                <button
                  onClick={() => setCurrentSlide(currentSlide - 1)}
                  style={{
                    flex: 1,
                    padding: '14px',
                    background: COLORS.primaryLight,
                    color: COLORS.primary,
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '15px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Back
                </button>
              )}
              <button
                onClick={handleNext}
                style={{
                  flex: currentSlide === 0 ? undefined : 1,
                  width: currentSlide === 0 ? '100%' : undefined,
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
                {isLastSlide ? 'Set Up My Breaks' : 'Next'}
              </button>
            </div>

            {/* Skip link */}
            {currentSlide < SLIDES.length - 1 && (
              <button
                onClick={() => {
                  localStorage.setItem('@breather_onboarded', 'true');
                  onDismiss();
                }}
                style={{
                  marginTop: '12px',
                  background: 'none',
                  border: 'none',
                  color: COLORS.textSecondary,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                Skip intro
              </button>
            )}
          </>
        ) : (
          <>
            {/* Setup step */}
            <div style={{ fontSize: '28px', marginBottom: '12px' }}>⚙️</div>
            <h2 style={{
              fontSize: '20px',
              fontWeight: 700,
              color: COLORS.text,
              marginBottom: '4px',
            }}>
              Quick Setup
            </h2>
            <p style={{
              fontSize: '13px',
              color: COLORS.textSecondary,
              marginBottom: '20px',
            }}>
              When should we remind you to take breaks?
            </p>

            {/* Work schedule */}
            <div style={{ textAlign: 'left', marginBottom: '24px' }}>
              <SchedulePicker
                activeDays={activeDays}
                startHour={startHour}
                endHour={endHour}
                onDaysChange={setActiveDays}
                onStartHourChange={setStartHour}
                onEndHourChange={setEndHour}
              />
            </div>

            {/* Finish buttons */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button
                onClick={() => setCurrentSlide(SLIDES.length - 1)}
                style={{
                  padding: '10px 16px',
                  background: 'none',
                  color: COLORS.textSecondary,
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Back
              </button>
              <button
                onClick={handleFinish}
                style={{
                  flex: 1,
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
                I Deserve Breaks
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
