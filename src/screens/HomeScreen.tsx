import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRemindersContext } from '../context/RemindersContext';
import { scheduleReminder, cancelReminder, isWithinSchedule } from '../services/notifications';
import { getInstallPrompt, onInstallPromptChange } from '../services/installPrompt';
import { COLORS, APP_NAME, WELLNESS_TIPS } from '../constants';
import { Reminder } from '../types';
import Logo from '../components/Logo';
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
  const { reminders, dispatch } = useRemindersContext();
  const navigation = useNavigate();

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

        {/* Tip of the Day — pushed to bottom */}
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

