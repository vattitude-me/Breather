import { PLANT_DAILY_COLORS, Pot } from '@breather/shared';

interface PlantProps {
  stage?: string;
  progress: number;
  colorIndex?: number;
  pot?: Pot;
  dailyLeaves?: number;
  leafDrop?: boolean;
}

const DEFAULT_POT_COLOR = '#C47A30';
const DEFAULT_POT_LIGHT = '#D4894A';
const SOIL_COLOR = '#5C3D2E';

function getDailyColors() {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  return PLANT_DAILY_COLORS[dayOfYear % PLANT_DAILY_COLORS.length];
}

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
  { id: 1, cx: 48, cy: 88, rx: 9, ry: 4.5, rotation: -30, stemX: 55, stemY: 92, side: 'left' },
  { id: 2, cx: 72, cy: 88, rx: 9, ry: 4.5, rotation: 30, stemX: 65, stemY: 92, side: 'right' },
  { id: 3, cx: 44, cy: 78, rx: 10, ry: 5, rotation: -40, stemX: 53, stemY: 82, side: 'left' },
  { id: 4, cx: 76, cy: 78, rx: 10, ry: 5, rotation: 40, stemX: 67, stemY: 82, side: 'right' },
  { id: 5, cx: 46, cy: 67, rx: 11, ry: 5, rotation: -35, stemX: 55, stemY: 72, side: 'left' },
  { id: 6, cx: 74, cy: 67, rx: 11, ry: 5, rotation: 35, stemX: 65, stemY: 72, side: 'right' },
  { id: 7, cx: 42, cy: 56, rx: 10, ry: 5, rotation: -45, stemX: 52, stemY: 62, side: 'left' },
  { id: 8, cx: 78, cy: 56, rx: 10, ry: 5, rotation: 45, stemX: 68, stemY: 62, side: 'right' },
  { id: 9, cx: 46, cy: 45, rx: 9, ry: 4.5, rotation: -30, stemX: 54, stemY: 50, side: 'left' },
  { id: 10, cx: 74, cy: 45, rx: 9, ry: 4.5, rotation: 30, stemX: 66, stemY: 50, side: 'right' },
  { id: 11, cx: 50, cy: 36, rx: 8, ry: 4, rotation: -20, stemX: 56, stemY: 40, side: 'left' },
  { id: 12, cx: 70, cy: 36, rx: 8, ry: 4, rotation: 20, stemX: 64, stemY: 40, side: 'right' },
];

