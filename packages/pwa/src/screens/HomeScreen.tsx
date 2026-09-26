import { useNavigate } from 'react-router-dom';
import { currentStreak, didBreatheToday, greeting } from '@breather/shared';
import { useGarden } from '../store';
import { SproutScene } from '../components/Sprout';
import { PrimaryButton } from '../components/ui';
import { Flame } from '../components/icons';

export default function HomeScreen() {
  const navigate = useNavigate();
  const g = useGarden();
  const now = new Date();
  const streak = currentStreak(g.days, now);
  const doneToday = didBreatheToday(g, now);
  const name = g.sproutName || 'Your sprout';

  return (
    <div className="screen">
      <div className="screen-head home-head">
        <div className="home-meta">
          <span className="date">
            {now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </span>
          {streak > 0 && (
            <span className="pill">
              <Flame />
              {streak} {streak === 1 ? 'day' : 'days'}
            </span>
          )}
        </div>
        <h1 className="title mt-14">
          {doneToday ? `${greeting(now)}. ${name} is soaking it in.` : `${greeting(now)}. Take a slow breath.`}
        </h1>
        <p className="lede">
          {doneToday
            ? 'You breathed today. Another round is always welcome.'
            : `${name} grows a little each time you pause.`}
        </p>
        <PrimaryButton
          label={doneToday ? 'Breathe again' : 'Begin breathing'}
          meta={`${g.sessionMinutes} min`}
          className="mt-18"
          onClick={() => navigate('/breathe')}
        />
      </div>
      <SproutScene leaves={g.leaves} hill={118} halo={220} />
    </div>
  );
}
