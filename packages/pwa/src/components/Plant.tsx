import { PLANT_DAILY_COLORS, Pot } from '@breather/shared';

interface PlantProps {
  stage?: string;
  progress: number;
  colorIndex?: number;
  pot?: Pot;
  dailyLeaves?: number;
  leafDrop?: boolean;
}

function getDailyColors() {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  return PLANT_DAILY_COLORS[dayOfYear % PLANT_DAILY_COLORS.length];
}

interface LeafDef {
  id: number;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  side: 'left' | 'right';
}

const LEAF_POSITIONS: LeafDef[] = [
  { id: 1, x: 30, y: 125, rotation: -35, scale: 0.7, side: 'left' },
  { id: 2, x: 120, y: 125, rotation: 35, scale: 0.7, side: 'right' },
  { id: 3, x: 22, y: 105, rotation: -45, scale: 0.8, side: 'left' },
  { id: 4, x: 128, y: 105, rotation: 45, scale: 0.8, side: 'right' },
  { id: 5, x: 28, y: 84, rotation: -38, scale: 0.85, side: 'left' },
  { id: 6, x: 124, y: 84, rotation: 38, scale: 0.85, side: 'right' },
  { id: 7, x: 20, y: 62, rotation: -50, scale: 0.9, side: 'left' },
  { id: 8, x: 132, y: 62, rotation: 50, scale: 0.9, side: 'right' },
  { id: 9, x: 30, y: 42, rotation: -30, scale: 0.85, side: 'left' },
  { id: 10, x: 122, y: 42, rotation: 30, scale: 0.85, side: 'right' },
  { id: 11, x: 40, y: 24, rotation: -20, scale: 0.75, side: 'left' },
  { id: 12, x: 112, y: 24, rotation: 20, scale: 0.75, side: 'right' },
];

const DEFAULT_POT_IMAGE = '/pots/porcelain.png';

export default function Plant({ progress, colorIndex, pot, dailyLeaves = 0, leafDrop = false }: PlantProps) {
  const colors = colorIndex !== undefined
    ? PLANT_DAILY_COLORS[colorIndex % PLANT_DAILY_COLORS.length]
    : getDailyColors();

  const potImage = pot?.image || DEFAULT_POT_IMAGE;
  const visibleLeaves = Math.min(dailyLeaves, LEAF_POSITIONS.length);
  const stemHeight = Math.min(140, 40 + visibleLeaves * 8);

  const showPedestal = potImage === DEFAULT_POT_IMAGE || potImage === '/pots/porcelain.png';

  return (
    <div className="plant-container">
      {/* Stem layer - behind pot */}
      <svg
        className="plant-stem-layer plant-idle-sway"
        viewBox="0 0 180 280"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="stem-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colors.stem} stopOpacity="0.85" />
            <stop offset="100%" stopColor={colors.stem} />
          </linearGradient>
        </defs>

        {/* Main stem */}
        <path
          d={`M90,180 C89,${180 - stemHeight * 0.3} 87,${180 - stemHeight * 0.55} 88,${180 - stemHeight * 0.75} S91,${180 - stemHeight * 0.9} 90,${180 - stemHeight}`}
          stroke="url(#stem-gradient)"
          strokeWidth="5"
          fill="none"
          strokeLinecap="round"
        />

        {/* Branch stubs */}
        {LEAF_POSITIONS.slice(0, visibleLeaves).map((leaf) => {
          const stemY = 180 - ((leaf.id - 0.5) / LEAF_POSITIONS.length) * stemHeight;
          const leafCenterX = leaf.x + 20;
          return (
            <path
              key={`branch-${leaf.id}`}
              d={`M90,${stemY} Q${(90 + leafCenterX) / 2},${stemY - 3} ${leafCenterX},${leaf.y + 18}`}
              stroke={colors.stem}
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              opacity="0.75"
            />
          );
        })}
      </svg>

      {/* Leaves layer */}
      <div className="plant-leaves-layer plant-idle-sway">
        {LEAF_POSITIONS.map((leaf) => {
          const visible = leaf.id <= visibleLeaves;
          const isNewest = leaf.id === visibleLeaves;

          return (
            <img
              key={`leaf-${leaf.id}`}
              src="/pots/leaf.png"
              alt=""
              className={`plant-leaf-img ${visible ? 'visible' : ''} ${isNewest ? 'newest' : ''} ${leafDrop ? 'dropping' : ''}`}
              style={{
                left: `${leaf.x}px`,
                top: `${leaf.y}px`,
                transform: `rotate(${leaf.rotation}deg) scale(${leaf.scale})`,
                '--leaf-i': leaf.id,
                '--leaf-side': leaf.side === 'left' ? -1 : 1,
              } as React.CSSProperties}
            />
          );
        })}
      </div>

      {/* Pot image */}
      <div className={`plant-pot-layer ${showPedestal ? 'with-pedestal' : ''}`}>
        <img
          src={potImage}
          alt="Plant pot"
          className="plant-pot-img"
        />
      </div>

      {/* Seed when no leaves */}
      {visibleLeaves === 0 && (
        <div className="plant-seed">
          <svg width="30" height="20" viewBox="0 0 30 20" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="15" cy="12" rx="8" ry="5" fill="#8D6E63" />
            <ellipse cx="13" cy="11" rx="3" ry="2" fill="#A1887F" opacity="0.5" />
            {progress > 0 && (
              <path
                d={`M15,10 Q14,${8 - (progress / 100) * 3} 15,${6 - (progress / 100) * 4}`}
                stroke={colors.stem}
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                opacity="0.8"
              />
            )}
          </svg>
        </div>
      )}
    </div>
  );
}
