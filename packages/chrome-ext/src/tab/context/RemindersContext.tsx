import { createContext, useContext, useReducer, useEffect, useState, ReactNode } from 'react';
import { Reminder, AppSettings, ReminderAction } from '@breather/shared/src/types';
import { DEFAULT_SETTINGS } from '@breather/shared/src/constants';
import { loadReminders, saveReminders, loadSettings, saveSettings, onStorageChange } from '../../lib/storage';

interface RemindersContextType {
  reminders: Reminder[];
  settings: AppSettings;
  dispatch: React.Dispatch<ReminderAction>;
  updateSettings: (settings: AppSettings) => void;
  isLoading: boolean;
}

const RemindersContext = createContext<RemindersContextType | null>(null);

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

export function RemindersProvider({ children }: { children: ReactNode }) {
  const [reminders, dispatch] = useReducer(remindersReducer, []);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([loadReminders(), loadSettings()]).then(([r, s]) => {
      dispatch({ type: 'LOAD', payload: r });
      setSettings(s);
      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!isLoading) {
      saveReminders(reminders);
    }
  }, [reminders, isLoading]);

  useEffect(() => {
    onStorageChange((changes) => {
      if (changes['@breather_reminders']?.newValue) {
        dispatch({ type: 'LOAD', payload: changes['@breather_reminders'].newValue });
      }
      if (changes['@breather_settings']?.newValue) {
        setSettings(changes['@breather_settings'].newValue);
      }
    });
  }, []);

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

export function useRemindersContext() {
  const ctx = useContext(RemindersContext);
  if (!ctx) throw new Error('useRemindersContext must be used within RemindersProvider');
  return ctx;
}
