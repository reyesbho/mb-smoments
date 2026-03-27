import { signOut } from 'firebase/auth';
import { authFirebase } from '../firebase';

export const logoutAction = async (): Promise<void> => {
  await signOut(authFirebase);
};
