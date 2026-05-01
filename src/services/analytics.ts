const GA_MEASUREMENT_ID = 'G-XNVN5X2B2B';

let initialized = false;

export function initAnalytics() {
  if (initialized) return;
  if (localStorage.getItem('@breather_analytics_consent') !== 'accepted') return;

  (window as any).dataLayer = (window as any).dataLayer || [];
  (window as any).gtag = function() {
    (window as any).dataLayer.push(arguments);
  };
  (window as any).gtag('js', new Date());
  (window as any).gtag('config', GA_MEASUREMENT_ID);

  const script = document.createElement('script');
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  script.async = true;
  document.head.appendChild(script);

  initialized = true;
}

export function hasAnalyticsConsent(): boolean {
  return localStorage.getItem('@breather_analytics_consent') === 'accepted';
}

export function setAnalyticsConsent(accepted: boolean) {
  localStorage.setItem('@breather_analytics_consent', accepted ? 'accepted' : 'declined');
  if (accepted) initAnalytics();
}
