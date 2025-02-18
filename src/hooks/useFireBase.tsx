import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { useMemo } from "react";

export default function useFireBase() {
  const firebaseApp = useMemo(
    () =>
      initializeApp({
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: import.meta.env.VITE_FIREBASE_APP_ID,
      }),
    []
  );
  const firebaseAnalytics = useMemo(() => getAnalytics(firebaseApp), [firebaseApp]);
  const firebaseAuth = useMemo(() => getAuth(firebaseApp), [firebaseApp]);
  const firebaseDB = useMemo(() => getFirestore(firebaseApp), [firebaseApp]);

  return { firebaseApp, firebaseAnalytics, firebaseAuth, firebaseDB };
}