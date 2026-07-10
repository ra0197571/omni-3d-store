import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { db } from '../services/firebase';
import { doc, setDoc, addDoc, collection, deleteDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion'; // Ensure motion is imported

export default function AdminDashboard() {
  const { settings } = useContext(AppContext);
  const [isAuth, setIsAuth] = useState(false);
  const [pass, setPass] = useState("");
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]); 
  const [categories, setCategories] = useState([]);

  // Form States
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

  // --- ANALYTICS CALCULATIONS (Safe Order) ---
  const totalRevenue = orders.reduce((acc, curr) => acc + Number(curr.price || 0), 0);

  const categorySales = categories.map(cat => {
    const total = orders
      .filter(o => {
        const prod = products.find(p => p.name === o.productName);
        return prod && prod.category === cat.name;
      })
      .reduce((acc, curr) => acc + Number(curr.price || 0), 0);
    return { name: cat.name, total };
  });

  const maxSale = Math.max(...categorySales.map(s => s.total), 1);

  const updateSettings = async (field, value) => {
    await setDoc(doc(db, "settings", "storeConfig"), { ...settings, [field]: value }, { merge: true });
  };

  const handlePublish = async (e) => {
    e.preventDefault();
    if(!pName || !pPrice || !pImg || !pCat || !pStock) return alert("Fill all required fields!");
    const productData = { 
        name: pName, price: pPrice, image: pImg, category: pCat, 
        stock: Number(pStock), description: pDesc, model3D: pModel 
    };
    if (editId) {
      await updateDoc(doc(db, "products", editId), productData);
      setEditId(null);
    } else {
      await addDoc(collection(db, "products"), { ...productData, createdAt: new Date() });
    }
    setPName(""); setPPrice(""); setPImg(""); setPCat(""); setPStock(""); setPDesc(""); setPModel("");
  };

  if (!isAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 p-5">
        <div className="bg-white p-10 rounded-[3rem] shadow-2xl text-center max-w-sm w-full">
          <h2 className="text-3xl font-black mb-6 uppercase italic">Admin Access</h2>
          <input type="password" placeholder="Password" className="w-full p-4 bg-slate-100 rounded-2xl mb-4 text-center outline-none focus:ring-2 ring-primary" onChange={(e) => setPass(e.target.value)} />
          <button onClick={() => pass === "admin" ? setIsAuth(true) : alert("Wrong Password!")} className="w-full bg-primary text-white p-4 rounded-2xl font-bold uppercase">Login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 md:p-10 max-w-7xl mx-auto flex flex-col gap-10 bg-white min-h-screen">
      <div className="flex justify-between items-center bg-slate-50 p-6 rounded-3xl border border-slate-100">
        <Link to="/" className="text-primary font-bold">← Storefront</Link>
        <h1 className="text-xl font-black italic uppercase tracking-widest leading-none">Control Center</h1>
        <button onClick={() => setIsAuth(false)} className="text-red-500 font-bold">Logout</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="space-y-8">
          <section className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-sm space-y-6">
            <h2 className="text-2xl font-bold border-b pb-2 italic text-slate-700 uppercase">Branding</h2>
            <div className="space-y-4">
               <input type="text" value={settings.storeName} className="w-full p-4 border rounded-2xl" placeholder="Store Name" onChange={(e)=>updateSettings('storeName', e.target.value)} />
               <input type="color" value={settings.primaryColor} className="w-full h-14 cursor-pointer rounded-xl border-none" onChange={(e)=>updateSettings('primaryColor', e.target.value)} />
               <input type="text" value={settings.whatsapp} className="w-full p-4 border rounded-2xl" placeholder="WhatsApp Number" onChange={(e)=>updateSettings('whatsapp', e.target.value)} />
               <div className="flex gap-2">
                 <input type="text" value={settings.jazzCashNo} className="w-1/2 p-4 border rounded-2xl" placeholder="JazzCash" onChange={(e)=>updateSettings('jazzCashNo', e.target.value)} />
                 <input type="text" value={settings.easyPaisaNo} className="w-1/2 p-4 border rounded-2xl" placeholder="EasyPaisa" onChange={(e)=>updateSettings('easyPaisaNo', e.target.value)} />
               </div>
            </div>
          </section>

          <section className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-sm space-y-4">
            <h2 className="text-xl font-bold italic uppercase">Categories</h2>
            <div className="flex space-x-2">
              <input type="text" value={newCatName} placeholder="New" className="flex-1 p-3 border rounded-xl" onChange={(e)=>setNewCatName(e.target.value)} />
              <button onClick={async () => { if(!newCatName) return; await addDoc(collection(db, "categories"), { name: newCatName }); setNewCatName("") }} className="bg-primary text-white px-4 rounded-xl font-bold">+</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map(c => (
                <span key={c.id} className="bg-slate-100 px-3 py-1 rounded-full text-[10px] font-black uppercase flex items-center">{c.name} <button onClick={()=>deleteDoc(doc(db,"categories",c.id))} className="ml-2 text-red-500">×</button></span>
              ))}
            </div>
          </section>
        </div>

        <section className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-xl">
          <h2 className="text-2xl font-bold mb-6 text-primary italic border-b pb-2 uppercase tracking-tighter">{editId ? "Update Item" : "Add Product"}</h2>
          <form onSubmit={handlePublish} className="space-y-4">
            <input type="text" placeholder="Name" value={pName} className="w-full p-4 bg-slate-800 rounded-2xl outline-none" onChange={(e)=>setPName(e.target.value)} />
            <div className="flex gap-2">
              <input type="number" placeholder="Price" value={pPrice} className="w-1/2 p-4 bg-slate-800 rounded-2xl outline-none" onChange={(e)=>setPPrice(e.target.value)} />
              <input type="number" placeholder="Stock" value={pStock} className="w-1/2 p-4 bg-slate-800 rounded-2xl outline-none border border-primary/30" onChange={(e)=>setPStock(e.target.value)} />
            </div>
            <input type="text" placeholder="Image URL" value={pImg} className="w-full p-4 bg-slate-800 rounded-2xl outline-none" onChange={(e)=>setPImg(e.target.value)} />
            <input type="text" placeholder="3D Model Path" value={pModel} className="w-full p-4 bg-slate-800 rounded-2xl outline-none border border-dashed border-primary/40 text-xs" onChange={(e)=>setPModel(e.target.value)} />
            <select value={pCat} className="w-full p-4 bg-slate-800 rounded-2xl outline-none text-slate-400" onChange={(e)=>setPCat(e.target.value)}>
              <option value="">Select Category</option>
              {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
            <textarea placeholder="Description..." value={pDesc} className="w-full p-4 bg-slate-800 rounded-2xl outline-none h-24 text-sm" onChange={(e)=>setPDesc(e.target.value)} />
            <button className="w-full bg-primary p-5 rounded-2xl font-bold uppercase shadow-lg shadow-primary/20">{editId ? "Save Changes" : "Publish"}</button>
          </form>
        </section>

        <section className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-sm h-full overflow-hidden">
          <h2 className="text-2xl font-bold mb-6 italic border-b pb-2 uppercase tracking-widest">Inventory</h2>
          <div className="space-y-4 overflow-y-auto max-h-[600px] pr-2">
            {products.map(p => (
              <div key={p.id} className="p-3 bg-slate-50 rounded-2xl border flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <img src={p.image} className="w-12 h-12 rounded-xl object-cover" />
                  <div><p className="font-bold text-sm leading-none">{p.name}</p><p className={`text-[9px] font-black mt-1 uppercase ${p.stock <= 0 ? 'text-red-500' : 'text-primary'}`}>{p.category} | Stock: {p.stock}</p></div>
                </div>
                <div className="flex space-x-1">
                  <button onClick={() => { setEditId(p.id); setPName(p.name); setPPrice(p.price); setPImg(p.image); setPCat(p.category); setPStock(p.stock); setPDesc(p.description || ""); setPModel(p.model3D || ""); }} className="p-2 text-blue-500 bg-blue-50 rounded-lg text-[9px] font-black">Edit</button>
                  <button onClick={()=>deleteDoc(doc(db,"products",p.id))} className="p-2 text-red-500 bg-red-50 rounded-lg text-[9px] font-black">Del</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ANALYTICS CARDS */}
        <div className="col-span-full grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-primary text-white p-8 rounded-[3rem] shadow-xl flex justify-between items-center">
            <div><p className="text-xs uppercase font-black opacity-70">Revenue</p><h2 className="text-5xl font-black italic">Rs.{totalRevenue}</h2></div>
            <div className="text-7xl opacity-10 font-black">PKR</div>
          </div>
          <div className="bg-slate-900 text-white p-8 rounded-[3rem] shadow-xl flex justify-between items-center">
            <div><p className="text-xs uppercase font-black opacity-70">Orders</p><h2 className="text-5xl font-black italic">{orders.length}</h2></div>
            <div className="text-7xl opacity-10 font-black">📦</div>
          </div>
        </div>

        {/* --- VISUAL BREAKDOWN --- */}
        <section className="col-span-full bg-slate-900 text-white p-8 md:p-12 rounded-[3rem] shadow-2xl border-b-8 border-primary relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-2xl font-black uppercase italic mb-10 tracking-tighter text-primary font-mono tracking-tighter">Category Revenue</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {categorySales.map((cat, i) => (
                <div key={i} className="space-y-4">
                  <div className="flex justify-between items-end">
                    <div><p className="text-[10px] font-black uppercase text-slate-500">{cat.name}</p><p className="text-xl font-bold font-mono text-primary">Rs.{cat.total}</p></div>
                    <p className="text-[10px] font-bold text-slate-600">{Math.round((cat.total / totalRevenue) * 100 || 0)}%</p>
                  </div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${(cat.total / maxSale) * 100}%` }} transition={{ duration: 1 }} className="h-full bg-primary" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ORDERS TABLE */}
        <section className="col-span-full bg-white p-8 rounded-[3rem] border-2 border-slate-100 shadow-sm overflow-hidden">
          <h2 className="text-2xl font-black mb-6 italic border-b pb-2 uppercase tracking-tighter">Recent Business Orders</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-400 uppercase text-[10px] tracking-widest font-black bg-slate-50">
                  <th className="p-5">Customer</th><th className="p-5">Product</th><th className="p-5">Trx ID</th><th className="p-5">Status</th><th className="p-5">Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition text-sm">
                    <td className="p-5 font-bold">{o.customerName}<br/><span className="text-[10px] font-normal text-slate-400">{o.address}</span></td>
                    <td className="p-5 font-black italic uppercase text-slate-700">{o.productName} <br/><span className="text-primary font-mono font-normal">Rs.{o.price}</span></td>
                    <td className="p-5 font-mono text-xs text-slate-500 font-bold">{o.transactionId}</td>
                    <td className="p-5"><span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase ${o.status === 'Pending' ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'}`}>{o.status}</span></td>
                    <td className="p-5 flex gap-2">
                      <button onClick={()=>updateDoc(doc(db,"orders",o.id), {status:"Shipped"})} className="bg-slate-900 text-white p-2 px-4 rounded-xl text-[10px] font-black uppercase">Ship</button>
                      <button onClick={()=>{if(window.confirm("Del?")) deleteDoc(doc(db,"orders",o.id))}} className="text-red-500 p-2 px-4 rounded-xl text-[10px] font-black uppercase border border-red-100">Del</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}