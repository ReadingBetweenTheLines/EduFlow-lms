import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; 

const firebaseConfig = {
  apiKey: "AIzaSyClcSVDJxveAVlrkEy5apCLME8N6sSCF-Y",
  authDomain: "lms-pab.firebaseapp.com",
  projectId: "lms-pab",
  storageBucket: "lms-pab.firebasestorage.app",
  messagingSenderId: "561819073798",
  appId: "1:561819073798:web:fcd295478a1c7cd2d03287",
  measurementId: "G-G5DRV6R2K0"
};

const app = initializeApp(firebaseConfig);

// --- EXPORTS ---
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);