import * as SecureStore from 'expo-secure-store';
import type { AuthResponse } from '../types';

const KEYS = {
  TOKEN:        'session_token',
  UID:          'session_uid',
  EMAIL:        'session_email',
  DISPLAY_NAME: 'session_display_name',
} as const;

export async function saveSession(user: AuthResponse): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(KEYS.TOKEN,        user.accessToken),
    SecureStore.setItemAsync(KEYS.UID,          user.uid),
    SecureStore.setItemAsync(KEYS.EMAIL,        user.email),
    SecureStore.setItemAsync(KEYS.DISPLAY_NAME, user.displayName),
  ]);
}

export async function loadSession(): Promise<AuthResponse | null> {
  const [accessToken, uid, email, displayName] = await Promise.all([
    SecureStore.getItemAsync(KEYS.TOKEN),
    SecureStore.getItemAsync(KEYS.UID),
    SecureStore.getItemAsync(KEYS.EMAIL),
    SecureStore.getItemAsync(KEYS.DISPLAY_NAME),
  ]);

  if (!accessToken || !uid) return null;

  return {
    accessToken,
    uid,
    email:        email        ?? '',
    displayName:  displayName  ?? '',
    emailVerified: false,
  };
}

export async function clearSession(): Promise<void> {
  await Promise.all(
    Object.values(KEYS).map((k) => SecureStore.deleteItemAsync(k))
  );
}
