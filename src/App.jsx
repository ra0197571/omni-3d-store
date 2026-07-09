import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { db } from './firebase';
import { collection, onSnapshot, addDoc, deleteDoc, doc, setDoc } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";

// --- 🛒 USER STOREFRONT ---
const Store = ({ storeName, products }) => (
  <div className="min-h-screen bg-gray-50">
    <nav className="p-6 bg-primary text-white shadow-xl flex justify-between items-center sticky top-0 z-50 transition-all">
      <h1 className="text-3xl font-black italic uppercase tracking-tighter">{storeName || "Omni Store"}</h1>
      <Link to="/admin" className="bg-white/20 px-5 py-2 rounded-full hover:bg-white/40 backdrop-blur-md transition">Admin</Link>
    </nav>
    
    <div className="max-w-7xl mx-auto p-10">
      <h2 className="text-3xl font-bold mb-10 text-gray-800">Latest Collection</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-10">
        {products.map(p => (
          <motion.div layout whileHover={{ y: -10 }} key={p.id} className="bg-white rounded-[2.5rem] p-5 shadow-sm hover:shadow-2xl transition-all border border-gray-100 group">
            <div className="w-full h-60 bg-gray-100 rounded-[2rem] mb-5 overflow-hidden">
              <img src={p.image || "https://via.placeholder.com/300"} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
            </div>
            <h4 className="font-bold text-xl text-gray-800 px-2">{p.name}</h4>
            <div className="flex justify-between items-center mt-4 px-2">
              <span className="text-primary font-black text-2xl">Rs. {p.price}</span>
              <button className="bg-primary text-white p-4 rounded-2xl shadow-lg shadow-primary/30 active:scale-90 transition">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d="M8 1a2.5 2.5 0 0 1 2.5 2.5V4h-5v-.5A2.5 2.5 0 0 1 8 1m3.5 3v-.5a3.5 3.5 0 1 0-7 0V4H1v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V4zM2 5h12v9a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1z"/></svg>
              </button>
            </div>
          </motion.div>
        ))}
      </div>
      {products.length === 0 && <p className="text-center text-gray-400 mt-20 text-xl font-medium italic">Store is empty. Please add products from Admin Panel.</p>}
    </div>
  </div>
);

// --- ⚙️ ADMIN DASHBOARD ---
const Admin = ({ storeName, setStoreName, primaryColor, setPrimaryColor, products }) => {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [imgUrl, setImgUrl] = useState("");

  const saveSettings = async (n, c) => await setDoc(doc(db, "settings", "storeConfig"), { storeName: n, primaryColor: c });

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!name || !price || !imgUrl) return alert("Pehle saari details bharein!");
    await addDoc(collection(db, "products"), { name, price, image: imgUrl, createdAt: new Date() });
    setName(""); setPrice(""); setImgUrl("");
  };

  return (
    <div className="p-10 max-w-6xl mx-auto min-h-screen">
      <Link to="/" className="text-primary font-bold hover:underline">← Go to Website</Link>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mt-10">
        {/* Settings */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">Store Settings</h2>
          <div className="space-y-4">
            <label className="text-xs font-bold text-gray-400 uppercase">Brand Name</label>
            <input type="text" value={storeName} className="w-full p-4 border rounded-2xl outline-none focus:border-primary" onChange={(e) => {setStoreName(e.target.value); saveSettings(e.target.value, primaryColor)}} />
            <label className="text-xs font-bold text-gray-400 uppercase">Theme Color</label>
            <input type="color" value={primaryColor} className="w-full h-16 cursor-pointer rounded-2xl" onChange={(e) => {setPrimaryColor(e.target.value); saveSettings(storeName, e.target.value)}} />
          </div>
        </div>

        {/* Add Product */}
        <div className="bg-gray-900 text-white p-8 rounded-[2.5rem] shadow-xl">
          <h2 className="text-2xl font-bold mb-6 text-primary">Add New Product</h2>
          <form onSubmit={handleAddProduct} className="space-y-4">
            <input type="text" placeholder="Product Name" value={name} className="w-full p-4 rounded-2xl bg-gray-800 border-none outline-none focus:ring-2 ring-primary" onChange={(e)=>setName(e.target.value)} />
            <input type="number" placeholder="Price (PKR)" value={price} className="w-full p-4 rounded-2xl bg-gray-800 border-none outline-none focus:ring-2 ring-primary" onChange={(e)=>setPrice(e.target.value)} />
            <input type="text" placeholder="Image URL (Paste link here)" value={imgUrl} className="w-full p-4 rounded-2xl bg-gray-800 border-none outline-none focus:ring-2 ring-primary" onChange={(e)=>setImgUrl(e.target.value)} />
            <button className="w-full bg-primary p-4 rounded-2xl font-bold uppercase tracking-widest text-lg shadow-lg shadow-primary/20">Add to Store</button>
          </form>
        </div>
      </div>

      <div className="mt-16">
        <h3 className="text-2xl font-bold mb-6">Inventory Management</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map(p => (
            <div key={p.id} className="flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-200">
              <div className="flex items-center space-x-4">
                <img src={p.image} className="w-12 h-12 rounded-lg object-cover" />
                <span className="font-bold">{p.name}</span>
              </div>
              <button onClick={() => deleteDoc(doc(db, "products", p.id))} className="text-red-500 hover:bg-red-50 p-2 rounded-lg">Delete</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- 🚀 MAIN APP ---
export default function App() {
  const [storeName, setStoreName] = useState("Store");
  const [primaryColor, setPrimaryColor] = useState("#3b82f6");
  const [products, setProducts] = useState([]);

  useEffect(() => {
    onSnapshot(doc(db, "settings", "storeConfig"), (s) => {
      if (s.exists()) {
        const data = s.data();
        setStoreName(data.storeName);
        setPrimaryColor(data.primaryColor);
        document.documentElement.style.setProperty('--primary-color', data.primaryColor);
      }
    });
    onSnapshot(collection(db, "products"), (s) => setProducts(s.docs.map(d => ({id:d.id, ...d.data()}))));
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Store storeName={storeName} products={products} />} />
        <Route path="/admin" element={<Admin storeName={storeName} setStoreName={setStoreName} primaryColor={primaryColor} setPrimaryColor={setPrimaryColor} products={products} />} />
      </Routes>
    </Router>
  );
}