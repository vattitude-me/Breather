import { useState, useEffect, useCallback } from 'react';
import { PotCollectionState } from '@breather/shared/src/types';
import { POTS_CATALOG } from '@breather/shared/src/constants';
import { loadPotCollection, onStorageChange } from '../../lib/storage';
import { recordBreak, equipPot as equipPotService, getNextUnlock, getActivePot } from '../../lib/potService';

export function usePotCollection() {
  const [state, setState] = useState<PotCollectionState>({
    totalBreaksCompleted: 0,
    activePotId: 'classic-terracotta',
    unlockedPotIds: ['classic-terracotta'],
    lastUnlockCelebrated: '',
  });
  const [newUnlockId, setNewUnlockId] = useState<string | null>(null);

  useEffect(() => {
    loadPotCollection().then(setState);
    onStorageChange((changes) => {
      if (changes['@breather_pot_collection']?.newValue) {
        setState(changes['@breather_pot_collection'].newValue);
      }
    });
  }, []);

  const completeBreak = useCallback(async () => {
    const { state: updated, newUnlock } = await recordBreak();
    setState(updated);
    if (newUnlock) setNewUnlockId(newUnlock);
    return { state: updated, newUnlock };
  }, []);

  const equip = useCallback(async (potId: string) => {
    const updated = await equipPotService(potId);
    setState(updated);
  }, []);

  const dismissUnlock = useCallback(() => setNewUnlockId(null), []);

  const activePot = getActivePot(state.activePotId);
  const nextUnlock = getNextUnlock(state.totalBreaksCompleted);

  return {
    state,
    activePot,
    nextUnlock,
    newUnlockId,
    equip,
    completeBreak,
    dismissUnlock,
    catalog: POTS_CATALOG,
  };
}
