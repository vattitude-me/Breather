export type DayOfWeek = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

export interface Schedule {
  activeDays: DayOfWeek[];
  startHour: number; // 0-23
  endHour: number;   // 0-23
}

export interface Reminder {
  id: string;
  title: string;
  intervalMinutes: number;
  isActive: boolean;
  notificationId?: string;
  createdAt: string;
  snoozeDurationMinutes: number;
  icon: string;
  schedule: Schedule;
}

export interface AppSettings {
  defaultSnoozeDurationMinutes: number;
  defaultIntervalMinutes: number;
  notificationsEnabled: boolean;
  defaultSchedule: Schedule;
}

export type ReminderAction =
  | { type: 'LOAD'; payload: Reminder[] }
  | { type: 'ADD'; payload: Reminder }
  | { type: 'UPDATE'; payload: Reminder }
  | { type: 'DELETE'; payload: string }
  | { type: 'TOGGLE'; payload: string };
