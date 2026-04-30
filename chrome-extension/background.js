// Breakly - Chrome Extension Background Service Worker
// Handles alarms, notifications, and progress tracking

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['reminders'], (result) => {
    if (!result.reminders) {
      chrome.storage.local.set({
        reminders: [],
        settings: {
          defaultSnoozeDurationMinutes: 10,
          defaultIntervalMinutes: 30,
          notificationsEnabled: true,
          defaultSchedule: { activeDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], startHour: 8, endHour: 17 }
        },
        progress: { entries: [], currentStreak: 0, longestStreak: 0, totalSessions: 0, totalMinutes: 0 }
      });
    }
  });
});

// Listen for alarm events
chrome.alarms.onAlarm.addListener((alarm) => {
  const reminderId = alarm.name;

  chrome.storage.local.get(['reminders', 'settings', 'progress'], (result) => {
    const reminders = result.reminders || [];
    const settings = result.settings || {};
    const progress = result.progress || { entries: [], currentStreak: 0, longestStreak: 0, totalSessions: 0, totalMinutes: 0 };
    const reminder = reminders.find(r => r.id === reminderId);

    if (!reminder || !reminder.isActive) return;
    if (!settings.notificationsEnabled) return;
    if (!isWithinSchedule(reminder.schedule)) return;

    // Show notification
    chrome.notifications.create(reminderId, {
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: `${reminder.icon} Breakly`,
      message: `Time to: ${reminder.title}`,
      buttons: [
        { title: '✓ Done' }
      ],
      requireInteraction: true,
      priority: 2
    });

    // Track as session
    trackProgress(progress, 'session', reminder.intervalMinutes);
    chrome.storage.local.set({ progress });
  });
});

// Handle notification button clicks
chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
  const reminderId = notificationId;

  chrome.storage.local.get(['reminders', 'progress'], (result) => {
    const reminders = result.reminders || [];
    const progress = result.progress || { entries: [], currentStreak: 0, longestStreak: 0, totalSessions: 0, totalMinutes: 0 };
    const reminder = reminders.find(r => r.id === reminderId);

    if (buttonIndex === 0) {
      trackProgress(progress, 'completed', reminder ? reminder.intervalMinutes : 0);
      chrome.storage.local.set({ progress });
      chrome.notifications.clear(notificationId);
    }
  });
});

// Handle notification click (dismiss)
chrome.notifications.onClicked.addListener((notificationId) => {
  chrome.notifications.clear(notificationId);
});

function isWithinSchedule(schedule) {
  if (!schedule) return true;
  const now = new Date();
  const jsDay = now.getDay(); // 0=Sun, 1=Mon...6=Sat
  const dayIndex = jsDay === 0 ? 6 : jsDay - 1; // Convert to 0=Mon...6=Sun
  const dayName = DAYS[dayIndex];
  const hour = now.getHours();

  if (!schedule.activeDays.includes(dayName)) return false;
  if (hour < schedule.startHour || hour >= schedule.endHour) return false;
  return true;
}

function trackProgress(progress, type, minutes) {
  const today = new Date().toISOString().split('T')[0];
  let entry = progress.entries.find(e => e.date === today);

  if (!entry) {
    entry = { date: today, completedCount: 0, totalMinutes: 0, sessions: 0 };
    progress.entries.push(entry);
  }

  if (type === 'completed') {
    entry.completedCount++;
    entry.totalMinutes += minutes;
  }
  entry.sessions++;

  // Update totals
  progress.totalSessions = progress.entries.reduce((sum, e) => sum + e.sessions, 0);
  progress.totalMinutes = progress.entries.reduce((sum, e) => sum + e.totalMinutes, 0);

  // Update streak
  calculateStreak(progress);
}

function calculateStreak(progress) {
  const entries = progress.entries || [];
  if (entries.length === 0) {
    progress.currentStreak = 0;
    return;
  }

  const today = new Date();
  let streak = 0;
  let checkDate = new Date(today);

  const todayStr = today.toISOString().split('T')[0];
  const hasTodayEntry = entries.some(e => e.date === todayStr && e.completedCount > 0);
  if (!hasTodayEntry) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (true) {
    const dateStr = checkDate.toISOString().split('T')[0];
    if (entries.some(e => e.date === dateStr && e.completedCount > 0)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  progress.currentStreak = streak;
  progress.longestStreak = Math.max(progress.longestStreak || 0, streak);
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SYNC_ALARMS') {
    syncAlarms(message.reminders);
    sendResponse({ success: true });
  }
  if (message.type === 'GET_STATE') {
    chrome.storage.local.get(['reminders', 'settings', 'progress'], (result) => {
      sendResponse(result);
    });
    return true;
  }
});

function syncAlarms(reminders) {
  chrome.alarms.clearAll(() => {
    reminders.forEach(reminder => {
      if (reminder.isActive) {
        chrome.alarms.create(reminder.id, {
          delayInMinutes: reminder.intervalMinutes,
          periodInMinutes: reminder.intervalMinutes
        });
      }
    });
  });
}
