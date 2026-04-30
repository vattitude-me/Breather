import { Routes, Route, Navigate } from 'react-router-dom';
import { useNotifications } from './hooks/useNotifications';
import HomeScreen from './screens/HomeScreen';
import AddEditReminderScreen from './screens/AddEditReminderScreen';
import ProgressScreen from './screens/ProgressScreen';
import SettingsScreen from './screens/SettingsScreen';
import './App.css';

function App() {
  useNotifications();

  return (
    <div className="app-container">
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