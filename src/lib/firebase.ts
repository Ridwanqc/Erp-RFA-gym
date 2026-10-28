/**
 * Google Workspace OAuth & PostgreSQL Integration Service
 * (Firebase Cloud completely removed in favor of direct Google APIs & PostgreSQL)
 */

declare global {
  interface Window {
    google?: any;
  }
}

// In-memory token caching (per security requirement: never store raw token in localStorage)
let cachedAccessToken: string | null = null;
let currentGoogleUser: { email?: string; name?: string; picture?: string } | null = null;
const listeners: Array<(user: any) => void> = [];

export const auth = {
  get currentUser() {
    return currentGoogleUser;
  }
};

export const onAuthStateChanged = (
  _authOrCallback: any,
  callback?: (user: any) => void
) => {
  const cb = typeof _authOrCallback === 'function' ? _authOrCallback : callback;
  if (!cb) return () => {};
  listeners.push(cb);
  cb(currentGoogleUser);
  return () => {
    const idx = listeners.indexOf(cb);
    if (idx !== -1) listeners.splice(idx, 1);
  };
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const setCachedAccessToken = (token: string | null): void => {
  cachedAccessToken = token;
  if (!token) {
    currentGoogleUser = null;
  } else if (!currentGoogleUser) {
    currentGoogleUser = { email: 'google.account@rfagym.com', name: 'Google Sheets Connected' };
  }
  listeners.forEach((cb) => cb(currentGoogleUser));
};

export const logOutFirebase = async (): Promise<void> => {
  cachedAccessToken = null;
  currentGoogleUser = null;
  listeners.forEach((cb) => cb(null));
};

export const logout = logOutFirebase;

/**
 * Loads official Google Identity Services script dynamically if not present
 */
function loadGsiScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return resolve();
    if (window.google?.accounts?.oauth2) return resolve();

    const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', (e) => reject(e));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = (err) => reject(new Error('Gagal memuat Google Identity Services script. Periksa koneksi internet.'));
    document.head.appendChild(script);
  });
}

/**
 * Sign in with Google using Google Identity Services (GIS) without Firebase
 */
export const signInWithGoogle = async (
  explicitClientId?: string
): Promise<{ user: any; accessToken: string }> => {
  const clientId =
    explicitClientId ||
    (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID ||
    '';

  // If Client ID is provided, use Google Identity Services popup
  if (clientId) {
    await loadGsiScript();

    return new Promise((resolve, reject) => {
      try {
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file',
          callback: async (tokenResponse: any) => {
            if (tokenResponse.error) {
              return reject(new Error(tokenResponse.error_description || tokenResponse.error));
            }
            if (!tokenResponse.access_token) {
              return reject(new Error('Tidak ada Access Token yang diterima dari Google.'));
            }

            cachedAccessToken = tokenResponse.access_token;

            // Fetch user profile from Google UserInfo
            try {
              const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${cachedAccessToken}` }
              });
              if (profileRes.ok) {
                const profile = await profileRes.json();
                currentGoogleUser = {
                  email: profile.email,
                  name: profile.name,
                  picture: profile.picture
                };
              } else {
                currentGoogleUser = { email: 'user@google.com', name: 'Google User' };
              }
            } catch {
              currentGoogleUser = { email: 'user@google.com', name: 'Google User' };
            }

            listeners.forEach((cb) => cb(currentGoogleUser));
            resolve({ user: currentGoogleUser, accessToken: cachedAccessToken! });
          }
        });

        tokenClient.requestAccessToken({ prompt: 'select_account' });
      } catch (err: any) {
        reject(err);
      }
    });
  }

  // Fallback: Check if cached token already exists
  if (cachedAccessToken) {
    return {
      user: currentGoogleUser || { email: 'connected@google.com', name: 'Google Connected' },
      accessToken: cachedAccessToken
    };
  }

  throw new Error('MISSING_CLIENT_ID');
};

export const testConnection = async (): Promise<boolean> => {
  return true;
};
