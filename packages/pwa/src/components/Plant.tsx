import { PLANT_DAILY_COLORS, Pot } from '@breather/shared';

interface PlantProps {
  stage?: string;
  progress: number;
  colorIndex?: number;
  pot?: Pot;
  dailyLeaves?: number;
  leafDrop?: boolean;
}

const SOIL_COLOR = '#3E2723';

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

function PotSVG({ potBody, potRim, potAccent, potPattern }: { potBody: string; potRim: string; potAccent: string; potPattern: string }) {
  const potId = `pot-${potPattern}-${potBody.replace('#', '')}`;

  return (
    <g>
      <defs>
        <linearGradient id={`${potId}-body`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={potRim} />
          <stop offset="40%" stopColor={potBody} />
          <stop offset="100%" stopColor={potAccent} />
        </linearGradient>
        <linearGradient id={`${potId}-rim`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={potRim} />
          <stop offset="100%" stopColor={potBody} />
        </linearGradient>
        <linearGradient id={`${potId}-shine`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.3" />
          <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.15" />
        </linearGradient>
        <radialGradient id={`${potId}-soil`} cx="0.5" cy="0.3" r="0.7">
          <stop offset="0%" stopColor="#5D4037" />
          <stop offset="100%" stopColor={SOIL_COLOR} />
        </radialGradient>
      </defs>

      {/* Pedestal - polished stone */}
      <ellipse cx="60" cy="152" rx="30" ry="5" fill="#8D8D8D" opacity="0.3" />
      <rect x="32" y="147" width="56" height="7" rx="3" fill="#A0978F" />
      <rect x="32" y="147" width="56" height="7" rx="3" fill="url(#${potId}-shine)" />
      <rect x="34" y="148" width="52" height="2" rx="1" fill="#C4BAB2" opacity="0.6" />

      {/* Pot body with gradient */}
      <path d="M35,122 Q36,135 40,147 L80,147 Q84,135 85,122 Z" fill={`url(#${potId}-body)`} />
      <path d="M35,122 Q36,135 40,147 L80,147 Q84,135 85,122 Z" fill={`url(#${potId}-shine)`} />

      {/* Rim with depth */}
      <path d="M33,117 Q33,114 36,114 L84,114 Q87,114 87,117 L87,124 Q87,126 84,126 L36,126 Q33,126 33,124 Z" fill={`url(#${potId}-rim)`} />
      <rect x="34" y="115" width="52" height="2" rx="1" fill="#FFFFFF" opacity="0.25" />

      {/* Pattern decorations */}
      {potPattern === 'solid' && (
        <>
          <path d="M44,130 Q46,132 44,134" stroke={potAccent} strokeWidth="0.8" fill="none" opacity="0.3" />
          <path d="M74,128 Q76,131 74,133" stroke={potAccent} strokeWidth="0.8" fill="none" opacity="0.25" />
          <ellipse cx="60" cy="140" rx="12" ry="1" fill="#000" opacity="0.05" />
        </>
      )}
      {potPattern === 'marble' && (
        <>
          <path d="M40,126 Q48,132 44,140 Q42,144 45,147" stroke={potAccent} strokeWidth="1.8" fill="none" opacity="0.35" strokeLinecap="round" />
          <path d="M65,124 Q70,130 67,136 Q64,141 68,147" stroke={potAccent} strokeWidth="1.2" fill="none" opacity="0.3" strokeLinecap="round" />
          <path d="M52,128 Q55,132 53,136" stroke={potAccent} strokeWidth="0.8" fill="none" opacity="0.25" strokeLinecap="round" />
          <path d="M76,130 Q78,134 75,138" stroke={potAccent} strokeWidth="0.6" fill="none" opacity="0.2" strokeLinecap="round" />
          <ellipse cx="48" cy="133" rx="3" ry="2" fill={potAccent} opacity="0.08" />
          <ellipse cx="72" cy="138" rx="4" ry="2.5" fill={potAccent} opacity="0.06" />
        </>
      )}
      {potPattern === 'porcelain' && (
        <>
          {/* Willow-style pattern */}
          <circle cx="50" cy="132" r="5" fill="none" stroke={potAccent} strokeWidth="1.5" opacity="0.7" />
          <circle cx="50" cy="132" r="3" fill="none" stroke={potAccent} strokeWidth="0.8" opacity="0.5" />
          <circle cx="70" cy="135" r="4.5" fill="none" stroke={potAccent} strokeWidth="1.2" opacity="0.65" />
          <circle cx="70" cy="135" r="2.5" fill="none" stroke={potAccent} strokeWidth="0.7" opacity="0.45" />
          <path d="M44,140 Q50,137 56,140 Q62,143 68,140" stroke={potAccent} strokeWidth="1" fill="none" opacity="0.5" />
          <path d="M46,143 Q52,140 58,143 Q64,146 70,143" stroke={potAccent} strokeWidth="0.8" fill="none" opacity="0.4" />
          {/* Decorative leaves */}
          <path d="M55,128 Q58,126 61,128 Q58,130 55,128" fill={potAccent} opacity="0.4" />
          <path d="M62,128 Q65,126 68,128 Q65,130 62,128" fill={potAccent} opacity="0.35" />
          {/* Rim decoration */}
          <path d="M36,118 L84,118" stroke={potAccent} strokeWidth="0.6" fill="none" opacity="0.4" strokeDasharray="2,3" />
          <path d="M36,122 L84,122" stroke={potAccent} strokeWidth="0.6" fill="none" opacity="0.3" strokeDasharray="2,3" />
        </>
      )}
      {potPattern === 'stone' && (
        <>
          {/* Rough stone texture */}
          <circle cx="42" cy="130" r="2.5" fill={potAccent} opacity="0.2" />
          <circle cx="55" cy="133" r="3" fill={potAccent} opacity="0.15" />
          <circle cx="68" cy="129" r="2" fill={potAccent} opacity="0.2" />
          <circle cx="75" cy="136" r="2.8" fill={potAccent} opacity="0.18" />
          <circle cx="48" cy="140" r="2.2" fill={potAccent} opacity="0.15" />
          <circle cx="62" cy="142" r="3.2" fill={potAccent} opacity="0.12" />
          <circle cx="78" cy="143" r="1.8" fill={potAccent} opacity="0.2" />
          {/* Rough edge detail */}
          <path d="M38,128 Q40,126 42,128" stroke={potAccent} strokeWidth="0.5" fill="none" opacity="0.3" />
          <path d="M80,131 Q82,129 83,131" stroke={potAccent} strokeWidth="0.5" fill="none" opacity="0.25" />
        </>
      )}
      {potPattern === 'mystery' && (
        <>
          {/* Ethereal glow pattern */}
          <path d="M42,127 L48,131 L42,135 Z" fill={potAccent} opacity="0.35" />
          <path d="M72,130 L78,134 L72,138 Z" fill={potAccent} opacity="0.3" />
          <circle cx="60" cy="136" r="4" fill={potAccent} opacity="0.2" />
          <circle cx="60" cy="136" r="2" fill="#FFF" opacity="0.3" />
          {/* Stars */}
          <path d="M50,128 L51,130 L53,130 L51.5,131.5 L52,133.5 L50,132 L48,133.5 L48.5,131.5 L47,130 L49,130 Z" fill={potAccent} opacity="0.5" />
          <path d="M68,140 L69,141.5 L70.5,141.5 L69.5,142.5 L70,144 L68,143 L66,144 L66.5,142.5 L65.5,141.5 L67,141.5 Z" fill={potAccent} opacity="0.4" />
          {/* Shimmer lines */}
          <path d="M45,144 Q55,141 65,144" stroke={potAccent} strokeWidth="0.6" fill="none" opacity="0.3" />
        </>
      )}

      {/* Inner soil with gradient */}
      <ellipse cx="60" cy="121" rx="25" ry="4.5" fill={`url(#${potId}-soil)`} />
      <ellipse cx="55" cy="120" rx="6" ry="1.5" fill="#6D4C41" opacity="0.3" />
    </g>
  );
}

export default function Plant({ progress, colorIndex, pot, dailyLeaves = 0, leafDrop = false }: PlantProps) {
  const colors = colorIndex !== undefined
    ? PLANT_DAILY_COLORS[colorIndex % PLANT_DAILY_COLORS.length]
    : getDailyColors();

  const potBody = pot ? pot.colors.body : '#1E40AF';
  const potRim = pot ? pot.colors.rim : '#DBEAFE';
  const potAccent = pot ? pot.colors.accent : '#1E40AF';
  const potPattern = pot?.pattern || 'porcelain';

  const visibleLeaves = Math.min(dailyLeaves, LEAF_POSITIONS.length);
  const stemHeight = Math.min(95, 30 + visibleLeaves * 5.5);

  return (
    <svg width="180" height="220" viewBox="0 0 120 160" xmlns="http://www.w3.org/2000/svg" className="plant-svg">
      <defs>
        <linearGradient id="stem-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={colors.stem} stopOpacity="0.9" />
          <stop offset="100%" stopColor={colors.stem} />
        </linearGradient>
        <linearGradient id="leaf-shine" x1="0" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
        <filter id="leaf-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0.5" dy="1" stdDeviation="0.8" floodOpacity="0.15" />
        </filter>
      </defs>

      {/* Pot and pedestal */}
      <PotSVG potBody={potBody} potRim={potRim} potAccent={potAccent} potPattern={potPattern} />

      {/* Main stem - organic curve with gradient */}
      <g className="plant-idle-sway">
        <path
          d={`M60,120 C59,${120 - stemHeight * 0.25} 57,${120 - stemHeight * 0.5} 58,${120 - stemHeight * 0.75} S61,${120 - stemHeight * 0.9} 60,${120 - stemHeight}`}
          stroke="url(#stem-grad)"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
        {/* Stem highlight */}
        <path
          d={`M60,120 C59,${120 - stemHeight * 0.25} 57,${120 - stemHeight * 0.5} 58,${120 - stemHeight * 0.75} S61,${120 - stemHeight * 0.9} 60,${120 - stemHeight}`}
          stroke="#FFFFFF"
          strokeWidth="1"
          fill="none"
          strokeLinecap="round"
          opacity="0.15"
        />

        {/* Branch stubs with taper */}
        {LEAF_POSITIONS.slice(0, visibleLeaves).map((leaf) => {
          const y1 = 120 - ((leaf.id - 0.5) / LEAF_POSITIONS.length) * stemHeight;
          return (
            <path
              key={`branch-${leaf.id}`}
              d={`M60,${y1} Q${(60 + leaf.stemX) / 2},${(y1 + leaf.stemY) / 2 - 1} ${leaf.stemX},${leaf.stemY}`}
              stroke={colors.stem}
              strokeWidth="2.2"
              fill="none"
              strokeLinecap="round"
              opacity="0.8"
            />
          );
        })}

        {/* Lush detailed leaves */}
        {LEAF_POSITIONS.map((leaf) => {
          const visible = leaf.id <= visibleLeaves;
          const isNewest = leaf.id === visibleLeaves;
          const isLight = leaf.id % 3 === 0;
          const isMid = leaf.id % 3 === 1;
          const leafColor = isLight ? colors.leaf : isMid ? colors.leafDark : colors.leaf;
          const leafHighlight = isLight ? colors.leaf : colors.leafDark;

          return (
            <g
              key={`leaf-${leaf.id}`}
              className={`plant-leaf ${visible ? 'visible' : ''} ${isNewest ? 'newest' : ''} ${leafDrop ? 'dropping' : ''}`}
              style={{
                transformOrigin: `${leaf.stemX}px ${leaf.stemY}px`,
                '--leaf-i': leaf.id,
                '--leaf-side': leaf.side === 'left' ? -1 : 1,
              } as React.CSSProperties}
              filter="url(#leaf-shadow)"
            >
              {/* Main leaf body */}
              <ellipse
                cx={leaf.cx}
                cy={leaf.cy}
                rx={leaf.rx}
                ry={leaf.ry}
                fill={leafColor}
                transform={`rotate(${leaf.rotation} ${leaf.cx} ${leaf.cy})`}
              />
              {/* Leaf highlight/sheen */}
              <ellipse
                cx={leaf.cx + (leaf.side === 'left' ? 1.5 : -1.5)}
                cy={leaf.cy - 1}
                rx={leaf.rx * 0.6}
                ry={leaf.ry * 0.5}
                fill="#FFFFFF"
                opacity="0.15"
                transform={`rotate(${leaf.rotation} ${leaf.cx} ${leaf.cy})`}
              />
              {/* Central vein */}
              <line
                x1={leaf.stemX}
                y1={leaf.stemY}
                x2={leaf.cx + (leaf.side === 'left' ? -leaf.rx * 0.6 : leaf.rx * 0.6)}
                y2={leaf.cy}
                stroke={leafHighlight}
                strokeWidth="0.7"
                opacity="0.5"
              />
              {/* Secondary veins */}
              <line
                x1={(leaf.stemX + leaf.cx) / 2}
                y1={(leaf.stemY + leaf.cy) / 2}
                x2={leaf.cx + (leaf.side === 'left' ? -2 : 2)}
                y2={leaf.cy - 2}
                stroke={leafHighlight}
                strokeWidth="0.4"
                opacity="0.3"
              />
              <line
                x1={(leaf.stemX + leaf.cx) / 2 + (leaf.side === 'left' ? -1 : 1)}
                y1={(leaf.stemY + leaf.cy) / 2 + 1}
                x2={leaf.cx + (leaf.side === 'left' ? -1 : 1)}
                y2={leaf.cy + 2}
                stroke={leafHighlight}
                strokeWidth="0.4"
                opacity="0.3"
              />
            </g>
          );
        })}
      </g>

      {/* Seed / soil sprout when no leaves */}
      {visibleLeaves === 0 && (
        <g>
          <ellipse cx="60" cy="118" rx="5" ry="2.5" fill="#8D6E63" />
          <ellipse cx="58" cy="117.5" rx="2" ry="1" fill="#A1887F" opacity="0.5" />
          {progress > 0 && (
            <path
              d={`M60,117 Q59,${115 - (progress / 100) * 2} 60,${114 - (progress / 100) * 3}`}
              stroke={colors.stem}
              strokeWidth="1.8"
              fill="none"
              strokeLinecap="round"
              opacity="0.8"
            />
          )}
        </g>
      )}
    </svg>
  );
}
