const GA_MEASUREMENT_ID = 'G-XNVN5X2B2B';

let initialized = false;

export function initAnalytics() {
  if (initialized) return;
  if (localStorage.getItem('@breakly_analytics_consent') !== 'accepted') return;

  const script = document.createElement('script');
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  script.async = true;
  document.head.appendChild(script);

  (window as any).dataLayer = (window as any).dataLayer || [];
  function gtag(...args: any[]) {
    (window as any).dataLayer.push(args);
  }
  gtag('js', new Date());
  gtag('config', GA_MEASUREMENT_ID);

  initialized = true;
}

export function hasAnalyticsConsent(): boolean {
  return localStorage.getItem('@breakly_analytics_consent') === 'accepted';
}

export function setAnalyticsConsent(accepted: boolean) {
  localStorage.setItem('@breakly_analytics_consent', accepted ? 'accepted' : 'declined');
  if (accepted) initAnalytics();
}
