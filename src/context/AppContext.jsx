import React, { createContext, useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // src/context/AppContext.jsx mein settings state ko update karein:
const [settings, setSettings] = useState({
  storeName: "Loading...",
  primaryColor: "#3b82f6",
  whatsapp: "",       // Naya
  jazzCashNo: "",     // Naya
  easyPaisaNo: "",    // Naya
});

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "storeConfig"), (s) => {
      if (s.exists()) {
        const data = s.data();
        setSettings(data);
        // Colors ko CSS Variables mein set karna
        document.documentElement.style.setProperty('--primary-color', data.primaryColor);
        document.documentElement.style.setProperty('--secondary-color', data.secondaryColor || "#1e293b");
      }
    });
    return () => unsub();
  }, []);

  return (
    <AppContext.Provider value={{ settings }}>
      {children}
    </AppContext.Provider>
  );
};