import { PotCollectionState } from './types';
import { STORAGE_KEYS, POTS_CATALOG } from './constants';

const DEFAULT_STATE: PotCollectionState = {
  totalBreaksCompleted: 0,
  activePotId: 'classic-terracotta',
  unlockedPotIds: ['classic-terracotta'],
  lastUnlockCelebrated: '',
};

export function loadPotCollection(): PotCollectionState {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.POT_COLLECTION);
    if (data) return JSON.parse(data);
  } catch { /* use default */ }
  return { ...DEFAULT_STATE };
}

export function savePotCollection(state: PotCollectionState): void {
  localStorage.setItem(STORAGE_KEYS.POT_COLLECTION, JSON.stringify(state));
  window.dispatchEvent(new Event('pot-collection-updated'));
}

export function recordBreak(): { state: PotCollectionState; newUnlock: string | null } {
  const current = loadPotCollection();
  const newTotal = current.totalBreaksCompleted + 1;

  const newlyUnlocked = POTS_CATALOG.find(
    (p) => p.unlockThreshold === newTotal && !current.unlockedPotIds.includes(p.id)
  );

  const updated: PotCollectionState = {
    ...current,
    totalBreaksCompleted: newTotal,
    unlockedPotIds: newlyUnlocked
      ? [...current.unlockedPotIds, newlyUnlocked.id]
      : current.unlockedPotIds,
  };

  savePotCollection(updated);
  return { state: updated, newUnlock: newlyUnlocked ? newlyUnlocked.id : null };
}

export function equipPot(potId: string): PotCollectionState {
  const current = loadPotCollection();
  if (!current.unlockedPotIds.includes(potId)) return current;
  const updated = { ...current, activePotId: potId };
  savePotCollection(updated);
  return updated;
}

export function getNextUnlock(totalBreaks: number): { name: string; breaksAway: number } | null {
  const next = POTS_CATALOG
    .filter((p) => p.unlockThreshold > totalBreaks)
    .sort((a, b) => a.unlockThreshold - b.unlockThreshold)[0];
  if (!next) return null;
  return { name: next.name, breaksAway: next.unlockThreshold - totalBreaks };
}

export function getActivePot(activePotId: string) {
  return POTS_CATALOG.find((p) => p.id === activePotId) || POTS_CATALOG[0];
}
