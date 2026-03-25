import { signInWithEmailAndPassword, type UserCredential } from 'firebase/auth';
import { authFirebase } from '../firebase';
import { authMomentsAction } from '../api/auth';
import { logoutAction } from './logout.action';
import { saveSession } from '../storage/session';
import type { AuthResponse } from '../types';

export const loginAction = async (email: string, password: string): Promise<AuthResponse | null> => {
  try {
    const userCredentials: UserCredential = await signInWithEmailAndPassword(
      authFirebase,
      email,
      password
    );

    const authCredentials: AuthResponse = {
      accessToken:   await userCredentials.user.getIdToken(),
      displayName:   userCredentials.user.displayName ?? '',
      email:         userCredentials.user.email ?? '',
      emailVerified: userCredentials.user.emailVerified,
      uid:           userCredentials.user.uid,
    };

    try {
      const response = await authMomentsAction(authCredentials);
      if (response.status !== 200) {
        await logoutAction();
        throw new Error('Error al autenticarse');
      }
    } catch {
      await logoutAction();
      throw new Error('Error al autenticarse');
    }

    // Persiste la sesión en SecureStore
    await saveSession(authCredentials);

    return authCredentials;
  } catch (error) {
    return null;
  }
};
