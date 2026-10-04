import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {registerSW} from 'virtual:pwa-register';
import html2canvas from 'html2canvas-pro';
import App from './App.tsx';
import { ThemeProvider } from './context/ThemeContext';
import { SettingsProvider } from './context/SettingsContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

// Ensure window.html2canvas uses html2canvas-pro (with native oklch / Tailwind v4 support)
if (typeof window !== 'undefined') {
  (window as any).html2canvas = html2canvas;
}

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
    <ErrorBoundary>
      <ThemeProvider>
        <SettingsProvider>
          <App />
        </SettingsProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>,
);
