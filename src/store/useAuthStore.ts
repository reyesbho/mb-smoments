import { create } from 'zustand';
import { loginAction } from '../actions/login.action';
import { logoutAction } from '../actions/logout.action';
import { checkAuthAction } from '../actions/check-auth.action';
import { saveSession, clearSession } from '../storage/session';
import type { AuthResponse } from '../types';

// ─── Tipos ────────────────────────────────────────────────────────────────────
export type AuthStatus = 'checking' | 'authenticated' | 'unauthenticated';

export interface AuthState {
  // Propiedades
  status: AuthStatus;
  token?:  string;
  user?:   AuthResponse;

  // Métodos
  login:        (email: string, password: string) => Promise<boolean>;
  logout:       () => Promise<void>;
  checkStatus:  () => Promise<void>;
  changeStatus: (token?: string, user?: AuthResponse) => Promise<boolean>;
}

// ─── Store ────────────────────────────────────────────────────────────────────
export const useAuthStore = create<AuthState>()((set, get) => ({
  status: 'checking',
  token:  undefined,
  user:   undefined,

  // Única fuente de verdad para persistencia de sesión
  changeStatus: async (token?: string, user?: AuthResponse) => {
    if (!token || !user) {
      await clearSession();
      set({ status: 'unauthenticated', token: undefined, user: undefined });
      return false;
    }

    await saveSession(user);
    set({ status: 'authenticated', token, user });
    return true;
  },

  login: async (email: string, password: string) => {
    const response = await loginAction(email, password);
    return get().changeStatus(response?.accessToken, response ?? undefined);
  },

  checkStatus: async () => {
    const response = await checkAuthAction();
    get().changeStatus(response?.accessToken, response ?? undefined);
  },

  logout: async () => {
    await Promise.all([logoutAction(), clearSession()]);
    set({ status: 'unauthenticated', token: undefined, user: undefined });
  },
}));
