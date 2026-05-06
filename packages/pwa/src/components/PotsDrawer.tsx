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
        <defs>
          <linearGradient id="mystery-locked-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#E5E7EB" />
            <stop offset="100%" stopColor="#D1D5DB" />
          </linearGradient>
        </defs>
        <path d="M16,24 Q17,36 19,48 L41,48 Q43,36 44,24 Z" fill="url(#mystery-locked-grad)" />
        <rect x="14" y="20" width="32" height="6" rx="3" fill="#E5E7EB" />
        <text x="25" y="40" fontSize="14" fill="#9CA3AF">?</text>
        <rect x="24" y="10" width="12" height="12" rx="6" fill="none" stroke="#9CA3AF" strokeWidth="1.5" />
        <circle cx="30" cy="42" r="2" fill="#9CA3AF" />
      </svg>
    );
  }

  if (isLocked) {
    return (
      <svg width="60" height="56" viewBox="0 0 60 56" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id={`locked-${pot.id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={pot.colors.rim} stopOpacity="0.4" />
            <stop offset="100%" stopColor={pot.colors.body} stopOpacity="0.4" />
          </linearGradient>
        </defs>
        <path d="M16,24 Q17,36 19,48 L41,48 Q43,36 44,24 Z" fill={`url(#locked-${pot.id})`} />
        <path d="M16,24 Q17,36 19,48 L41,48 Q43,36 44,24 Z" fill="#D1D5DB" opacity="0.5" />
        <rect x="14" y="20" width="32" height="6" rx="3" fill="#E5E7EB" opacity="0.8" />
        <rect x="24" y="8" width="12" height="14" rx="6" fill="none" stroke="#9CA3AF" strokeWidth="1.8" />
        <circle cx="30" cy="35" r="2.5" fill="#9CA3AF" />
        <rect x="29" y="35" width="2" height="5" rx="1" fill="#9CA3AF" />
      </svg>
    );
  }

  const { colors, pattern } = pot;
  const tid = `thumb-${pot.id}`;

  return (
    <svg width="60" height="56" viewBox="0 0 60 56" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`${tid}-body`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={colors.rim} />
          <stop offset="40%" stopColor={colors.body} />
          <stop offset="100%" stopColor={colors.accent} />
        </linearGradient>
        <linearGradient id={`${tid}-rim`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={colors.rim} />
          <stop offset="100%" stopColor={colors.body} />
        </linearGradient>
        <linearGradient id={`${tid}-shine`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.3" />
          <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.12" />
        </linearGradient>
      </defs>

      {/* Pot body */}
      <path d="M16,24 Q17,36 19,48 L41,48 Q43,36 44,24 Z" fill={`url(#${tid}-body)`} />
      <path d="M16,24 Q17,36 19,48 L41,48 Q43,36 44,24 Z" fill={`url(#${tid}-shine)`} />

      {/* Rim */}
      <rect x="14" y="20" width="32" height="6" rx="3" fill={`url(#${tid}-rim)`} />
      <rect x="15" y="21" width="30" height="1.5" rx="0.75" fill="#FFFFFF" opacity="0.2" />

      {/* Pattern details */}
      {pattern === 'solid' && (
        <>
          <path d="M22,30 Q24,32 22,34" stroke={colors.accent} strokeWidth="0.6" fill="none" opacity="0.3" />
          <path d="M38,32 Q40,34 38,36" stroke={colors.accent} strokeWidth="0.6" fill="none" opacity="0.25" />
        </>
      )}
      {pattern === 'marble' && (
        <>
          <path d="M20,26 Q26,32 23,40 Q21,44 24,48" stroke={colors.accent} strokeWidth="1.2" fill="none" opacity="0.35" strokeLinecap="round" />
          <path d="M34,24 Q37,30 35,36 Q33,41 36,46" stroke={colors.accent} strokeWidth="0.8" fill="none" opacity="0.3" strokeLinecap="round" />
          <ellipse cx="28" cy="34" rx="2" ry="1.5" fill={colors.accent} opacity="0.08" />
        </>
      )}
      {pattern === 'porcelain' && (
        <>
          <circle cx="24" cy="33" r="3.5" fill="none" stroke={colors.accent} strokeWidth="1" opacity="0.7" />
          <circle cx="24" cy="33" r="2" fill="none" stroke={colors.accent} strokeWidth="0.5" opacity="0.4" />
          <circle cx="36" cy="36" r="3" fill="none" stroke={colors.accent} strokeWidth="0.8" opacity="0.6" />
          <circle cx="36" cy="36" r="1.5" fill="none" stroke={colors.accent} strokeWidth="0.5" opacity="0.4" />
          <path d="M20,42 Q26,40 32,42 Q38,44 42,42" stroke={colors.accent} strokeWidth="0.7" fill="none" opacity="0.4" />
          <path d="M28,28 Q30,27 32,28 Q30,29 28,28" fill={colors.accent} opacity="0.4" />
          <path d="M15,22 L45,22" stroke={colors.accent} strokeWidth="0.4" fill="none" opacity="0.3" strokeDasharray="1.5,2" />
        </>
      )}
      {pattern === 'stone' && (
        <>
          <circle cx="22" cy="30" r="1.8" fill={colors.accent} opacity="0.2" />
          <circle cx="34" cy="33" r="2.2" fill={colors.accent} opacity="0.18" />
          <circle cx="26" cy="40" r="1.5" fill={colors.accent} opacity="0.22" />
          <circle cx="38" cy="42" r="2" fill={colors.accent} opacity="0.15" />
          <circle cx="20" cy="44" r="1.2" fill={colors.accent} opacity="0.2" />
          <path d="M18,28 Q19,27 20,28" stroke={colors.accent} strokeWidth="0.4" fill="none" opacity="0.3" />
        </>
      )}
      {pattern === 'mystery' && (
        <>
          <path d="M22,28 L26,32 L22,36 Z" fill={colors.accent} opacity="0.35" />
          <circle cx="34" cy="34" r="3" fill={colors.accent} opacity="0.2" />
          <circle cx="34" cy="34" r="1.5" fill="#FFF" opacity="0.3" />
          <path d="M28,40 L29,42 L31,42 L29.5,43 L30,45 L28,44 L26,45 L26.5,43 L25,42 L27,42 Z" fill={colors.accent} opacity="0.5" />
        </>
      )}

      {/* Active indicator */}
      {isActive && (
        <>
          <circle cx="50" cy="10" r="8" fill="#10B981" />
          <path d="M46,10 L49,13 L54,7" stroke="#FFF" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </>
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
