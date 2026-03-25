import { onAuthStateChanged } from 'firebase/auth';
import { authFirebase } from '../firebase';
import { authMomentsAction } from '../api/auth';
import { logoutAction } from './logout.action';
import { loadSession, saveSession, clearSession } from '../storage/session';
import type { AuthResponse } from '../types';

export const checkAuthAction = (): Promise<AuthResponse | null> => {
  return new Promise((resolve) => {
    loadSession().then(async (stored) => {
      // Sin sesión guardada → Login
      if (!stored) return resolve(null);

      // Hay sesión en SecureStore.
      // Firebase usa inMemoryPersistence: no recuerda al usuario entre reinicios.
      // Comprobamos si Firebase ya tiene al usuario en memoria (sesión activa en el mismo proceso).
      const firebaseUser = authFirebase.currentUser;

      if (firebaseUser) {
        // Firebase tiene al usuario (misma sesión, app no fue cerrada completamente)
        // → Obtenemos token fresco y revalidamos con backend
        try {
          const freshToken = await firebaseUser.getIdToken();
          const authUser: AuthResponse = {
            accessToken:   freshToken,
            displayName:   firebaseUser.displayName ?? stored.displayName,
            email:         firebaseUser.email       ?? stored.email,
            emailVerified: firebaseUser.emailVerified,
            uid:           firebaseUser.uid,
          };
          const response = await authMomentsAction(authUser);
          if (response.status !== 200) {
            await logoutAction();
            return resolve(null);
          }
          await saveSession(authUser);
          return resolve(authUser);
        } catch {
          await logoutAction();
          return resolve(null);
        }
      }

      // Firebase NO tiene al usuario en memoria (reinicio del app).
      // Confiamos en la sesión de SecureStore: si el token está expirado,
      // el interceptor 401 del cliente Axios limpiará la sesión automáticamente.
      resolve(stored);
    });
  });
};
