import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getAuth, inMemoryPersistence } from 'firebase/auth';

const firebaseConfig = {
  apiKey: '',
  authDomain: '',
  projectId: '',
  appId: '',
};

// Capturamos ANTES de initializeApp para distinguir primera carga de reinicio
const isFirstInit = getApps().length === 0;
const app = isFirstInit ? initializeApp(firebaseConfig) : getApp();

// inMemoryPersistence: Firebase no persiste internamente.
// Nuestra capa de SecureStore (session.ts) maneja la persistencia entre reinicios.
export const authFirebase = isFirstInit
  ? initializeAuth(app, { persistence: inMemoryPersistence })
  : getAuth(app);
