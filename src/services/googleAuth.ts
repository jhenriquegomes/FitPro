import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  User as FirebaseUser 
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
// Workspace Drive scope & User info
provider.addScope('https://www.googleapis.com/auth/drive');
provider.addScope('https://www.googleapis.com/auth/drive.file');
provider.addScope('https://www.googleapis.com/auth/userinfo.profile');
provider.addScope('https://www.googleapis.com/auth/userinfo.email');

// In-memory token cache (never stored in localStorage)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

export interface GoogleAuthResult {
  firebaseUser: FirebaseUser;
  accessToken: string;
  name: string;
  email: string;
  photoUrl?: string;
}

export const initGoogleAuth = (
  onAuthSuccess?: (user: FirebaseUser, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // Token not cached in memory yet, require interaction or re-signin for Drive operations
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (forceConsent: boolean = false): Promise<GoogleAuthResult> => {
  try {
    isSigningIn = true;
    if (forceConsent) {
      provider.setCustomParameters({ prompt: 'consent select_account' });
    } else {
      provider.setCustomParameters({ prompt: 'select_account' });
    }
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    
    if (!credential?.accessToken) {
      throw new Error('Não foi possível obter o token de acesso da conta Google.');
    }

    cachedAccessToken = credential.accessToken;
    
    return {
      firebaseUser: result.user,
      accessToken: cachedAccessToken,
      name: result.user.displayName || 'Usuário Google',
      email: result.user.email || '',
      photoUrl: result.user.photoURL || undefined
    };
  } catch (error: any) {
    if (
      error?.code === 'auth/popup-closed-by-user' ||
      error?.code === 'auth/cancelled-popup-request'
    ) {
      // User dismissed or closed the popup window; this is expected user behavior, not an application error
      console.info('Login Google cancelado pelo usuário (janela fechada).');
    } else if (error?.code === 'auth/popup-blocked') {
      console.warn('Pop-up de login do Google bloqueado pelo navegador.');
    } else {
      console.error('Google Sign-in error:', error);
    }
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getGoogleAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const setGoogleAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};

export const googleSignOut = async () => {
  try {
    await signOut(auth);
  } finally {
    cachedAccessToken = null;
  }
};

export const isGoogleConnected = (): boolean => {
  return !!auth.currentUser && !!cachedAccessToken;
};
