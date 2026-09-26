import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from '../components/icons';

const SECTIONS = [
  {
    title: 'Your data stays on your device',
    body: "Breather keeps your sprout, settings and session history in your browser's local storage. Nothing is sent to a server. Clearing your browser data removes it.",
  },
  {
    title: 'No account required',
    body: 'There is no sign-up, no login and no personal information to share. Your sprout name is the only thing you type in, and it never leaves your device.',
  },
  {
    title: 'Reminders',
    body: 'If you turn on the daily reminder, Breather asks for permission to show browser notifications. You can switch it off in Settings or in your browser at any time.',
  },
  {
    title: 'Analytics',
    body: 'If you opt in to anonymous usage sharing, we use Google Analytics to understand general usage such as page views. No personally identifiable information is collected. You can change this anytime in Settings.',
  },
  {
    title: 'Chrome extension',
    body: 'The Breather Chrome extension shows your sprout in the toolbar and sends your daily reminder. It syncs your garden with this web app through local browser storage only. No data is sent to an external server.',
  },
  {
    title: 'Third-party services',
    body: 'Breather is hosted on Vercel. Google Analytics is used only if you opt in. No other third-party services receive your data.',
  },
  {
    title: 'Changes to this policy',
    body: 'If this policy changes, the update will appear here. Last updated: September 2026.',
  },
];

export default function PrivacyScreen() {
  const navigate = useNavigate();

  return (
    <div className="screen">
      <div className="page-top">
        <button className="icon-btn" aria-label="Back" onClick={() => navigate(-1)}>
          <ChevronLeft />
        </button>
      </div>
      <div className="screen-head tight">
        <h1 className="title">Help &amp; privacy</h1>
        <p className="lede">
          Take one slow breathing session a day and your sprout grows a leaf. Miss a day and nothing is lost.
        </p>
      </div>
      <div className="privacy">
        {SECTIONS.map((s) => (
          <div key={s.title} className="card privacy-card">
            <h2>{s.title}</h2>
            <p>{s.body}</p>
          </div>
        ))}
      </div>
      <div className="bottom-gap" />
    </div>
  );
}