export default function Plant({ progress, colorIndex, pot, dailyLeaves = 0, leafDrop = false }: PlantProps) {
  const colors = colorIndex !== undefined
    ? PLANT_DAILY_COLORS[colorIndex % PLANT_DAILY_COLORS.length]
    : getDailyColors();

  const potBody = pot ? pot.colors.body : DEFAULT_POT_COLOR;
  const potRim = pot ? pot.colors.rim : DEFAULT_POT_LIGHT;
  const potAccent = pot ? pot.colors.accent : DEFAULT_POT_COLOR;
  const potPattern = pot?.pattern || 'solid';

  const visibleLeaves = Math.min(dailyLeaves, LEAF_POSITIONS.length);
  const stemHeight = Math.min(95, 30 + visibleLeaves * 5.5);

  return (
    <svg width="180" height="220" viewBox="0 0 120 160" xmlns="http://www.w3.org/2000/svg" className="plant-svg">
      {/* Pedestal */}
      <rect x="30" y="148" width="60" height="6" rx="2" fill="#D6CEC8" />
      <rect x="34" y="151" width="52" height="4" rx="1" fill="#C4BAB2" />

      {/* Pot */}
      <path d="M35,122 L40,147 L80,147 L85,122 Z" fill={potBody} />
      <path d="M33,117 L87,117 L87,125 L33,125 Z" rx="2" fill={potRim} />
      {potPattern === 'marble' && (
        <>
          <path d="M42,127 Q52,135 46,143" stroke={potAccent} strokeWidth="1.5" fill="none" opacity="0.4" />
          <path d="M68,125 Q74,133 70,141" stroke={potAccent} strokeWidth="1" fill="none" opacity="0.35" />
        </>
      )}
      {potPattern === 'porcelain' && (
        <>
          <circle cx="50" cy="132" r="4" fill="none" stroke={potAccent} strokeWidth="1.2" opacity="0.7" />
          <circle cx="68" cy="135" r="3.5" fill="none" stroke={potAccent} strokeWidth="1" opacity="0.6" />
          <path d="M55,139 Q60,143 65,139" stroke={potAccent} strokeWidth="1" fill="none" opacity="0.5" />
        </>
      )}
      {potPattern === 'stone' && (
        <>
          <circle cx="45" cy="131" r="2" fill={potAccent} opacity="0.25" />
          <circle cx="65" cy="137" r="2.5" fill={potAccent} opacity="0.2" />
          <circle cx="55" cy="142" r="1.5" fill={potAccent} opacity="0.3" />
        </>
      )}
      {potPattern === 'mystery' && (
        <>
          <path d="M45,125 L50,129 L45,133 Z" fill={potAccent} opacity="0.4" />
          <path d="M70,129 L75,133 L70,137 Z" fill={potAccent} opacity="0.3" />
          <circle cx="60" cy="135" r="3" fill={potAccent} opacity="0.25" />
        </>
      )}
      <ellipse cx="60" cy="121" rx="26" ry="4" fill={SOIL_COLOR} />

      {/* Main stem - vine-like curve */}
      <g className="plant-idle-sway">
        <path
          d={`M60,120 C60,${120 - stemHeight * 0.3} 58,${120 - stemHeight * 0.6} 60,${120 - stemHeight}`}
          stroke={colors.stem}
          strokeWidth="3.5"
          fill="none"
          strokeLinecap="round"
        />

        {/* Branch stubs connecting to leaves */}
        {LEAF_POSITIONS.slice(0, visibleLeaves).map((leaf) => (
          <line
            key={`branch-${leaf.id}`}
            x1="60"
            y1={120 - ((leaf.id - 0.5) / LEAF_POSITIONS.length) * stemHeight}
            x2={leaf.stemX}
            y2={leaf.stemY}
            stroke={colors.stem}
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.8"
          />
        ))}

        {/* Individual leaves */}
        {LEAF_POSITIONS.map((leaf) => {
          const visible = leaf.id <= visibleLeaves;
          const isNewest = leaf.id === visibleLeaves;
          const leafColor = leaf.id % 3 === 0 ? colors.leafDark : colors.leaf;

          return (
            <g
              key={`leaf-${leaf.id}`}
              className={`plant-leaf ${visible ? 'visible' : ''} ${isNewest ? 'newest' : ''} ${leafDrop ? 'dropping' : ''}`}
              style={{
                transformOrigin: `${leaf.stemX}px ${leaf.stemY}px`,
                '--leaf-i': leaf.id,
                '--leaf-side': leaf.side === 'left' ? -1 : 1,
              } as React.CSSProperties}
            >
              <ellipse
                cx={leaf.cx}
                cy={leaf.cy}
                rx={leaf.rx}
                ry={leaf.ry}
                fill={leafColor}
                transform={`rotate(${leaf.rotation} ${leaf.cx} ${leaf.cy})`}
              />
              {/* Leaf vein */}
              <line
                x1={leaf.stemX}
                y1={leaf.stemY}
                x2={leaf.cx + (leaf.side === 'left' ? -3 : 3)}
                y2={leaf.cy}
                stroke={colors.leafDark}
                strokeWidth="0.8"
                opacity="0.4"
              />
            </g>
          );
        })}
      </g>

      {/* Seed / soil sprout when no leaves */}
      {visibleLeaves === 0 && (
        <g>
          <ellipse cx="60" cy="118" rx="5" ry="2.5" fill="#8D6E63" />
          {progress > 0 && (
            <line x1="60" y1="117" x2="60" y2={115 - (progress / 100) * 3} stroke={colors.stem} strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
          )}
        </g>
      )}
    </svg>
  );
}
