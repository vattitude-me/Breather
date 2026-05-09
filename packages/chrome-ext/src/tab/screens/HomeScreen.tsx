import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { WELLNESS_TIPS, POTS_CATALOG } from '@breather/shared/src/constants';
import { DayOfWeek } from '@breather/shared/src/types';
import { useRemindersContext } from '../context/RemindersContext';
import { usePlantState } from '../hooks/usePlantState';
import { usePotCollection } from '../hooks/usePotCollection';
import Plant from '../components/Plant';
import Pot from '../components/Pot';
import PotsDrawer from '../components/PotsDrawer';

const CARD_COLORS = ['var(--card-pink)', 'var(--card-peach)', 'var(--card-mint)', 'var(--card-lavender)'];

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function formatDate(): string {
  return new Date().toLocaleDateString('en-AU', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function getDayOfWeek(): DayOfWeek {
  const days: DayOfWeek[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[new Date().getDay()];
}

function getReminderStatus(r: { isActive: boolean; schedule: { activeDays: DayOfWeek[]; startHour: number; endHour: number } }) {
  if (!r.isActive) return { label: 'Paused', cls: 'paused' };
  const now = new Date();
  const day = getDayOfWeek();
  const hour = now.getHours();
  if (!r.schedule.activeDays.includes(day) || hour < r.schedule.startHour || hour >= r.schedule.endHour) {
    return { label: 'Outside hours', cls: 'outside' };
  }
  return { label: 'Active', cls: 'active' };
}

export default function HomeScreen() {
  const navigate = useNavigate();
  const { reminders, dispatch } = useRemindersContext();
  const { plantState, dailyLeaves, colors } = usePlantState();
  const { state: potState, activePot, nextUnlock, equip, catalog } = usePotCollection();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [tipIndex] = useState(() => Math.floor(Math.random() * WELLNESS_TIPS.length));

  const todayBreaks = potState.totalBreaksCompleted;

  return (
    <div>
      <header className="header">
        <div className="header-title">
          <span>🌱</span> Breather
        </div>
      </header>

      <div className="greeting">
        {getGreeting()} - {formatDate()}
      </div>

      <div className="plant-hero">
        <div className="plant-hero-stats">
          🌿 {dailyLeaves} breaks today
        </div>
        {nextUnlock && (
          <div className="plant-hero-unlock">
            ⭐ Next {nextUnlock.name} in {nextUnlock.breaksAway} breaks
          </div>
        )}
        <div className="plant-svg-container">
          <Plant stage={plantState.stage} leaves={dailyLeaves} colors={colors} />
          <div onClick={() => setDrawerOpen(true)} style={{ cursor: 'pointer', marginLeft: -10 }}>
            <Pot pot={activePot} size={60} />
          </div>
        </div>
      </div>

      <div className="section">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span className="section-title" style={{ marginBottom: 0 }}>My Break Routines</span>
          <button className="btn btn-secondary" onClick={() => navigate('/add-reminder')}>
            + Add New
          </button>
        </div>

        {reminders.length === 0 ? (
          <button className="add-reminder-btn" onClick={() => navigate('/add-reminder')}>
            + Create your first routine
          </button>
        ) : (
          <div className="reminder-grid">
            {reminders.map((r, i) => {
              const status = getReminderStatus(r);
              const schedDays = r.schedule.activeDays.length === 7
                ? 'Every day'
                : r.schedule.activeDays.length === 5 &&
                  !r.schedule.activeDays.includes('Sat') &&
                  !r.schedule.activeDays.includes('Sun')
                  ? 'Weekdays'
                  : r.schedule.activeDays.join(', ');

              return (
                <div
                  key={r.id}
                  className="reminder-card"
                  style={{ background: CARD_COLORS[i % CARD_COLORS.length] }}
                >
                  <button
                    className="delete-btn"
                    onClick={(e) => { e.stopPropagation(); dispatch({ type: 'DELETE', payload: r.id }); }}
                  >
                    🗑️
                  </button>
                  <div>
                    <div
                      className="reminder-card-icon"
                      onClick={() => navigate(`/edit-reminder/${r.id}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      {r.icon}
                    </div>
                    <div className="reminder-card-title">{r.title}</div>
                    <div className="reminder-card-interval">
                      Every {r.intervalMinutes >= 60 ? `${r.intervalMinutes / 60}h` : `${r.intervalMinutes}m`}
                    </div>
                    <div className="reminder-card-status">
                      <span className={`status-dot ${status.cls}`} />
                      <span>{status.label}</span>
                    </div>
                  </div>
                  <div className="reminder-card-footer">
                    <span className="reminder-card-schedule">
                      {r.schedule.startHour}:00-{r.schedule.endHour}:00 - {schedDays}
                    </span>
                    <button
                      className={`toggle ${r.isActive ? 'active' : ''}`}
                      onClick={() => dispatch({ type: 'TOGGLE', payload: r.id })}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="section">
        <div className="tip-card">
          💡 {WELLNESS_TIPS[tipIndex]}
        </div>
      </div>

      <PotsDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        catalog={catalog}
        state={potState}
        onEquip={equip}
      />
    </div>
  );
}
