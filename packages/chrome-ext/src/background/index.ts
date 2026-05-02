import {
  PlantState, PlantStage,
  STORAGE_KEYS, PLANT_MAX_POINTS, PLANT_DECAY_PER_DAY, PLANT_STAGES,
  stageFromPoints,
} from '@breather/shared';

const ALARM_NAME = 'breather-reminder';
const DEFAULT_INTERVAL_MINUTES = 30;

const BREAK_PROMPTS = [
  'Your body will thank you!',
  'A small pause goes a long way.',
  'Time to stretch and reset.',
  'Step away for a moment — you have earned it.',
  'Quick break? Your plant is thirsty too!',
];

const DEFAULT_PLANT: PlantState = {
  waterPoints: 0,
  stage: 'seed',
  lastWateredDate: '',
  lastDecayCheckDate: '',
};

async function getPlantState(): Promise<PlantState> {
  const result = await chrome.storage.local.get('plant');
  return result.plant || { ...DEFAULT_PLANT };
}

async function savePlantState(state: PlantState): Promise<void> {
  await chrome.storage.local.set({ plant: state });
}

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

function daysBetween(dateA: string, dateB: string): number {
  const a = new Date(dateA).getTime();
  const b = new Date(dateB).getTime();
  return Math.floor(Math.abs(b - a) / 86400000);
}

async function checkDecay(state: PlantState): Promise<PlantState> {
  const today = getToday();
  if (state.lastDecayCheckDate === today) return state;
  if (!state.lastWateredDate) return { ...state, lastDecayCheckDate: today };

  const missed = daysBetween(state.lastWateredDate, today) - 1;
  if (missed <= 0) return { ...state, lastDecayCheckDate: today };

  const pointsLost = Math.min(state.waterPoints, missed * PLANT_DECAY_PER_DAY);
  const newPoints = Math.max(0, state.waterPoints - pointsLost);
  const updated: PlantState = {
    ...state,
    waterPoints: newPoints,
    stage: stageFromPoints(newPoints),
    lastDecayCheckDate: today,
  };
  await savePlantState(updated);
  return updated;
}

async function waterPlant(): Promise<PlantState> {
  let state = await getPlantState();
  state = await checkDecay(state);

  const newPoints = Math.min(PLANT_MAX_POINTS, state.waterPoints + 1);
  const updated: PlantState = {
    waterPoints: newPoints,
    stage: stageFromPoints(newPoints),
    lastWateredDate: getToday(),
    lastDecayCheckDate: state.lastDecayCheckDate,
  };
  await savePlantState(updated);
  return updated;
}

// Alarm-based reminders
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === ALARM_NAME) {
    const body = BREAK_PROMPTS[Math.floor(Math.random() * BREAK_PROMPTS.length)];
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon-128.png',
      title: '🌱 Time for a break!',
      message: body,
      buttons: [
        { title: '🌱 Done! Water plant' },
        { title: '💤 Snooze' },
      ],
      requireInteraction: true,
    });
  }
});

chrome.notifications.onButtonClicked.addListener(async (notificationId, buttonIndex) => {
  if (buttonIndex === 0) {
    await waterPlant();
  }
  chrome.notifications.clear(notificationId);
});

// Message handlers for popup
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'GET_PLANT_STATE') {
    getPlantState().then(async (state) => {
      const updated = await checkDecay(state);
      sendResponse(updated);
    });
    return true;
  }

  if (message.type === 'WATER_PLANT') {
    waterPlant().then(sendResponse);
    return true;
  }

  if (message.type === 'GET_NEXT_ALARM') {
    chrome.alarms.get(ALARM_NAME, (alarm) => {
      sendResponse(alarm ? { scheduledTime: alarm.scheduledTime } : null);
    });
    return true;
  }

  if (message.type === 'SET_INTERVAL') {
    const minutes = message.minutes || DEFAULT_INTERVAL_MINUTES;
    chrome.alarms.create(ALARM_NAME, { periodInMinutes: minutes });
    sendResponse({ ok: true });
    return true;
  }
});

// Setup default alarm on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create(ALARM_NAME, { periodInMinutes: DEFAULT_INTERVAL_MINUTES });
});
