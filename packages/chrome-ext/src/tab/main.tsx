import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { RemindersProvider } from './context/RemindersContext';
import App from './App';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <RemindersProvider>
        <App />
      </RemindersProvider>
    </HashRouter>
  </StrictMode>
);
