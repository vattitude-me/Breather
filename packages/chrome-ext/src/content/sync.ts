const STORAGE_KEYS = [
  '@breather_reminders',
  '@breather_settings',
  '@breather_progress',
  '@breather_plant',
  '@breather_pot_collection',
];

function isContextValid(): boolean {
  try {
    return !!chrome.runtime?.id;
  } catch {
    return false;
  }
}

function localStorageToExtension() {
  if (!isContextValid()) {
    cleanup();
    return;
  }
  const data: Record<string, unknown> = {};
  for (const key of STORAGE_KEYS) {
    const raw = localStorage.getItem(key);
    if (raw !== null) {
      try {
        data[key] = JSON.parse(raw);
      } catch {
        data[key] = raw;
      }
    }
  }
  if (Object.keys(data).length > 0) {
    chrome.storage.local.set(data);
  }
}

function extensionToLocalStorage(changes: Record<string, { newValue?: unknown }>) {
  for (const key of STORAGE_KEYS) {
    if (changes[key] && changes[key].newValue !== undefined) {
      localStorage.setItem(key, JSON.stringify(changes[key].newValue));
    }
  }
  window.dispatchEvent(new CustomEvent('breather-storage-sync'));
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (!isContextValid()) {
    cleanup();
    return;
  }
  if (area === 'local') {
    extensionToLocalStorage(changes);
  }
});

window.addEventListener('storage', (e) => {
  if (e.key && STORAGE_KEYS.includes(e.key)) {
    localStorageToExtension();
  }
});

window.addEventListener('breather-local-change', () => {
  localStorageToExtension();
});

let pollInterval: ReturnType<typeof setInterval> | null = null;

function cleanup() {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
}

localStorageToExtension();
pollInterval = setInterval(localStorageToExtension, 5000);
