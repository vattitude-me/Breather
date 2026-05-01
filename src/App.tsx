import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useNotifications } from './hooks/useNotifications';
import { initAnalytics } from './services/analytics';
import './services/installPrompt';
import HomeScreen from './screens/HomeScreen';
import AddEditReminderScreen from './screens/AddEditReminderScreen';
import ProgressScreen from './screens/ProgressScreen';
import SettingsScreen from './screens/SettingsScreen';
import PrivacyScreen from './screens/PrivacyScreen';
import WelcomeModal from './screens/WelcomeScreen';
import CookieConsent from './components/CookieConsent';
import NotificationPrompt from './components/NotificationPrompt';
import './App.css';

function App() {
  useNotifications();

  useEffect(() => {
    initAnalytics();
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  const [showWelcome, setShowWelcome] = useState(
    () => localStorage.getItem('@breakly_onboarded') !== 'true'
  );

  return (
    <div className="app-container">
      {showWelcome && <WelcomeModal onDismiss={() => setShowWelcome(false)} />}
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<HomeScreen />} />
        <Route path="/add-reminder" element={<AddEditReminderScreen />} />
        <Route path="/edit-reminder/:reminderId" element={<AddEditReminderScreen />} />
        <Route path="/progress" element={<ProgressScreen />} />
        <Route path="/settings" element={<SettingsScreen />} />
        <Route path="/privacy" element={<PrivacyScreen />} />
      </Routes>
      <CookieConsent />
      {!showWelcome && <NotificationPrompt />}
    </div>
  );
}

export default App;
