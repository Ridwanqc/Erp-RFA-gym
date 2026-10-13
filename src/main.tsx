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

// Automatically register PWA Service Worker safely (ignoring iframe security or offline blocks)
try {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
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
  }
} catch (swError) {
  console.warn('ServiceWorker initialization skipped:', swError);
}

function mountApplication() {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error('[GymPro Lifecycle] Fatal: #root container element was not found in the DOM.');
    return;
  }

  console.log('[GymPro Lifecycle] 1. Initializing and mounting React application to #root...');
  try {
    createRoot(rootElement).render(
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
    console.log('[GymPro Lifecycle] 1b. React createRoot.render dispatched successfully.');
  } catch (mountErr) {
    console.error('[GymPro Lifecycle] Critical error during createRoot render:', mountErr);
  }
}

// Ensure DOM is ready before mounting to avoid race conditions
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountApplication);
  } else {
    mountApplication();
  }
}
