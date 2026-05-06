import { useEffect, useRef } from 'react';
import { COLORS, POTS_CATALOG, PotCollectionState } from '@breather/shared';

interface PotsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onEquip: (potId: string) => void;
  state: PotCollectionState;
}

function PotThumbnail({ pot, isActive, isLocked }: {
  pot: typeof POTS_CATALOG[0];
  isActive: boolean;
  isLocked: boolean;
}) {
  return (
    <div style={{ position: 'relative', width: '60px', height: '60px' }}>
      <img
        src={pot.image}
        alt={pot.name}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          filter: isLocked ? 'grayscale(1) brightness(0.7)' : 'none',
          transition: 'filter 0.2s ease',
        }}
      />
      {isLocked && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round">
            <rect x="3" y="11" width="18" height="11" rx="2" fill="#9CA3AF" fillOpacity="0.3" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
      )}
      {isActive && (
        <div style={{
          position: 'absolute',
          top: '-4px',
          right: '-4px',
          width: '18px',
          height: '18px',
          borderRadius: '9px',
          backgroundColor: '#10B981',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      )}
    </div>
  );
}

export default function PotsDrawer({ isOpen, onClose, onEquip, state }: PotsDrawerProps) {
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current) onClose();
  };

  const handleEquip = (potId: string) => {
    if (state.unlockedPotIds.includes(potId)) {
      onEquip(potId);
      if (navigator.vibrate) navigator.vibrate(30);
      onClose();
    }
  };

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className="pots-drawer-backdrop"
    >
      <div className="pots-drawer-sheet">
        <div className="pots-drawer-handle" />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', padding: '0 4px' }}>
          <div />
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: COLORS.text, margin: 0 }}>
            Pots Collection
          </h3>
          <button
            onClick={onClose}
            style={{ width: '32px', height: '32px', borderRadius: '16px', border: 'none', background: COLORS.border, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={COLORS.textSecondary} strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', overflowY: 'auto', maxHeight: '360px', padding: '4px' }}>
          {POTS_CATALOG.map((pot) => {
            const isLocked = !state.unlockedPotIds.includes(pot.id);
            const isActive = state.activePotId === pot.id;
            return (
              <button
                key={pot.id}
                onClick={() => handleEquip(pot.id)}
                disabled={isLocked}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 6px',
                  borderRadius: '14px',
                  border: isActive ? `2px solid ${COLORS.accent}` : '2px solid transparent',
                  background: isActive ? COLORS.accentLight : isLocked ? '#F9FAFB' : 'transparent',
                  cursor: isLocked ? 'default' : 'pointer',
                  opacity: isLocked ? 0.8 : 1,
                  transition: 'all 0.2s ease',
                }}
              >
                <PotThumbnail pot={pot} isActive={isActive} isLocked={isLocked} />
                <span style={{ fontSize: '11px', fontWeight: 600, color: isLocked ? COLORS.disabled : COLORS.text, textAlign: 'center', lineHeight: 1.3 }}>
                  {isLocked ? `${pot.unlockThreshold} breaks` : pot.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
