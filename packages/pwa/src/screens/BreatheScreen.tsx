import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPattern, recordSession } from '@breather/shared';
import { getGarden, updateGarden, useGarden } from '../store';
import { chime, pulse } from '../services/cues';
import { SproutScene } from '../components/Sprout';
import { Close, Pause, Play, Volume, VolumeOff } from '../components/icons';

const TICK_MS = 200;

function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return;
    let sentinel: WakeLockSentinel | null = null;
    let cancelled = false;
    const acquire = () => {
      navigator.wakeLock.request('screen').then((s) => {
        if (cancelled) s.release();
        else sentinel = s;
      }).catch(() => {});
    };
    const onVisible = () => { if (document.visibilityState === 'visible') acquire(); };
    acquire();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      sentinel?.release().catch(() => {});
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [active]);
}

export default function BreatheScreen() {
  const navigate = useNavigate();
  const g = useGarden();
  const pattern = getPattern(g.patternId);
  // The length is fixed when the session starts, even if settings change mid-way.
  const [totalMs] = useState(() => getGarden().sessionMinutes * 60_000);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(true);
  const lastTick = useRef(Date.now());
  const finished = useRef(false);

  useWakeLock(running);

  useEffect(() => {
    if (!running) return;
    lastTick.current = Date.now();
    const id = window.setInterval(() => {
      const now = Date.now();
      const delta = now - lastTick.current;
      lastTick.current = now;
      setElapsed((e) => Math.min(totalMs, e + delta));
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [running, totalMs]);

  const cycleMs = useMemo(() => pattern.phases.reduce((n, p) => n + p.seconds * 1000, 0), [pattern]);
  const { phaseIndex, phaseLeft } = useMemo(() => {
    let t = elapsed % cycleMs;
    for (let i = 0; i < pattern.phases.length; i++) {
      const len = pattern.phases[i].seconds * 1000;
      if (t < len) return { phaseIndex: i, phaseLeft: Math.ceil((len - t) / 1000) };
      t -= len;
    }
    return { phaseIndex: 0, phaseLeft: pattern.phases[0].seconds };
  }, [elapsed, cycleMs, pattern]);
  const phase = pattern.phases[phaseIndex];
  const cycleCount = Math.floor(elapsed / cycleMs);

  // Cue each phase change (including the first) with the optional chime and haptic tap.
  useEffect(() => {
    if (!running || finished.current) return;
    const { chime: withChime, haptics } = getGarden();
    if (withChime) chime(phase.expanded ? 440 : 330);
    if (haptics) pulse();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phaseIndex, cycleCount]);

  useEffect(() => {
    if (elapsed < totalMs || finished.current) return;
    finished.current = true;
    const seconds = Math.round(totalMs / 1000);
    updateGarden((current) => recordSession(current, seconds));
    if (getGarden().chime) chime(528);
    navigate('/done', { replace: true, state: { seconds } });
  }, [elapsed, totalMs, navigate]);

  const remaining = Math.max(0, Math.ceil((totalMs - elapsed) / 1000));
  const clock = `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')}`;
  const countdown = Array.from({ length: phase.seconds }, (_, i) => phase.seconds - i);

  return (
    <div className="screen breathe">
      <div className="breathe-top">
        <button className="icon-btn" aria-label="End session" onClick={() => navigate('/home', { replace: true })}>
          <Close />
        </button>
        <span className="breathe-clock">{clock} left</span>
        <button
          className="icon-btn"
          aria-label={g.chime ? 'Mute chime' : 'Unmute chime'}
          onClick={() => updateGarden((cur) => ({ ...cur, chime: !cur.chime }))}
        >
          {g.chime ? <Volume /> : <VolumeOff />}
        </button>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${(elapsed / totalMs) * 100}%` }} />
      </div>
      <div className="screen-head breathe-head" aria-live="polite">
        <h1 className="breathe-phase">{running ? `${phase.label}…` : 'Paused'}</h1>
        <p className="breathe-count">
          {countdown.map((n, i) => (
            <span key={n} className={running && n === phaseLeft ? 'now' : undefined}>
              {i > 0 && ' · '}
              {n}
            </span>
          ))}
        </p>
      </div>
      <SproutScene
        leaves={g.leaves}
        potSize={150}
        hill={200}
        halo={220}
        outerHalo={300}
        haloScale={running ? (phase.expanded ? 1.12 : 0.88) : 1}
        haloDuration={phase.seconds}
      >
        <div className="hill-action center">
          <button
            className="pause-btn"
            aria-label={running ? 'Pause' : 'Resume'}
            onClick={() => setRunning((r) => !r)}
          >
            {running ? <Pause size={24} /> : <Play />}
          </button>
        </div>
      </SproutScene>
    </div>
  );
}
