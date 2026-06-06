import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from 'firebase/auth';
import { auth } from './firebase';
import type { User } from '../mocks';

function toAppUser(fb: FirebaseUser): User {
  const displayName = fb.displayName ?? '';
  const [firstName = '', ...rest] = displayName.split(' ');
  return {
    id:        fb.uid,
    firstName: firstName || (fb.email?.split('@')[0] ?? 'Użytkownik'),
    lastName:  rest.join(' ') || undefined,
    email:     fb.email ?? '',
  };
}

export async function firebaseLogin(email: string, password: string): Promise<User> {
  const { user } = await signInWithEmailAndPassword(auth, email, password);
  return toAppUser(user);
}

export async function firebaseRegister(email: string, password: string): Promise<User> {
  const { user } = await createUserWithEmailAndPassword(auth, email, password);
  return toAppUser(user);
}

export async function firebaseResetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

export async function firebaseLogout(): Promise<void> {
  await signOut(auth);
}

export function onAuthChanged(cb: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, fb => cb(fb ? toAppUser(fb) : null));
}
