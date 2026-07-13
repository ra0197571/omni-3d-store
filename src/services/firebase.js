import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDvDAhPC_xZAqdYmTzRROQOZzgvUln17aQ",
  authDomain: "omni-stor.firebaseapp.com",
  projectId: "omni-stor",
  storageBucket: "omni-stor.firebasestorage.app",
  messagingSenderId: "849465766301",
  appId: "1:849465766301:web:adffd1929b3c2f8e843f74",
  measurementId: "G-BDPCJX16FB"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);