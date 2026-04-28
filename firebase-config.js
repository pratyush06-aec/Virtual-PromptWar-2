// Firebase Client Config — safe to expose (used ONLY for Auth, not for Gemini)
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDrkL2m83_z0JBW92E9k8U4BGaIxYeT0f4",
  authDomain: "nexus-venue-190880-e0408.firebaseapp.com",
  projectId: "nexus-venue-190880-e0408",
  storageBucket: "nexus-venue-190880-e0408.firebasestorage.app",
  messagingSenderId: "115029865588",
  appId: "1:115029865588:web:fb07a375335b0d05c74d21",
  measurementId: "G-G4SMEKH2JN"
};

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const googleProvider = new GoogleAuthProvider();

export { auth, googleProvider };
