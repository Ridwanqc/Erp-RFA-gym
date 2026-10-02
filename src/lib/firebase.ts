import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App singleton
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with explicit databaseId if configured (e.g. named Firestore databases)
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Google Auth Provider configured for popups with Workspace Scopes
export const WORKSPACE_SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/spreadsheets.readonly'
];

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});
WORKSPACE_SCOPES.forEach((scope) => googleProvider.addScope(scope));

// In-memory caching for the access token (per Skill requirement: NEVER save to localStorage/sessionStorage)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const setCachedAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errMessage = error instanceof Error ? error.message : String(error);
  const errCode = (error as any)?.code;

  const errInfo: FirestoreErrorInfo = {
    error: errMessage,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };

  // If backend is temporarily unreachable / offline, log a gentle warning instead of throwing an unhandled fatal error
  if (
    errCode === 'unavailable' ||
    errMessage.includes('unavailable') ||
    errMessage.includes('the client is offline') ||
    errMessage.includes('Could not reach Cloud Firestore backend')
  ) {
    console.warn(`[Firestore Offline Cache Active] ${operationType} on ${path}: backend temporarily offline, local cache is handling data.`);
    return;
  }

  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Critical validation boot check
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error: any) {
    const msg = error instanceof Error ? error.message : String(error);
    const code = error?.code || '';
    if (code === 'unavailable' || msg.includes('the client is offline') || msg.includes('unavailable')) {
      console.warn("Firestore operates in offline/local cache mode:", code || msg);
      return false;
    }
    // Expected to return permission denied or not found for test doc, which confirms connectivity
    return true;
  }
}

// Google Sign In Popup helper
export async function signInWithGoogle(): Promise<{ user: FirebaseUser; accessToken: string }> {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential?.accessToken) {
      cachedAccessToken = credential.accessToken;
    }
    return { user: result.user, accessToken: cachedAccessToken || '' };
  } catch (error) {
    console.error('Google Sign-In Error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
}

// Sign Out helper
export async function logOutFirebase() {
  try {
    await signOut(auth);
    cachedAccessToken = null;
  } catch (error) {
    console.error('Firebase Sign-Out Error:', error);
  }
}

export { onAuthStateChanged };
export type { FirebaseUser };
