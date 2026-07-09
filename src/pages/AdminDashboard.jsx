import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { db } from '../services/firebase';
import { doc, setDoc, addDoc, collection, deleteDoc, onSnapshot } from 'firebase/firestore';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  const { settings } = useContext(AppContext);
  const [isAuth, setIsAuth] = useState(false);
  const [pass, setPass] = useState("");
  const [products, setProducts] = useState([]); // Inventory ke liye

  // Form States
  const [pName, setPName] = useState("");
  const [pPrice, setPPrice] = useState("");
  const [pImg, setPImg] = useState("");

  const adminPassword = "admin"; // Aapka password

  // Inventory load karna
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "products"), (s) => {
      setProducts(s.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const updateSettings = async (field, value) => {
    await setDoc(doc(db, "settings", "storeConfig"), { ...settings, [field]: value }, { merge: true });
  };

  const addProduct = async (e) => {
    e.preventDefault();
    if(!pName || !pPrice || !pImg) return alert("Fill all fields");
    await addDoc(collection(db, "products"), { name: pName, price: pPrice, image: pImg, createdAt: new Date() });
    setPName(""); setPPrice(""); setPImg("");
  };

  const removeProduct = async (id) => {
    if(window.confirm("Delete this product?")) {
      await deleteDoc(doc(db, "products", id));
    }
  };

  if (!isAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 p-5">
        <div className="bg-white p-10 rounded-[3rem] shadow-2xl text-center max-w-sm w-full border-t-8 border-blue-600">
          <h2 className="text-3xl font-black mb-6 uppercase italic text-slate-800">Admin Login</h2>
          <input type="password" placeholder="Enter Password" title='password' className="w-full p-4 bg-slate-100 rounded-2xl mb-4 text-center outline-none focus:ring-2 ring-blue-500" onChange={(e) => setPass(e.target.value)} />
          <button onClick={() => pass === adminPassword ? setIsAuth(true) : alert("Wrong!")} className="w-full bg-blue-600 text-white p-4 rounded-2xl font-bold uppercase">Enter Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-10 max-w-7xl mx-auto flex flex-col gap-10 bg-white min-h-screen">
      <div className="flex justify-between items-center bg-slate-50 p-6 rounded-3xl border">
        <Link to="/" className="text-blue-600 font-bold hover:underline">← Go to Storefront</Link>
        <h1 className="text-xl font-black italic">CONTROL CENTER</h1>
        <button onClick={() => setIsAuth(false)} className="bg-red-100 text-red-600 px-6 py-2 rounded-full font-bold">Logout</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* 1. BRANDING & PAYMENTS SECTION */}
        <section className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-sm space-y-6">
          <h2 className="text-2xl font-bold mb-6 italic text-slate-800 border-b pb-2">Store Branding</h2>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">Store Name</label>
            <input type="text" value={settings.storeName} className="w-full p-4 border rounded-2xl mt-1" onChange={(e)=>updateSettings('storeName', e.target.value)} />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">Theme Color</label>
            <input type="color" value={settings.primaryColor} className="w-full h-14 cursor-pointer rounded-xl mt-1" onChange={(e)=>updateSettings('primaryColor', e.target.value)} />
          </div>
          <div className="pt-4 border-t space-y-4">
            <h3 className="font-bold text-green-600 italic">Payment Details</h3>
            <input type="text" value={settings.whatsapp} className="w-full p-4 border rounded-2xl" placeholder="WhatsApp (923...)" onChange={(e)=>updateSettings('whatsapp', e.target.value)} />
            <input type="text" value={settings.jazzCashNo} className="w-full p-4 border rounded-2xl" placeholder="JazzCash Number" onChange={(e)=>updateSettings('jazzCashNo', e.target.value)} />
            <input type="text" value={settings.easyPaisaNo} className="w-full p-4 border rounded-2xl" placeholder="EasyPaisa Number" onChange={(e)=>updateSettings('easyPaisaNo', e.target.value)} />
          </div>
        </section>

        {/* 2. ADD PRODUCT SECTION */}
        <section className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-xl">
          <h2 className="text-2xl font-bold mb-6 text-blue-400 italic border-b pb-2 text-primary">Add New Product</h2>
          <form onSubmit={addProduct} className="space-y-4">
            <input type="text" placeholder="Product Name" value={pName} className="w-full p-4 bg-slate-800 rounded-2xl border-none outline-none focus:ring-1 ring-blue-500" onChange={(e)=>setPName(e.target.value)} />
            <input type="number" placeholder="Price (Rs)" value={pPrice} className="w-full p-4 bg-slate-800 rounded-2xl border-none outline-none focus:ring-1 ring-blue-500" onChange={(e)=>setPPrice(e.target.value)} />
            <input type="text" placeholder="Image Link (URL)" value={pImg} className="w-full p-4 bg-slate-800 rounded-2xl border-none outline-none focus:ring-1 ring-blue-500" onChange={(e)=>setPImg(e.target.value)} />
            <button className="w-full bg-blue-600 p-5 rounded-2xl font-bold uppercase tracking-widest text-lg shadow-lg shadow-blue-500/20">Publish Now</button>
          </form>
        </section>

        {/* 3. INVENTORY LIST SECTION (Missing Hissa) */}
        <section className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-sm overflow-hidden">
          <h2 className="text-2xl font-bold mb-6 italic text-slate-800 border-b pb-2">Inventory ({products.length})</h2>
          <div className="space-y-4 overflow-y-auto max-h-[500px] pr-2">
            {products.map(p => (
              <div key={p.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border group">
                <div className="flex items-center space-x-3">
                  <img src={p.image} alt={p.name} className="w-12 h-12 rounded-xl object-cover" />
                  <div>
                    <p className="font-bold text-sm text-slate-800 leading-none">{p.name}</p>
                    <p className="text-xs text-blue-600 font-bold mt-1">Rs. {p.price}</p>
                  </div>
                </div>
                <button onClick={() => removeProduct(p.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                  🗑️
                </button>
              </div>
            ))}
            {products.length === 0 && <p className="text-center text-slate-400 mt-10 italic">No products yet.</p>}
          </div>
        </section>

      </div>
    </div>
  );
}