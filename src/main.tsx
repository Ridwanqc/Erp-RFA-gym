import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {registerSW} from 'virtual:pwa-register';
import App from './App.tsx';
import { ThemeProvider } from './context/ThemeContext';
import { SettingsProvider } from './context/SettingsContext';
import './index.css';

// Automatically register PWA Service Worker for offline capabilities & caching
registerSW({
  immediate: true,
  onRegistered(r) {
    if (r) {
      console.log('PWA ServiceWorker successfully registered');
    }
  },
  onRegisterError(error) {
    console.warn('PWA ServiceWorker registration error:', error);
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <SettingsProvider>
        <App />
      </SettingsProvider>
    </ThemeProvider>
  </StrictMode>,
);
