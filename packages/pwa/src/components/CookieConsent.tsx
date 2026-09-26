import { useEffect, useState } from 'react';
import { setAnalyticsConsent } from '../services/analytics';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('@breather_analytics_consent') !== null) return;
    const timer = setTimeout(() => setVisible(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  const answer = (accepted: boolean) => {
    setAnalyticsConsent(accepted);
    setVisible(false);
  };

  return (
    <div className="consent" role="dialog" aria-label="Usage data">
      <p>Help us improve Breather with anonymous usage data?</p>
      <button className="consent-no" onClick={() => answer(false)}>No thanks</button>
      <button className="consent-yes" onClick={() => answer(true)}>Sure</button>
    </div>
  );
}
