import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { nanoid } from 'nanoid';
import { useRemindersContext } from '../context/RemindersContext';
import { scheduleReminder, cancelReminder, getNextFireTime, getAlertsSent, isWithinSchedule } from '../services/notifications';
import { getInstallPrompt, onInstallPromptChange } from '../services/installPrompt';
import { COLORS, APP_NAME, PRESET_REMINDERS, DEFAULT_SCHEDULE, WELLNESS_TIPS } from '../constants';
import { Reminder } from '../types';
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

export default function HomeScreen() {
  const { reminders, settings, dispatch } = useRemindersContext();
  const navigation = useNavigate();

  const activeReminders = reminders.filter((r) => r.isActive);
  const totalReminders = reminders.length;

  const [countdown, setCountdown] = useState('--');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [alertsSent, setAlertsSent] = useState(0);
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

  useEffect(() => {
    getAlertsSent().then(setAlertsSent);
    const poll = setInterval(() => {
      getAlertsSent().then(setAlertsSent);
    }, 10000);
    return () => clearInterval(poll);
  }, []);

  useEffect(() => {
    function updateCountdown() {
      if (activeReminders.length === 0) {
        setCountdown('--');
        return;
      }

      // Check if any active reminder is within schedule
      const scheduledReminders = activeReminders.filter(r => isWithinSchedule(r.schedule));
      if (scheduledReminders.length === 0) {
        setCountdown('Paused');
        return;
      }

      const now = Date.now();
      let soonest = Infinity;

      for (const r of scheduledReminders) {
        const next = getNextFireTime(r);
        if (next) {
          const diff = next.getTime() - now;
          if (diff > 0 && diff < soonest) soonest = diff;
        }
      }

      if (soonest === Infinity) {
        setCountdown('--');
        return;
      }

      const totalSec = Math.floor(soonest / 1000);
      if (totalSec >= 3600) {
        const h = Math.floor(totalSec / 3600);
        const m = Math.floor((totalSec % 3600) / 60);
        setCountdown(`${h}h ${m}m`);
      } else if (totalSec >= 60) {
        const m = Math.floor(totalSec / 60);
        const s = totalSec % 60;
        setCountdown(`${m}:${s.toString().padStart(2, '0')}`);
      } else {
        setCountdown(`${totalSec}s`);
      }
    }

    updateCountdown();
    const interval = setInterval(() => {
      updateCountdown();
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, [activeReminders]);

  const handleQuickAdd = async (preset: typeof PRESET_REMINDERS[0]) => {
    const existing = reminders.find((r) => r.title === preset.title);
    if (existing) return;

    const reminder: Reminder = {
      id: nanoid(),
      title: preset.title,
      intervalMinutes: preset.defaultInterval,
      isActive: true,
      snoozeDurationMinutes: settings.defaultSnoozeDurationMinutes,
      icon: preset.icon,
      createdAt: new Date().toISOString(),
      schedule: settings.defaultSchedule || DEFAULT_SCHEDULE as any,
    };

    try {
      const notificationId = await scheduleReminder(reminder);
      reminder.notificationId = notificationId;
    } catch (e) {
      console.error('Failed to schedule reminder:', e);
    }

    dispatch({ type: 'ADD', payload: reminder });
  };

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
      {/* Welcome Header */}
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)', fontWeight: 500, margin: 0 }}>
              {getGreeting()}
            </p>
            <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#FFFFFF', marginTop: '2px', margin: 0 }}>
              {APP_NAME}
            </h1>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {!isInstalled && installPrompt && (
              <button
                onClick={handleInstall}
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '22px',
                  backgroundColor: 'rgba(255,255,255,0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: 'none',
                  cursor: 'pointer',
                }}
                title="Install Breakly"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </button>
            )}
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '22px',
              backgroundColor: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
            }}>
              🌿
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>📅</span>
          <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.9)', fontWeight: 400, flex: 1 }}>
            {getFormattedDate()}
          </span>
          <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>
            {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>

      <div className="page-content">
        {/* Quick Stats Banner */}
        {totalReminders > 0 && (
          <div style={{
            display: 'flex',
            backgroundColor: COLORS.surface,
            borderRadius: '16px',
            padding: '18px 16px',
            marginBottom: '28px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            alignItems: 'center',
          }}>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: 700, color: COLORS.primary }}>{activeReminders.length}</div>
              <div style={{ fontSize: '11px', color: COLORS.textSecondary, marginTop: '4px', fontWeight: 500, textTransform: 'uppercase' }}>Active</div>
            </div>
            <div style={{ width: '1px', height: '30px', backgroundColor: COLORS.border }} />
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: 700, color: COLORS.primary }}>{alertsSent}</div>
              <div style={{ fontSize: '11px', color: COLORS.textSecondary, marginTop: '4px', fontWeight: 500, textTransform: 'uppercase' }}>Alerts Sent</div>
            </div>
            <div style={{ width: '1px', height: '30px', backgroundColor: COLORS.border }} />
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: 700, color: COLORS.primary }}>{countdown}</div>
              <div style={{ fontSize: '11px', color: COLORS.textSecondary, marginTop: '4px', fontWeight: 500, textTransform: 'uppercase' }}>Next In</div>
            </div>
          </div>
        )}

        {/* My Routines */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: COLORS.text, margin: 0 }}>My Break Routines</h2>
            <button 
              onClick={() => navigation('/add-reminder')}
              style={{ background: 'none', border: 'none', color: COLORS.primary, fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
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
                borderRadius: '16px',
                padding: '32px',
                border: `2px dashed ${COLORS.primary}`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                cursor: 'pointer',
              }}
            >
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '28px',
                backgroundColor: 'rgba(232, 97, 77, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '12px',
              }}>
                <span style={{ fontSize: '28px', color: COLORS.primary, fontWeight: 600 }}>+</span>
              </div>
              <span style={{ fontSize: '16px', fontWeight: 700, color: COLORS.text, marginBottom: '4px' }}>Create a break routine</span>
              <span style={{ fontSize: '13px', color: COLORS.textSecondary }}>Set reminders to stretch, move, and rest</span>
            </button>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              {reminders.map((item, index) => (
                <div key={item.id} style={{ width: '47%' }}>
                  <div style={{
                    ...styles.reminderCard,
                    backgroundColor: getCategoryColor(index),
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                      <button
                        onClick={() => navigation(`/edit-reminder/${item.id}`)}
                        style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '22px',
                          backgroundColor: 'rgba(255,255,255,0.7)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        <span style={{ fontSize: '22px' }}>{item.icon}</span>
                      </button>
                      <label style={{ position: 'relative', display: 'inline-block', width: '51px', height: '31px' }}>
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
                          borderRadius: '31px',
                          transition: '0.3s',
                        }}>
                          <span style={{
                            position: 'absolute',
                            left: item.isActive ? '23px' : '3px',
                            top: '3px',
                            width: '25px',
                            height: '25px',
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
                      <div style={{ fontSize: '15px', fontWeight: 700, color: COLORS.text, marginBottom: '2px' }}>{item.title}</div>
                      <div style={{ fontSize: '12px', color: COLORS.textSecondary, marginTop: '2px' }}>Every {formatInterval(item.intervalMinutes)}</div>
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', marginTop: '10px', gap: '6px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '4px', backgroundColor: !item.isActive ? COLORS.disabled : isWithinSchedule(item.schedule) ? '#4CAF50' : COLORS.secondary }} />
                      <span style={{ fontSize: '11px', color: COLORS.textSecondary, fontWeight: 500, flex: 1 }}>
                        {!item.isActive ? 'Paused' : isWithinSchedule(item.schedule) ? 'Active' : 'Outside hours'}
                      </span>
                      <button
                        onClick={() => handleDelete(item)}
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '12px',
                          backgroundColor: 'rgba(239, 68, 68, 0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        <span style={{ color: COLORS.danger, fontSize: '11px', fontWeight: 700 }}>✕</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Add */}
        <div style={{ marginBottom: '28px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: COLORS.text, marginBottom: '10px' }}>Quick Add</h3>
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', scrollbarWidth: 'none' }}>
            {PRESET_REMINDERS.slice(0, 3).map((preset) => {
              const alreadyExists = reminders.some((r) => r.title === preset.title);
              return (
                <button
                  key={preset.title}
                  onClick={() => !alreadyExists && handleQuickAdd(preset)}
                  disabled={alreadyExists}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: alreadyExists ? COLORS.border : COLORS.surface,
                    borderRadius: '20px',
                    padding: '8px 14px',
                    border: `1px solid ${alreadyExists ? COLORS.border : COLORS.border}`,
                    cursor: alreadyExists ? 'default' : 'pointer',
                    opacity: alreadyExists ? 0.5 : 1,
                    whiteSpace: 'nowrap',
                  }}
                >
                  <span style={{ fontSize: '16px' }}>{preset.icon}</span>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: alreadyExists ? COLORS.textSecondary : COLORS.text }}>
                    {preset.title}
                  </span>
                  {alreadyExists && <span style={{ fontSize: '10px', color: COLORS.accent, fontWeight: 700 }}>✓</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tip of the Day */}
        <div style={{
          backgroundColor: COLORS.accentLight,
          borderRadius: '14px',
          padding: '16px',
          borderLeft: `4px solid ${COLORS.accent}`,
        }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: COLORS.accent, marginBottom: '6px' }}>💡 Tip</div>
          <p style={{ fontSize: '13px', color: COLORS.text, lineHeight: 1.5, margin: 0 }}>
            {WELLNESS_TIPS[Math.floor(Date.now() / (1000 * 60 * 60 * 3)) % WELLNESS_TIPS.length]}
          </p>
        </div>
      </div>

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
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
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

const styles = {
  reminderCard: {
    borderRadius: '18px',
    padding: '16px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
};