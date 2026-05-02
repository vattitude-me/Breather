let deferredPrompt: any = null;
const listeners: Set<(prompt: any) => void> = new Set();

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  listeners.forEach((fn) => fn(deferredPrompt));
});

window.addEventListener('appinstalled', () => {
  deferredPrompt = null;
  listeners.forEach((fn) => fn(null));
});

export function getInstallPrompt() {
  return deferredPrompt;
}

export function onInstallPromptChange(fn: (prompt: any) => void) {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}
