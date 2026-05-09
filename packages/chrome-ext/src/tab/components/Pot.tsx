import { Pot as PotType } from '@breather/shared/src/types';

interface PotProps {
  pot: PotType;
  size?: number;
}

export default function Pot({ pot, size = 60 }: PotProps) {
  const scale = size / 60;

  return (
    <svg width={size} height={size * 0.8} viewBox="0 0 60 48">
      <path
        d={`M10 12 L14 44 L46 44 L50 12 Z`}
        fill={pot.colors.body}
        stroke={pot.colors.accent}
        strokeWidth="1"
      />
      <rect x={8} y={8} width={44} height={6} rx={3} fill={pot.colors.rim} />
      {pot.pattern === 'stone' && (
        <>
          <line x1={20} y1={14} x2={18} y2={42} stroke={pot.colors.accent} strokeWidth={1} opacity={0.4} />
          <line x1={30} y1={14} x2={30} y2={42} stroke={pot.colors.accent} strokeWidth={1} opacity={0.4} />
          <line x1={40} y1={14} x2={42} y2={42} stroke={pot.colors.accent} strokeWidth={1} opacity={0.4} />
        </>
      )}
      {pot.pattern === 'marble' && (
        <>
          <circle cx={22} cy={28} r={2} fill={pot.colors.accent} opacity={0.4} />
          <circle cx={30} cy={24} r={2} fill={pot.colors.accent} opacity={0.4} />
          <circle cx={38} cy={28} r={2} fill={pot.colors.accent} opacity={0.4} />
          <circle cx={26} cy={36} r={2} fill={pot.colors.accent} opacity={0.4} />
          <circle cx={34} cy={36} r={2} fill={pot.colors.accent} opacity={0.4} />
        </>
      )}
      {pot.pattern === 'mystery' && (
        <path
          d="M20 20 L30 16 L40 20 L40 34 L30 38 L20 34 Z"
          fill="none"
          stroke={pot.colors.accent}
          strokeWidth={1}
          opacity={0.4}
        />
      )}
    </svg>
  );
}
