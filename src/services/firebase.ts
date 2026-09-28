import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as fbSignOut, 
  onAuthStateChanged, 
  User,
  signInAnonymously
} from 'firebase/auth';
import { 
  initializeFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  limit, 
  serverTimestamp,
  Firestore
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Safe check: verify if Firebase configuration is provided
export const isFirebaseConfigured = Boolean(
  firebaseConfig.projectId &&
  firebaseConfig.projectId.trim().length > 0
);

export const isFirebaseAuthConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.apiKey.startsWith('AIza') &&
  firebaseConfig.projectId &&
  firebaseConfig.projectId.trim().length > 0
);

export const currentFirebaseProjectId = firebaseConfig.projectId || '';
export const currentFirestoreDatabaseId = (firebaseConfig as any).firestoreDatabaseId || '(default)';

let app: FirebaseApp | null = null;
if (isFirebaseConfigured) {
  try {
    const configToUse: any = {
      projectId: firebaseConfig.projectId,
      appId: firebaseConfig.appId,
      authDomain: firebaseConfig.authDomain,
      storageBucket: firebaseConfig.storageBucket,
      messagingSenderId: firebaseConfig.messagingSenderId
    };
    if (firebaseConfig.apiKey && firebaseConfig.apiKey.startsWith('AIza')) {
      configToUse.apiKey = firebaseConfig.apiKey;
    }
    app = !getApps().length ? initializeApp(configToUse) : getApp();
  } catch (err) {
    console.warn('Firebase app init failed:', err);
  }
}

// Only instantiate auth if a valid Firebase Web API key is configured
export const auth: any = (app && isFirebaseAuthConfigured) ? getAuth(app) : null;
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Initialize Firestore for the designated database
export const db: any = (app && (firebaseConfig as any).firestoreDatabaseId)
  ? initializeFirestore(app, {}, (firebaseConfig as any).firestoreDatabaseId)
  : (app ? initializeFirestore(app, {}) : null);

export { 
  signInWithPopup, 
  fbSignOut, 
  onAuthStateChanged, 
  signInAnonymously,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  serverTimestamp
};
export type { User };
