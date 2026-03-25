import { signOut } from 'firebase/auth';
import { authFirebase } from '../firebase';
import { clearSession } from '../storage/session';

export const logoutAction = async (): Promise<void> => {
  await Promise.all([
    signOut(authFirebase),
    clearSession(),
  ]);
};
