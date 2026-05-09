import { Pot as PotType, PotCollectionState } from '@breather/shared/src/types';
import Pot from './Pot';

interface PotsDrawerProps {
  open: boolean;
  onClose: () => void;
  catalog: PotType[];
  state: PotCollectionState;
  onEquip: (potId: string) => void;
}

export default function PotsDrawer({ open, onClose, catalog, state, onEquip }: PotsDrawerProps) {
  if (!open) return null;

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer-content" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-title">Pot Collection</div>
        <div className="pots-grid">
          {catalog.map((pot) => {
            const unlocked = state.unlockedPotIds.includes(pot.id);
            const isActive = state.activePotId === pot.id;

            return (
              <div
                key={pot.id}
                className={`pot-item ${isActive ? 'active' : ''} ${!unlocked ? 'locked' : ''}`}
                onClick={() => unlocked && onEquip(pot.id)}
              >
                <Pot pot={pot} size={48} />
                <div className="pot-name">{pot.name}</div>
                {!unlocked && (
                  <div className="pot-threshold">🔒 {pot.unlockThreshold} breaks</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
