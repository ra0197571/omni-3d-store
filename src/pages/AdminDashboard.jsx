import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { db } from '../services/firebase';
import { doc, setDoc, addDoc, collection, deleteDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function AdminDashboard() {
  const { settings } = useContext(AppContext);
  const [isAuth, setIsAuth] = useState(false);
  const [pass, setPass] = useState("");
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]); 
  const [categories, setCategories] = useState([]);

  // Product Form States
  const [pName, setPName] = useState("");
  const [pPrice, setPPrice] = useState("");
  const [pImg, setPImg] = useState("");
  const [pCat, setPCat] = useState("");
  const [pStock, setPStock] = useState(""); 
  const [pDesc, setPDesc] = useState(""); 
  const [pModel, setPModel] = useState(""); 
  const [newCatName, setNewCatName] = useState("");
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    const unsubProducts = onSnapshot(collection(db, "products"), (s) => {
      setProducts(s.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubOrders = onSnapshot(collection(db, "orders"), (s) => {
      setOrders(s.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubCats = onSnapshot(collection(db, "categories"), (s) => {
      setCategories(s.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => { unsubProducts(); unsubOrders(); unsubCats(); };
  }, []);

  // --- 📊 POWERFUL ANALYTICS LOGIC ---
  const totalRevenue = orders.reduce((acc, curr) => acc + Number(curr.price || 0), 0);
  
  // Total Inventory Value (Stock worth)
  const inventoryValue = products.reduce((acc, p) => acc + (Number(p.price) * Number(p.stock || 0)), 0);

  const categorySales = categories.map(cat => {
    const total = orders
      .filter(o => {
        // Naam se match karne ke bajaye, hum search kar rahe hain (Case insensitive)
        const orderProdName = o.productName?.toLowerCase().trim();
        const currentProd = products.find(p => p.name?.toLowerCase().trim() === orderProdName);
        return currentProd && currentProd.category === cat.name;
      })
      .reduce((acc, curr) => acc + Number(curr.price || 0), 0);
    return { name: cat.name, total };
  });

  const maxSale = Math.max(...categorySales.map(s => s.total), 1);

  // --- FUNCTIONS ---
  const updateSettings = async (field, value) => {
    await setDoc(doc(db, "settings", "storeConfig"), { ...settings, [field]: value }, { merge: true });
  };

  const handlePublish = async (e) => {
    e.preventDefault();
    if(!pName || !pPrice || !pImg || !pCat || !pStock) return alert("All fields are required!");

    const productData = { 
        name: pName, price: pPrice, image: pImg, category: pCat, 
        stock: Number(pStock), description: pDesc, model3D: pModel 
    };

    if (editId) {
      await updateDoc(doc(db, "products", editId), productData);
      setEditId(null);
      alert("Product Updated!");
    } else {
      await addDoc(collection(db, "products"), { ...productData, createdAt: new Date() });
      alert("Product Published!");
    }
    // Reset
    setPName(""); setPPrice(""); setPImg(""); setPCat(""); setPStock(""); setPDesc(""); setPModel("");
  };

  if (!isAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 p-5">
        <motion.div initial={{scale:0.9, opacity:0}} animate={{scale:1, opacity:1}} className="bg-white p-10 rounded-[3rem] shadow-2xl text-center max-w-sm w-full">
          <h2 className="text-3xl font-black mb-6 uppercase italic text-slate-800">Admin Login</h2>
          <input type="password" placeholder="Password" className="w-full p-5 bg-slate-100 rounded-2xl mb-4 text-center outline-none focus:ring-4 ring-primary/20 font-bold" onChange={(e) => setPass(e.target.value)} />
          <button onClick={() => pass === "admin" ? setIsAuth(true) : alert("Invalid Pass!")} className="w-full bg-primary text-white p-5 rounded-2xl font-black uppercase shadow-xl hover:shadow-primary/40 active:scale-95 transition-all">Enter Control Center</button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-5 md:p-10 max-w-[1600px] mx-auto flex flex-col gap-10 bg-white min-h-screen">
      {/* Top Header */}
      <div className="flex justify-between items-center bg-slate-50 p-6 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <Link to="/" className="text-primary font-black uppercase italic tracking-widest text-xs">← Storefront</Link>
        <h1 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter leading-none">Control <span className="text-primary">Center</span></h1>
        <button onClick={() => setIsAuth(false)} className="text-red-500 font-black uppercase text-xs tracking-widest underline">Logout</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* LEFT COLUMN: BRANDING & CATEGORIES */}
        <div className="space-y-10">
          <section className="bg-white p-8 rounded-[3rem] border-2 border-slate-50 shadow-sm space-y-6">
            <h2 className="text-xl font-black border-b pb-4 italic text-slate-800 uppercase tracking-tighter">Branding & Payments</h2>
            <div className="space-y-4">
               <div className="space-y-1">
                 <p className="text-[10px] font-black uppercase text-slate-400 ml-2">Store Name</p>
                 <input type="text" value={settings.storeName} className="w-full p-4 bg-slate-50 border rounded-2xl font-bold" onChange={(e)=>updateSettings('storeName', e.target.value)} />
               </div>
               <div className="space-y-1">
                 <p className="text-[10px] font-black uppercase text-slate-400 ml-2">Theme Color</p>
                 <input type="color" value={settings.primaryColor} className="w-full h-14 cursor-pointer rounded-2xl border-none" onChange={(e)=>updateSettings('primaryColor', e.target.value)} />
               </div>
               <div className="grid grid-cols-2 gap-2 pt-4 border-t border-dashed">
                 <input type="text" value={settings.jazzCashNo} className="w-full p-4 bg-slate-50 border rounded-xl text-xs font-bold" placeholder="JazzCash" onChange={(e)=>updateSettings('jazzCashNo', e.target.value)} />
                 <input type="text" value={settings.easyPaisaNo} className="w-full p-4 bg-slate-50 border rounded-xl text-xs font-bold" placeholder="EasyPaisa" onChange={(e)=>updateSettings('easyPaisaNo', e.target.value)} />
               </div>
            </div>
          </section>

          <section className="bg-white p-8 rounded-[3rem] border-2 border-slate-50 shadow-sm space-y-6">
            <h2 className="text-xl font-black italic uppercase tracking-tighter">Categories</h2>
            <div className="flex space-x-2">
              <input type="text" value={newCatName} placeholder="New Category..." className="flex-1 p-4 bg-slate-50 border rounded-2xl text-sm font-bold" onChange={(e)=>setNewCatName(e.target.value)} />
              <button onClick={async () => { if(!newCatName) return; await addDoc(collection(db, "categories"), { name: newCatName }); setNewCatName("") }} className="bg-primary text-white px-6 rounded-2xl font-black shadow-lg shadow-primary/20">+</button>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              {categories.map(c => (
                <span key={c.id} className="bg-slate-900 text-white px-4 py-2 rounded-full text-[10px] font-black uppercase flex items-center shadow-md">
                  {c.name} <button onClick={()=>deleteDoc(doc(db,"categories",c.id))} className="ml-3 text-primary text-lg leading-none">×</button>
                </span>
              ))}
            </div>
          </section>
        </div>

        {/* MIDDLE COLUMN: ADD PRODUCT */}
        <section className="bg-slate-900 text-white p-8 md:p-10 rounded-[4rem] shadow-2xl border-b-8 border-primary relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-3xl font-black mb-8 text-primary italic border-b border-white/10 pb-4 uppercase tracking-tighter">
              {editId ? "Update Product" : "Publish Item"}
            </h2>
            <form onSubmit={handlePublish} className="space-y-4">
              <input type="text" placeholder="Product Name" value={pName} className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl outline-none focus:ring-1 ring-primary font-bold" onChange={(e)=>setPName(e.target.value)} />
              <div className="flex gap-4">
                <input type="number" placeholder="Price" value={pPrice} className="w-1/2 p-5 bg-white/5 border border-white/10 rounded-2xl outline-none" onChange={(e)=>setPPrice(e.target.value)} />
                <input type="number" placeholder="Stock" value={pStock} className="w-1/2 p-5 bg-white/5 border border-white/10 rounded-2xl outline-none" onChange={(e)=>setPStock(e.target.value)} />
              </div>
              <input type="text" placeholder="Image URL" value={pImg} className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl outline-none" onChange={(e)=>setPImg(e.target.value)} />
              <input type="text" placeholder="3D Model Path (/models/file.glb)" value={pModel} className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl outline-none text-xs italic" onChange={(e)=>setPModel(e.target.value)} />
              
              <select value={pCat} className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl outline-none font-bold text-slate-400" onChange={(e)=>setPCat(e.target.value)}>
                <option value="">Select Category</option>
                {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>

              <textarea placeholder="Description & Features..." value={pDesc} className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl outline-none h-32 text-sm" onChange={(e)=>setPDesc(e.target.value)} />

              <button className="w-full bg-primary p-6 rounded-3xl font-black uppercase text-xl shadow-2xl shadow-primary/30 active:scale-95 transition-all">
                {editId ? "Save Changes" : "Publish Now"}
              </button>
              {editId && <button onClick={()=>{setEditId(null); setPName(""); setPPrice(""); setPImg(""); setPCat(""); setPStock(""); setPDesc(""); setPModel("")}} className="w-full text-slate-500 font-bold uppercase text-[10px] mt-2">Cancel Edit</button>}
            </form>
          </div>
        </section>

        {/* RIGHT COLUMN: INVENTORY */}
        <section className="bg-white p-8 rounded-[3rem] border-2 border-slate-50 shadow-sm h-full overflow-hidden">
          <h2 className="text-xl font-black mb-8 italic border-b pb-4 uppercase tracking-tighter">Live Inventory ({products.length})</h2>
          <div className="space-y-4 overflow-y-auto max-h-[750px] pr-2 custom-scrollbar">
            {products.map(p => (
              <div key={p.id} className="p-4 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center justify-between hover:border-primary transition-colors">
                <div className="flex items-center space-x-4">
                  <img src={p.image} className="w-14 h-14 rounded-2xl object-cover shadow-lg" />
                  <div>
                    <p className="font-black text-sm uppercase italic leading-none">{p.name}</p>
                    <p className={`text-[10px] font-black mt-2 tracking-widest ${p.stock <= 0 ? 'text-red-500' : 'text-primary'}`}>
                      {p.category} | STOCK: {p.stock}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-1">
                  <button onClick={() => { setEditId(p.id); setPName(p.name); setPPrice(p.price); setPImg(p.image); setPCat(p.category); setPStock(p.stock); setPDesc(p.description || ""); setPModel(p.model3D || ""); }} className="p-2 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase">Edit</button>
                  <button onClick={()=>deleteDoc(doc(db,"products",p.id))} className="p-2 bg-red-50 text-red-500 rounded-xl text-[10px] font-black uppercase">Del</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* BOTTOM SECTION: ANALYTICS & ORDERS */}
        <div className="col-span-full grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-primary text-white p-10 rounded-[3.5rem] shadow-2xl relative overflow-hidden group">
            <div className="relative z-10"><p className="text-[10px] uppercase font-black opacity-70 tracking-widest">Total Revenue</p><h2 className="text-5xl font-black italic">Rs.{totalRevenue}</h2></div>
            <div className="absolute -right-5 -bottom-5 text-9xl font-black opacity-10 italic group-hover:rotate-6 transition">PKR</div>
          </div>
          <div className="bg-slate-900 text-white p-10 rounded-[3.5rem] shadow-2xl relative overflow-hidden group">
            <div className="relative z-10"><p className="text-[10px] uppercase font-black opacity-70 tracking-widest">Orders Count</p><h2 className="text-5xl font-black italic">{orders.length}</h2></div>
            <div className="absolute -right-5 -bottom-5 text-9xl font-black opacity-10 italic group-hover:-rotate-6 transition">📦</div>
          </div>
          <div className="bg-slate-50 border-2 border-slate-100 p-10 rounded-[3.5rem] shadow-sm relative overflow-hidden group">
            <div className="relative z-10"><p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Inventory Value</p><h2 className="text-5xl font-black italic text-slate-800">Rs.{inventoryValue}</h2></div>
            <div className="absolute -right-5 -bottom-5 text-9xl font-black opacity-5 italic group-hover:scale-110 transition">STOCK</div>
          </div>
        </div>

        {/* REVENUE BREAKDOWN CHART */}
        <section className="col-span-full bg-slate-900 text-white p-10 md:p-14 rounded-[4rem] shadow-2xl border-b-8 border-primary relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-3xl font-black uppercase italic mb-12 tracking-tighter text-primary">Revenue Breakdown</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
              {categorySales.map((cat, i) => (
                <div key={i} className="space-y-5">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">{cat.name}</p>
                      <p className="text-2xl font-black italic text-primary">Rs.{cat.total}</p>
                    </div>
                    <p className="text-xs font-black text-slate-600">{Math.round((cat.total / totalRevenue) * 100 || 0)}%</p>
                  </div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${(cat.total / maxSale) * 100}%` }} transition={{ duration: 1.5, ease: "easeOut" }} className="h-full bg-primary shadow-[0_0_20px_rgba(255,0,0,0.4)]" />
                  </div>
                </div>
              ))}
              {categories.length === 0 && <p className="col-span-full text-center text-slate-500 font-bold uppercase tracking-widest">Create categories to see breakdown</p>}
            </div>
          </div>
        </section>

        {/* ORDERS TABLE */}
        <section className="col-span-full bg-white p-8 md:p-12 rounded-[4rem] border-2 border-slate-50 shadow-sm overflow-hidden">
          <h2 className="text-2xl font-black mb-10 italic border-b pb-6 uppercase tracking-tighter">Business Orders Log</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-separate border-spacing-y-4">
              <thead>
                <tr className="text-slate-400 uppercase text-[10px] tracking-widest font-black">
                  <th className="px-6">Customer info</th><th className="px-6">Order details</th><th className="px-6">Trx ID</th><th className="px-6">Status</th><th className="px-6">Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id} className="bg-slate-50 hover:bg-slate-100/50 transition-all group">
                    <td className="px-6 py-6 rounded-l-[2rem] font-bold text-sm">{o.customerName}<br/><span className="text-[10px] font-normal text-slate-400 block max-w-[150px] truncate">{o.address}</span></td>
                    <td className="px-6 py-6 font-black italic uppercase text-slate-800 text-sm">{o.productName} <br/><span className="text-primary font-mono font-normal">Rs.{o.price}</span></td>
                    <td className="px-6 py-6 font-mono text-xs text-slate-500 font-black">{o.transactionId}</td>
                    <td className="px-6 py-6"><span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm ${o.status === 'Pending' ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'}`}>{o.status}</span></td>
                    <td className="px-6 py-6 rounded-r-[2rem] flex gap-2">
                      <button onClick={()=>updateDoc(doc(db,"orders",o.id), {status:"Shipped"})} className="bg-slate-900 text-white p-3 px-5 rounded-2xl text-[10px] font-black uppercase hover:scale-105 transition shadow-lg">Ship</button>
                      <button onClick={()=>{if(window.confirm("Del?")) deleteDoc(doc(db,"orders",o.id))}} className="bg-white text-red-500 p-3 px-5 rounded-2xl text-[10px] font-black uppercase border border-red-100 hover:bg-red-50 transition">Del</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {orders.length === 0 && <div className="text-center py-24 text-slate-300 font-black italic text-xl uppercase tracking-widest">No Sales Recorded Yet</div>}
          </div>
        </section>
      </div>
    </div>
  );
}