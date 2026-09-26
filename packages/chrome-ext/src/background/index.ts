import {
  Garden,
  PWA_URL,
  STORAGE_KEYS,
  didBreatheToday,
  nextReminderAt,
  normalizeGarden,
} from '@breather/shared';

const ALARM = 'breather_daily';
const NOTIFICATION = 'breather_daily';
const PWA_HEARTBEAT_STALE_MS = 90_000; // the PWA writes a heartbeat every 30s
const LATE_ALARM_GRACE_MS = 2 * 60 * 60 * 1000; // skip reminders Chrome delivers hours late (e.g. after sleep)
const SYNC_KEYS = [STORAGE_KEYS.GARDEN, STORAGE_KEYS.PWA_ACTIVE];

async function readGarden(): Promise<Garden | null> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.GARDEN);
  const raw = result[STORAGE_KEYS.GARDEN];
  return raw ? normalizeGarden(raw) : null;
}

async function syncAlarm(): Promise<void> {
  await chrome.alarms.clear(ALARM);
  const garden = await readGarden();
  if (!garden?.onboarded) return;
  const next = nextReminderAt(garden.reminder);
  if (next) await chrome.alarms.create(ALARM, { when: next.getTime() });
}

async function isPwaOpen(): Promise<boolean> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEYS.PWA_ACTIVE);
    const heartbeat = Number(result[STORAGE_KEYS.PWA_ACTIVE]);
    if (heartbeat && Date.now() - heartbeat < PWA_HEARTBEAT_STALE_MS) return true;
    const tabs = await chrome.tabs.query({ url: `${PWA_URL}/*` });
    return tabs.length > 0;
  } catch {
    return false;
  }
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== ALARM) return;
  await syncAlarm();

  if (Date.now() - alarm.scheduledTime > LATE_ALARM_GRACE_MS) return;
  // The PWA shows its own reminder while it is open.
  if (await isPwaOpen()) return;
  const garden = await readGarden();
  if (!garden?.reminder.enabled || didBreatheToday(garden)) return;

  const name = garden.sproutName || 'Your sprout';
  const minutes = garden.sessionMinutes;
  await chrome.notifications.create(NOTIFICATION, {
    type: 'basic',
    iconUrl: 'icons/icon-128.png',
    title: 'Time for a slow breath',
    message: `${name} is ready when you are. ${minutes} calm ${minutes === 1 ? 'minute' : 'minutes'}?`,
    priority: 1,
  });
});

chrome.notifications.onClicked.addListener(async (id) => {
  if (id !== NOTIFICATION) return;
  chrome.notifications.clear(id);
  await chrome.tabs.create({ url: `${PWA_URL}/breathe` });
});

chrome.runtime.onInstalled.addListener(async (details) => {
  // Drop alarms left over from the old per-reminder model.
  for (const alarm of await chrome.alarms.getAll()) {
    if (alarm.name.startsWith('breather_reminder_')) await chrome.alarms.clear(alarm.name);
  }
  await syncAlarm();
  if (details.reason === 'install') {
    await chrome.tabs.create({ url: `${PWA_URL}/home?source=extension` });
  }
});

chrome.runtime.onStartup.addListener(syncAlarm);

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes[STORAGE_KEYS.GARDEN]) syncAlarm();
});

// Reads the garden straight from an open PWA tab so the popup is fresh.
async function pullFromPwa(): Promise<boolean> {
  try {
    const [tab] = await chrome.tabs.query({ url: `${PWA_URL}/*` });
    if (!tab?.id) return false;
    const [result] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
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
      args: [SYNC_KEYS],
    });
    const data = result?.result as Record<string, unknown> | undefined;
    if (!data || Object.keys(data).length === 0) return false;
    await chrome.storage.local.set(data);
    return true;
  } catch {
    return false;
  }
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'OPEN_TAB') {
    chrome.tabs.create({ url: `${PWA_URL}${message.path || '/'}` });
    sendResponse({ ok: true });
  }
  if (message.type === 'PULL_FROM_PWA') {
    pullFromPwa().then((ok) => sendResponse({ ok }));
    return true;
  }
});
