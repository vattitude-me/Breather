import { PotCollectionState } from '@breather/shared/src/types';
import { POTS_CATALOG } from '@breather/shared/src/constants';
import { loadPotCollection, savePotCollection } from './storage';

export async function recordBreak(): Promise<{ state: PotCollectionState; newUnlock: string | null }> {
  const current = await loadPotCollection();
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

  await savePotCollection(updated);
  return { state: updated, newUnlock: newlyUnlocked ? newlyUnlocked.id : null };
}

export async function equipPot(potId: string): Promise<PotCollectionState> {
  const current = await loadPotCollection();
  if (!current.unlockedPotIds.includes(potId)) return current;
  const updated = { ...current, activePotId: potId };
  await savePotCollection(updated);
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
