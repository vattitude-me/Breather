import { useState } from 'react';
import HomeScreen from './screens/HomeScreen';
import AddReminderScreen from './screens/AddReminderScreen';
import EditReminderScreen from './screens/EditReminderScreen';
import ProgressScreen from './screens/ProgressScreen';
import SettingsScreen from './screens/SettingsScreen';
import './popup.css';

export type Screen =
  | { name: 'home' }
  | { name: 'add-reminder' }
  | { name: 'edit-reminder'; reminderId: string }
  | { name: 'progress' }
  | { name: 'settings' };

export default function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'home' });
  const navigate = (s: Screen) => setScreen(s);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#FFF9F5' }}>
      {screen.name === 'home' && <HomeScreen navigate={navigate} />}
      {screen.name === 'add-reminder' && <AddReminderScreen navigate={navigate} />}
      {screen.name === 'edit-reminder' && <EditReminderScreen navigate={navigate} reminderId={screen.reminderId} />}
      {screen.name === 'progress' && <ProgressScreen navigate={navigate} />}
      {screen.name === 'settings' && <SettingsScreen navigate={navigate} />}
    </div>
  );
}
