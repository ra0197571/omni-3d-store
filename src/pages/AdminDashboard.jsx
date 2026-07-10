import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { db } from '../services/firebase';
import { doc, setDoc, addDoc, collection, deleteDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { Link } from 'react-router-dom';

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
  const [pStock, setPStock] = useState(""); // Stock State
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

  const totalRevenue = orders.reduce((acc, curr) => acc + Number(curr.price || 0), 0);

  const updateSettings = async (field, value) => {
    await setDoc(doc(db, "settings", "storeConfig"), { ...settings, [field]: value }, { merge: true });
  };

  const handlePublish = async (e) => {
    e.preventDefault();
    if(!pName || !pPrice || !pImg || !pCat || !pStock) return alert("All fields including Stock & Category are required!");

    const productData = { name: pName, price: pPrice, image: pImg, category: pCat, stock: Number(pStock) };

    if (editId) {
      await updateDoc(doc(db, "products", editId), productData);
      setEditId(null);
    } else {
      await addDoc(collection(db, "products"), { ...productData, createdAt: new Date() });
    }
    setPName(""); setPPrice(""); setPImg(""); setPCat(""); setPStock("");
  };

  if (!isAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 p-5">
        <div className="bg-white p-10 rounded-[3rem] shadow-2xl text-center max-w-sm w-full">
          <h2 className="text-3xl font-black mb-6 uppercase italic">Admin Access</h2>
          <input type="password" placeholder="Password" className="w-full p-4 bg-slate-100 rounded-2xl mb-4 text-center outline-none focus:ring-2 ring-primary" onChange={(e) => setPass(e.target.value)} />
          <button onClick={() => pass === "admin" ? setIsAuth(true) : alert("Wrong Password!")} className="w-full bg-primary text-white p-4 rounded-2xl font-bold uppercase shadow-lg">Login</button>
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
        
        {/* SECTION 1: BRANDING & CATEGORIES */}
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
              <input type="text" value={newCatName} placeholder="New Cat" className="flex-1 p-3 border rounded-xl" onChange={(e)=>setNewCatName(e.target.value)} />
              <button onClick={async () => { if(!newCatName) return; await addDoc(collection(db, "categories"), { name: newCatName }); setNewCatName("") }} className="bg-primary text-white px-4 rounded-xl font-bold">+</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map(c => (
                <span key={c.id} className="bg-slate-100 px-3 py-1 rounded-full text-[10px] font-black uppercase flex items-center">
                  {c.name} <button onClick={()=>deleteDoc(doc(db,"categories",c.id))} className="ml-2 text-red-500">×</button>
                </span>
              ))}
            </div>
          </section>
        </div>

        {/* SECTION 2: ADD PRODUCT WITH STOCK */}
        <section className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-xl">
          <h2 className="text-2xl font-bold mb-6 text-primary italic border-b pb-2 uppercase">
            {editId ? "Update Product" : "Add Product"}
          </h2>
          <form onSubmit={handlePublish} className="space-y-4">
            <input type="text" placeholder="Name" value={pName} className="w-full p-4 bg-slate-800 rounded-2xl outline-none" onChange={(e)=>setPName(e.target.value)} />
            <div className="flex gap-2">
              <input type="number" placeholder="Price" value={pPrice} className="w-1/2 p-4 bg-slate-800 rounded-2xl outline-none" onChange={(e)=>setPPrice(e.target.value)} />
              <input type="number" placeholder="Stock" value={pStock} className="w-1/2 p-4 bg-slate-800 rounded-2xl outline-none focus:ring-1 ring-primary" onChange={(e)=>setPStock(e.target.value)} />
            </div>
            <input type="text" placeholder="Image URL" value={pImg} className="w-full p-4 bg-slate-800 rounded-2xl outline-none" onChange={(e)=>setPImg(e.target.value)} />
            <select value={pCat} className="w-full p-4 bg-slate-800 rounded-2xl outline-none text-slate-400" onChange={(e)=>setPCat(e.target.value)}>
              <option value="">Select Category</option>
              {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
            <button className="w-full bg-primary p-5 rounded-2xl font-bold uppercase text-lg">
              {editId ? "Save Changes" : "Publish"}
            </button>
          </form>
        </section>

        {/* SECTION 3: INVENTORY WITH STOCK STATUS */}
        <section className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-sm h-full">
          <h2 className="text-2xl font-bold mb-6 italic border-b pb-2 uppercase">Inventory</h2>
          <div className="space-y-4 overflow-y-auto max-h-[600px] pr-2">
            {products.map(p => (
              <div key={p.id} className="p-3 bg-slate-50 rounded-2xl border flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <img src={p.image} className="w-12 h-12 rounded-xl object-cover" />
                  <div>
                    <p className="font-bold text-sm leading-none">{p.name}</p>
                    <p className={`text-[10px] font-black mt-1 ${p.stock <= 0 ? 'text-red-500' : 'text-primary'}`}>
                      STOCK: {p.stock}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-1">
                  <button onClick={() => { setEditId(p.id); setPName(p.name); setPPrice(p.price); setPImg(p.image); setPCat(p.category); setPStock(p.stock); }} className="p-2 text-blue-500 bg-blue-50 rounded-lg text-[10px] font-bold">Edit</button>
                  <button onClick={()=>deleteDoc(doc(db,"products",p.id))} className="p-2 text-red-500 bg-red-50 rounded-lg text-[10px] font-bold">Del</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ANALYTICS */}
        <div className="col-span-full grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-primary text-white p-8 rounded-[2.5rem] shadow-xl flex justify-between items-center">
            <div><p className="text-xs uppercase font-bold opacity-70">Revenue</p><h2 className="text-4xl font-black">Rs.{totalRevenue}</h2></div>
            <div className="text-5xl opacity-20 font-black">PKR</div>
          </div>
          <div className="bg-slate-800 text-white p-8 rounded-[2.5rem] shadow-xl flex justify-between items-center">
            <div><p className="text-xs uppercase font-bold opacity-70">Total Orders</p><h2 className="text-4xl font-black">{orders.length}</h2></div>
            <div className="text-5xl opacity-20 font-black">📦</div>
          </div>
        </div>

        {/* ORDERS TABLE */}
        <section className="col-span-full bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-sm overflow-hidden">
          <h2 className="text-2xl font-bold mb-6 italic border-b pb-2 uppercase tracking-widest">Recent Orders</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-400 uppercase text-[10px] tracking-widest font-black">
                  <th className="p-4">Customer</th><th className="p-4">Product</th><th className="p-4">Trx ID</th><th className="p-4">Status</th><th className="p-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id} className="border-b border-slate-50">
                    <td className="p-4 font-bold text-sm">{o.customerName}<br/><span className="text-[10px] font-normal text-slate-400 truncate block w-32">{o.address}</span></td>
                    <td className="p-4 text-sm font-medium">{o.productName}</td>
                    <td className="p-4 font-mono text-xs text-primary font-bold">{o.transactionId}</td>
                    <td className="p-4"><span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${o.status === 'Pending' ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'}`}>{o.status}</span></td>
                    <td className="p-4 flex gap-2">
                      <button onClick={()=>updateDoc(doc(db,"orders",o.id), {status:"Shipped"})} className="bg-slate-900 text-white p-2 rounded-lg text-[10px] font-bold">Ship</button>
                      <button onClick={()=>{if(window.confirm("Delete?")) deleteDoc(doc(db,"orders",o.id))}} className="bg-red-500 text-white p-2 rounded-lg text-[10px] font-bold">Delete</button>
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