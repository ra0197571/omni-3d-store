import React, { useState, useEffect } from 'react';
import { db } from './firebase'; // Firebase config import
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore"; 

function App() {
  const [storeName, setStoreName] = useState("Loading...");
  const [primaryColor, setPrimaryColor] = useState("#3b82f6");

  // 1. Database se settings load karna (Website khulte hi)
  useEffect(() => {
    const docRef = doc(db, "settings", "storeConfig");
    
    // Real-time listener: Agar koi admin panel se change kare, to website khud update ho jaye
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setStoreName(data.storeName);
        setPrimaryColor(data.primaryColor);
        document.documentElement.style.setProperty('--primary-color', data.primaryColor);
      } else {
        // Agar pehli dafa hai aur data nahi hai
        setStoreName("MY OMNI STORE");
      }
    });

    return () => unsubscribe();
  }, []);

  // 2. Data Firebase mein save karne ka function
  const saveToFirebase = async (newName, newColor) => {
    try {
      await setDoc(doc(db, "settings", "storeConfig"), {
        storeName: newName,
        primaryColor: newColor
      });
    } catch (e) {
      console.error("Error saving document: ", e);
    }
  };

  const handleNameChange = (e) => {
    const name = e.target.value;
    setStoreName(name);
    saveToFirebase(name, primaryColor);
  };

  const handleColorChange = (e) => {
    const color = e.target.value;
    setPrimaryColor(color);
    document.documentElement.style.setProperty('--primary-color', color);
    saveToFirebase(storeName, color);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-5 bg-gray-50">
      {/* Website Header */}
      <div 
        className="p-10 rounded-3xl shadow-2xl text-white mb-10 w-full max-w-lg text-center transition-all duration-500 bg-primary"
      >
        <h1 className="text-4xl font-black uppercase tracking-tighter">{storeName}</h1>
        <p className="opacity-80 text-sm mt-2 font-medium italic">Ultra Pro Max Live Store</p>
      </div>

      {/* Admin Panel Card */}
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border border-gray-200">
        <h3 className="text-xl font-bold mb-6 text-gray-800 border-b pb-4 text-center italic text-primary">Admin Control</h3>
        
        <div className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 text-center">Update Store Name</label>
            <input 
              type="text" 
              value={storeName}
              placeholder="Type Brand Name..." 
              className="border-2 border-gray-100 p-3 rounded-xl w-full focus:border-primary outline-none text-center font-bold"
              onChange={handleNameChange}
            />
          </div>
          
          <div className="flex flex-col items-center">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Pick Theme Color</label>
            <input 
              type="color" 
              value={primaryColor}
              onChange={handleColorChange}
              className="w-full h-14 cursor-pointer rounded-xl border-none shadow-sm"
            />
          </div>
        </div>
      </div>
      
      <p className="mt-8 text-gray-400 text-xs">Aap jo yahan likhenge, wo puri dunya ko Live nazar aaye ga!</p>
    </div>
  );
}

export default App;