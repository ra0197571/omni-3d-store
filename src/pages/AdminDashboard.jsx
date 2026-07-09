import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { db } from '../services/firebase';
import { doc, setDoc, addDoc, collection, deleteDoc } from 'firebase/firestore';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  const { settings } = useContext(AppContext);
  const [pName, setPName] = useState("");
  const [pPrice, setPPrice] = useState("");
  const [pImg, setPImg] = useState("");

  const updateSettings = async (field, value) => {
    await setDoc(doc(db, "settings", "storeConfig"), { ...settings, [field]: value }, { merge: true });
  };

  const addProduct = async (e) => {
    e.preventDefault();
    await addDoc(collection(db, "products"), { name: pName, price: pPrice, image: pImg });
    setPName(""); setPPrice(""); setPImg("");
  };

  return (
    <div className="p-10 max-w-6xl mx-auto flex flex-col gap-10">
      <Link to="/" className="text-primary font-bold text-lg">← View Live Store</Link>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Branding Controls */}
        <section className="bg-white p-8 rounded-[2.5rem] shadow-xl border">
          <h2 className="text-2xl font-bold mb-6 italic border-b pb-2">Store Branding</h2>
          <div className="space-y-6">
            <div>
              <label className="text-xs font-bold text-slate-400">STORE NAME</label>
              <input type="text" value={settings.storeName} className="w-full p-4 border rounded-2xl" onChange={(e)=>updateSettings('storeName', e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400">PRIMARY THEME COLOR</label>
              <input type="color" value={settings.primaryColor} className="w-full h-16 cursor-pointer" onChange={(e)=>updateSettings('primaryColor', e.target.value)} />
            </div>
          </div>
        </section>
        // AdminDashboard.jsx mein "Branding Controls" wale div ke niche ye section add karein:

<section className="bg-white p-8 rounded-[2.5rem] shadow-xl border mt-8">
  <h2 className="text-2xl font-bold mb-6 italic border-b pb-2 text-green-600">Payment & WhatsApp</h2>
  <div className="space-y-4">
    <div>
      <label className="text-xs font-bold text-slate-400 uppercase">WhatsApp Number (e.g. 923001234567)</label>
      <input type="text" value={settings.whatsapp || ""} className="w-full p-4 border rounded-2xl" placeholder="92..." onChange={(e)=>updateSettings('whatsapp', e.target.value)} />
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="text-xs font-bold text-slate-400 uppercase">JazzCash No</label>
        <input type="text" value={settings.jazzCashNo || ""} className="w-full p-4 border rounded-2xl" onChange={(e)=>updateSettings('jazzCashNo', e.target.value)} />
      </div>
      <div>
        <label className="text-xs font-bold text-slate-400 uppercase">EasyPaisa No</label>
        <input type="text" value={settings.easyPaisaNo || ""} className="w-full p-4 border rounded-2xl" onChange={(e)=>updateSettings('easyPaisaNo', e.target.value)} />
      </div>
    </div>
  </div>
</section>

        {/* Product Controls */}
        <section className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-xl">
          <h2 className="text-2xl font-bold mb-6 text-primary italic border-b pb-2">Add New Product</h2>
          <form onSubmit={addProduct} className="space-y-4">
             <input type="text" placeholder="Name" value={pName} className="w-full p-4 bg-slate-800 rounded-2xl" onChange={(e)=>setPName(e.target.value)} />
             <input type="number" placeholder="Price" value={pPrice} className="w-full p-4 bg-slate-800 rounded-2xl" onChange={(e)=>setPPrice(e.target.value)} />
             <input type="text" placeholder="Image Link" value={pImg} className="w-full p-4 bg-slate-800 rounded-2xl" onChange={(e)=>setPImg(e.target.value)} />
             <button className="w-full bg-primary p-4 rounded-2xl font-bold uppercase tracking-widest">Publish Product</button>
          </form>
        </section>
<section className="bg-white p-8 rounded-[2.5rem] shadow-xl border mt-10">
  <h2 className="text-2xl font-bold mb-6 italic border-b pb-2 text-orange-500">Payment & Contact</h2>
  <div className="space-y-4">
    <div>
      <label className="text-xs font-bold text-slate-400">WHATSAPP NUMBER (923...)</label>
      <input type="text" value={settings.whatsapp} className="w-full p-4 border rounded-2xl" placeholder="923001234567" onChange={(e)=>updateSettings('whatsapp', e.target.value)} />
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="text-xs font-bold text-slate-400">JAZZCASH NO</label>
        <input type="text" value={settings.jazzCashNo} className="w-full p-4 border rounded-2xl" onChange={(e)=>updateSettings('jazzCashNo', e.target.value)} />
      </div>
      <div>
        <label className="text-xs font-bold text-slate-400">EASYPAISA NO</label>
        <input type="text" value={settings.easyPaisaNo} className="w-full p-4 border rounded-2xl" onChange={(e)=>updateSettings('easyPaisaNo', e.target.value)} />
      </div>
    </div>
  </div>
</section>
      </div>
    </div>
  );
}