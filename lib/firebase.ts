import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getStorage } from "firebase/storage";
import firebaseConfig from "../firebase-applet-config.json";

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
const auth = getAuth(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

export { app, db, auth, storage, googleProvider };
