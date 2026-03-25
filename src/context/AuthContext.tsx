import React, { createContext, useContext, useEffect, useState } from 'react';
import { loginAction } from '../actions/login.action';
import { logoutAction } from '../actions/logout.action';
import { checkAuthAction } from '../actions/check-auth.action';
import type { AuthResponse } from '../types';

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface AuthState {
  user: AuthResponse | null;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

// ─── Contexto ─────────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
  });

  // Restaurar sesión al iniciar via Firebase onAuthStateChanged
  useEffect(() => {
    checkAuthAction().then((user) => {
      setState({ user, isLoading: false });
    });
  }, []);

  const login = async (email: string, password: string) => {
    const user = await loginAction(email, password);
    if (!user) throw new Error('Credenciales incorrectas');
    setState({ user, isLoading: false });
  };

  const logout = async () => {
    await logoutAction();
    setState({ user: null, isLoading: false });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
