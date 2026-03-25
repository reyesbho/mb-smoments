import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getAuth, inMemoryPersistence } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyCHd3bqn7mmhyfTxPnFeKMFRUxbgvYOpjk',
  authDomain: 'sweetmoments-dev.firebaseapp.com',
  projectId: 'sweetmoments-dev',
  appId: '1:663601038967:web:654e3316da1f6370e26872',
};

// Capturamos ANTES de initializeApp para distinguir primera carga de reinicio
const isFirstInit = getApps().length === 0;
const app = isFirstInit ? initializeApp(firebaseConfig) : getApp();

// inMemoryPersistence: Firebase no persiste internamente.
// Nuestra capa de SecureStore (session.ts) maneja la persistencia entre reinicios.
export const authFirebase = isFirstInit
  ? initializeAuth(app, { persistence: inMemoryPersistence })
  : getAuth(app);
