
// @ts-ignore
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  // @ts-ignore
  getAuth,
  // @ts-ignore
  setPersistence,
  // @ts-ignore
  browserLocalPersistence,
  // @ts-ignore
  browserSessionPersistence
} from "firebase/auth";
// @ts-ignore
import { getFirestore } from "firebase/firestore";
// @ts-ignore
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyBFqaDpdrUZUDil2YmsdK-dGu_echBRSoE",
  authDomain: "aimr-twin-studio.firebaseapp.com",
  projectId: "aimr-twin-studio",
  storageBucket: "aimr-twin-studio.firebasestorage.app",
  messagingSenderId: "298990602880",
  appId: "1:298990602880:web:a29a36febb7ff24c297465",
  measurementId: "G-GYK4Q35MLR"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);

const initializePersistence = async () => {
  try {
    await setPersistence(auth, browserLocalPersistence);
  } catch (error) {
    console.warn("Firebase Auth: Local persistence blocked. Falling back to session storage.", error);
    try {
      await setPersistence(auth, browserSessionPersistence);
    } catch (fallbackError) {
      console.error("Firebase Auth: Persistence initialization failed completely.", fallbackError);
    }
  }
};

// @ts-ignore
import { connectAuthEmulator } from "firebase/auth";
// @ts-ignore
import { connectFirestoreEmulator } from "firebase/firestore";
// @ts-ignore
import { connectFunctionsEmulator } from "firebase/functions";

export const persistencePromise = initializePersistence().then(() => {
  // Connect to emulators if running locally
  if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
    console.log("Connecting to Firebase Emulators...");
    // @ts-ignore
    connectAuthEmulator(auth, "http://127.0.0.1:9099");
    // @ts-ignore
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
    // @ts-ignore
    connectFunctionsEmulator(functions, "127.0.0.1", 5001);
  }
});
