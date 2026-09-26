import type { CSSProperties, ReactNode } from 'react';
import potImage from '../assets/pot.png';

const STEM = '#5E9E62';
const LEAF_COLORS = ['#7DBB78', '#6AAE6A', '#8DC786'];

interface LeafDef {
  id: number;
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  rotation: number;
  stemX: number;
  stemY: number;
  side: 'left' | 'right';
}

const LEAF_POSITIONS: LeafDef[] = [
  { id: 1, cx: 46, cy: 88, rx: 11, ry: 5.5, rotation: -35, stemX: 55, stemY: 92, side: 'left' },
  { id: 2, cx: 74, cy: 88, rx: 11, ry: 5.5, rotation: 35, stemX: 65, stemY: 92, side: 'right' },
  { id: 3, cx: 42, cy: 76, rx: 12, ry: 6, rotation: -42, stemX: 53, stemY: 80, side: 'left' },
  { id: 4, cx: 78, cy: 76, rx: 12, ry: 6, rotation: 42, stemX: 67, stemY: 80, side: 'right' },
  { id: 5, cx: 44, cy: 64, rx: 13, ry: 6, rotation: -38, stemX: 55, stemY: 69, side: 'left' },
  { id: 6, cx: 76, cy: 64, rx: 13, ry: 6, rotation: 38, stemX: 65, stemY: 69, side: 'right' },
  { id: 7, cx: 40, cy: 52, rx: 12, ry: 5.5, rotation: -48, stemX: 52, stemY: 58, side: 'left' },
  { id: 8, cx: 80, cy: 52, rx: 12, ry: 5.5, rotation: 48, stemX: 68, stemY: 58, side: 'right' },
  { id: 9, cx: 44, cy: 40, rx: 11, ry: 5, rotation: -32, stemX: 54, stemY: 46, side: 'left' },
  { id: 10, cx: 76, cy: 40, rx: 11, ry: 5, rotation: 32, stemX: 66, stemY: 46, side: 'right' },
  { id: 11, cx: 48, cy: 30, rx: 10, ry: 5, rotation: -25, stemX: 56, stemY: 35, side: 'left' },
  { id: 12, cx: 72, cy: 30, rx: 10, ry: 5, rotation: 25, stemX: 64, stemY: 35, side: 'right' },
];

interface SproutProps {
  leaves: number;
  /** Pot width in px; the plant scales with it. */
  size?: number;
  /** Play the sprout-in animation on the newest leaf. */
  grow?: boolean;
}

