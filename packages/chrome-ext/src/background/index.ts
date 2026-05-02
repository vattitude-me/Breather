import {
  Reminder,
  STORAGE_KEYS, PLANT_MAX_POINTS, PLANT_DECAY_PER_DAY, PLANT_STAGES,
  PlantState,
} from '@breather/shared';

const ALARM_PREFIX = 'breather_';

const BREAK_PROMPTS = [
  'Your body will thank you!',
  'A small pause goes a long way.',
  'Time to stretch and reset.',
  'Step away for a moment — you have earned it.',
  'Quick break? Your plant is thirsty too!',
];

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

function daysBetween(a: string, b: string): number {
  return Math.floor(Math.abs(new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

function stageFromPoints(points: number) {
  for (let i = PLANT_STAGES.length - 1; i >= 0; i--) {
    if (points >= PLANT_STAGES[i].minPoints) return PLANT_STAGES[i].stage;
  }
  return 'seed' as const;
}

const DEFAULT_PLANT: PlantState = { waterPoints: 0, stage: 'seed', lastWateredDate: '', lastDecayCheckDate: '' };

async function getPlant(): Promise<PlantState> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.PLANT);
  return result[STORAGE_KEYS.PLANT] || { ...DEFAULT_PLANT };
}

async function savePlant(state: PlantState): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS.PLANT]: state });
}

async function checkDecay(state: PlantState): Promise<PlantState> {
  const today = getToday();
  if (state.lastDecayCheckDate === today) return state;
  if (!state.lastWateredDate) return { ...state, lastDecayCheckDate: today };
  const missed = daysBetween(state.lastWateredDate, today) - 1;
  if (missed <= 0) return { ...state, lastDecayCheckDate: today };
  const pointsLost = Math.min(state.waterPoints, missed * PLANT_DECAY_PER_DAY);
  const newPoints = Math.max(0, state.waterPoints - pointsLost);
  const updated: PlantState = { ...state, waterPoints: newPoints, stage: stageFromPoints(newPoints), lastDecayCheckDate: today };
  await savePlant(updated);
  return updated;
}

async function waterPlant(): Promise<PlantState> {
  let state = await getPlant();
  state = await checkDecay(state);
  const newPoints = Math.min(PLANT_MAX_POINTS, state.waterPoints + 1);
  const updated: PlantState = { waterPoints: newPoints, stage: stageFromPoints(newPoints), lastWateredDate: getToday(), lastDecayCheckDate: state.lastDecayCheckDate };
  await savePlant(updated);
  return updated;
}

async function getReminders(): Promise<Reminder[]> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.REMINDERS);
  return result[STORAGE_KEYS.REMINDERS] || [];
}

function isWithinSchedule(schedule?: Reminder['schedule']): boolean {
  if (!schedule) return true;
  const now = new Date();
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
  const dayName = days[now.getDay()];
  const hour = now.getHours();
  if (!schedule.activeDays.includes(dayName as never)) return false;
  if (hour < schedule.startHour || hour >= schedule.endHour) return false;
  return true;
}

function scheduleAlarm(reminder: Reminder) {
  chrome.alarms.create(`${ALARM_PREFIX}${reminder.id}`, {
    periodInMinutes: reminder.intervalMinutes,
    delayInMinutes: reminder.intervalMinutes,
  });
}

function cancelAlarm(id: string) {
  chrome.alarms.clear(`${ALARM_PREFIX}${id}`);
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (!alarm.name.startsWith(ALARM_PREFIX)) return;
  const id = alarm.name.slice(ALARM_PREFIX.length);
  const reminders = await getReminders();
  const reminder = reminders.find((r) => r.id === id);
  if (!reminder || !reminder.isActive) return;
  if (!isWithinSchedule(reminder.schedule)) return;

  const body = BREAK_PROMPTS[Math.floor(Math.random() * BREAK_PROMPTS.length)];
  chrome.notifications.create(`notif_${id}`, {
    type: 'basic',
    iconUrl: 'icons/icon-128.png',
    title: `${reminder.icon} Time for a ${reminder.title.toLowerCase()} break`,
    message: body,
    buttons: [
      { title: '🌱 Done! Water plant' },
      { title: '💤 Snooze' },
    ],
    requireInteraction: true,
  });
});

chrome.notifications.onButtonClicked.addListener(async (notificationId, buttonIndex) => {
  if (buttonIndex === 0) {
    await waterPlant();
  }
  chrome.notifications.clear(notificationId);
});

chrome.notifications.onClicked.addListener(async (notificationId) => {
  await waterPlant();
  chrome.notifications.clear(notificationId);
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'GET_PLANT_STATE') {
    getPlant().then(async (state) => {
      const updated = await checkDecay(state);
      sendResponse(updated);
    });
    return true;
  }

  if (message.type === 'WATER_PLANT') {
    waterPlant().then(sendResponse);
    return true;
  }

  if (message.type === 'SYNC_PLANT') {
    savePlant(message.plant).then(() => sendResponse({ ok: true }));
    return true;
  }

  if (message.type === 'GET_NEXT_ALARM') {
    getReminders().then(async (reminders) => {
      const activeIds = reminders.filter((r) => r.isActive).map((r) => r.id);
      const alarms = await chrome.alarms.getAll();
      let earliest: chrome.alarms.Alarm | null = null;
      for (const alarm of alarms) {
        if (!alarm.name.startsWith(ALARM_PREFIX)) continue;
        const id = alarm.name.slice(ALARM_PREFIX.length);
        if (!activeIds.includes(id)) continue;
        if (!earliest || alarm.scheduledTime < earliest.scheduledTime) earliest = alarm;
      }
      sendResponse(earliest ? { scheduledTime: earliest.scheduledTime } : null);
    });
    return true;
  }

  if (message.type === 'SCHEDULE_REMINDER') {
    const reminder = message.reminder as Reminder;
    scheduleAlarm(reminder);
    sendResponse({ ok: true });
    return true;
  }

  if (message.type === 'CANCEL_REMINDER') {
    cancelAlarm(message.id);
    sendResponse({ ok: true });
    return true;
  }

  if (message.type === 'CANCEL_ALL') {
    chrome.alarms.clearAll();
    sendResponse({ ok: true });
    return true;
  }
});

chrome.runtime.onInstalled.addListener(async () => {
  const reminders = await getReminders();
  for (const r of reminders) {
    if (r.isActive) scheduleAlarm(r);
  }
});
