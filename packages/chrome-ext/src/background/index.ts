import { Reminder, DayOfWeek } from '@breather/shared/src/types';
import { STORAGE_KEYS } from '@breather/shared/src/constants';

const PWA_URL = 'https://breather-break.vercel.app';

const NOTIFICATION_PROMPTS = [
  'Your body will thank you!',
  'A small pause goes a long way.',
  'Time to stretch and reset.',
  'Step away for a moment - you have earned it.',
  'Quick break? Your plant is thirsty too!',
];

function getRandomPrompt(): string {
  return NOTIFICATION_PROMPTS[Math.floor(Math.random() * NOTIFICATION_PROMPTS.length)];
}

function getDayOfWeek(): DayOfWeek {
  const days: DayOfWeek[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[new Date().getDay()];
}

function isWithinSchedule(reminder: Reminder): boolean {
  const now = new Date();
  const currentDay = getDayOfWeek();
  const currentHour = now.getHours();

  if (!reminder.schedule.activeDays.includes(currentDay)) return false;
  if (currentHour < reminder.schedule.startHour || currentHour >= reminder.schedule.endHour) return false;
  return true;
}

function getAlarmName(reminderId: string): string {
  return `breather_reminder_${reminderId}`;
}

async function scheduleReminder(reminder: Reminder): Promise<void> {
  const alarmName = getAlarmName(reminder.id);
  await chrome.alarms.clear(alarmName);

  if (!reminder.isActive) return;

  await chrome.alarms.create(alarmName, {
    periodInMinutes: reminder.intervalMinutes,
    delayInMinutes: reminder.intervalMinutes,
  });
}

async function cancelReminder(reminderId: string): Promise<void> {
  await chrome.alarms.clear(getAlarmName(reminderId));
}

async function syncAllAlarms(): Promise<void> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.REMINDERS);
  const reminders: Reminder[] = result[STORAGE_KEYS.REMINDERS] || [];

  const existing = await chrome.alarms.getAll();
  for (const alarm of existing) {
    if (alarm.name.startsWith('breather_reminder_')) {
      await chrome.alarms.clear(alarm.name);
    }
  }

  for (const reminder of reminders) {
    if (reminder.isActive) {
      await scheduleReminder(reminder);
    }
  }
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (!alarm.name.startsWith('breather_reminder_')) return;

  const reminderId = alarm.name.replace('breather_reminder_', '');
  const result = await chrome.storage.local.get(STORAGE_KEYS.REMINDERS);
  const reminders: Reminder[] = result[STORAGE_KEYS.REMINDERS] || [];
  const reminder = reminders.find((r) => r.id === reminderId);

  if (!reminder || !reminder.isActive) return;
  if (!isWithinSchedule(reminder)) return;

  await chrome.notifications.create(`breather_notif_${reminderId}_${Date.now()}`, {
    type: 'basic',
    iconUrl: 'icons/icon-128.png',
    title: `${reminder.icon} Time for a ${reminder.title.toLowerCase()} break`,
    message: getRandomPrompt(),
    buttons: [{ title: `${reminder.icon} Take Break` }],
    priority: 2,
    requireInteraction: true,
  });
});

chrome.notifications.onButtonClicked.addListener(async (notificationId, _buttonIndex) => {
  if (!notificationId.startsWith('breather_notif_')) return;

  const parts = notificationId.split('_');
  const reminderId = parts[2];

  const result = await chrome.storage.local.get(STORAGE_KEYS.REMINDERS);
  const reminders: Reminder[] = result[STORAGE_KEYS.REMINDERS] || [];
  const reminder = reminders.find((r) => r.id === reminderId);

  const breakDuration = reminder?.breakDurationSeconds || 60;

  await chrome.tabs.create({
    url: `${PWA_URL}/active-break?reminderId=${reminderId}&duration=${breakDuration}`,
  });

  chrome.notifications.clear(notificationId);
});

chrome.notifications.onClicked.addListener(async (notificationId) => {
  if (!notificationId.startsWith('breather_notif_')) return;

  const parts = notificationId.split('_');
  const reminderId = parts[2];

  const result = await chrome.storage.local.get(STORAGE_KEYS.REMINDERS);
  const reminders: Reminder[] = result[STORAGE_KEYS.REMINDERS] || [];
  const reminder = reminders.find((r) => r.id === reminderId);

  const breakDuration = reminder?.breakDurationSeconds || 60;

  await chrome.tabs.create({
    url: `${PWA_URL}/active-break?reminderId=${reminderId}&duration=${breakDuration}`,
  });

  chrome.notifications.clear(notificationId);
});

chrome.runtime.onInstalled.addListener(async () => {
  await syncAllAlarms();
});

chrome.runtime.onStartup.addListener(async () => {
  await syncAllAlarms();
});

chrome.storage.onChanged.addListener(async (changes, area) => {
  if (area !== 'local') return;
  if (changes[STORAGE_KEYS.REMINDERS]) {
    await syncAllAlarms();
  }
});

const SYNC_STORAGE_KEYS = [
  '@breather_reminders',
  '@breather_settings',
  '@breather_progress',
  '@breather_plant',
  '@breather_pot_collection',
];

async function pullFromPWA(): Promise<boolean> {
  try {
    const tabs = await chrome.tabs.query({ url: `${PWA_URL}/*` });
    let tabId: number;

    if (tabs.length > 0 && tabs[0].id) {
      tabId = tabs[0].id;
    } else {
      return false;
    }

    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: (keys: string[]) => {
        const data: Record<string, unknown> = {};
        for (const key of keys) {
          const raw = localStorage.getItem(key);
          if (raw !== null) {
            try { data[key] = JSON.parse(raw); } catch { data[key] = raw; }
          }
        }
        return data;
      },
      args: [SYNC_STORAGE_KEYS],
    });

    if (results && results[0] && results[0].result) {
      const data = results[0].result as Record<string, unknown>;
      if (Object.keys(data).length > 0) {
        await chrome.storage.local.set(data);
        return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'OPEN_TAB') {
    chrome.tabs.create({ url: `${PWA_URL}${message.path || '/'}` });
    sendResponse({ ok: true });
  }
  if (message.type === 'SYNC_ALARMS') {
    syncAllAlarms().then(() => sendResponse({ ok: true }));
    return true;
  }
  if (message.type === 'PULL_FROM_PWA') {
    pullFromPWA().then((ok) => sendResponse({ ok }));
    return true;
  }
});
