import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { db } from './firebase';
import { collection, onSnapshot, addDoc, deleteDoc, doc, setDoc } from "firebase/firestore";
import { motion } from "framer-motion";

// --- 🛒 DUKAN (CUSTOMER VIEW) ---
const Store = ({ storeName, products }) => (
  <div className="min-h-screen bg-slate-50">
    <nav className="p-6 bg-blue-600 text-white shadow-xl flex justify-between items-center sticky top-0 z-50">
      <h1 className="text-3xl font-black uppercase tracking-tighter italic">{storeName || "OMNI STORE"}</h1>
      <Link to="/admin" className="bg-white/20 px-4 py-2 rounded-full hover:bg-white/40 transition">Admin Panel</Link>
    </nav>
    
    <div className="max-w-6xl mx-auto p-10">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {products.map(p => (
          <motion.div whileHover={{ y: -10 }} key={p.id} className="bg-white rounded-[2rem] p-5 shadow-md border border-slate-100 group">
            <div className="w-full h-48 bg-slate-100 rounded-[1.5rem] mb-4 overflow-hidden">
              <img src={p.image || "https://via.placeholder.com/300"} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
            </div>
            <h4 className="font-bold text-lg text-slate-800">{p.name}</h4>
            <div className="flex justify-between items-center mt-3">
              <span className="text-blue-600 font-black text-xl text-primary">Rs. {p.price}</span>
              <button className="bg-blue-600 text-white p-3 rounded-xl shadow-lg shadow-blue-200">Buy</button>
            </div>
          </motion.div>
        ))}
      </div>
      {products.length === 0 && <p className="text-center text-slate-400 mt-20 italic">Dukan khali hai! Admin se products add karein.</p>}
    </div>
  </div>
);

// --- ⚙️ ADMIN PANEL ---
const Admin = ({ storeName, setStoreName, products }) => {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [img, setImg] = useState("");

  const handleAdd = async (e) => {
    e.preventDefault();
    if(!name || !price || !img) return alert("Details bharein!");
    await addDoc(collection(db, "products"), { name, price, image: img });
    setName(""); setPrice(""); setImg("");
  };

  return (
    <div className="p-10 max-w-5xl mx-auto">
      <Link to="/" className="text-blue-600 font-bold mb-10 block underline">← Back to Store</Link>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="bg-white p-8 rounded-3xl shadow-xl border">
          <h2 className="text-xl font-bold mb-4">Branding</h2>
          <input type="text" value={storeName} className="w-full p-3 border rounded-xl" onChange={(e) => {
            const n = e.target.value;
            setStoreName(n);
            setDoc(doc(db, "settings", "storeConfig"), { storeName: n }, { merge: true });
          }} />
        </div>
        <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl">
          <h2 className="text-xl font-bold mb-4 text-blue-400">Add Product</h2>
          <form onSubmit={handleAdd} className="space-y-3">
            <input type="text" placeholder="Product Name" value={name} className="w-full p-3 rounded-xl bg-slate-800 border-none" onChange={(e)=>setName(e.target.value)} />
            <input type="number" placeholder="Price" value={price} className="w-full p-3 rounded-xl bg-slate-800 border-none" onChange={(e)=>setPrice(e.target.value)} />
            <input type="text" placeholder="Image URL" value={img} className="w-full p-3 rounded-xl bg-slate-800 border-none" onChange={(e)=>setImg(e.target.value)} />
            <button className="w-full bg-blue-600 p-3 rounded-xl font-bold uppercase">Add to Store</button>
          </form>
        </div>
      </div>
    </div>
  );
};

// --- 🚀 MAIN APP ---
export default function App() {
  const [storeName, setStoreName] = useState("Store");
  const [products, setProducts] = useState([]);

  useEffect(() => {
    onSnapshot(doc(db, "settings", "storeConfig"), (s) => s.exists() && setStoreName(s.data().storeName));
    onSnapshot(collection(db, "products"), (s) => setProducts(s.docs.map(d => ({id:d.id, ...d.data()}))));
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Store storeName={storeName} products={products} />} />
        <Route path="/admin" element={<Admin storeName={storeName} setStoreName={setStoreName} products={products} />} />
      </Routes>
    </Router>
  );
}