import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { db } from './firebase';
import { doc, onSnapshot, setDoc, collection, addDoc, deleteDoc } from "firebase/firestore"; 
import { motion, AnimatePresence } from "framer-motion";

// --- CUSTOMER STORE PAGE ---
const Storefront = ({ storeName, products, primaryColor }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-gray-50">
    <nav className="p-6 bg-primary text-white shadow-xl flex justify-between items-center transition-all">
      <h1 className="text-3xl font-black italic tracking-tighter uppercase">{storeName}</h1>
      <Link title='Admin Panel' to="/admin" className="bg-white/20 px-4 py-2 rounded-full backdrop-blur-md hover:bg-white/40 transition">⚙️</Link>
    </nav>
    
    <div className="max-w-6xl mx-auto p-10">
      <h2 className="text-2xl font-bold mb-8 text-gray-800">Featured Products</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {products.map(product => (
          <motion.div 
            layout
            whileHover={{ y: -10 }}
            key={product.id} 
            className="bg-white p-5 rounded-[2rem] shadow-sm hover:shadow-2xl transition-all border border-gray-100"
          >
            <div className="w-full h-48 bg-gray-100 rounded-[1.5rem] mb-4 flex items-center justify-center text-gray-400 overflow-hidden">
               {/* Agle step mein hum yahan real image dalenge */}
               <span className="text-xs uppercase font-bold tracking-widest">No Image</span>
            </div>
            <h4 className="font-bold text-lg text-gray-800">{product.name}</h4>
            <div className="flex justify-between items-center mt-3">
               <p className="text-primary font-black text-xl">Rs. {product.price}</p>
               <button className="bg-primary text-white p-3 rounded-2xl shadow-lg shadow-primary/30">
                 <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d="M8 1a2.5 2.5 0 0 1 2.5 2.5V4h-5v-.5A2.5 2.5 0 0 1 8 1m3.5 3v-.5a3.5 3.5 0 1 0-7 0V4H1v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V4zM2 5h12v9a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1z"/></svg>
               </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </motion.div>
);

// --- MAIN APP COMPONENT ---
function App() {
  const [storeName, setStoreName] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#3b82f6");
  const [products, setProducts] = useState([]);

  useEffect(() => {
    onSnapshot(doc(db, "settings", "storeConfig"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setStoreName(data.storeName);
        setPrimaryColor(data.primaryColor);
        document.documentElement.style.setProperty('--primary-color', data.primaryColor);
      }
    });

    onSnapshot(collection(db, "products"), (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Storefront storeName={storeName} products={products} primaryColor={primaryColor} />} />
        <Route path="/admin" element={<AdminPanel storeName={storeName} products={products} setStoreName={setStoreName} setPrimaryColor={setPrimaryColor} primaryColor={primaryColor} />} />
      </Routes>
    </Router>
  );
}

// --- ADMIN PANEL COMPONENT (Hidden logic simplified for view) ---
const AdminPanel = ({ storeName, products, setStoreName, setPrimaryColor, primaryColor }) => {
  const [pName, setPName] = useState("");
  const [pPrice, setPPrice] = useState("");

  const saveConfig = async (n, c) => await setDoc(doc(db, "settings", "storeConfig"), { storeName: n, primaryColor: c });
  const addP = async () => { 
    if(!pName || !pPrice) return;
    await addDoc(collection(db, "products"), { name: pName, price: pPrice });
    setPName(""); setPPrice("");
  }

  return (
    <div className="p-10 bg-white min-h-screen">
       <Link to="/" className="text-primary font-bold mb-10 block">← Back to Store</Link>
       <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-6">
            <h2 className="text-3xl font-bold">Admin Settings</h2>
            <input type="text" value={storeName} className="w-full p-4 border rounded-2xl" onChange={(e) => {setStoreName(e.target.value); saveConfig(e.target.value, primaryColor)}} />
            <input type="color" value={primaryColor} className="w-full h-14" onChange={(e) => {setPrimaryColor(e.target.value); saveConfig(storeName, e.target.value)}} />
          </div>
          <div className="space-y-6 bg-gray-50 p-6 rounded-[2rem]">
            <h2 className="text-2xl font-bold">New Product</h2>
            <input type="text" placeholder="Name" value={pName} className="w-full p-4 border rounded-2xl" onChange={(e)=>setPName(e.target.value)} />
            <input type="number" placeholder="Price" value={pPrice} className="w-full p-4 border rounded-2xl" onChange={(e)=>setPPrice(e.target.value)} />
            <button onClick={addP} className="w-full bg-black text-white p-4 rounded-2xl font-bold">Add Product</button>
          </div>
       </div>
       <div className="mt-10 border-t pt-10">
          <h3 className="text-xl font-bold mb-4">Current Inventory</h3>
          {products.map(p => (
            <div key={p.id} className="flex justify-between items-center p-4 border-b">
              <span>{p.name}</span>
              <button onClick={async ()=> await deleteDoc(doc(db, "products", p.id))} className="text-red-500">Delete</button>
            </div>
          ))}
       </div>
    </div>
  );
}

export default App;