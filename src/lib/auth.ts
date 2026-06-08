import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  updatePassword,
  deleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider,
  type User as FirebaseUser,
} from 'firebase/auth';
import { auth } from './firebase';
import { trackEvent } from './analytics';
import type { User } from '../mocks';

type EmailFirebaseUser = FirebaseUser & { email: string };

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
  void trackEvent('login', { method: 'password' });
  return toAppUser(user);
}

export async function firebaseRegister(email: string, password: string): Promise<User> {
  const { user } = await createUserWithEmailAndPassword(auth, email, password);
  void trackEvent('sign_up', { method: 'password' });
  return toAppUser(user);
}

export async function firebaseResetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
  void trackEvent('password_reset_request', { method: 'email' });
}

export async function firebaseLogout(): Promise<void> {
  await signOut(auth);
}

function getCurrentEmailUser(): EmailFirebaseUser {
  const user = auth.currentUser;
  if (!user || !user.email) {
    throw new Error('Brak aktywnej sesji użytkownika.');
  }
  return user as EmailFirebaseUser;
}

async function reauthenticateWithPassword(currentPassword: string): Promise<FirebaseUser> {
  const user = getCurrentEmailUser();
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  return user;
}

export async function firebaseChangePassword(
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const user = await reauthenticateWithPassword(currentPassword);
  await updatePassword(user, newPassword);
  void trackEvent('change_password', { method: 'password' });
}

export async function firebaseDeleteAccount(currentPassword: string): Promise<void> {
  const user = await reauthenticateWithPassword(currentPassword);
  await deleteUser(user);
  void trackEvent('delete_account_success', { method: 'password' });
}

export function onAuthChanged(cb: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, fb => cb(fb ? toAppUser(fb) : null));
}
