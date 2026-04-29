export interface Reminder {
  id: string;
  title: string;
  intervalMinutes: number;
  isActive: boolean;
  notificationId?: string;
  createdAt: string;
  snoozeDurationMinutes: number;
  icon: string;
}

export interface AppSettings {
  defaultSnoozeDurationMinutes: number;
  defaultIntervalMinutes: number;
  notificationsEnabled: boolean;
}

export type ReminderAction =
  | { type: 'LOAD'; payload: Reminder[] }
  | { type: 'ADD'; payload: Reminder }
  | { type: 'UPDATE'; payload: Reminder }
  | { type: 'DELETE'; payload: string }
  | { type: 'TOGGLE'; payload: string };
