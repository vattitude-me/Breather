import { Routes, Route, Navigate } from 'react-router-dom';
import HomeScreen from './screens/HomeScreen';
import ActiveBreakScreen from './screens/ActiveBreakScreen';
import AddEditReminderScreen from './screens/AddEditReminderScreen';
import ProgressScreen from './screens/ProgressScreen';
import SettingsScreen from './screens/SettingsScreen';
import WelcomeScreen from './screens/WelcomeScreen';
import BottomNav from './components/BottomNav';
import { useRemindersContext } from './context/RemindersContext';

export default function App() {
  const { isLoading } = useRemindersContext();

  if (isLoading) {
    return (
      <div className="app-loading">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="app-container">
      <Routes>
        <Route path="/home" element={<HomeScreen />} />
        <Route path="/active-break" element={<ActiveBreakScreen />} />
        <Route path="/add-reminder" element={<AddEditReminderScreen />} />
        <Route path="/edit-reminder/:id" element={<AddEditReminderScreen />} />
        <Route path="/progress" element={<ProgressScreen />} />
        <Route path="/settings" element={<SettingsScreen />} />
        <Route path="/welcome" element={<WelcomeScreen />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
      <BottomNav />
    </div>
  );
}
