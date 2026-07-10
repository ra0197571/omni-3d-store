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

  // Product Form States
  const [pName, setPName] = useState("");
  const [pPrice, setPPrice] = useState("");
  const [pImg, setPImg] = useState("");
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "products"), (s) => {
      setProducts(s.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const updateSettings = async (field, value) => {
    await setDoc(doc(db, "settings", "storeConfig"), { ...settings, [field]: value }, { merge: true });
  };

  const handlePublish = async (e) => {
    e.preventDefault();
    if(!pName || !pPrice || !pImg) return alert("All fields are required!");

    if (editId) {
      await updateDoc(doc(db, "products", editId), { name: pName, price: pPrice, image: pImg });
      setEditId(null);
      alert("Product Updated!");
    } else {
      await addDoc(collection(db, "products"), { name: pName, price: pPrice, image: pImg, createdAt: new Date() });
      alert("Product Published!");
    }
    setPName(""); setPPrice(""); setPImg("");
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
        <h1 className="text-xl font-black italic uppercase tracking-widest">Control Center</h1>
        <button onClick={() => setIsAuth(false)} className="text-red-500 font-bold">Logout</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* SECTION 1: BRANDING */}
        <section className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-sm space-y-6">
          <h2 className="text-2xl font-bold border-b pb-2 italic text-slate-700">Branding & Payments</h2>
          <div className="space-y-4">
             <input type="text" value={settings.storeName} className="w-full p-4 border rounded-2xl" placeholder="Store Name" onChange={(e)=>updateSettings('storeName', e.target.value)} />
             <input type="color" value={settings.primaryColor} className="w-full h-14 cursor-pointer rounded-xl" onChange={(e)=>updateSettings('primaryColor', e.target.value)} />
             <input type="text" value={settings.whatsapp} className="w-full p-4 border rounded-2xl" placeholder="WhatsApp (923...)" onChange={(e)=>updateSettings('whatsapp', e.target.value)} />
             <input type="text" value={settings.jazzCashNo} className="w-full p-4 border rounded-2xl" placeholder="JazzCash Number" onChange={(e)=>updateSettings('jazzCashNo', e.target.value)} />
          </div>
        </section>

        {/* SECTION 2: ADD / EDIT PRODUCT */}
        <section className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-xl">
          <h2 className="text-2xl font-bold mb-6 text-primary italic border-b pb-2 uppercase">
            {editId ? "Update Product" : "Add New Product"}
          </h2>
          <form onSubmit={handlePublish} className="space-y-4">
            <input type="text" placeholder="Name" value={pName} className="w-full p-4 bg-slate-800 rounded-2xl border-none outline-none focus:ring-1 ring-primary" onChange={(e)=>setPName(e.target.value)} />
            <input type="number" placeholder="Price (Rs)" value={pPrice} className="w-full p-4 bg-slate-800 rounded-2xl border-none outline-none focus:ring-1 ring-primary" onChange={(e)=>setPPrice(e.target.value)} />
            <input type="text" placeholder="Image URL" value={pImg} className="w-full p-4 bg-slate-800 rounded-2xl border-none outline-none focus:ring-1 ring-primary" onChange={(e)=>setPImg(e.target.value)} />
            <button className="w-full bg-primary p-5 rounded-2xl font-bold uppercase tracking-widest text-lg shadow-lg">
              {editId ? "Save Changes" : "Publish Now"}
            </button>
            {editId && <button onClick={() => {setEditId(null); setPName(""); setPPrice(""); setPImg("")}} className="w-full text-slate-400 mt-2">Cancel Edit</button>}
          </form>
        </section>

        {/* SECTION 3: INVENTORY */}
        <section className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-sm overflow-hidden">
          <h2 className="text-2xl font-bold mb-6 italic border-b pb-2">Inventory ({products.length})</h2>
          <div className="space-y-4 overflow-y-auto max-h-[500px]">
            {products.map(p => (
              <div key={p.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border">
                <div className="flex items-center space-x-3">
                  <img src={p.image} className="w-12 h-12 rounded-xl object-cover" />
                  <div>
                    <p className="font-bold text-sm text-slate-800 leading-none">{p.name}</p>
                    <p className="text-xs text-primary font-bold mt-1">Rs. {p.price}</p>
                  </div>
                </div>
                <div className="flex space-x-1">
                  <button onClick={() => { setEditId(p.id); setPName(p.name); setPPrice(p.price); setPImg(p.image); window.scrollTo(0,0); }} className="p-2 text-blue-500 bg-blue-50 rounded-lg text-xs font-bold">Edit</button>
                  <button onClick={async () => await deleteDoc(doc(db, "products", p.id))} className="p-2 text-red-500 bg-red-50 rounded-lg text-xs font-bold">Delete</button>
                </div>
              </div>
            ))}
          </div>
          
        </section>
         {/* SECTION 4: DASHBOARD ANALYTICS & ORDERS */}
<div className="col-span-full grid grid-cols-1 md:grid-cols-4 gap-5">
  <div className="bg-primary text-white p-6 rounded-3xl shadow-xl">
    <p className="text-sm opacity-80 uppercase font-bold">Total Revenue</p>
    <h2 className="text-4xl font-black">Rs. {totalRevenue}</h2>
  </div>
  <div className="bg-slate-800 text-white p-6 rounded-3xl shadow-xl">
    <p className="text-sm opacity-80 uppercase font-bold">Total Orders</p>
    <h2 className="text-4xl font-black">{orders.length}</h2>
  </div>
</div>

<section className="col-span-full bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-sm mt-10">
  <h2 className="text-2xl font-bold mb-6 italic border-b pb-2">Recent Orders</h2>
  <div className="overflow-x-auto">
    <table className="w-full text-left">
      <thead>
        <tr className="text-slate-400 uppercase text-xs">
          <th className="p-4">Customer</th>
          <th className="p-4">Product</th>
          <th className="p-4">Price</th>
          <th className="p-4">Status</th>
          <th className="p-4">Action</th>
        </tr>
      </thead>
      <tbody>
        {orders.map(o => (
          <tr key={o.id} className="border-b border-slate-50 hover:bg-slate-50 transition">
            <td className="p-4 font-bold">{o.customerName} <br/><span className="text-[10px] font-normal text-slate-400">{o.address}</span></td>
            <td className="p-4">{o.productName}</td>
            <td className="p-4 font-black text-primary">Rs. {o.price}</td>
            <td className="p-4">
               <span className={`px-3 py-1 rounded-full text-xs font-bold ${o.status === 'Pending' ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'}`}>
                {o.status}
               </span>
            </td>
            <td className="p-4">
              <button 
                onClick={async () => await updateDoc(doc(db, "orders", o.id), { status: "Shipped" })}
                className="text-xs bg-slate-900 text-white px-3 py-1 rounded-lg"
              >
                Mark Shipped
              </button>
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