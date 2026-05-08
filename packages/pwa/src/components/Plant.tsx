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

const DEFAULT_POT_IMAGE = '/pots/terracotta.png';

export default function Plant({ progress, colorIndex, pot, dailyLeaves = 0, leafDrop = false }: PlantProps) {
  const colors = colorIndex !== undefined
    ? PLANT_DAILY_COLORS[colorIndex % PLANT_DAILY_COLORS.length]
    : getDailyColors();

  const potImage = pot?.image || DEFAULT_POT_IMAGE;
  const visibleLeaves = Math.min(dailyLeaves, LEAF_POSITIONS.length);
  const stemHeight = Math.min(95, 30 + visibleLeaves * 5.5);

  return (
    <div className="plant-container">
      {/* SVG stem and leaves */}
      <svg className="plant-svg-layer" viewBox="0 0 120 128" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="stem-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colors.stem} stopOpacity="0.85" />
            <stop offset="100%" stopColor={colors.stem} />
          </linearGradient>
          <filter id="leaf-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0.5" dy="1" stdDeviation="0.8" floodOpacity="0.15" />
          </filter>
        </defs>

        {/* Soil mound - sized to match pot opening */}
        <ellipse cx="60" cy="122" rx="42" ry="7" fill={SOIL_COLOR} />
        <ellipse cx="52" cy="121" rx="12" ry="3" fill="#5D4037" opacity="0.4" />
        <ellipse cx="68" cy="121.5" rx="7" ry="2" fill="#4E342E" opacity="0.3" />

        {/* Main stem */}
        <g className="plant-idle-sway">
          <path
            d={`M60,118 C59,${118 - stemHeight * 0.25} 57,${118 - stemHeight * 0.5} 58,${118 - stemHeight * 0.75} S61,${118 - stemHeight * 0.9} 60,${118 - stemHeight}`}
            stroke="url(#stem-grad)"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d={`M60,118 C59,${118 - stemHeight * 0.25} 57,${118 - stemHeight * 0.5} 58,${118 - stemHeight * 0.75} S61,${118 - stemHeight * 0.9} 60,${118 - stemHeight}`}
            stroke="#FFFFFF"
            strokeWidth="1"
            fill="none"
            strokeLinecap="round"
            opacity="0.12"
          />

          {/* Branch stubs */}
          {LEAF_POSITIONS.slice(0, visibleLeaves).map((leaf) => {
            const y1 = 118 - ((leaf.id - 0.5) / LEAF_POSITIONS.length) * stemHeight;
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

          {/* Leaves */}
          {LEAF_POSITIONS.map((leaf) => {
            const visible = leaf.id <= visibleLeaves;
            const isNewest = leaf.id === visibleLeaves;
            const leafColor = leaf.id % 3 === 0 ? colors.leafDark : leaf.id % 3 === 1 ? colors.leaf : colors.leafDark;
            const leafHighlight = colors.leafDark;

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
                <ellipse
                  cx={leaf.cx}
                  cy={leaf.cy}
                  rx={leaf.rx}
                  ry={leaf.ry}
                  fill={leafColor}
                  transform={`rotate(${leaf.rotation} ${leaf.cx} ${leaf.cy})`}
                />
                <ellipse
                  cx={leaf.cx + (leaf.side === 'left' ? 1.5 : -1.5)}
                  cy={leaf.cy - 1}
                  rx={leaf.rx * 0.55}
                  ry={leaf.ry * 0.45}
                  fill="#FFFFFF"
                  opacity="0.12"
                  transform={`rotate(${leaf.rotation} ${leaf.cx} ${leaf.cy})`}
                />
                <line
                  x1={leaf.stemX}
                  y1={leaf.stemY}
                  x2={leaf.cx + (leaf.side === 'left' ? -leaf.rx * 0.5 : leaf.rx * 0.5)}
                  y2={leaf.cy}
                  stroke={leafHighlight}
                  strokeWidth="0.7"
                  opacity="0.45"
                />
                <line
                  x1={(leaf.stemX + leaf.cx) / 2}
                  y1={(leaf.stemY + leaf.cy) / 2}
                  x2={leaf.cx + (leaf.side === 'left' ? -2 : 2)}
                  y2={leaf.cy - 1.5}
                  stroke={leafHighlight}
                  strokeWidth="0.4"
                  opacity="0.25"
                />
              </g>
            );
          })}
        </g>

        {/* Seed when no leaves */}
        {visibleLeaves === 0 && (
          <g>
            <ellipse cx="60" cy="116" rx="5" ry="2.5" fill="#8D6E63" />
            <ellipse cx="58" cy="115.5" rx="2" ry="1" fill="#A1887F" opacity="0.5" />
            {progress > 0 && (
              <path
                d={`M60,115 Q59,${113 - (progress / 100) * 2} 60,${112 - (progress / 100) * 3}`}
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

      {/* Pot image with shadow */}
      <div className="plant-pot-wrapper">
        <div className="plant-pot-shadow" />
        <img src={potImage} alt="Plant pot" className="plant-pot-img" />
      </div>
    </div>
  );
}
