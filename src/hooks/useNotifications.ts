import { useEffect } from 'react';
import { requestPermissions } from '../services/notifications';

export function useNotifications() {
  useEffect(() => {
    // Request notification permission on mount
    requestPermissions();
  }, []);
}