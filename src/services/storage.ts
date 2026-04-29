import AsyncStorage from '@react-native-async-storage/async-storage';
import { Reminder, AppSettings } from '../types';
import { STORAGE_KEYS, DEFAULT_SETTINGS } from '../constants';

export async function loadReminders(): Promise<Reminder[]> {
  const data = await AsyncStorage.getItem(STORAGE_KEYS.REMINDERS);
  if (!data) return [];
  return JSON.parse(data);
}

export async function saveReminders(reminders: Reminder[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(reminders));
}

export async function loadSettings(): Promise<AppSettings> {
  const data = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
  if (!data) return DEFAULT_SETTINGS;
  return JSON.parse(data);
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
}
