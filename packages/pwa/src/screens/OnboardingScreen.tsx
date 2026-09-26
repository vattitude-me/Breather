import { useState, type ReactNode } from 'react';
import {
  DailyReminder,
  REMINDER_SLOTS,
  SESSION_MINUTE_OPTIONS,
  SPROUT_NAME_SUGGESTIONS,
  formatClock,
} from '@breather/shared';
import { getGarden, updateGarden, useGarden } from '../store';
import { requestPermission } from '../services/reminders';
import { SproutScene } from '../components/Sprout';
import { Dots, PrimaryButton } from '../components/ui';
import { Check, Leaf, Pause, Wind } from '../components/icons';

type Step = 'welcome' | 'how' | 'rhythm' | 'name';

export default function OnboardingScreen() {
  const garden = useGarden();
  const returning = garden.leaves > 0;
  const [step, setStep] = useState<Step>('welcome');
  const [minutes, setMinutes] = useState(garden.sessionMinutes);
  const [reminder, setReminder] = useState<DailyReminder>(garden.reminder);
  const [name, setName] = useState(garden.sproutName);

  const pickSlot = (slot: DailyReminder['slot'], time: string) => {
    setReminder((r) => (r.slot === slot && r.enabled ? { ...r, enabled: false } : { enabled: true, slot, time }));
  };

  const finishRhythm = () => {
    if (reminder.enabled) requestPermission();
    setStep('name');
  };

  const plant = () => {
    updateGarden(() => ({
      ...getGarden(),
      onboarded: true,
      sproutName: name.trim(),
      sessionMinutes: minutes,
      reminder,
    }));
  };

  if (step === 'welcome') {
    return (
      <div className="screen">
        <SproutScene
          leaves={returning ? garden.leaves : 0}
          hill={96}
          lip
          halo={260}
        />
        <div className="screen-foot">
          <h1 className="title">{returning ? 'Welcome back.' : 'Meet your sprout.'}</h1>
          <p className="lede">
            {returning
              ? `Breather is simpler now: one calm breathing session a day. Your ${garden.leaves} ${garden.leaves === 1 ? 'leaf' : 'leaves'} came with you.`
              : 'A tiny desk garden that grows each time you stop to breathe.'}
          </p>
          <PrimaryButton label="Get started" className="mt-16" onClick={() => setStep('how')} />
        </div>
      </div>
    );
  }

  if (step === 'how') {
    return (
      <div className="screen">
        <div className="onboard-top">
          <Dots step={0} total={3} />
          <button className="link-muted" onClick={() => setStep('name')}>Skip</button>
        </div>
        <div className="screen-head">
          <h1 className="title">Three small steps, once a day.</h1>
          <p className="lede">No streak guilt. Miss a day and your sprout simply waits.</p>
        </div>
        <div className="steps">
          <StepCard icon={<Pause />} title="Pause" text="Step away for a few minutes." />
          <StepCard icon={<Wind />} title="Breathe" text="Follow the slow rise and fall." />
          <StepCard icon={<Leaf />} title="Grow" text="Every session adds a new leaf." green />
        </div>
        <div className="spacer" />
        <div className="screen-foot">
          <PrimaryButton label="Continue" onClick={() => setStep('rhythm')} />
        </div>
      </div>
    );
  }

  if (step === 'rhythm') {
    return (
      <div className="screen">
        <div className="onboard-top">
          <Dots step={1} total={3} />
          <button className="link-muted" onClick={() => setStep('name')}>Skip</button>
        </div>
        <div className="screen-head">
          <h1 className="title">How long feels easy?</h1>
          <p className="lede">Start small. You can change this anytime.</p>
        </div>
        <MinutePicker value={minutes} onChange={setMinutes} />
        <div className="block">
          <span className="block-title">Gentle reminder</span>
          <div className="card list">
            {REMINDER_SLOTS.map((s) => {
              const selected = reminder.enabled && reminder.slot === s.id;
              return (
                <button key={s.id} className="row" onClick={() => pickSlot(s.id, s.time)} aria-pressed={selected}>
                  <span className="row-label">{s.label}</span>
                  {selected ? (
                    <span className="check-dot"><Check /></span>
                  ) : (
                    <span className="row-value">{formatClock(s.time)}</span>
                  )}
                </button>
              );
            })}
          </div>
          {!reminder.enabled && <p className="hint">No reminders. You can turn one on in Settings.</p>}
        </div>
        <div className="spacer" />
        <div className="screen-foot">
          <PrimaryButton label="Continue" onClick={finishRhythm} />
        </div>
      </div>
    );
  }

  const trimmed = name.trim();
  return (
    <div className="screen">
      <div className="onboard-top">
        <Dots step={2} total={3} />
      </div>
      <div className="screen-head">
        <h1 className="title">Give it a name.</h1>
        <p className="lede">Something you'd like to check in on.</p>
      </div>
      <div className="block">
        <input
          className="text-input"
          value={name}
          maxLength={20}
          placeholder="Your sprout's name"
          aria-label="Sprout name"
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && trimmed) plant(); }}
        />
        <div className="chips">
          {SPROUT_NAME_SUGGESTIONS.map((n) => (
            <button key={n} className="chip" onClick={() => setName(n)}>{n}</button>
          ))}
        </div>
      </div>
      <SproutScene leaves={returning ? garden.leaves : 0} potSize={110} hill={170} overlap={44}>
        <div className="hill-action">
          <PrimaryButton label={trimmed ? `Plant ${trimmed}` : 'Plant your sprout'} disabled={!trimmed} onClick={plant} />
        </div>
      </SproutScene>
    </div>
  );
}

function StepCard({ icon, title, text, green }: { icon: ReactNode; title: string; text: string; green?: boolean }) {
  return (
    <div className="card step-card">
      <span className={`step-icon${green ? ' green' : ''}`}>{icon}</span>
      <span className="step-text">
        <strong>{title}</strong>
        <span>{text}</span>
      </span>
    </div>
  );
}

export function MinutePicker({ value, onChange }: { value: number; onChange: (m: number) => void }) {
  return (
    <div className="minute-grid">
      {SESSION_MINUTE_OPTIONS.map((m) => (
        <button
          key={m}
          className={`card minute${m === value ? ' selected' : ''}`}
          aria-pressed={m === value}
          onClick={() => onChange(m)}
        >
          <span className="minute-num">{m}</span>
          <span className="minute-unit">{m === 1 ? 'minute' : 'minutes'}</span>
        </button>
      ))}
    </div>
  );
}
