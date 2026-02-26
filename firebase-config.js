// firebase-config.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAH4AAMhfBU52qLg6mjL0VHFAGx1OR4SAk",
  authDomain: "eventlog-e2243.firebaseapp.com",
  projectId: "eventlog-e2243",
  storageBucket: "eventlog-e2243.firebasestorage.app",
  messagingSenderId: "95089726888",
  appId: "1:95089726888:web:a7a577456aeebe10f4399d",
  measurementId: "G-RM4V4410ZN"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
