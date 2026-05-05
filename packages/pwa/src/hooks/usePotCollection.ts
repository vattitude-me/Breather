import { useState, useEffect, useCallback } from 'react';
import {
  PotCollectionState,
  loadPotCollection,
  equipPot,
  recordBreak,
  getNextUnlock,
  getActivePot,
  POTS_CATALOG,
} from '@breather/shared';

export function usePotCollection() {
  const [state, setState] = useState<PotCollectionState>(loadPotCollection);
  const [newUnlockId, setNewUnlockId] = useState<string | null>(null);

  useEffect(() => {
    const handler = () => setState(loadPotCollection());
    window.addEventListener('pot-collection-updated', handler);
    return () => window.removeEventListener('pot-collection-updated', handler);
  }, []);

  const equip = useCallback((potId: string) => {
    const updated = equipPot(potId);
    setState(updated);
  }, []);

  const completeBreak = useCallback(() => {
    const { state: updated, newUnlock } = recordBreak();
    setState(updated);
    if (newUnlock) {
      setNewUnlockId(newUnlock);
    }
    return newUnlock;
  }, []);

  const dismissUnlock = useCallback(() => {
    setNewUnlockId(null);
  }, []);

  const nextUnlock = getNextUnlock(state.totalBreaksCompleted);
  const activePot = getActivePot(state.activePotId);

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
