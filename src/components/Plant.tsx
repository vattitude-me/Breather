import { PlantStage } from '../types';
import { COLORS, PLANT_DAILY_COLORS } from '../constants';

interface PlantProps {
  stage: PlantStage;
  progress: number;
  colorIndex?: number;
}

const POT_COLOR = '#C47A30';
const POT_LIGHT = '#D4894A';
const SOIL_COLOR = '#5C3D2E';

function getDailyColors() {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  return PLANT_DAILY_COLORS[dayOfYear % PLANT_DAILY_COLORS.length];
}

export default function Plant({ stage, progress, colorIndex }: PlantProps) {
  const colors = colorIndex !== undefined
    ? PLANT_DAILY_COLORS[colorIndex % PLANT_DAILY_COLORS.length]
    : getDailyColors();
  const scale = 0.85 + (progress / 100) * 0.15;
  const leafOpacity = 0.6 + (progress / 100) * 0.4;

  return (
    <svg width="120" height="140" viewBox="0 0 120 140" xmlns="http://www.w3.org/2000/svg">
      {/* Pot */}
      <path d="M35,105 L40,130 L80,130 L85,105 Z" fill={POT_COLOR} />
      <path d="M33,100 L87,100 L87,108 L33,108 Z" rx="2" fill={POT_LIGHT} />
      <ellipse cx="60" cy="104" rx="26" ry="4" fill={SOIL_COLOR} />

      {stage === 'seed' && (
        <g>
          <ellipse cx="60" cy="100" rx={4 + (progress / 100) * 2} ry={2.5 + (progress / 100) * 1} fill="#8D6E63" />
          {progress > 50 && (
            <line x1="60" y1="99" x2="60" y2={97 - (progress - 50) / 25} stroke={colors.stem} strokeWidth="1.5" strokeLinecap="round" opacity={(progress - 50) / 50} />
          )}
        </g>
      )}

      {stage === 'sprout' && (
        <g style={{ transition: 'all 0.4s ease', transformOrigin: '60px 100px', transform: `scale(${scale})` }}>
          <line x1="60" y1="100" x2="60" y2={88 - (progress / 100) * 8} stroke={colors.stem} strokeWidth="3" strokeLinecap="round" />
          <ellipse cx="52" cy={86 - (progress / 100) * 6} rx={6 + (progress / 100) * 3} ry={3 + (progress / 100) * 1.5} fill={colors.leaf} transform={`rotate(-30 52 ${86 - (progress / 100) * 6})`} opacity={leafOpacity} />
          <ellipse cx="68" cy={86 - (progress / 100) * 6} rx={6 + (progress / 100) * 3} ry={3 + (progress / 100) * 1.5} fill={colors.leaf} transform={`rotate(30 68 ${86 - (progress / 100) * 6})`} opacity={leafOpacity} />
        </g>
      )}

      {stage === 'sapling' && (
        <g style={{ transition: 'all 0.4s ease', transformOrigin: '60px 100px', transform: `scale(${scale})` }}>
          <line x1="60" y1="100" x2="60" y2={70 - (progress / 100) * 5} stroke={colors.stem} strokeWidth="3.5" strokeLinecap="round" />
          <ellipse cx="49" cy="85" rx="9" ry="4" fill={colors.leaf} transform="rotate(-35 49 85)" opacity={leafOpacity} />
          <ellipse cx="71" cy="85" rx="9" ry="4" fill={colors.leaf} transform="rotate(35 71 85)" opacity={leafOpacity} />
          <ellipse cx="48" cy="73" rx={8 + (progress / 100) * 3} ry="4.5" fill={colors.leafDark} transform="rotate(-25 48 73)" opacity={leafOpacity} />
          <ellipse cx="72" cy="73" rx={8 + (progress / 100) * 3} ry="4.5" fill={colors.leafDark} transform="rotate(25 72 73)" opacity={leafOpacity} />
          <ellipse cx="55" cy={67 - (progress / 100) * 3} rx={6 + (progress / 100) * 2} ry="3.5" fill={colors.leaf} transform={`rotate(-15 55 ${67 - (progress / 100) * 3})`} opacity={leafOpacity} />
          <ellipse cx="65" cy={67 - (progress / 100) * 3} rx={6 + (progress / 100) * 2} ry="3.5" fill={colors.leaf} transform={`rotate(15 65 ${67 - (progress / 100) * 3})`} opacity={leafOpacity} />
        </g>
      )}

      {stage === 'tree' && (
        <g style={{ transition: 'all 0.4s ease', transformOrigin: '60px 100px', transform: `scale(${scale})` }}>
          <path d="M57,100 L57,60 Q57,55 60,52 Q63,55 63,60 L63,100" fill={colors.stem} />
          <line x1="57" y1="80" x2="45" y2="72" stroke={colors.stem} strokeWidth="2" strokeLinecap="round" />
          <line x1="63" y1="75" x2="75" y2="68" stroke={colors.stem} strokeWidth="2" strokeLinecap="round" />
          <ellipse cx="60" cy="48" rx={24 + (progress / 100) * 5} ry={18 + (progress / 100) * 5} fill={colors.leaf} opacity={leafOpacity} />
          <ellipse cx="48" cy="55" rx="16" ry="14" fill={colors.leafDark} opacity={0.4 + (progress / 100) * 0.2} />
          <ellipse cx="72" cy="52" rx="14" ry="12" fill={colors.leafDark} opacity={0.35 + (progress / 100) * 0.2} />
          <ellipse cx="60" cy="40" rx={14 + (progress / 100) * 4} ry={10 + (progress / 100) * 3} fill={colors.leaf} opacity={0.5 + (progress / 100) * 0.3} />
        </g>
      )}

      {stage === 'flowering' && (
        <g style={{ transition: 'all 0.4s ease', transformOrigin: '60px 100px', transform: `scale(${scale})` }}>
          <path d="M57,100 L57,60 Q57,55 60,52 Q63,55 63,60 L63,100" fill={colors.stem} />
          <line x1="57" y1="80" x2="45" y2="72" stroke={colors.stem} strokeWidth="2" strokeLinecap="round" />
          <line x1="63" y1="75" x2="75" y2="68" stroke={colors.stem} strokeWidth="2" strokeLinecap="round" />
          <ellipse cx="60" cy="48" rx="29" ry="23" fill={colors.leaf} />
          <ellipse cx="48" cy="55" rx="16" ry="14" fill={colors.leafDark} opacity="0.6" />
          <ellipse cx="72" cy="52" rx="14" ry="12" fill={colors.leafDark} opacity="0.5" />
          <ellipse cx="60" cy="40" rx="18" ry="13" fill={colors.leaf} opacity="0.8" />
          {/* Flowers — appear progressively */}
          <circle cx="45" cy="42" r={4 + (progress / 100)} fill={COLORS.primary} opacity={0.7 + (progress / 100) * 0.3} />
          <circle cx="45" cy="42" r="2" fill="#FFF9C4" />
          <circle cx="70" cy="38" r={4 + (progress / 100)} fill={COLORS.primary} opacity={0.7 + (progress / 100) * 0.3} />
          <circle cx="70" cy="38" r="2" fill="#FFF9C4" />
          <circle cx="58" cy="30" r={3.5 + (progress / 100) * 0.5} fill={COLORS.secondary} opacity={0.7 + (progress / 100) * 0.3} />
          <circle cx="58" cy="30" r="1.8" fill="#FFF9C4" />
          {progress > 30 && (
            <>
              <circle cx="78" cy="50" r="4" fill={COLORS.primary} opacity={(progress - 30) / 70} />
              <circle cx="78" cy="50" r="1.5" fill="#FFF9C4" opacity={(progress - 30) / 70} />
            </>
          )}
          {progress > 60 && (
            <>
              <circle cx="40" cy="55" r="4" fill={COLORS.secondary} opacity={(progress - 60) / 40} />
              <circle cx="40" cy="55" r="1.5" fill="#FFF9C4" opacity={(progress - 60) / 40} />
            </>
          )}
        </g>
      )}
    </svg>
  );
}
