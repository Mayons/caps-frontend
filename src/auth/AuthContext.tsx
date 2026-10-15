import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User as FirebaseUser,
} from 'firebase/auth';
import { firebaseAuth } from './firebase';
import { ApiError } from '../api/client';
import { capsApi, type RegisterData } from '../api/caps';
import type { UserProfile } from '../api/types';

/**
 * Estados posibles de la sesión:
 * - loading: todavía no sabemos si hay sesión.
 * - signedOut: no hay sesión.
 * - needsRegistration: hay sesión de Firebase pero falta crear el usuario en CAPS.
 * - inactive: la cuenta de CAPS fue desactivada.
 * - ready: sesión completa, `profile` tiene los datos del usuario.
 * - error: no se pudo hablar con el servidor.
 */
export type AuthStatus = 'loading' | 'signedOut' | 'needsRegistration' | 'inactive' | 'ready' | 'error';

interface AuthContextValue {
  status: AuthStatus;
  firebaseUser: FirebaseUser | null;
  profile: UserProfile | null;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUp: (email: string, password: string, data: RegisterData) => Promise<void>;
  completeRegistration: (data: RegisterData) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  resendVerification: () => Promise<void>;
  /** Vuelve a leer el usuario de Firebase (por ejemplo, después de verificar el email). */
  reloadFirebaseUser: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function requireAuth() {
  if (!firebaseAuth) throw new Error('Firebase no está configurado');
  return firebaseAuth;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  // Mientras se crea la cuenta, evitamos que el listener muestre estados intermedios.
  const registering = useRef(false);

  const loadProfile = useCallback(async () => {
    try {
      const me = await capsApi.getMe();
      setProfile(me);
      setStatus('ready');
    } catch (error) {
      setProfile(null);
      if (error instanceof ApiError && error.code === 'USER_NOT_REGISTERED') setStatus('needsRegistration');
      else if (error instanceof ApiError && error.code === 'USER_INACTIVE') setStatus('inactive');
      else setStatus('error');
    }
  }, []);

  useEffect(() => {
    if (!firebaseAuth) return;
    return onAuthStateChanged(firebaseAuth, (user) => {
      setFirebaseUser(user);
      if (registering.current) return;
      if (!user) {
        setProfile(null);
        setStatus('signedOut');
        return;
      }
      setStatus('loading');
      queueMicrotask(() => { void loadProfile(); });
    });
  }, [loadProfile]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      firebaseUser,
      profile,
      signIn: async (email, password) => {
        await signInWithEmailAndPassword(requireAuth(), email.trim(), password);
      },
      signInWithGoogle: async () => {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        await signInWithPopup(requireAuth(), provider);
      },
      signUp: async (email, password, data) => {
        registering.current = true;
        try {
          const credential = await createUserWithEmailAndPassword(requireAuth(), email.trim(), password);
          await sendEmailVerification(credential.user).catch(() => undefined);
          await capsApi.register(data);
        } finally {
          registering.current = false;
          if (requireAuth().currentUser) await loadProfile();
        }
      },
      completeRegistration: async (data) => {
        await capsApi.register(data);
        await loadProfile();
      },
      signOut: async () => {
        await firebaseSignOut(requireAuth());
      },
      resetPassword: async (email) => {
        await sendPasswordResetEmail(requireAuth(), email.trim());
      },
      resendVerification: async () => {
        const user = requireAuth().currentUser;
        if (user) await sendEmailVerification(user);
      },
      reloadFirebaseUser: async () => {
        const user = requireAuth().currentUser;
        if (!user) return;
        await user.reload();
        // Forzamos un token nuevo para que el backend vea el email verificado.
        await user.getIdToken(true);
        setFirebaseUser(requireAuth().currentUser);
      },
      refreshProfile: loadProfile,
    }),
    [status, firebaseUser, profile, loadProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return context;
}

/** Traduce los códigos de error de Firebase a mensajes en castellano. */
export function firebaseErrorMessage(error: unknown): string {
  const code = (error as { code?: string })?.code ?? '';
  const messages: Record<string, string> = {
    'auth/invalid-credential': 'Email o contraseña incorrectos.',
    'auth/wrong-password': 'Email o contraseña incorrectos.',
    'auth/user-not-found': 'Email o contraseña incorrectos.',
    'auth/invalid-email': 'El email no es válido.',
    'auth/email-already-in-use': 'Ya existe una cuenta con ese email. Probá iniciar sesión.',
    'auth/weak-password': 'La contraseña es muy débil. Usá al menos 8 caracteres.',
    'auth/too-many-requests': 'Demasiados intentos. Esperá unos minutos y volvé a probar.',
    'auth/network-request-failed': 'No hay conexión. Revisá tu internet.',
    'auth/missing-email': 'Ingresá tu email.',
    'auth/popup-blocked': 'El navegador bloqueó la ventana de Google. Permití ventanas emergentes y volvé a intentar.',
    'auth/popup-closed-by-user': 'Se cerró la ventana de Google antes de completar el ingreso.',
    'auth/cancelled-popup-request': 'Ya hay un ingreso con Google en curso.',
    'auth/operation-not-allowed': 'Este método de acceso no está habilitado en Firebase.',
    'auth/unauthorized-domain': 'Este dominio no está autorizado para ingresar con Firebase.',
    'auth/account-exists-with-different-credential': 'Ya existe una cuenta con ese email y otro método de acceso. Ingresá con el método original.',
  };
  if (messages[code]) return messages[code];
  if (error instanceof Error) return error.message;
  return 'No se pudo completar la operación.';
}
