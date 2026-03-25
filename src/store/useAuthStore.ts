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
  user?: AuthResponse;

  // Métodos
  login:        (email: string, password: string) => Promise<boolean>;
  logout:       () => Promise<void>;
  checkStatus:  () => Promise<void>;
  changeStatus: (user?: AuthResponse | null) => Promise<boolean>;
}

// ─── Store ────────────────────────────────────────────────────────────────────
export const useAuthStore = create<AuthState>()((set, get) => ({
  status: 'checking',
  user:   undefined,

  changeStatus: async (user?: AuthResponse | null) => {
    if (!user) {
      await clearSession();
      set({ status: 'unauthenticated', user: undefined });
      return false;
    }

    await saveSession(user);
    set({ status: 'authenticated', user });
    return true;
  },

  login: async (email: string, password: string) => {
    const response = await loginAction(email, password);
    return get().changeStatus(response);
  },

  checkStatus: async () => {
    const response = await checkAuthAction();
    get().changeStatus(response);
  },

  logout: async () => {
    await logoutAction();
    set({ status: 'unauthenticated', user: undefined });
  },
}));
