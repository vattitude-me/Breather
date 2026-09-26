import { useEffect, useState } from 'react';
import {
  Garden,
  STORAGE_KEYS,
  currentStreak,
  didBreatheToday,
  formatClock,
  normalizeGarden,
} from '@breather/shared';
import Sprout from '@pwa/components/Sprout';

function openPwa(path: string) {
  chrome.runtime.sendMessage({ type: 'OPEN_TAB', path });
  window.close();
}

export default function PopupApp() {
  const [garden, setGarden] = useState<Garden | null | undefined>(undefined);

  useEffect(() => {
    const load = () => {
      chrome.storage.local.get(STORAGE_KEYS.GARDEN, (result) => {
        const raw = result[STORAGE_KEYS.GARDEN];
        setGarden(raw ? normalizeGarden(raw) : null);
      });
    };
    load();
    chrome.runtime.sendMessage({ type: 'PULL_FROM_PWA' }, (response) => {
      if (response?.ok) load();
    });
  }, []);

  if (garden === undefined) return <div className="popup" />;

  if (!garden?.onboarded) {
    return (
      <div className="popup">
        <div className="stage">
          <div className="halo" />
          <Sprout leaves={garden?.leaves ?? 0} size={96} />
        </div>
        <div className="body">
          <h1>Meet your sprout.</h1>
          <p>A tiny desk garden that grows each time you stop to breathe.</p>
          <button className="cta" onClick={() => openPwa('/')}>
            <span>Get started</span>
            <Arrow />
          </button>
        </div>
      </div>
    );
  }

  const name = garden.sproutName || 'Your sprout';
  const streak = currentStreak(garden.days);
  const doneToday = didBreatheToday(garden);
  const status = doneToday
    ? 'You breathed today. Nicely done.'
    : garden.reminder.enabled
      ? `Reminder at ${formatClock(garden.reminder.time)}`
      : 'Reminders are off';

  return (
    <div className="popup">
      <div className="stage">
        <div className="halo" />
        <Sprout leaves={garden.leaves} size={96} />
      </div>
      <div className="body">
        <h1>{name}</h1>
        <p className="stats">
          {garden.leaves} {garden.leaves === 1 ? 'leaf' : 'leaves'}
          {streak > 0 && ` · ${streak} ${streak === 1 ? 'day' : 'days'} in a row`}
        </p>
        <button className="cta" onClick={() => openPwa('/breathe')}>
          <span>{doneToday ? 'Breathe again' : 'Begin breathing'}</span>
          <span className="meta">{garden.sessionMinutes} min</span>
        </button>
        <div className="foot">
          <span>{status}</span>
          <button className="link" onClick={() => openPwa('/home')}>Open Breather</button>
        </div>
      </div>
    </div>
  );
}

function Arrow() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}
