import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { nanoid } from 'nanoid';
import { useRemindersContext } from '../context/RemindersContext';
import { scheduleReminder, cancelReminder, getNextFireTime, getAlertsSent, getCompletedCount, isWithinSchedule } from '../services/notifications';
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
  const [completedCount, setCompletedCount] = useState(0);
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

  useEffect(() => {
    getAlertsSent().then(setAlertsSent);
    getCompletedCount().then(setCompletedCount);
    const poll = setInterval(() => {
      getAlertsSent().then(setAlertsSent);
      getCompletedCount().then(setCompletedCount);
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: '13px', color: '#5C6370', fontWeight: 500, margin: 0 }}>
              {getGreeting()} · {getFormattedDate()}
            </p>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#1A1A2E', marginTop: '2px', margin: 0 }}>
              {APP_NAME}
            </h1>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {!isInstalled && installPrompt && (
              <button
                onClick={handleInstall}
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '12px',
                  backgroundColor: '#F0E6E0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: 'none',
                  cursor: 'pointer',
                }}
                title="Install Breather"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D4503C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </button>
            )}
            <span style={{ fontSize: '13px', color: '#1A1A2E', fontWeight: 600 }}>
              {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      </div>

      <div className="page-content" style={{ padding: '16px 20px' }}>
        {/* Inline Stats Row */}
        {totalReminders > 0 && (
          <div style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '20px',
          }}>
            {[
              { value: activeReminders.length, label: 'Active', color: COLORS.primary },
              { value: alertsSent, label: 'Alerts', color: COLORS.primary },
              { value: completedCount, label: 'Done', color: COLORS.accent },
              { value: countdown, label: 'Next in', color: COLORS.primary },
            ].map((stat) => (
              <div key={stat.label} style={{
                flex: 1,
                backgroundColor: COLORS.surface,
                borderRadius: '12px',
                padding: '10px 4px',
                textAlign: 'center',
                border: `1px solid ${COLORS.border}`,
              }}>
                <div style={{ fontSize: '16px', fontWeight: 700, color: stat.color }}>{stat.value}</div>
                <div style={{ fontSize: '9px', color: COLORS.textSecondary, marginTop: '2px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        )}

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

        {/* Quick Add */}
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: COLORS.text, marginBottom: '8px' }}>Quick Add</h3>
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}>
            {PRESET_REMINDERS.slice(0, 4).map((preset) => {
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
                    padding: '7px 12px',
                    border: `1px solid ${COLORS.border}`,
                    cursor: alreadyExists ? 'default' : 'pointer',
                    opacity: alreadyExists ? 0.5 : 1,
                    whiteSpace: 'nowrap',
                  }}
                >
                  <span style={{ fontSize: '14px' }}>{preset.icon}</span>
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

