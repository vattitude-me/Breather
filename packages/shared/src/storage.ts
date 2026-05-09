import { Reminder, AppSettings } from './types';
import { STORAGE_KEYS, DEFAULT_SETTINGS } from './constants';

function notifyExtension() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('breather-local-change'));
  }
}

export async function loadReminders(): Promise<Reminder[]> {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.REMINDERS);
    if (!data) return [];
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading reminders:', error);
    return [];
  }
}

export async function saveReminders(reminders: Reminder[]): Promise<void> {
  try {
    localStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(reminders));
    notifyExtension();
  } catch (error) {
    console.error('Error saving reminders:', error);
  }
}

export async function loadSettings(): Promise<AppSettings> {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!data) return DEFAULT_SETTINGS;
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading settings:', error);
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    notifyExtension();
  } catch (error) {
    console.error('Error saving settings:', error);
  }
}

export async function loadProgress(): Promise<string | null> {
  try {
    return localStorage.getItem(STORAGE_KEYS.PROGRESS);
  } catch (error) {
    console.error('Error loading progress:', error);
    return null;
  }
}

export async function saveProgress(progress: string): Promise<void> {
  try {
    localStorage.setItem(STORAGE_KEYS.PROGRESS, progress);
    notifyExtension();
  } catch (error) {
    console.error('Error saving progress:', error);
  }
}
