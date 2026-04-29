import React from 'react';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { RemindersProvider } from './src/context/RemindersContext';
import RootNavigator from './src/navigation/RootNavigator';
import { useNotifications } from './src/hooks/useNotifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function AppContent() {
  useNotifications();
  return (
    <>
      <StatusBar style="dark" />
      <RootNavigator />
    </>
  );
}

export default function App() {
  return (
    <RemindersProvider>
      <AppContent />
    </RemindersProvider>
  );
}
