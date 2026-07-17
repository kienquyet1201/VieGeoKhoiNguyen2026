import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyDBpAw07ulXZbwXdrt2YbJq2K-JPhidzpU",
    authDomain: "viegeo.firebaseapp.com",
    projectId: "viegeo",
    storageBucket: "viegeo.firebasestorage.app",
    messagingSenderId: "1096962722269",
    appId: "1:1096962722269:web:3ce5e32956ca42a2b9ce34",
    measurementId: "G-D31X0CZR93"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
