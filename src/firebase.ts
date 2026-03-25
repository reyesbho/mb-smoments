import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getAuth, inMemoryPersistence } from 'firebase/auth';

const firebaseConfig = {
  apiKey:      process.env.EXPO_PUBLIC_FIREBASE_API_KEY      ?? '',
  authDomain:  process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN  ?? '',
  projectId:   process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID   ?? '',
  appId:       process.env.EXPO_PUBLIC_FIREBASE_APP_ID       ?? '',
};

// Capturamos ANTES de initializeApp para distinguir primera carga de reinicio
const isFirstInit = getApps().length === 0;
const app = isFirstInit ? initializeApp(firebaseConfig) : getApp();

// inMemoryPersistence: Firebase no persiste internamente.
// Nuestra capa de SecureStore (session.ts) maneja la persistencia entre reinicios.
export const authFirebase = isFirstInit
  ? initializeAuth(app, { persistence: inMemoryPersistence })
  : getAuth(app);
