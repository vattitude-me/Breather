import { FULL_BLOOM_LEAVES, Garden, currentStreak, dateKey, formatTotal, weekOverview } from '@breather/shared';
import { useGarden } from '../store';
import { Stat } from './CompleteScreen';

function gardenLine(g: Garden): string {
  const name = g.sproutName || 'Your sprout';
  if (g.leaves === 0) return `${name} is waiting for its first leaf.`;
  if (g.leaves >= FULL_BLOOM_LEAVES) return `${name} is in full bloom with ${g.leaves} leaves.`;
  const left = FULL_BLOOM_LEAVES - g.leaves;
  return `${name} has ${g.leaves} ${g.leaves === 1 ? 'leaf' : 'leaves'}. ${left} more to full bloom.`;
}

function sessionLabel(at: Date, now: Date): string {
  const time = at.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  const days = Math.round(
    (new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() -
      new Date(at.getFullYear(), at.getMonth(), at.getDate()).getTime()) / 86_400_000
  );
  if (dateKey(at) === dateKey(now)) return `Today, ${time}`;
  if (days === 1) return `Yesterday, ${time}`;
  if (days < 7) return `${at.toLocaleDateString(undefined, { weekday: 'long' })}, ${time}`;
  return `${at.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}, ${time}`;
}

export default function ProgressScreen() {
  const g = useGarden();
  const now = new Date();
  const week = weekOverview(g.days, now);
  const doneThisWeek = week.filter((d) => d.done).length;
  const streak = currentStreak(g.days, now);
  const recent = g.sessions.slice(0, 5);

  return (
    <div className="screen">
      <div className="screen-head">
        <h1 className="title">Your garden</h1>
        <p className="lede">{gardenLine(g)}</p>
      </div>

      <div className="card week">
        <div className="week-head">
          <span className="block-title">This week</span>
          <span className="muted">{doneThisWeek} of 7 days</span>
        </div>
        <div className="week-days">
          {week.map((d) => (
            <div key={d.key} className="week-day">
              <span
                className={[
                  'day-dot',
                  d.done && 'done',
                  d.isToday && 'today',
                  d.isFuture && 'future',
                ].filter(Boolean).join(' ')}
              />
              <span className={d.isToday ? 'day-letter today' : 'day-letter'}>{d.letter}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="stat-grid pad-x mt-14">
        <Stat value={streak} label="day streak" />
        <Stat value={formatTotal(g.totalSeconds)} label="total calm" />
      </div>

      <div className="block">
        <span className="block-title">Recent</span>
        {recent.length === 0 ? (
          <p className="hint">Your sessions will show up here.</p>
        ) : (
          <div className="recent">
            {recent.map((s, i) => (
              <div key={s.at} className="recent-row">
                <span className="recent-when">
                  <span className={`recent-dot${i === 0 ? ' latest' : ''}`} />
                  {sessionLabel(new Date(s.at), now)}
                </span>
                <span className="muted">{Math.round(s.seconds / 60)} min</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
