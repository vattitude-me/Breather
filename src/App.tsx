import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useNotifications } from './hooks/useNotifications';
import HomeScreen from './screens/HomeScreen';
import AddEditReminderScreen from './screens/AddEditReminderScreen';
import ProgressScreen from './screens/ProgressScreen';
import SettingsScreen from './screens/SettingsScreen';
import WelcomeModal from './screens/WelcomeScreen';
import './App.css';

function App() {
  useNotifications();

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
      </Routes>
    </div>
  );
}

export default App;
