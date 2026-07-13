import React, { createContext, useState, useEffect } from 'react';
import { auth, db } from '../services/firebase';
import { onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      try {
        if (currentUser) {
          const docSnap = await getDoc(doc(db, "users", currentUser.uid));
          setUser({ uid: currentUser.uid, ...currentUser, ...docSnap.data() });
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error(err);
      }
      setLoading(false); // White screen khatam karne ke liye ye line sab se zaroori hai
    });
    return () => unsub();
  }, []);

  const signup = (email, pass) => createUserWithEmailAndPassword(auth, email, pass);
  const login = (email, pass) => signInWithEmailAndPassword(auth, email, pass);
  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ user, signup, login, logout }}>
      {!loading ? children : (
        <div className="min-h-screen flex items-center justify-center bg-white font-black uppercase italic text-primary animate-pulse">
          Omni-3D Loading...
        </div>
      )}
    </AuthContext.Provider>
  );
};