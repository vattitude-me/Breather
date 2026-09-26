import { useSyncExternalStore } from 'react';
import { Garden, STORAGE_KEYS, createGarden, migrateLegacy, normalizeGarden } from '@breather/shared';

let cache: Garden | null = null;
const listeners = new Set<() => void>();

function load(): Garden {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.GARDEN);
    if (raw) return normalizeGarden(JSON.parse(raw));
  } catch { /* fall through to a fresh garden */ }
  const migrated = migrateLegacy((key) => localStorage.getItem(key));
  return { ...createGarden(), ...migrated };
}

export function getGarden(): Garden {
  if (!cache) cache = load();
  return cache;
}

export function updateGarden(change: (g: Garden) => Garden): Garden {
  cache = change(getGarden());
  localStorage.setItem(STORAGE_KEYS.GARDEN, JSON.stringify(cache));
  window.dispatchEvent(new Event('breather-local-change'));
  listeners.forEach((fn) => fn());
  return cache;
}

function reload() {
  cache = null;
  listeners.forEach((fn) => fn());
}

window.addEventListener('storage', (e) => {
  if (e.key === STORAGE_KEYS.GARDEN) reload();
});
window.addEventListener('breather-storage-sync', reload);

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

export function useGarden(): Garden {
  return useSyncExternalStore(subscribe, getGarden);
}
