import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useRemindersContext } from '../context/RemindersContext';
import { scheduleReminder, cancelReminder, isWithinSchedule, getNextFireTime } from '../services/notifications';
import { getInstallPrompt, onInstallPromptChange } from '../services/installPrompt';
import {
  COLORS, APP_NAME, WELLNESS_TIPS, PLANT_MOTIVATIONS, PLANT_DAILY_COLORS,
  Reminder, loadPlantState, savePlantState, stageFromPoints,
  PLANT_DECAY_PER_DAY, STORAGE_KEYS, POTS_CATALOG,
} from '@breather/shared';
import Logo from '../components/Logo';
import Plant from '../components/Plant';
import PotsDrawer from '../components/PotsDrawer';
import { usePlantState } from '../hooks/usePlantState';
import { usePotCollection } from '../hooks/usePotCollection';
import '../screens.css';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function getFormattedDate(): string {
  const now = new Date();
  return now.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function HeaderCountdown({ reminders }: { reminders: Reminder[] }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const hasActiveReminders = reminders.some((r) => r.isActive);
  const hasOutsideHours = reminders.some((r) => r.isActive && !isWithinSchedule(r.schedule));

  const nextBreak = useMemo(() => {
    let earliest: { time: Date; reminder: Reminder } | null = null;
    for (const r of reminders) {
      if (!isWithinSchedule(r.schedule)) continue;
      const fire = getNextFireTime(r);
      if (!fire) continue;
      if (!earliest || fire.getTime() < earliest.time.getTime()) {
        earliest = { time: fire, reminder: r };
      }
    }
    return earliest;
  }, [reminders, now]);

  if (reminders.length === 0) return null;

  if (!nextBreak && hasActiveReminders && hasOutsideHours) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '4px 10px',
        backgroundColor: COLORS.secondaryLight,
        borderRadius: '20px',
        border: `1px solid ${COLORS.border}`,
      }}>
        <span style={{ fontSize: '11px' }}>😴</span>
        <span style={{ fontSize: '11px', fontWeight: 600, color: COLORS.textSecondary }}>Paused</span>
      </div>
    );
  }

  if (!nextBreak && !hasActiveReminders && reminders.length > 0) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '4px 10px',
        backgroundColor: COLORS.cardMint,
        borderRadius: '20px',
        border: `1px solid ${COLORS.border}`,
      }}>
        <span style={{ fontSize: '11px' }}>⏸️</span>
        <span style={{ fontSize: '11px', fontWeight: 600, color: COLORS.textSecondary }}>Off</span>
      </div>
    );
  }

  if (!nextBreak) return null;

  const diffMs = Math.max(0, nextBreak.time.getTime() - now);
  const totalSecs = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSecs / 3600);
  const minutes = Math.floor((totalSecs % 3600) / 60);
  const seconds = totalSecs % 60;

  const pad = (n: number) => String(n).padStart(2, '0');
  const timeStr = hours > 0
    ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
    : `${pad(minutes)}:${pad(seconds)}`;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '5px',
      padding: '4px 10px',
      backgroundColor: COLORS.primaryLight,
      borderRadius: '20px',
      border: `1px solid ${COLORS.border}`,
    }}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={COLORS.primary} strokeWidth="2.5" strokeLinecap="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
      <span style={{ fontSize: '12px', fontWeight: 700, color: COLORS.primary, fontVariantNumeric: 'tabular-nums' }}>
        {timeStr}
      </span>
    </div>
  );
}

