import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { FULL_BLOOM_LEAVES, currentStreak, secondsThisWeek } from '@breather/shared';
import { useGarden } from '../store';
import { SproutScene } from '../components/Sprout';
import { PrimaryButton } from '../components/ui';

const WORDS = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];

export default function CompleteScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const g = useGarden();
  const seconds = (location.state as { seconds?: number } | null)?.seconds;
  if (!seconds) return <Navigate to="/home" replace />;

  const minutes = Math.round(seconds / 60);
  const name = g.sproutName || 'Your sprout';
  const streak = currentStreak(g.days);
  const weekMinutes = Math.round(secondsThisWeek(g) / 60);
  const lead = `${WORDS[minutes] ?? minutes} calm ${minutes === 1 ? 'minute' : 'minutes'}.`;
  const growth = g.leaves === FULL_BLOOM_LEAVES ? `${name} just burst into bloom.` : `${name} grew a new leaf.`;

  return (
    <div className="screen">
      <SproutScene
        leaves={g.leaves}
        grow
        hill={96}
        lip
        halo={240}
        badge={<span className="leaf-badge">+1 leaf</span>}
      />
      <div className="screen-foot">
        <h1 className="title">Nicely done.</h1>
        <p className="lede">{lead} {growth}</p>
        <div className="stat-grid mt-8">
          <Stat value={streak} label={streak === 1 ? 'day in a row' : 'days in a row'} />
          <Stat value={weekMinutes} label="min this week" />
        </div>
        <PrimaryButton label={`Back to ${g.sproutName || 'your sprout'}`} className="mt-12" onClick={() => navigate('/home', { replace: true })} />
      </div>
    </div>
  );
}

export function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="card stat">
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}
