import axios from 'axios';
import { authFirebase } from '../firebase';
import { loadSession, clearSession } from '../storage/session';

export const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'http://192.168.3.19:3000/api';

const client = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request: token fresco si Firebase está activo, sino SecureStore ──────────
client.interceptors.request.use(async (config) => {
  let token: string | null = null;

  const firebaseUser = authFirebase.currentUser;
  if (firebaseUser) {
    // Firebase tiene la sesión activa en memoria → token siempre fresco
    token = await firebaseUser.getIdToken();
  } else {
    // Reinicio del app → Firebase no recuerda al usuario → usamos SecureStore
    const session = await loadSession();
    token = session?.accessToken ?? null;
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Response: 401 → sesión inválida, limpiar todo ───────────────────────────
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await Promise.all([
        authFirebase.signOut(),
        clearSession(),
      ]);
    }
    return Promise.reject(error);
  }
);

export default client;