export default function Sprout({ leaves, size = 150, grow = false }: SproutProps) {
  const visibleLeaves = Math.min(leaves, LEAF_POSITIONS.length);
  const stemHeight = Math.min(95, 30 + visibleLeaves * 5.5);
  const top = 118 - stemHeight;
  const bloom = leaves >= LEAF_POSITIONS.length;
  const stemPath = `M60,118 C59,${118 - stemHeight * 0.25} 57,${118 - stemHeight * 0.5} 58,${118 - stemHeight * 0.75} S61,${118 - stemHeight * 0.9} 60,${top}`;
  const plantWidth = (size * 150) / 110;

  return (
    <div className="sprout" style={{ width: plantWidth }}>
      <svg
        className="sprout-plant"
        viewBox="0 0 120 128"
        style={{ width: plantWidth, height: plantWidth, marginBottom: -(size * 9) / 110 }}
        aria-hidden="true"
      >
        <ellipse cx="60" cy="122" rx="42" ry="7" fill="#3E2723" />
        <ellipse cx="52" cy="121" rx="12" ry="3" fill="#5D4037" opacity="0.4" />

        {visibleLeaves === 0 ? (
          <g className="sprout-sway">
            <ellipse cx="60" cy="117" rx="5" ry="2.5" fill="#8D6E63" />
            <path d="M60,116 Q59,110 60,104" stroke={STEM} strokeWidth="2.4" fill="none" strokeLinecap="round" />
            <path d="M60,106 C56,106 53,103 52,99 C56,99 59,102 60,106 Z" fill={LEAF_COLORS[0]} />
            <path d="M60,104 C61,100 64,97 68,98 C67,102 64,104 60,104 Z" fill={LEAF_COLORS[1]} />
          </g>
        ) : (
          <g className="sprout-sway">
            <path d={stemPath} stroke={STEM} strokeWidth="4" fill="none" strokeLinecap="round" />

            {LEAF_POSITIONS.slice(0, visibleLeaves).map((leaf) => {
              const y1 = 118 - ((leaf.id - 0.5) / LEAF_POSITIONS.length) * stemHeight;
              return (
                <path
                  key={`branch-${leaf.id}`}
                  d={`M60,${y1} Q${(60 + leaf.stemX) / 2},${(y1 + leaf.stemY) / 2 - 1} ${leaf.stemX},${leaf.stemY}`}
                  stroke={STEM}
                  strokeWidth="2.2"
                  fill="none"
                  strokeLinecap="round"
                  opacity="0.8"
                />
              );
            })}

            {LEAF_POSITIONS.slice(0, visibleLeaves).map((leaf) => (
              <g
                key={`leaf-${leaf.id}`}
                className={`sprout-leaf${grow && leaf.id === visibleLeaves ? ' newest' : ''}`}
                style={{
                  transformOrigin: `${leaf.stemX}px ${leaf.stemY}px`,
                  '--leaf-i': leaf.id,
                  '--leaf-side': leaf.side === 'left' ? -1 : 1,
                } as CSSProperties}
              >
                <ellipse
                  cx={leaf.cx}
                  cy={leaf.cy}
                  rx={leaf.rx}
                  ry={leaf.ry}
                  fill={LEAF_COLORS[leaf.id % 3]}
                  transform={`rotate(${leaf.rotation} ${leaf.cx} ${leaf.cy})`}
                />
                <line
                  x1={leaf.stemX}
                  y1={leaf.stemY}
                  x2={leaf.cx + (leaf.side === 'left' ? -leaf.rx * 0.5 : leaf.rx * 0.5)}
                  y2={leaf.cy}
                  stroke={STEM}
                  strokeWidth="0.7"
                  opacity="0.4"
                />
              </g>
            ))}

            {bloom && (
              <g className={grow && leaves === LEAF_POSITIONS.length ? 'sprout-leaf newest' : undefined} style={{ transformOrigin: `60px ${top}px` }}>
                {[0, 72, 144, 216, 288].map((a) => (
                  <ellipse key={a} cx="60" cy={top - 5} rx="3.2" ry="5" fill="#F4A48E" transform={`rotate(${a} 60 ${top})`} />
                ))}
                <circle cx="60" cy={top} r="3" fill="#F6C453" />
              </g>
            )}
          </g>
        )}
      </svg>
      <img className="sprout-pot" src={potImage} alt="" style={{ width: size, height: (size * 95) / 110 }} />
    </div>
  );
}

interface SceneProps {
  leaves: number;
  potSize?: number;
  grow?: boolean;
  /** Height of the grass hill in px. */
  hill: number;
  /** Diameter of the soft halo behind the plant. */
  halo?: number;
  /** Optional outer halo, used by the breathing screen. */
  outerHalo?: number;
  /** Distance from the pot rim up to the halo center. Defaults to tucking the halo just behind the rim. */
  haloRise?: number;
  haloScale?: number;
  /** Seconds the halo takes to reach haloScale. */
  haloDuration?: number;
  /** How far the pot sinks into the hill. */
  overlap?: number;
  /** Paint a page-colored lip over the hill so the content below sits on a flat edge. */
  lip?: boolean;
  /** Rendered relative to the halo center. */
  badge?: ReactNode;
  children?: ReactNode;
}

export function SproutScene({
  leaves,
  potSize = 150,
  grow,
  hill,
  halo,
  outerHalo,
  haloRise,
  haloScale = 1,
  haloDuration,
  overlap = 60,
  lip = false,
  badge,
  children,
}: SceneProps) {
  // Halos hang off the pot rim rather than the top of the scene, so they stay
  // behind the plant however tall the screen is.
  const rim = hill - overlap + (potSize * 95) / 110;
  const center = rim + (haloRise ?? (halo ?? 0) / 2 - 30);
  const reach = Math.max(halo ?? 0, outerHalo ?? 0) * Math.max(haloScale, 1) / 2;

  const haloStyle = (size: number) => ({
    width: size,
    height: size,
    margin: -size / 2,
    transform: `scale(${haloScale})`,
    transitionDuration: haloDuration ? `${haloDuration}s` : undefined,
  });

  return (
    <div className="scene" style={{ minHeight: reach ? center + reach : undefined }}>
      <div className="scene-anchor" style={{ bottom: center }}>
        {outerHalo && <div className="scene-halo outer" style={haloStyle(outerHalo)} />}
        {halo && <div className="scene-halo" style={haloStyle(halo)} />}
        {badge}
      </div>
      <div className="scene-plant" style={{ marginBottom: -overlap }}>
        <Sprout leaves={leaves} size={potSize} grow={grow} />
      </div>
      <div className="scene-hill" style={{ height: hill }}>
        {children}
      </div>
      {lip && <div className="scene-lip" />}
    </div>
  );
}
