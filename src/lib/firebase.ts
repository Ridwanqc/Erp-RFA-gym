/**
 * Authentication and Google Workspace token helper
 * (Firebase Cloud removed in favor of PostgreSQL + Dokploy)
 */

export const testConnection = async (): Promise<boolean> => {
  return true;
};

export const auth: any = {
  currentUser: null
};

export const onAuthStateChanged = (_auth: any, callback: (user: any) => void) => {
  callback(null);
  return () => {};
};

export const signInWithGoogle = async (): Promise<any> => {
  return null;
};

export const logOutFirebase = async (): Promise<void> => {};

let cachedAccessToken: string | null = null;

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const setCachedAccessToken = (token: string | null): void => {
  cachedAccessToken = token;
};