export default function HomeScreen() {
  const { reminders, dispatch } = useRemindersContext();
  const navigation = useNavigate();
  const location = useLocation();
  const { plantState, progress, water, dailyLeaves, leafDrop, triggerLeafDrop } = usePlantState();
  const { activePot, nextUnlock, newUnlockId, equip, completeBreak, dismissUnlock, catalog, state: potState } = usePotCollection();
  const [motivation, setMotivation] = useState<{ icon: string; text: string } | null>(null);
  const [isWatering, setIsWatering] = useState(false);
  const [showWateringOverlay, setShowWateringOverlay] = useState(false);
  const [showPotsDrawer, setShowPotsDrawer] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [devColorIndex, setDevColorIndex] = useState<number | undefined>(undefined);
  const [devPotIndex, setDevPotIndex] = useState<number | undefined>(undefined);
  const [devMode, setDevMode] = useState(
    () => localStorage.getItem(STORAGE_KEYS.DEV_MODE) === 'true'
  );

  useEffect(() => {
    const checkDevMode = () => setDevMode(localStorage.getItem(STORAGE_KEYS.DEV_MODE) === 'true');
    window.addEventListener('storage', checkDevMode);
    window.addEventListener('focus', checkDevMode);
    return () => {
      window.removeEventListener('storage', checkDevMode);
      window.removeEventListener('focus', checkDevMode);
    };
  }, []);

  const triggerWatering = useCallback(() => {
    setIsWatering(true);
    setTimeout(() => setIsWatering(false), 1500);
  }, []);

  const showMotivation = useCallback(() => {
    const msg = PLANT_MOTIVATIONS[Math.floor(Math.random() * PLANT_MOTIVATIONS.length)];
    setMotivation(msg);
    setTimeout(() => setMotivation(null), 2000);
  }, []);

  useEffect(() => {
    const state = location.state as { justCompletedBreak?: boolean } | null;
    if (state?.justCompletedBreak) {
      window.history.replaceState({}, '');
      completeBreak();
      setShowWateringOverlay(true);
      showMotivation();
      setTimeout(() => {
        setShowWateringOverlay(false);
      }, 3500);
    }
  }, [location.state]);

  const handleWater = () => {
    water();
    const unlocked = completeBreak();
    if (unlocked) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
    showMotivation();
    triggerWatering();
  };

  useEffect(() => {
    const handler = () => {
      showMotivation();
      triggerWatering();
    };
    window.addEventListener('plant-updated', handler);
    return () => window.removeEventListener('plant-updated', handler);
  }, [showMotivation, triggerWatering]);

  useEffect(() => {
    if (newUnlockId) {
      setShowConfetti(true);
      const t = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(t);
    }
  }, [newUnlockId]);

  const [notifPermission, setNotifPermission] = useState(
    () => 'Notification' in window ? Notification.permission : 'denied'
  );
  const [installPrompt, setInstallPrompt] = useState<any>(getInstallPrompt);
  const isInstalled = window.matchMedia('(display-mode: standalone)').matches;

  useEffect(() => {
    if (isInstalled) return;
    return onInstallPromptChange((prompt) => {
      setInstallPrompt(prompt);
    });
  }, [isInstalled]);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const result = await installPrompt.userChoice;
    if (result.outcome === 'accepted') {
      setInstallPrompt(null);
    }
  };

  const handleEnableNotifications = useCallback(async () => {
    const result = await Notification.requestPermission();
    setNotifPermission(result);
  }, []);


  const handleToggle = async (reminder: Reminder) => {
    try {
      if (reminder.isActive && reminder.notificationId) {
        await cancelReminder(reminder.notificationId);
        dispatch({
          type: 'UPDATE',
          payload: { ...reminder, isActive: false, notificationId: undefined },
        });
      } else {
        const notificationId = await scheduleReminder(reminder);
        dispatch({
          type: 'UPDATE',
          payload: { ...reminder, isActive: true, notificationId },
        });
      }
    } catch (e) {
      console.error('Failed to toggle reminder:', e);
      dispatch({
        type: 'UPDATE',
        payload: { ...reminder, isActive: !reminder.isActive },
      });
    }
  };

  const handleDelete = (reminder: Reminder) => {
    if (!window.confirm(`Delete "${reminder.title}"?`)) return;

    if (reminder.notificationId) {
      cancelReminder(reminder.notificationId).catch(console.error);
    }
    dispatch({ type: 'DELETE', payload: reminder.id });
  };

  const formatInterval = (minutes: number): string => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${minutes} min`;
  };

  const getCategoryColor = (index: number): string => {
    const colors = [COLORS.cardPink, COLORS.cardPeach, COLORS.cardMint, COLORS.cardLavender];
    return colors[index % colors.length];
  };

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%' }}>
          <Logo />
          <h1>{APP_NAME}</h1>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <HeaderCountdown reminders={reminders} />
            {!isInstalled && installPrompt && (
              <button
                onClick={handleInstall}
                className="page-header-back"
                title="Install Breather"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={COLORS.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="page-content" style={{ padding: '16px 20px' }}>
        {/* Greeting */}
        <p style={{ fontSize: '13px', color: COLORS.textSecondary, margin: '0 0 14px', fontWeight: 500 }}>
          {getGreeting()} · {getFormattedDate()}
        </p>

        {/* My Routines */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: COLORS.text, margin: 0 }}>My Break Routines</h2>
            <button
              onClick={() => navigation('/add-reminder')}
              style={{ background: 'none', border: 'none', color: COLORS.primary, fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
            >
              + Add New
            </button>
          </div>

          {reminders.length === 0 ? (
            <button
              onClick={() => navigation('/add-reminder')}
              style={{
                width: '100%',
                backgroundColor: COLORS.primaryLight,
                borderRadius: '14px',
                padding: '28px',
                border: `2px dashed ${COLORS.primary}`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                cursor: 'pointer',
              }}
            >
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '24px',
                backgroundColor: 'rgba(232, 97, 77, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '10px',
              }}>
                <span style={{ fontSize: '24px', color: COLORS.primary, fontWeight: 600 }}>+</span>
              </div>
              <span style={{ fontSize: '15px', fontWeight: 700, color: COLORS.text, marginBottom: '4px' }}>Create a break routine</span>
              <span style={{ fontSize: '13px', color: COLORS.textSecondary }}>Set reminders to stretch, move, and rest</span>
            </button>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: reminders.length <= 2 ? 'column' : 'row',
              flexWrap: reminders.length <= 2 ? 'nowrap' : 'wrap',
              gap: '10px',
            }}>
              {reminders.map((item, index) => {
                const useListLayout = reminders.length <= 2;
                const statusColor = !item.isActive ? COLORS.disabled : isWithinSchedule(item.schedule) ? '#4CAF50' : COLORS.secondary;
                const statusText = !item.isActive ? 'Paused' : isWithinSchedule(item.schedule) ? 'Active' : 'Outside hours';

                return useListLayout ? (
                  <div key={item.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    backgroundColor: getCategoryColor(index),
                    borderRadius: '14px',
                    padding: '12px 14px',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                  }}>
                    <button
                      onClick={() => navigation(`/edit-reminder/${item.id}`)}
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '12px',
                        backgroundColor: 'rgba(255,255,255,0.7)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: 'none',
                        cursor: 'pointer',
                        flexShrink: 0,
                      }}
                    >
                      <span style={{ fontSize: '20px' }}>{item.icon}</span>
                    </button>
                    <button
                      onClick={() => navigation(`/edit-reminder/${item.id}`)}
                      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', flex: 1, minWidth: 0 }}
                    >
                      <div style={{ fontSize: '14px', fontWeight: 700, color: COLORS.text }}>{item.title}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                        <span style={{ fontSize: '12px', color: COLORS.textSecondary }}>Every {formatInterval(item.intervalMinutes)}</span>
                        <div style={{ width: '3px', height: '3px', borderRadius: '50%', backgroundColor: COLORS.disabled }} />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <div style={{ width: '6px', height: '6px', borderRadius: '3px', backgroundColor: statusColor }} />
                          <span style={{ fontSize: '11px', color: statusColor === '#4CAF50' ? '#4CAF50' : COLORS.textSecondary, fontWeight: 500 }}>{statusText}</span>
                        </div>
                      </div>
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      <button
                        onClick={() => handleDelete(item)}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '10px',
                          backgroundColor: 'rgba(239, 68, 68, 0.08)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={COLORS.danger} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                      <label style={{ position: 'relative', display: 'inline-block', width: '46px', height: '28px' }}>
                        <input
                          type="checkbox"
                          checked={item.isActive}
                          onChange={() => handleToggle(item)}
                          style={{ opacity: 0, width: 0, height: 0 }}
                        />
                        <span style={{
                          position: 'absolute',
                          cursor: 'pointer',
                          inset: 0,
                          backgroundColor: item.isActive ? COLORS.primary : COLORS.disabled,
                          borderRadius: '28px',
                          transition: '0.3s',
                        }}>
                          <span style={{
                            position: 'absolute',
                            left: item.isActive ? '21px' : '3px',
                            top: '3px',
                            width: '22px',
                            height: '22px',
                            backgroundColor: '#FFFFFF',
                            borderRadius: '50%',
                            transition: '0.3s',
                          }} />
                        </span>
                      </label>
                    </div>
                  </div>
                ) : (
                  <div key={item.id} style={{ width: 'calc(50% - 5px)' }}>
                    <div style={{
                      borderRadius: '14px',
                      padding: '14px',
                      backgroundColor: getCategoryColor(index),
                      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <button
                          onClick={() => navigation(`/edit-reminder/${item.id}`)}
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '12px',
                            backgroundColor: 'rgba(255,255,255,0.7)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          <span style={{ fontSize: '20px' }}>{item.icon}</span>
                        </button>
                        <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '26px' }}>
                          <input
                            type="checkbox"
                            checked={item.isActive}
                            onChange={() => handleToggle(item)}
                            style={{ opacity: 0, width: 0, height: 0 }}
                          />
                          <span style={{
                            position: 'absolute',
                            cursor: 'pointer',
                            inset: 0,
                            backgroundColor: item.isActive ? COLORS.primary : COLORS.disabled,
                            borderRadius: '26px',
                            transition: '0.3s',
                          }}>
                            <span style={{
                              position: 'absolute',
                              left: item.isActive ? '20px' : '3px',
                              top: '3px',
                              width: '20px',
                              height: '20px',
                              backgroundColor: '#FFFFFF',
                              borderRadius: '50%',
                              transition: '0.3s',
                            }} />
                          </span>
                        </label>
                      </div>
                      <button
                        onClick={() => navigation(`/edit-reminder/${item.id}`)}
                        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', width: '100%' }}
                      >
                        <div style={{ fontSize: '14px', fontWeight: 700, color: COLORS.text }}>{item.title}</div>
                        <div style={{ fontSize: '11px', color: COLORS.textSecondary, marginTop: '2px' }}>Every {formatInterval(item.intervalMinutes)}</div>
                      </button>
                      <div style={{ display: 'flex', alignItems: 'center', marginTop: '8px', gap: '6px' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '3px', backgroundColor: statusColor }} />
                        <span style={{ fontSize: '11px', color: COLORS.textSecondary, fontWeight: 500, flex: 1 }}>{statusText}</span>
                        <button
                          onClick={() => handleDelete(item)}
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '8px',
                            backgroundColor: 'rgba(239, 68, 68, 0.08)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={COLORS.danger} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Virtual Plant Hero Card */}
        <div
          className={isWatering ? 'water-animation' : ''}
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '16px',
            backgroundColor: COLORS.surface,
            borderRadius: '14px',
            border: `1px solid ${COLORS.border}`,
          }}
        >
          {/* Confetti burst on unlock */}
          {showConfetti && (
            <div className="confetti-container">
              {Array.from({ length: 24 }).map((_, i) => (
                <div key={i} className="confetti-piece" style={{ '--i': i } as React.CSSProperties} />
              ))}
            </div>
          )}

          {/* Unlock celebration toast */}
          {newUnlockId && (
            <div
              onClick={dismissUnlock}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '8px',
                padding: '8px 14px',
                backgroundColor: '#ECFDF5',
                borderRadius: '10px',
                border: '1px solid #10B981',
                cursor: 'pointer',
                animation: 'fadeIn 0.3s ease',
              }}
            >
              <span style={{ fontSize: '16px' }}>🎉</span>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#065F46' }}>
                New pot unlocked: {catalog.find((p) => p.id === newUnlockId)?.name}!
              </span>
            </div>
          )}

          {/* Micro-goal header */}
          {nextUnlock && !newUnlockId && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill={COLORS.secondary} stroke="none">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <span style={{ fontSize: '12px', fontWeight: 600, color: COLORS.text }}>
                Next {nextUnlock.name} in {nextUnlock.breaksAway} break{nextUnlock.breaksAway !== 1 ? 's' : ''}
              </span>
            </div>
          )}

          {isWatering && (
            <div className="water-drops">
              {[
                { left: '25%', delay: '0s' },
                { left: '45%', delay: '0.15s' },
                { left: '65%', delay: '0.3s' },
                { left: '35%', delay: '0.1s' },
                { left: '55%', delay: '0.25s' },
                { left: '75%', delay: '0.05s' },
                { left: '20%', delay: '0.2s' },
              ].map((drop, i) => (
                <span
                  key={i}
                  className="water-drop"
                  style={{ left: drop.left, top: '5%', animationDelay: drop.delay }}
                >
                  💧
                </span>
              ))}
              <div className="water-splash" />
            </div>
          )}

          {/* Plant + Swap button wrapper */}
          <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setShowPotsDrawer(true)}>
            <Plant stage={plantState.stage} progress={progress} colorIndex={devColorIndex} pot={devPotIndex !== undefined ? POTS_CATALOG[devPotIndex] : activePot} dailyLeaves={dailyLeaves} leafDrop={leafDrop} />
            {/* Swap icon */}
            <button
              onClick={(e) => { e.stopPropagation(); setShowPotsDrawer(true); }}
              style={{
                position: 'absolute',
                right: '-16px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '30px',
                height: '30px',
                borderRadius: '15px',
                border: `1px solid ${COLORS.border}`,
                backgroundColor: COLORS.surface,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={COLORS.textSecondary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="17 1 21 5 17 9" />
                <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                <polyline points="7 23 3 19 7 15" />
                <path d="M21 13v2a4 4 0 0 1-4 4H3" />
              </svg>
            </button>

            {/* Watering can overlay - plays when returning from break */}
            {showWateringOverlay && (
              <div className="home-water-overlay">
                <div className="home-watering-can">
                  <svg width="56" height="56" viewBox="0 0 80 80" fill="none">
                    <path d="M20 55 L20 35 Q20 25 30 25 L55 25 Q60 25 60 30 L60 55 Q60 60 55 60 L25 60 Q20 60 20 55Z" fill={COLORS.accent} opacity="0.9" />
                    <path d="M55 30 L70 20 L72 22 L58 33" fill={COLORS.accent} opacity="0.8" />
                    <circle cx="72" cy="18" r="2" fill={COLORS.accentLight} />
                    <circle cx="74" cy="22" r="1.5" fill={COLORS.accentLight} />
                    <circle cx="70" cy="16" r="1.5" fill={COLORS.accentLight} />
                  </svg>
                </div>
                <div className="home-water-stream">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="home-water-droplet" style={{ '--drop-i': i } as React.CSSProperties} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {motivation && (
            <div style={{
              fontSize: '13px',
              fontWeight: 600,
              color: COLORS.accent,
              marginTop: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              animation: 'fadeIn 0.3s ease',
            }}>
              <span style={{ fontSize: '16px' }}>{motivation.icon}</span>
              {motivation.text}
            </div>
          )}
          <div style={{ fontSize: '14px', fontWeight: 700, color: COLORS.text, marginTop: motivation ? '2px' : '4px' }}>
            Today's Growth
          </div>
          <div style={{ fontSize: '11px', color: COLORS.textSecondary, marginTop: '2px' }}>
            {dailyLeaves} {dailyLeaves === 1 ? 'break' : 'breaks'} today
          </div>
        </div>

        {/* Pots Collection Drawer */}
        <PotsDrawer
          isOpen={showPotsDrawer}
          onClose={() => setShowPotsDrawer(false)}
          onEquip={equip}
          state={potState}
        />

        {/* Dev-only plant testing panel */}
        {devMode && (
          <div style={{
            marginTop: '8px',
            padding: '10px 14px',
            backgroundColor: '#FFF3E0',
            borderRadius: '10px',
            border: '1px dashed #C47A30',
          }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#C47A30', marginBottom: '8px' }}>DEV: Plant Controls</div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <button
                onClick={handleWater}
                style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #C47A30', background: '#FFF', fontSize: '11px', cursor: 'pointer', fontWeight: 600 }}
              >
                Water +1
              </button>
              <button
                onClick={() => setDevColorIndex((prev) => ((prev ?? 0) + 1) % PLANT_DAILY_COLORS.length)}
                style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #0E8A7D', background: '#FFF', fontSize: '11px', cursor: 'pointer', fontWeight: 600, color: '#0E8A7D' }}
              >
                Next Colour
              </button>
              <button
                onClick={() => {
                  const state = loadPlantState();
                  const newPoints = Math.max(0, state.waterPoints - PLANT_DECAY_PER_DAY);
                  savePlantState({ ...state, waterPoints: newPoints, stage: stageFromPoints(newPoints) });
                }}
                style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #DC2626', background: '#FFF', fontSize: '11px', cursor: 'pointer', fontWeight: 600, color: '#DC2626' }}
              >
                Decay -2
              </button>
              <button
                onClick={() => {
                  savePlantState({ waterPoints: 0, stage: 'seed', lastWateredDate: '', lastDecayCheckDate: '', dailyLeavesGrown: 0, dailyDate: '' });
                }}
                style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #DC2626', background: '#FFF', fontSize: '11px', cursor: 'pointer', fontWeight: 600, color: '#DC2626' }}
              >
                Reset
              </button>
              <button
                onClick={triggerLeafDrop}
                style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #C47A30', background: '#FFF', fontSize: '11px', cursor: 'pointer', fontWeight: 600, color: '#C47A30' }}
              >
                Leaf Drop
              </button>
              <button
                onClick={() => setDevPotIndex((prev) => ((prev ?? -1) + 1) % POTS_CATALOG.length)}
                style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #6B21A8', background: '#FFF', fontSize: '11px', cursor: 'pointer', fontWeight: 600, color: '#6B21A8' }}
              >
                Next Pot
              </button>
            </div>
            <div style={{ fontSize: '10px', color: '#856404', marginTop: '6px' }}>
              Points: {plantState.waterPoints} | Leaves today: {dailyLeaves} | Pot: {devPotIndex !== undefined ? POTS_CATALOG[devPotIndex].name : activePot?.name} | Last watered: {plantState.lastWateredDate || 'never'}
            </div>
          </div>
        )}


        {/* Tip of the Day - pushed to bottom */}
        <div style={{
          marginTop: 'auto',
          backgroundColor: COLORS.accentLight,
          borderRadius: '12px',
          padding: '14px',
          borderLeft: `3px solid ${COLORS.accent}`,
        }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: COLORS.accent, marginBottom: '4px' }}>Tip</div>
          <p style={{ fontSize: '12px', color: COLORS.text, lineHeight: 1.5, margin: 0 }}>
            {WELLNESS_TIPS[Math.floor(Date.now() / (1000 * 60 * 60 * 3)) % WELLNESS_TIPS.length]}
          </p>
        </div>
      </div>

      {/* Notification Warning */}
      {notifPermission !== 'granted' && (
        <div style={{
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '10px 16px',
          backgroundColor: '#FEF3CD',
          borderTop: '1px solid #F0E6E0',
        }}>
          <span style={{ fontSize: '16px', flexShrink: 0 }}>⚠️</span>
          <p style={{ fontSize: '12px', color: '#856404', lineHeight: 1.4, margin: 0, flex: 1 }}>
            Notifications are off. Breather can't remind you to take breaks.
          </p>
          <button
            onClick={handleEnableNotifications}
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
            Enable
          </button>
        </div>
      )}

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        <button className="bottom-nav-item active" onClick={() => navigation('/home')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <span>Home</span>
        </button>
        <button className="bottom-nav-item" onClick={() => navigation('/progress')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 17l-2 4h14l-2-4" />
            <path d="M12 13V8" />
            <path d="M8 10c0-2.2 1.8-4 4-4s4 1.8 4 4" />
            <path d="M9 12c-1.5-1-2-3-1-4.5" />
            <path d="M15 12c1.5-1 2-3 1-4.5" />
          </svg>
          <span>Progress</span>
        </button>
        <button className="bottom-nav-item" onClick={() => navigation('/settings')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          <span>Settings</span>
        </button>
      </nav>
    </div>
  );
}

