import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

let authExport: any;
let dbExport: any;

try {
    const app = initializeApp(firebaseConfig);
    authExport = getAuth(app);
    dbExport = getFirestore(app);
} catch (e) {
    console.warn("Firebase initialization failed, using mocks for preview:", e);
    authExport = {
        currentUser: null,
        onAuthStateChanged: (cb: any) => { cb(null); return () => { }; },
        signOut: async () => { }
    } as any;
    dbExport = {} as any;
}

export const auth = authExport;
export const db = dbExport;
