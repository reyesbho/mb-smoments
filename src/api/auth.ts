import client from './client';
import type { AuthResponse } from '../types';

// Valida el ID token de Firebase con el backend
export async function authMomentsAction(auth: AuthResponse) {
  return client.post('/user/auth', { idToken: auth.accessToken });
}
