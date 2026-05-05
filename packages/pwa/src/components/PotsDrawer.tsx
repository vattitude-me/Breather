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
  if (isLocked && pot.pattern === 'mystery') {
    return (
      <svg width="60" height="56" viewBox="0 0 60 56" xmlns="http://www.w3.org/2000/svg">
        <rect x="10" y="8" width="40" height="36" rx="4" fill="#E5E7EB" stroke="#9CA3AF" strokeWidth="1.5" />
        <rect x="6" y="36" width="48" height="12" rx="2" fill="#D1D5DB" stroke="#9CA3AF" strokeWidth="1" />
        <text x="22" y="30" fontSize="16" fill="#6B7280">?</text>
        <text x="34" y="30" fontSize="16" fill="#6B7280">?</text>
      </svg>
    );
  }

  if (isLocked) {
    return (
      <svg width="60" height="56" viewBox="0 0 60 56" xmlns="http://www.w3.org/2000/svg">
        <path d="M18,28 L20,48 L40,48 L42,28 Z" fill="#D1D5DB" />
        <rect x="16" y="24" width="28" height="6" rx="2" fill="#E5E7EB" />
        <rect x="25" y="12" width="10" height="14" rx="5" fill="none" stroke="#9CA3AF" strokeWidth="2" />
        <circle cx="30" cy="38" r="3" fill="#9CA3AF" />
      </svg>
    );
  }

  const { colors, pattern } = pot;
  return (
    <svg width="60" height="56" viewBox="0 0 60 56" xmlns="http://www.w3.org/2000/svg">
      <path d={`M18,28 L20,50 L40,50 L42,28 Z`} fill={colors.body} />
      <rect x="16" y="24" width="28" height="6" rx="2" fill={colors.rim} />
      {pattern === 'marble' && (
        <>
          <path d="M22,32 Q28,38 24,44" stroke={colors.accent} strokeWidth="1.5" fill="none" opacity="0.5" />
          <path d="M34,30 Q38,36 35,42" stroke={colors.accent} strokeWidth="1" fill="none" opacity="0.4" />
        </>
      )}
      {pattern === 'porcelain' && (
        <>
          <circle cx="26" cy="36" r="3" fill="none" stroke={colors.accent} strokeWidth="1" opacity="0.6" />
          <circle cx="34" cy="40" r="2.5" fill="none" stroke={colors.accent} strokeWidth="1" opacity="0.6" />
          <path d="M28,42 Q30,44 32,42" stroke={colors.accent} strokeWidth="0.8" fill="none" opacity="0.5" />
        </>
      )}
      {pattern === 'stone' && (
        <>
          <circle cx="24" cy="35" r="1.5" fill={colors.accent} opacity="0.3" />
          <circle cx="36" cy="38" r="2" fill={colors.accent} opacity="0.25" />
          <circle cx="30" cy="44" r="1" fill={colors.accent} opacity="0.3" />
        </>
      )}
      {pattern === 'mystery' && (
        <>
          <path d="M22,30 Q30,26 38,30 L36,46 Q30,48 24,46 Z" fill={colors.body} />
          <text x="25" y="42" fontSize="10" fill="#FFF" opacity="0.8">&#x2728;</text>
        </>
      )}
      {isActive && (
        <circle cx="48" cy="10" r="8" fill="#10B981">
          <animate attributeName="r" values="7;8;7" dur="2s" repeatCount="indefinite" />
        </circle>
      )}
      {isActive && (
        <path d="M44,10 L47,13 L52,7" stroke="#FFF" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', overflowY: 'auto', maxHeight: '320px', padding: '4px' }}>
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
                  gap: '6px',
                  padding: '10px 4px',
                  borderRadius: '12px',
                  border: isActive ? `2px solid ${COLORS.accent}` : '2px solid transparent',
                  background: isActive ? COLORS.accentLight : 'transparent',
                  cursor: isLocked ? 'default' : 'pointer',
                  opacity: isLocked ? 0.7 : 1,
                  transition: 'all 0.2s ease',
                }}
              >
                <PotThumbnail pot={pot} isActive={isActive} isLocked={isLocked} />
                <span style={{ fontSize: '10px', fontWeight: 600, color: isLocked ? COLORS.disabled : COLORS.text, textAlign: 'center', lineHeight: 1.2 }}>
                  {isLocked ? `Unlock at\n${pot.unlockThreshold} Breaks` : pot.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
