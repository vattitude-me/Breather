const VAPID_PUBLIC_KEY = 'BO3Pt4ViMdlExya89ipT20Mgso6GjdjoIIm-wVpfAwN_-5r4B7orYctxS3x0cpgzD8CCUUXdkLM75xCVf7u4E5A';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function subscribeToPush(): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const existing = await registration.pushManager.getSubscription();
    if (existing) return existing;

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as unknown as ArrayBuffer,
    });

    return subscription;
  } catch (error) {
    console.error('Push subscription failed:', error);
    return null;
  }
}

export async function syncSubscriptionWithServer(
  reminders: Array<{
    id: string;
    title: string;
    icon: string;
    intervalMinutes: number;
    schedule?: { activeDays: string[]; startHour: number; endHour: number };
  }>
): Promise<void> {
  const subscription = await subscribeToPush();
  if (!subscription) return;

  try {
    await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
        reminders,
        tzOffset: new Date().getTimezoneOffset(),
      }),
    });
  } catch (error) {
    console.error('Failed to sync subscription:', error);
  }
}

let heartbeatInterval: ReturnType<typeof setInterval> | null = null;

export function startHeartbeat(): void {
  if (heartbeatInterval) return;

  const sendHeartbeat = async () => {
    const subscription = await subscribeToPush();
    if (!subscription) return;
    try {
      await fetch('/api/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });
    } catch {
      // Silently fail — next heartbeat will retry
    }
  };

  sendHeartbeat();
  heartbeatInterval = setInterval(sendHeartbeat, 60_000);
}

export function stopHeartbeat(): void {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
}

export async function unsubscribeFromPush(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return;

    await subscription.unsubscribe();
    await fetch('/api/unsubscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: subscription.endpoint }),
    });
  } catch (error) {
    console.error('Failed to unsubscribe:', error);
  }
}
