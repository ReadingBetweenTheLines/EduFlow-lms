// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// REPLACE THESE WITH YOUR REAL FIREBASE KEYS LATER
const firebaseConfig = {
  apiKey: "AIzaSyClcSVDJxveAVlrkEy5apCLME8N6sSCF-Y",
  authDomain: "eduflow-placeholder.firebaseapp.com",
  projectId: "eduflow-placeholder",
  storageBucket: "eduflow-placeholder.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);