import { PlantStage } from '@breather/shared/src/types';

interface PlantProps {
  stage: PlantStage;
  leaves: number;
  colors: { leaf: string; leafDark: string; stem: string };
}

const LEAF_POSITIONS = [
  { x: 0, y: 0, side: 'left' },
  { x: 0, y: -14, side: 'right' },
  { x: 0, y: -28, side: 'left' },
  { x: 0, y: -42, side: 'right' },
  { x: 0, y: -56, side: 'left' },
  { x: 0, y: -70, side: 'right' },
  { x: 0, y: -84, side: 'left' },
  { x: 0, y: -98, side: 'right' },
  { x: 0, y: -112, side: 'left' },
  { x: 0, y: -126, side: 'right' },
  { x: 0, y: -140, side: 'left' },
  { x: 0, y: -154, side: 'right' },
];

function StemPath({ height, color }: { height: number; color: string }) {
  return (
    <path
      d={`M50 180 Q50 ${180 - height * 0.5} 50 ${180 - height}`}
      stroke={color}
      strokeWidth="4"
      fill="none"
      strokeLinecap="round"
    />
  );
}

function Leaf({ x, y, side, color, colorDark, index, total }: {
  x: number; y: number; side: string; color: string; colorDark: string;
  index: number; total: number;
}) {
  const isNewest = index === total - 1;
  const leafX = side === 'left' ? 50 + x - 12 : 50 + x + 4;
  const leafY = 180 + y;
  const flip = side === 'left' ? -1 : 1;

  return (
    <g opacity={isNewest ? 1 : 0.9}>
      <ellipse
        cx={leafX + flip * 8}
        cy={leafY}
        rx={10}
        ry={5}
        fill={index % 2 === 0 ? color : colorDark}
        transform={`rotate(${flip * 20} ${leafX + flip * 8} ${leafY})`}
      >
        {isNewest && (
          <animate attributeName="opacity" values="0.7;1;0.7" dur="1.5s" repeatCount="indefinite" />
        )}
      </ellipse>
    </g>
  );
}

function Flower({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <g>
      <circle cx={50 + x} cy={180 + y - 8} r={4} fill={color} opacity={0.9} />
      <circle cx={50 + x - 3} cy={180 + y - 5} r={3} fill="#F8BBD0" opacity={0.7} />
      <circle cx={50 + x + 3} cy={180 + y - 5} r={3} fill="#F8BBD0" opacity={0.7} />
    </g>
  );
}

export default function Plant({ stage, leaves, colors }: PlantProps) {
  const stemHeight = stage === 'seed' ? 0
    : stage === 'sprout' ? 30
    : stage === 'sapling' ? 80
    : stage === 'tree' ? 130
    : 160;

  const visibleLeaves = Math.min(leaves, 12);
  const showFlower = stage === 'flowering';

  return (
    <svg width="100" height="200" viewBox="0 0 100 200">
      {stage === 'seed' && (
        <ellipse cx={50} cy={185} rx={8} ry={5} fill="#8D6E63" />
      )}

      {stemHeight > 0 && (
        <StemPath height={stemHeight} color={colors.stem} />
      )}

      {LEAF_POSITIONS.slice(0, visibleLeaves).map((pos, i) => (
        <Leaf
          key={i}
          x={pos.x}
          y={pos.y}
          side={pos.side}
          color={colors.leaf}
          colorDark={colors.leafDark}
          index={i}
          total={visibleLeaves}
        />
      ))}

      {showFlower && <Flower x={0} y={-stemHeight} color="#E91E63" />}

      <ellipse cx={50} cy={190} rx={20} ry={6} fill="#5D4037" opacity={0.3} />
    </svg>
  );
}
