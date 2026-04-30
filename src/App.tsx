import { Routes, Route, Navigate } from 'react-router-dom';
import { useNotifications } from './hooks/useNotifications';
import HomeScreen from './screens/HomeScreen';
import AddEditReminderScreen from './screens/AddEditReminderScreen';
import ProgressScreen from './screens/ProgressScreen';
import SettingsScreen from './screens/SettingsScreen';
import WelcomeScreen from './screens/WelcomeScreen';
import './App.css';

function isOnboarded(): boolean {
  return localStorage.getItem('@breakly_onboarded') === 'true';
}

function App() {
  useNotifications();

  return (
    <div className="app-container">
      <Routes>
        <Route path="/" element={<Navigate to={isOnboarded() ? '/home' : '/welcome'} replace />} />
        <Route path="/welcome" element={<WelcomeScreen />} />
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