import React, { createContext, useContext, useReducer, useEffect, useState, ReactNode } from 'react';
import {
  Reminder, ReminderAction, AppSettings,
  loadReminders, saveReminders, loadSettings, saveSettings,
  DEFAULT_SETTINGS,
} from '@breather/shared';

interface RemindersContextType {
  reminders: Reminder[];
  settings: AppSettings;
  dispatch: React.Dispatch<ReminderAction>;
  updateSettings: (settings: AppSettings) => void;
  isLoading: boolean;
}

const RemindersContext = createContext<RemindersContextType | undefined>(undefined);

function remindersReducer(state: Reminder[], action: ReminderAction): Reminder[] {
  switch (action.type) {
    case 'LOAD':
      return action.payload;
    case 'ADD':
      return [...state, action.payload];
    case 'UPDATE':
      return state.map((r) => (r.id === action.payload.id ? action.payload : r));
    case 'DELETE':
      return state.filter((r) => r.id !== action.payload);
    case 'TOGGLE':
      return state.map((r) =>
        r.id === action.payload ? { ...r, isActive: !r.isActive } : r
      );
    default:
      return state;
  }
}

interface RemindersProviderProps {
  children: ReactNode;
}

export function RemindersProvider({ children }: RemindersProviderProps) {
  const [reminders, dispatch] = useReducer(remindersReducer, []);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [savedReminders, savedSettings] = await Promise.all([
        loadReminders(),
        loadSettings(),
      ]);
      dispatch({ type: 'LOAD', payload: savedReminders });
      setSettings(savedSettings);
      setIsLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      saveReminders(reminders);
    }
  }, [reminders, isLoading]);

  const updateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  return (
    <RemindersContext.Provider value={{ reminders, settings, dispatch, updateSettings, isLoading }}>
      {children}
    </RemindersContext.Provider>
  );
}

export function useRemindersContext(): RemindersContextType {
  const context = useContext(RemindersContext);
  if (!context) {
    throw new Error('useRemindersContext must be used within a RemindersProvider');
  }
  return context;
}