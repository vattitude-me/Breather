import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  APP_VERSION,
  BREATH_PATTERNS,
  DailyReminder,
  REMINDER_SLOTS,
  formatClock,
  getPattern,
} from '@breather/shared';
import { updateGarden, useGarden } from '../store';
import { notificationsBlocked, requestPermission } from '../services/reminders';
import { hasAnalyticsConsent, setAnalyticsConsent } from '../services/analytics';
import { getInstallPrompt, onInstallPromptChange } from '../services/installPrompt';
import { canVibrate } from '../services/cues';
import { PrimaryButton, Row, Section, Sheet, Toggle } from '../components/ui';
import { Check } from '../components/icons';
import { MinutePicker } from './OnboardingScreen';

type SheetId = 'minutes' | 'pattern' | 'name' | 'reminder' | null;

function reminderLabel(r: DailyReminder): string {
  const slot = REMINDER_SLOTS.find((s) => s.id === r.slot);
  return `${slot?.label ?? 'Daily'}, ${formatClock(r.time)}`;
}

export default function SettingsScreen() {
  const navigate = useNavigate();
  const g = useGarden();
  const [sheet, setSheet] = useState<SheetId>(null);
  const [draftName, setDraftName] = useState(g.sproutName);
  const [blocked, setBlocked] = useState(notificationsBlocked);
  const [analytics, setAnalytics] = useState(hasAnalyticsConsent);
  const [installPrompt, setInstallPrompt] = useState(getInstallPrompt);

  useEffect(() => onInstallPromptChange(setInstallPrompt), []);

  const set = (patch: Partial<typeof g>) => updateGarden((cur) => ({ ...cur, ...patch }));

  const setReminderEnabled = async (enabled: boolean) => {
    set({ reminder: { ...g.reminder, enabled } });
    if (enabled) {
      await requestPermission();
      setBlocked(notificationsBlocked());
    }
  };

  const install = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(getInstallPrompt());
  };

  const saveName = () => {
    const name = draftName.trim();
    if (name) set({ sproutName: name });
    setSheet(null);
  };

  return (
    <div className="screen">
      <div className="screen-head">
        <h1 className="title">Settings</h1>
      </div>

      <Section title="PRACTICE">
        <Row label="Daily goal" value={`${g.sessionMinutes} min`} onClick={() => setSheet('minutes')} />
        <Row label="Breath pattern" value={getPattern(g.patternId).short} onClick={() => setSheet('pattern')} />
        <Row
          label="Sprout name"
          value={g.sproutName || 'Unnamed'}
          onClick={() => { setDraftName(g.sproutName); setSheet('name'); }}
        />
      </Section>

      <Section title="GENTLE NUDGES">
        <div className="row">
          <button className="row-label as-button" onClick={() => setSheet('reminder')}>
            <span>Reminders</span>
            <span className="row-sub">
              {blocked && g.reminder.enabled ? 'Blocked in browser settings' : g.reminder.enabled ? reminderLabel(g.reminder) : 'Off'}
            </span>
          </button>
          <Toggle label="Reminders" on={g.reminder.enabled} onChange={setReminderEnabled} />
        </div>
        <div className="row">
          <span className="row-label">Soft chime</span>
          <Toggle label="Soft chime" on={g.chime} onChange={(chime) => set({ chime })} />
        </div>
        {canVibrate && (
          <div className="row">
            <span className="row-label">Haptic breath cues</span>
            <Toggle label="Haptic breath cues" on={g.haptics} onChange={(haptics) => set({ haptics })} />
          </div>
        )}
      </Section>

      <Section title="ABOUT">
        {installPrompt && <Row label="Install app" chevron onClick={install} />}
        <Row label="Help & privacy" chevron onClick={() => navigate('/privacy')} />
        <div className="row">
          <span className="row-label">
            <span>Share anonymous usage</span>
            <span className="row-sub">Helps us improve Breather</span>
          </span>
          <Toggle
            label="Share anonymous usage"
            on={analytics}
            onChange={(on) => { setAnalyticsConsent(on); setAnalytics(on); }}
          />
        </div>
        <Row label="Version" value={APP_VERSION} />
      </Section>
      <div className="bottom-gap" />

      {sheet === 'minutes' && (
        <Sheet title="Daily goal" onClose={() => setSheet(null)}>
          <MinutePicker value={g.sessionMinutes} onChange={(sessionMinutes) => { set({ sessionMinutes }); setSheet(null); }} />
        </Sheet>
      )}

      {sheet === 'pattern' && (
        <Sheet title="Breath pattern" onClose={() => setSheet(null)}>
          <div className="card list">
            {BREATH_PATTERNS.map((p) => (
              <button key={p.id} className="row" onClick={() => { set({ patternId: p.id }); setSheet(null); }}>
                <span className="row-label">
                  <span>{p.name}</span>
                  <span className="row-sub">{p.phases.map((ph) => `${ph.label} ${ph.seconds}`).join(', ')}</span>
                </span>
                {p.id === g.patternId ? <span className="check-dot"><Check /></span> : <span className="row-value">{p.short}</span>}
              </button>
            ))}
          </div>
        </Sheet>
      )}

      {sheet === 'name' && (
        <Sheet title="Sprout name" onClose={() => setSheet(null)}>
          <input
            className="text-input"
            value={draftName}
            maxLength={20}
            autoFocus
            aria-label="Sprout name"
            onChange={(e) => setDraftName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') saveName(); }}
          />
          <PrimaryButton label="Save" className="mt-16" disabled={!draftName.trim()} onClick={saveName} />
        </Sheet>
      )}

      {sheet === 'reminder' && (
        <Sheet title="Daily reminder" onClose={() => setSheet(null)}>
          <div className="card list">
            {REMINDER_SLOTS.map((s) => {
              const selected = g.reminder.enabled && g.reminder.slot === s.id;
              return (
                <button
                  key={s.id}
                  className="row"
                  onClick={() => {
                    set({ reminder: { enabled: true, slot: s.id, time: s.time } });
                    requestPermission().then(() => setBlocked(notificationsBlocked()));
                    setSheet(null);
                  }}
                >
                  <span className="row-label">{s.label}</span>
                  {selected ? <span className="check-dot"><Check /></span> : <span className="row-value">{formatClock(s.time)}</span>}
                </button>
              );
            })}
          </div>
          <p className="hint">
            One nudge a day, skipped if you've already breathed.
            {blocked && ' Notifications are blocked. Allow them for this site in your browser settings.'}
          </p>
        </Sheet>
      )}
    </div>
  );
}
