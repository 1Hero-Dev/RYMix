import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfigRaw from '../../firebase-applet-config.json';

// Support environment variables with fallback to local applet config (V15 fix)
const env = (typeof import.meta !== 'undefined' && (import.meta as any).env) || {};
const firebaseConfig = {
  ...firebaseConfigRaw,
  apiKey: env.VITE_FIREBASE_API_KEY || firebaseConfigRaw.apiKey,
  projectId: env.VITE_FIREBASE_PROJECT_ID || firebaseConfigRaw.projectId,
  appId: env.VITE_FIREBASE_APP_ID || firebaseConfigRaw.appId,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigRaw.authDomain,
  firestoreDatabaseId: env.VITE_FIRESTORE_DATABASE_ID || firebaseConfigRaw.firestoreDatabaseId,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigRaw.storageBucket,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigRaw.messagingSenderId,
};

// Initialize Firebase App safely
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// CRITICAL: Initialize Cloud Firestore with forced long-polling to prevent iframe WebChannel stream disconnects
let firestoreDb;
try {
  firestoreDb = initializeFirestore(
    app,
    {
      experimentalForceLongPolling: true,
    },
    firebaseConfig.firestoreDatabaseId
  );
} catch {
  firestoreDb = getFirestore(app, firebaseConfig.firestoreDatabaseId);
}

export const db = firestoreDb;

// Validate Connection to Firestore as mandated by Firebase Integration Skill
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
      return false;
    }
    return true;
  }
}

// Non-blocking test on initial client boot
if (typeof window !== 'undefined') {
  testConnection().catch(() => {});
}

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Cloud Storage
export const storage = getStorage(app);

// Operation Types for error reporting
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
