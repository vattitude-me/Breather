import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useGarden } from './store';
import { useDailyReminder } from './services/reminders';
import { initAnalytics } from './services/analytics';
import './services/installPrompt';
import TabLayout from './components/TabLayout';
import OnboardingScreen from './screens/OnboardingScreen';
import HomeScreen from './screens/HomeScreen';
import BreatheScreen from './screens/BreatheScreen';
import CompleteScreen from './screens/CompleteScreen';
import ProgressScreen from './screens/ProgressScreen';
import SettingsScreen from './screens/SettingsScreen';
import PrivacyScreen from './screens/PrivacyScreen';

export default function App() {
  const garden = useGarden();
  useDailyReminder(garden);

  useEffect(() => {
    initAnalytics();
  }, []);

  if (!garden.onboarded) {
    return (
      <div className="app">
        <Routes>
          <Route path="/privacy" element={<PrivacyScreen />} />
          <Route path="*" element={<OnboardingScreen />} />
        </Routes>
      </div>
    );
  }

  return (
    <div className="app">
      <Routes>
        <Route element={<TabLayout />}>
          <Route path="/home" element={<HomeScreen />} />
          <Route path="/progress" element={<ProgressScreen />} />
          <Route path="/settings" element={<SettingsScreen />} />
        </Route>
        <Route path="/breathe" element={<BreatheScreen />} />
        <Route path="/done" element={<CompleteScreen />} />
        <Route path="/privacy" element={<PrivacyScreen />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </div>
  );
}
