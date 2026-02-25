import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCMgM0jBFiWeuDwX3pW6oesGJL-Oe34_jg",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "factoryops-329a2.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "factoryops-329a2",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "factoryops-329a2.firebasestorage.app",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "98497508645",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:98497508645:web:57c2d94818f192392596cc",
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-Z1QBYYDM9G"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export let analytics = null;
isSupported().then((supported) => {
    if (supported) analytics = getAnalytics(app);
});
