import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { db } from '../services/firebase';
import { doc, setDoc, addDoc, collection, deleteDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
// Professional PDF Libraries
import { jsPDF } from "jspdf";
import "jspdf-autotable";

export default function AdminDashboard() {
  const { settings } = useContext(AppContext);
  const [isAuth, setIsAuth] = useState(false);
  const [pass, setPass] = useState("");
  
  // Data States
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]); 
  const [categories, setCategories] = useState([]);

  // Product Form States (100% Logic)
  const [pName, setPName] = useState("");
  const [pPrice, setPPrice] = useState("");
  const [pImg, setPImg] = useState("");
  const [pCat, setPCat] = useState("");
  const [pStock, setPStock] = useState(""); 
  const [pDesc, setPDesc] = useState(""); 
  const [pModel, setPModel] = useState(""); 
  const [newCatName, setNewCatName] = useState("");
  const [editId, setEditId] = useState(null);

  // --- Real-time Listeners (Section 6 & 16) ---
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

  // --- 📊 POWERFUL ANALYTICS LOGIC (Section 17) ---
  const totalRevenue = orders.reduce((acc, curr) => acc + Number(curr.price || 0), 0);
  const inventoryValue = products.reduce((acc, p) => acc + (Number(p.price) * Number(p.stock || 0)), 0);

  const categorySales = categories.map(cat => {
    const total = orders.reduce((acc, o) => {
        // Robust matching: checks name or saved category
        const prod = products.find(p => p.name === o.productName);
        if (prod && prod.category === cat.name) return acc + Number(o.price || 0);
        return acc;
    }, 0);
    return { name: cat.name, total };
  });
  const maxSale = Math.max(...categorySales.map(s => s.total), 1);

  // --- 📄 PDF INVOICE GENERATOR (Section 22) ---
  const generateInvoice = (order) => {
    const doc = new jsPDF();
    doc.setFontSize(22); doc.setTextColor(settings.primaryColor || "#ff0000");
    doc.text(settings.storeName?.toUpperCase(), 20, 20);
    doc.setFontSize(10); doc.setTextColor(100);
    doc.text("Official Business Invoice", 20, 28);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 150, 28);
    doc.autoTable({
      startY: 40,
      head: [['Order Status', 'Client Details']],
      body: [[`Status: ${order.status}`, `Name: ${order.customerName}\nAddr: ${order.address}`]],
      theme: 'grid',
    });
    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 10,
      head: [['Product', 'Trx ID', 'Price']],
      body: [[order.productName, order.transactionId, `Rs.${order.price}`]],
      headStyles: { fillColor: settings.primaryColor || "#ff0000" },
    });
    doc.setFontSize(14); doc.text(`TOTAL: Rs.${order.price}`, 145, doc.lastAutoTable.finalY + 20);
    doc.save(`Invoice_${order.customerName}.pdf`);
  };

  // --- DATABASE ACTIONS ---
  const updateSettings = async (field, value) => {
    await setDoc(doc(db, "settings", "storeConfig"), { ...settings, [field]: value }, { merge: true });
  };

  const handlePublish = async (e) => {
    e.preventDefault();
    if(!pName || !pPrice || !pImg || !pCat || !pStock) return alert("Fill all fields!");
    const data = { name: pName, price: pPrice, image: pImg, category: pCat, stock: Number(pStock), description: pDesc, model3D: pModel };
    
    if (editId) { 
        await updateDoc(doc(db, "products", editId), data); 
        setEditId(null); 
        alert("Updated!");
    } else { 
        await addDoc(collection(db, "products"), { ...data, createdAt: new Date() }); 
        alert("Published!");
    }
    // Reset Form (No logic missed)
    setPName(""); setPPrice(""); setPImg(""); setPCat(""); setPStock(""); setPDesc(""); setPModel("");
  };

  // --- LOGIN UI (Section 18) ---
  if (!isAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 p-5 font-sans">
        <motion.div initial={{y:20, opacity:0}} animate={{y:0, opacity:1}} className="bg-white p-10 rounded-[3rem] shadow-2xl text-center max-w-sm w-full">
          <h2 className="text-3xl font-black mb-6 uppercase italic text-slate-800 tracking-tighter">Admin Access</h2>
          <input type="password" placeholder="Dashboard Password" className="w-full p-5 bg-slate-100 rounded-2xl mb-4 text-center font-bold outline-none focus:ring-4 ring-primary/20 transition-all" onChange={(e) => setPass(e.target.value)} />
          <button onClick={() => pass === "admin" ? setIsAuth(true) : alert("Invalid Password!")} className="w-full bg-primary text-white p-5 rounded-2xl font-black uppercase shadow-xl hover:shadow-primary/40 active:scale-95 transition-all">Enter Control Center</button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-10 max-w-[1600px] mx-auto flex flex-col gap-10 bg-white min-h-screen font-sans">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-slate-900 text-white p-6 md:p-10 rounded-[3rem] shadow-2xl gap-4 border-b-8 border-primary">
        <Link to="/" className="text-primary font-black uppercase italic tracking-widest text-xs hover:text-white transition-all">← Back to Storefront</Link>
        <h1 className="text-2xl md:text-4xl font-black italic uppercase tracking-tighter">OMNI-3D <span className="text-primary">CONTROL</span></h1>
        <button onClick={() => setIsAuth(false)} className="bg-red-500/10 text-red-500 px-6 py-2 rounded-full font-black uppercase text-[10px] tracking-widest border border-red-500/20 hover:bg-red-500 hover:text-white transition-all">Logout</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* COLUMN 1: DYNAMIC BRANDING & CONTACT (Section 7) */}
        <div className="space-y-10">
          <section className="bg-white p-6 md:p-8 rounded-[3rem] border-2 border-slate-50 shadow-sm space-y-6">
            <h2 className="text-xl font-black italic text-slate-800 uppercase border-b pb-4 tracking-tighter">Store Identity</h2>
            <div className="space-y-4">
               <div><p className="text-[10px] font-black uppercase text-slate-400 mb-1 ml-2">Store Name</p>
               <input type="text" value={settings.storeName} className="w-full p-4 bg-slate-50 border rounded-2xl font-bold outline-none focus:border-primary" onChange={(e)=>updateSettings('storeName', e.target.value)} /></div>
               
               <div><p className="text-[10px] font-black uppercase text-slate-400 mb-1 ml-2">Business Email</p>
               <input type="email" value={settings.email} placeholder="your@email.com" className="w-full p-4 bg-slate-50 border rounded-2xl font-bold outline-none focus:border-primary" onChange={(e)=>updateSettings('email', e.target.value)} /></div>
               
               <div><p className="text-[10px] font-black uppercase text-slate-400 mb-1 ml-2">Store Location</p>
               <input type="text" value={settings.address} placeholder="City, Country" className="w-full p-4 bg-slate-50 border rounded-2xl font-bold outline-none focus:border-primary" onChange={(e)=>updateSettings('address', e.target.value)} /></div>

               <div className="grid grid-cols-2 gap-2 border-t pt-4 border-dashed mt-4">
                 <div className="space-y-1"><p className="text-[9px] font-bold text-slate-400 ml-1">WHATSAPP</p><input type="text" value={settings.whatsapp} className="w-full p-4 bg-slate-50 border rounded-xl text-xs font-bold" onChange={(e)=>updateSettings('whatsapp', e.target.value)} /></div>
                 <div className="space-y-1"><p className="text-[9px] font-bold text-slate-400 ml-1">THEME COLOR</p><input type="color" value={settings.primaryColor} className="w-full h-12 cursor-pointer rounded-xl border-none" onChange={(e)=>updateSettings('primaryColor', e.target.value)} /></div>
               </div>
            </div>
          </section>

          <section className="bg-white p-6 md:p-8 rounded-[3rem] border-2 border-slate-50 shadow-sm space-y-4">
            <h2 className="text-xl font-black italic uppercase">Payments (Manual)</h2>
            <input type="text" value={settings.jazzCashNo} className="w-full p-4 bg-slate-50 border rounded-xl font-bold text-sm" placeholder="JazzCash Number" onChange={(e)=>updateSettings('jazzCashNo', e.target.value)} />
            <input type="text" value={settings.easyPaisaNo} className="w-full p-4 bg-slate-50 border rounded-xl font-bold text-sm" placeholder="EasyPaisa Number" onChange={(e)=>updateSettings('easyPaisaNo', e.target.value)} />
          </section>

          <section className="bg-white p-8 rounded-[3rem] border-2 border-slate-50 shadow-sm space-y-6">
            <h2 className="text-xl font-black italic uppercase">Categories</h2>
            <div className="flex space-x-2">
              <input type="text" value={newCatName} placeholder="New..." className="flex-1 p-4 bg-slate-50 border rounded-2xl text-sm font-bold" onChange={(e)=>setNewCatName(e.target.value)} />
              <button onClick={async () => { if(!newCatName) return; await addDoc(collection(db, "categories"), { name: newCatName }); setNewCatName("") }} className="bg-primary text-white px-6 rounded-2xl font-black shadow-lg shadow-primary/20 transition-all">+</button>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              {categories.map(c => (
                <span key={c.id} className="bg-slate-900 text-white px-4 py-2 rounded-full text-[10px] font-black uppercase flex items-center shadow-md">
                  {c.name} <button onClick={()=>deleteDoc(doc(db,"categories",c.id))} className="ml-3 text-primary font-bold text-lg leading-none">×</button>
                </span>
              ))}
            </div>
          </section>
        </div>

        {/* COLUMN 2: PUBLISH ITEM (Section 5 & 9) */}
        <section className="bg-slate-900 text-white p-8 md:p-10 rounded-[4rem] shadow-2xl border-b-8 border-primary relative overflow-hidden">
            <h2 className="text-3xl font-black mb-8 text-primary italic border-b border-white/10 pb-4 uppercase tracking-tighter">{editId ? "Update Item" : "Publish Item"}</h2>
            <form onSubmit={handlePublish} className="space-y-4 text-slate-800">
              <input type="text" placeholder="Product Name" value={pName} className="w-full p-5 bg-white border-none rounded-2xl font-bold focus:ring-4 ring-primary/20 outline-none transition-all" onChange={(e)=>setPName(e.target.value)} />
              <div className="flex gap-4">
                <div className="w-1/2"><p className="text-[10px] text-white/40 mb-1 font-black ml-2 uppercase">Price (PKR)</p>
                <input type="number" placeholder="0.00" value={pPrice} className="w-full p-5 bg-white border-none rounded-2xl font-bold outline-none" onChange={(e)=>setPPrice(e.target.value)} /></div>
                <div className="w-1/2"><p className="text-[10px] text-white/40 mb-1 font-black ml-2 uppercase">Stock Qty</p>
                <input type="number" placeholder="0" value={pStock} className="w-full p-5 bg-white border-none rounded-2xl font-bold outline-none" onChange={(e)=>setPStock(e.target.value)} /></div>
              </div>
              <input type="text" placeholder="Main Image URL" value={pImg} className="w-full p-5 bg-white border-none rounded-2xl font-bold text-sm" onChange={(e)=>setPImg(e.target.value)} />
              <input type="text" placeholder="3D Path (e.g. /models/shoe.glb)" value={pModel} className="w-full p-5 bg-white/10 text-white border-none rounded-2xl text-xs italic" onChange={(e)=>setPModel(e.target.value)} />
              <select value={pCat} className="w-full p-5 bg-white border-none rounded-2xl font-bold text-slate-400" onChange={(e)=>setPCat(e.target.value)}>
                <option value="">Choose Category</option>
                {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
              <textarea placeholder="Product Description & Tafseel..." value={pDesc} className="w-full p-5 bg-white border-none rounded-2xl h-36 text-sm font-medium resize-none" onChange={(e)=>setPDesc(e.target.value)} />
              <button className="w-full bg-primary text-white p-6 rounded-3xl font-black uppercase text-xl shadow-xl active:scale-95 transition-all mt-4">Confirm & Publish</button>
              {editId && <button onClick={()=>{setEditId(null); setPName(""); setPPrice(""); setPImg(""); setPCat(""); setPStock(""); setPDesc(""); setPModel("")}} className="w-full text-slate-500 font-bold uppercase text-[10px] mt-2 tracking-widest">Cancel Editing</button>}
            </form>
        </section>

        {/* COLUMN 3: INVENTORY LIST (Section 13) */}
        <section className="bg-white p-8 rounded-[3rem] border-2 border-slate-50 shadow-sm h-full overflow-hidden">
          <h2 className="text-xl font-black mb-8 italic border-b pb-4 uppercase tracking-tighter">Warehouse ({products.length})</h2>
          <div className="space-y-4 overflow-y-auto max-h-[750px] pr-2 custom-scrollbar">
            {products.map(p => (
              <div key={p.id} className="p-4 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center justify-between hover:border-primary transition-all group">
                <div className="flex items-center space-x-4">
                  <img src={p.image} className="w-14 h-14 rounded-2xl object-cover shadow-lg border-2 border-white group-hover:scale-110 transition" />
                  <div>
                    <p className="font-black text-sm uppercase italic leading-none">{p.name}</p>
                    <p className={`text-[9px] font-black mt-2 tracking-widest ${p.stock <= 3 ? 'text-red-500 underline' : 'text-primary'}`}>STOCK: {p.stock}</p>
                  </div>
                </div>
                <div className="flex space-x-1">
                  <button onClick={() => { setEditId(p.id); setPName(p.name); setPPrice(p.price); setPImg(p.image); setPCat(p.category); setPStock(p.stock); setPDesc(p.description || ""); setPModel(p.model3D || ""); window.scrollTo(0,0); }} className="p-2 bg-blue-50 text-blue-600 rounded-xl text-[9px] font-black hover:bg-blue-600 hover:text-white transition">EDIT</button>
                  <button onClick={()=> { if(window.confirm("Delete Product?")) deleteDoc(doc(db,"products",p.id)) }} className="p-2 bg-red-50 text-red-500 rounded-xl text-[9px] font-black hover:bg-red-600 hover:text-white transition">DEL</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ANALYTICS SCORECARDS (Section 16) */}
        <div className="col-span-full grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-primary text-white p-10 rounded-[3.5rem] shadow-2xl relative overflow-hidden group border-b-8 border-black/20">
            <div className="relative z-10"><p className="text-[10px] uppercase font-black opacity-70 tracking-widest">Gross Revenue</p><h2 className="text-5xl font-black italic">Rs.{totalRevenue}</h2></div>
            <div className="absolute -right-5 -bottom-5 text-9xl font-black opacity-10 italic">PKR</div>
          </div>
          <div className="bg-slate-900 text-white p-10 rounded-[3.5rem] shadow-2xl relative overflow-hidden group border-b-8 border-primary/50">
            <div className="relative z-10"><p className="text-[10px] uppercase font-black opacity-70 tracking-widest">Order Success</p><h2 className="text-5xl font-black italic">{orders.length}</h2></div>
            <div className="absolute -right-5 -bottom-5 text-9xl font-black opacity-10 italic">📦</div>
          </div>
          <div className="bg-slate-50 border-2 border-slate-100 p-10 rounded-[3.5rem] shadow-sm relative overflow-hidden group border-b-8 border-slate-200">
            <div className="relative z-10"><p className="text-[10px] uppercase font-black text-slate-400">Inventory Worth</p><h2 className="text-5xl font-black italic text-slate-800 font-mono">Rs.{inventoryValue}</h2></div>
            <div className="absolute -right-5 -bottom-5 text-9xl font-black opacity-5 italic">STOCK</div>
          </div>
        </div>

        {/* CHART SECTION (Section 17) */}
        <section className="col-span-full bg-slate-900 text-white p-10 md:p-14 rounded-[4rem] shadow-2xl border-b-8 border-primary relative overflow-hidden">
            <h2 className="text-3xl font-black uppercase italic mb-12 tracking-tighter text-primary">Department Performance</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
              {categorySales.map((cat, i) => (
                <div key={i} className="space-y-5">
                  <div className="flex justify-between items-end">
                    <div><p className="text-[10px] font-black uppercase text-slate-500 mb-1">{cat.name}</p><p className="text-2xl font-black italic text-primary font-mono leading-none">Rs.{cat.total}</p></div>
                    <p className="text-xs font-black text-slate-600">{Math.round((cat.total / totalRevenue) * 100 || 0)}%</p>
                  </div>
                  <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 shadow-inner">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${(cat.total / maxSale) * 100}%` }} transition={{ duration: 1.5, ease: "easeOut" }} className="h-full bg-primary shadow-[0_0_25px_rgba(255,0,0,0.6)]" />
                  </div>
                </div>
              ))}
              {categories.length === 0 && <p className="col-span-full text-center text-slate-500 font-bold uppercase py-10 tracking-[0.5em]">Awaiting Category Data...</p>}
            </div>
        </section>

        {/* ORDERS TABLE (Section 12) */}
        <section className="col-span-full bg-white p-8 md:p-12 rounded-[4rem] border-2 border-slate-50 shadow-sm overflow-hidden mb-20">
          <h2 className="text-2xl font-black mb-10 italic border-b pb-6 uppercase tracking-tighter">Business Transactions Log</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-separate border-spacing-y-4">
              <thead>
                <tr className="text-slate-400 uppercase text-[10px] tracking-widest font-black px-6">
                  <th className="px-6 pb-2">Client Details</th><th className="px-6 pb-2">Product Info</th><th className="px-6 pb-2 text-center">Trx ID</th><th className="px-6 pb-2 text-center">Process</th><th className="px-6 pb-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id} className="bg-slate-50 hover:bg-slate-100/50 transition-all group">
                    <td className="px-6 py-8 rounded-l-[2rem] font-bold text-sm">{o.customerName}<br/><span className="text-[10px] font-normal text-slate-400 block max-w-[150px] truncate mt-1 italic leading-tight">{o.address}</span></td>
                    <td className="px-6 py-8 font-black italic uppercase text-slate-800 text-sm">{o.productName} <br/><span className="text-primary font-mono font-normal text-[10px] tracking-widest mt-1 block">Rs.{o.price}</span></td>
                    <td className="px-6 py-8 font-mono text-[10px] text-slate-500 font-black text-center bg-white/50 rounded-xl shadow-inner mx-4">{o.transactionId}</td>
                    <td className="px-6 py-8 text-center"><span className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm ${o.status === 'Pending' ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'}`}>{o.status}</span></td>
                    <td className="px-6 py-8 rounded-r-[2rem] text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={()=>updateDoc(doc(db,"orders",o.id), {status:"Shipped"})} className="bg-slate-900 text-white p-3 px-5 rounded-2xl text-[9px] font-black uppercase shadow-lg hover:scale-105 active:scale-95 transition-all">Ship</button>
                        <button onClick={()=>generateInvoice(o)} className="bg-primary text-white p-3 px-5 rounded-2xl text-[9px] font-black uppercase shadow-lg hover:scale-105 active:scale-95 transition-all">Bill</button>
                        <button onClick={()=>{if(window.confirm("Remove Entry?")) deleteDoc(doc(db,"orders",o.id))}} className="bg-white text-red-500 p-3 px-5 rounded-2xl text-[9px] font-black border border-red-100 hover:bg-red-500 hover:text-white transition-all">Del</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {orders.length === 0 && <div className="text-center py-24 text-slate-300 font-black italic text-xl uppercase tracking-widest border-2 border-dashed border-slate-50 rounded-[3rem] mt-4 opacity-50">Zero Sales Data Found</div>}
          </div>
        </section>
      </div>
    </div>
  );
}