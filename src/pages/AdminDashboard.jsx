import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { AuthContext } from '../context/AuthContext';
import { db } from '../services/firebase';
import { doc, setDoc, addDoc, collection, deleteDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import emailjs from '@emailjs/browser';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// --- PROFESSIONAL SECURITY CONFIG ---
const ADMIN_EMAIL = "ra0197571@gmail.com";
const MASTER_PASSWORD = "RehmanAdmin786"; 
const LOCKOUT_MINUTES = 5;

export default function AdminDashboard() {
  const { user, loading: authLoading } = useContext(AuthContext);
  const { settings } = useContext(AppContext);
  const navigate = useNavigate();

  // --- SECURITY VIEW SYSTEM ---
  const [view, setView] = useState(sessionStorage.getItem('admin_session') ? 'dashboard' : 'password'); 
  const [inputPass, setInputPass] = useState("");
  const [inputOtp, setInputOtp] = useState("");
  const [serverOtp, setServerOtp] = useState("");
  const [isLocked, setIsLocked] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  // --- DATA STATES ---
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]); 
  const [categories, setCategories] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [editId, setEditId] = useState(null);

  // --- FORM STATES ---
  const [pName, setPName] = useState("");
  const [pPrice, setPPrice] = useState("");
  const [pImg, setPImg] = useState("");
  const [pCat, setPCat] = useState("");
  const [pStock, setPStock] = useState(""); 
  const [pDesc, setPDesc] = useState(""); 
  const [pModel, setPModel] = useState(""); 
  const [newCatName, setNewCatName] = useState("");
  const [newCoupon, setNewCoupon] = useState({ code: "", discount: "" });
  const [uploading, setUploading] = useState(false);

  // 1. SECURITY: Firebase Auth Check
  useEffect(() => {
    if (!authLoading && (!user || user.email !== ADMIN_EMAIL)) { navigate("/auth"); }
  }, [user, authLoading, navigate]);

  // 2. SECURITY: Lockout Protocol
  useEffect(() => {
    const lockUntil = localStorage.getItem('admin_lock_until');
    if (lockUntil && Date.now() < lockUntil) {
      setIsLocked(true);
      const remaining = Math.round((lockUntil - Date.now()) / 1000);
      setTimeLeft(remaining);
      const timer = setInterval(() => {
        setTimeLeft(t => { if (t <= 1) { clearInterval(timer); setIsLocked(false); return 0; } return t - 1; });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, []);

  // 3. IMAGE UPLOAD LOGIC (ImgBB)
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return null;
    setUploading(true);
    const formData = new FormData(); formData.append("image", file);
    try {
const res = await fetch(`https://api.imgbb.com/1/upload?key=${import.meta.env.VITE_IMGBB_KEY}`, {
  method: "POST",
  body: formData
});      const data = await res.json();
      if (data.success) return data.data.url;
    } catch { alert("Upload failed!"); }
    finally { setUploading(false); }
    return null;
  };

  // 4. SECURITY: OTP Handler
  const triggerOtp = async () => {
    if (inputPass !== MASTER_PASSWORD) {
        let attempts = Number(localStorage.getItem('failed_attempts') || 0) + 1;
        if (attempts >= 3) {
            localStorage.setItem('admin_lock_until', Date.now() + LOCKOUT_MINUTES * 60 * 1000);
            setIsLocked(true);
        } else { localStorage.setItem('failed_attempts', attempts); alert(`Wrong Password! Attempt ${attempts}/3`); }
        return;
    }
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    setServerOtp(otpCode);
    try {
      await emailjs.send('service_vzqm198', 'template_y9i1xxn', { to_email: ADMIN_EMAIL, passcode: otpCode, store_name: settings.storeName }, 'pKPMMS-CLiLSsujqa');
      setView('otp');
      localStorage.setItem('failed_attempts', 0);
    } catch { alert("Email Failed"); }
  };

  // 5. DATABASE LISTENERS
  useEffect(() => {
    if (view === 'dashboard') {
      const unsubP = onSnapshot(collection(db, "products"), s => setProducts(s.docs.map(d => ({ id: d.id, ...d.data() }))));
      const unsubO = onSnapshot(collection(db, "orders"), s => setOrders(s.docs.map(d => ({ id: d.id, ...d.data() }))));
      const unsubC = onSnapshot(collection(db, "categories"), s => setCategories(s.docs.map(d => ({ id: d.id, ...d.data() }))));
      const unsubCP = onSnapshot(collection(db, "coupons"), s => setCoupons(s.docs.map(d => ({ id: d.id, ...d.data() }))));
      return () => { unsubP(); unsubO(); unsubC(); unsubCP(); };
    }
  }, [view]);

  // --- ANALYTICS LOGIC ---
  const totalRevenue = orders.reduce((acc, curr) => acc + Number(curr.totalAmount || curr.price || 0), 0);
  const inventoryValue = products.reduce((acc, p) => acc + (Number(p.price) * Number(p.stock || 0)), 0);

  const categorySales = categories.map(cat => {
    const total = orders.reduce((acc, o) => {
        if (o.items && Array.isArray(o.items)) {
            const catSum = o.items.filter(i => i.category === cat.name).reduce((s, item) => s + (Number(item.price) * Number(item.quantity)), 0);
            return acc + catSum;
        }
        if (o.productName) {
            const pMatch = products.find(p => p.name === o.productName);
            if (pMatch && pMatch.category === cat.name) return acc + Number(o.totalAmount || o.price || 0);
        }
        return acc;
    }, 0);
    return { name: cat.name, total };
  });
  const maxSaleValue = Math.max(...categorySales.map(s => s.total), 1);

  // --- ACTIONS ---
  const addCategory = async () => {
    if(!newCatName) return;
    await addDoc(collection(db, "categories"), { name: newCatName });
    setNewCatName("");
  };

  const addCoupon = async () => {
    if(!newCoupon.code || !newCoupon.discount) return;
    await addDoc(collection(db, "coupons"), newCoupon);
    setNewCoupon({ code: "", discount: "" });
  };

  const handlePublish = async (e) => {
    e.preventDefault();
    if(!pName || !pPrice || !pImg || !pCat) return alert("Fill fields!");
    const data = { name: pName, price: pPrice, image: pImg, category: pCat, stock: Number(pStock), description: pDesc, model3D: pModel };
    editId ? await updateDoc(doc(db, "products", editId), data) : await addDoc(collection(db, "products"), {...data, createdAt: new Date()});
    setPName(""); setPPrice(""); setPImg(""); setPCat(""); setPStock(""); setPDesc(""); setEditId(null);
  };

  const updateSettings = async (field, value) => {
    await setDoc(doc(db, "settings", "storeConfig"), { ...settings, [field]: value }, { merge: true });
  };

  const generateInvoice = (order) => {
    const doc = new jsPDF();
    const primary = settings.primaryColor || "#ff0000";
    doc.setFillColor(primary); doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor("#ffffff"); doc.setFontSize(24); doc.text(settings.storeName?.toUpperCase() || "STORE", 20, 25);
    const tableBody = order.items ? order.items.map(i => [i.name, `x${i.quantity}`, `Rs.${i.price}`]) : [[order.productName, "x1", `Rs.${order.price}`]];
    autoTable(doc, { startY: 70, head: [['Product', 'Qty', 'Amount']], body: tableBody, headStyles: { fillColor: primary } });
    doc.save(`Bill_${order.customerName}.pdf`);
  };

  const exportSalesReportPDF = () => {
    const doc = new jsPDF();
    autoTable(doc, { startY: 30, head: [['#', 'Customer', 'Trx ID', 'Status', 'Amount']], body: orders.map((o, i) => [i + 1, o.customerName, o.transactionId, o.status, `Rs. ${o.totalAmount || o.price}`]), headStyles: { fillColor: settings.primaryColor || "#ff0000" } });
    doc.save("Sales_Report.pdf");
  };

  const exportInventoryPDF = () => {
    const doc = new jsPDF();
    autoTable(doc, { startY: 30, head: [['#', 'Name', 'Category', 'Stock', 'Price']], body: products.map((p, i) => [i + 1, p.name, p.category, p.stock, `Rs. ${p.price}`]), headStyles: { fillColor: settings.primaryColor || "#ff0000" } });
    doc.save("Inventory_Report.pdf");
  };

  // --- HELPER: STATUS COLORS ---
  const getStatusStyle = (status) => {
    switch (status) {
      case "Pending": return "bg-amber-100 text-amber-600 border-amber-200";
      case "Processing": return "bg-blue-100 text-blue-600 border-blue-200";
      case "Packed": return "bg-purple-100 text-purple-600 border-purple-200";
      case "Shipped": return "bg-indigo-100 text-indigo-600 border-indigo-200";
      case "Delivered": return "bg-green-100 text-green-600 border-green-200";
      default: return "bg-slate-100 text-slate-600";
    }
  };

  // --- RENDERING VIEWS ---
  if (view === 'password') return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6 font-sans">
      <motion.div initial={{opacity:0}} animate={{opacity:1}} className="bg-white p-12 rounded-[3rem] shadow-2xl w-full max-w-md text-center">
        <h2 className="text-3xl font-black uppercase italic mb-8 tracking-tighter text-slate-800">System Access</h2>
        {isLocked ? <div className="p-8 bg-red-50 text-red-600 rounded-3xl font-black border-2 border-red-100">LOCKED: {timeLeft}s</div> : (
          <div className="space-y-4">
            <input type="password" placeholder="Admin Password" value={inputPass} onChange={e => setInputPass(e.target.value)} className="w-full p-5 bg-slate-50 border-none rounded-2xl text-center font-bold outline-none focus:ring-4 ring-primary/20" />
            <button onClick={triggerOtp} className="w-full bg-slate-900 text-white p-5 rounded-2xl font-black uppercase hover:bg-primary transition-all">Verify & Send OTP</button>
          </div>
        )}
      </motion.div>
    </div>
  );

  if (view === 'otp') return (
    <div className="min-h-screen flex items-center justify-center bg-primary p-6 font-sans">
      <motion.div initial={{scale:0.9}} animate={{scale:1}} className="bg-white p-12 rounded-[4rem] shadow-2xl w-full max-w-md text-center border-[10px] border-white/20">
        <h2 className="text-3xl font-black italic mb-2 uppercase text-slate-800">Verification</h2>
        <p className="text-[10px] font-black text-slate-400 mb-8 uppercase tracking-widest">Sent to {ADMIN_EMAIL}</p>
        <input type="text" maxLength="6" value={inputOtp} onChange={e => setInputOtp(e.target.value)} className="w-full p-6 bg-slate-50 rounded-3xl text-center text-4xl font-mono font-black tracking-[12px] outline-none" />
        <button onClick={() => { if(inputOtp === serverOtp) { sessionStorage.setItem('admin_session', 'active'); setView('dashboard'); } else { alert("Invalid OTP"); } }} className="w-full bg-slate-900 text-white p-6 rounded-3xl font-black uppercase mt-8 shadow-2xl">Unlock Dashboard</button>
      </motion.div>
    </div>
  );

  return (
    <div className="p-4 md:p-10 max-w-[1600px] mx-auto flex flex-col gap-10 bg-white min-h-screen font-sans text-slate-900">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-slate-900 text-white p-8 rounded-[3rem] shadow-2xl gap-4 border-b-8 border-primary">
        <Link to="/" className="text-primary font-black uppercase italic text-xs hover:text-white transition-all">← Back to Store</Link>
        <h1 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter">OMNI-3D <span className="text-primary">CONTROL</span></h1>
        <button onClick={() => { sessionStorage.removeItem('admin_session'); setView('password'); }} className="bg-red-500/10 text-red-500 px-6 py-2 rounded-full font-black uppercase text-[10px] tracking-widest border border-red-500/20 hover:bg-red-500 hover:text-white transition-all">Logout & Lock</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* COLUMN 1 */}
        <div className="space-y-10">
          <section className="bg-white p-8 rounded-[3rem] border-2 border-slate-50 shadow-sm space-y-6">
            <h2 className="text-xl font-black italic text-slate-800 uppercase border-b pb-4 tracking-tighter">Store Identity</h2>
            <div className="space-y-6">
                <div className="flex flex-col items-center gap-4 p-6 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                   <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Brand Logo</p>
                   <div className="h-20 w-24 bg-white rounded-3xl shadow-inner flex items-center justify-center overflow-hidden border-2 border-white">
                      {settings.logoUrl ? <img src={settings.logoUrl} className="h-full w-full object-contain p-2" alt="" /> : <span className="text-2xl grayscale opacity-20">🖼️</span>}
                   </div>
                   <input type="file" id="logo-upload" accept="image/*" className="hidden" onChange={async (e) => { const url = await handleImageUpload(e); if(url) { await updateSettings('logoUrl', url); alert("Logo Saved!"); }}} />
                   <label htmlFor="logo-upload" className={`px-6 py-2 rounded-xl font-black uppercase text-[9px] cursor-pointer transition-all shadow-lg ${uploading ? 'bg-slate-200 text-slate-400 animate-pulse' : 'bg-slate-900 text-white hover:bg-primary'}`}> {uploading ? "Wait..." : "Change Logo"} </label>
                </div>
                <input type="text" value={settings.storeName || ""} className="w-full p-4 bg-slate-50 border rounded-2xl font-bold focus:border-primary outline-none" placeholder="Store Name" onChange={(e)=>updateSettings('storeName', e.target.value)} />
                <div className="grid grid-cols-2 gap-4 border-t pt-6 border-dashed">
                    <input type="text" value={settings.whatsapp || ""} className="w-full p-4 bg-slate-50 border rounded-xl text-xs font-bold" placeholder="WhatsApp" onChange={(e)=>updateSettings('whatsapp', e.target.value)} />
                    <input type="color" value={settings.primaryColor || "#ff0000"} className="w-full h-12 cursor-pointer rounded-xl border-none p-1 bg-slate-50 shadow-inner" onChange={(e)=>updateSettings('primaryColor', e.target.value)} />
                </div>
            </div>
          </section>

          <section className="bg-white p-8 rounded-[3rem] border-2 border-slate-50 shadow-sm space-y-6">
            <h2 className="text-xl font-black italic text-slate-800 uppercase border-b pb-4 tracking-tighter">Banners & Socials</h2>
            <div className="space-y-4">
                <input type="text" value={settings.heroHeading || ""} className="w-full p-4 bg-slate-50 border rounded-2xl font-bold" placeholder="Hero Heading" onChange={(e)=>updateSettings('heroHeading', e.target.value)} />
                <input type="text" value={settings.heroSubheading || ""} className="w-full p-4 bg-slate-50 border rounded-2xl font-bold" placeholder="Hero Subheading" onChange={(e)=>updateSettings('heroSubheading', e.target.value)} />
                <div className="grid gap-3 pt-4 border-t border-dashed">
                    <input type="text" value={settings.facebook || ""} placeholder="Facebook Link" className="w-full p-4 bg-slate-50 border rounded-xl text-xs" onChange={(e)=>updateSettings('facebook', e.target.value)} />
                    <input type="text" value={settings.instagram || ""} placeholder="Instagram Link" className="w-full p-4 bg-slate-50 border rounded-xl text-xs" onChange={(e)=>updateSettings('instagram', e.target.value)} />
                </div>
            </div>
          </section>

          <section className="bg-white p-8 rounded-[3rem] border-2 border-slate-50 shadow-sm space-y-4">
            <h2 className="text-xl font-black italic uppercase text-slate-800">Payments & Shipping</h2>
            <div className="space-y-4">
                <input type="text" value={settings.jazzCashNo || ""} className="w-full p-4 bg-slate-50 border rounded-xl font-bold text-sm" placeholder="JazzCash Number" onChange={(e)=>updateSettings('jazzCashNo', e.target.value)} />
                <input type="text" value={settings.easyPaisaNo || ""} className="w-full p-4 bg-slate-50 border rounded-xl font-bold text-sm" placeholder="EasyPaisa Number" onChange={(e)=>updateSettings('easyPaisaNo', e.target.value)} />
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 ml-2 mb-1">Standard Shipping (PKR)</p>
                  <input type="number" value={settings.shippingFee || 0} className="w-full p-4 bg-slate-50 border rounded-xl font-bold" onChange={(e) => updateSettings('shippingFee', Number(e.target.value))} />
                </div>
            </div>
          </section>

          <section className="bg-white p-8 rounded-[3rem] border-2 border-slate-50 shadow-sm space-y-4">
            <h2 className="text-xl font-black italic uppercase">Categories</h2>
            <div className="flex gap-2">
                <input type="text" value={newCatName} placeholder="Category Name" className="w-full p-4 bg-slate-50 border rounded-xl font-bold text-sm" onChange={(e)=>setNewCatName(e.target.value)} />
                <button onClick={addCategory} className="bg-primary text-white px-6 rounded-xl font-black uppercase text-[10px]">Add</button>
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
                {categories.map(c => ( <div key={c.id} className="bg-slate-50 px-4 py-2 rounded-full text-[10px] font-bold border flex items-center gap-2">{c.name}<button onClick={()=>deleteDoc(doc(db,"categories",c.id))} className="text-red-500 font-black">x</button></div> ))}
            </div>
          </section>

          <section className="bg-white p-8 rounded-[3rem] border shadow-sm space-y-4">
            <h2 className="text-xl font-black italic uppercase">Promo Codes</h2>
            <div className="flex gap-2">
                <input type="text" placeholder="CODE" className="w-1/2 p-4 bg-slate-50 border rounded-xl font-bold" value={newCoupon.code} onChange={e => setNewCoupon({...newCoupon, code: e.target.value.toUpperCase()})} />
                <input type="number" placeholder="%" className="w-1/4 p-4 bg-slate-50 border rounded-xl font-bold" value={newCoupon.discount} onChange={e => setNewCoupon({...newCoupon, discount: e.target.value})} />
                <button onClick={addCoupon} className="bg-primary text-white px-4 rounded-xl font-black uppercase text-[10px]">Create</button>
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
                {coupons.map(c => ( <div key={c.id} className="bg-green-50 text-green-700 px-4 py-2 rounded-full text-[10px] font-bold flex items-center gap-2">{c.code} (-{c.discount}%)<button onClick={() => deleteDoc(doc(db, "coupons", c.id))} className="text-red-500 font-black">x</button></div> ))}
            </div>
          </section>
        </div>

        {/* COLUMN 2 */}
        <section className="bg-slate-900 text-white p-8 md:p-10 rounded-[4rem] shadow-2xl border-b-8 border-primary relative overflow-hidden h-fit">
            <h2 className="text-3xl font-black mb-8 text-primary italic border-b border-white/10 pb-4 uppercase tracking-tighter">{editId ? "Update Item" : "Publish Item"}</h2>
            <form onSubmit={handlePublish} className="space-y-4 text-slate-800">
              <input type="text" placeholder="Product Name" value={pName} className="w-full p-5 bg-white border-none rounded-2xl font-bold focus:ring-4 ring-primary/20 outline-none" onChange={(e)=>setPName(e.target.value)} />
              <div className="flex gap-4">
                <input type="number" placeholder="Price" value={pPrice} className="w-1/2 p-5 bg-white rounded-2xl font-bold outline-none" onChange={(e)=>setPPrice(e.target.value)} />
                <input type="number" placeholder="Stock" value={pStock} className="w-1/2 p-5 bg-white rounded-2xl font-bold outline-none" onChange={(e)=>setPStock(e.target.value)} />
              </div>
              <div className="space-y-2">
                  <p className="text-[9px] text-white/40 mb-1 font-black ml-2 uppercase italic">Upload Product Photo</p>
                  <input type="file" id="p-img-upload" accept="image/*" className="hidden" onChange={async (e) => { const url = await handleImageUpload(e); if(url) setPImg(url); }} />
                  <label htmlFor="p-img-upload" className={`w-full p-5 bg-white/10 border-2 border-dashed border-white/20 rounded-2xl flex items-center justify-center cursor-pointer hover:border-primary transition-all ${uploading ? 'animate-pulse' : ''}`}>
                    <span className="text-white font-black uppercase text-xs"> {uploading ? "Uploading..." : pImg ? "Photo Selected ✅" : "Select Photo from Device"} </span>
                  </label>
                  {pImg && <div className="mt-2 flex items-center gap-3 bg-white/5 p-2 rounded-xl border border-white/10"><img src={pImg} className="w-10 h-10 rounded-lg object-cover" alt="" /><p className="text-[8px] text-primary font-black uppercase">Ready to Publish</p></div>}
              </div>
              <input type="text" placeholder="3D Path (.glb)" value={pModel} className="w-full p-5 bg-white/10 text-white border-none rounded-2xl text-xs italic" onChange={(e)=>setPModel(e.target.value)} />
              <select value={pCat} className="w-full p-5 bg-white border-none rounded-2xl font-bold text-slate-400" onChange={(e)=>setPCat(e.target.value)}>
                <option value="">Choose Category</option>
                {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
              <textarea placeholder="Description..." value={pDesc} className="w-full p-5 bg-white border-none rounded-2xl h-36 font-medium resize-none" onChange={(e)=>setPDesc(e.target.value)} />
              <button disabled={uploading} className={`w-full bg-primary text-white p-6 rounded-3xl font-black uppercase text-xl shadow-xl active:scale-95 transition-all mt-4 ${uploading ? 'opacity-50' : ''}`}> {editId ? "Update Product" : "Confirm & Publish"} </button>
            </form>
        </section>

        {/* COLUMN 3 */}
        <section className="bg-white p-8 rounded-[3rem] border-2 border-slate-50 shadow-sm h-full overflow-hidden">
          <h2 className="text-xl font-black italic uppercase mb-8 border-b pb-4">Warehouse ({products.length})</h2>
          <div className="space-y-4 overflow-y-auto max-h-[750px] pr-2 custom-scrollbar">
            {products.map(p => (
              <div key={p.id} className="p-4 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center justify-between hover:border-primary transition-all group">
                <div className="flex items-center space-x-4">
                  <img src={p.image} className="w-14 h-14 rounded-2xl object-cover shadow-lg border-2 border-white" />
                  <div><p className="font-black text-sm uppercase italic leading-none">{p.name}</p><p className={`text-[9px] font-black mt-2 text-primary`}>STOCK: {p.stock}</p></div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditId(p.id); setPName(p.name); setPPrice(p.price); setPImg(p.image); setPCat(p.category); setPStock(p.stock); setPDesc(p.description || ""); window.scrollTo(0,0); }} className="p-2 bg-blue-50 text-blue-600 rounded-xl text-[9px] font-black uppercase">EDIT</button>
                  <button onClick={()=> { if(window.confirm("Delete Product?")) deleteDoc(doc(db,"products",p.id)) }} className="p-2 bg-red-50 text-red-500 rounded-xl text-[9px] font-black hover:bg-red-600 hover:text-white transition">DEL</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ANALYTICS */}
        <div className="col-span-full grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-primary text-white p-10 rounded-[3.5rem] shadow-2xl relative overflow-hidden group">
            <div className="relative z-10"><p className="text-[10px] uppercase font-black opacity-70 tracking-widest">Gross Revenue</p><h2 className="text-5xl font-black italic">Rs.{totalRevenue}</h2></div>
          </div>
          <div className="bg-slate-900 text-white p-10 rounded-[3.5rem] shadow-2xl relative overflow-hidden group">
            <div className="relative z-10"><p className="text-[10px] uppercase font-black opacity-70 tracking-widest">Order Success</p><h2 className="text-5xl font-black italic">{orders.length}</h2></div>
          </div>
          <div className="bg-slate-50 border-2 border-slate-100 p-10 rounded-[3.5rem] shadow-sm relative group">
            <div className="relative z-10"><p className="text-[10px] uppercase font-black text-slate-400">Inventory Worth</p><h2 className="text-5xl font-black italic text-slate-800 font-mono">Rs.{inventoryValue}</h2></div>
          </div>
        </div>

        {/* CHART SECTION */}
        <section className="col-span-full bg-slate-900 text-white p-10 md:p-14 rounded-[4rem] shadow-2xl border-b-8 border-primary relative overflow-hidden">
            <h2 className="text-3xl font-black uppercase italic mb-12 tracking-tighter text-primary">Department Performance</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
              {categories.map((cat, i) => {
                const total = orders.reduce((acc, o) => {
                    if (o.items && Array.isArray(o.items)) {
                        const catSum = o.items.filter(item => item.category === cat.name).reduce((s, item) => s + (Number(item.price) * Number(item.quantity)), 0);
                        return acc + catSum;
                    }
                    if (o.productName) {
                        const pMatch = products.find(p => p.name === o.productName);
                        if (pMatch && pMatch.category === cat.name) return acc + Number(o.totalAmount || o.price || 0);
                    }
                    return acc;
                }, 0);
                const percentage = Math.round((total / totalRevenue) * 100) || 0;
                const barWidth = Math.min((total / maxSaleValue) * 100, 100);
                return (
                  <div key={i} className="space-y-5">
                    <div className="flex justify-between items-end">
                      <div><p className="text-[10px] font-black uppercase text-slate-500 mb-1">{cat.name}</p><p className="text-2xl font-black italic text-primary font-mono leading-none">Rs.{total}</p></div>
                      <p className="text-xs font-black text-slate-600">{percentage}%</p>
                    </div>
                    <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${barWidth}%` }} transition={{ duration: 1.5, ease: "easeOut" }} className="h-full bg-primary shadow-[0_0_25px_rgba(255,0,0,0.6)]" />
                    </div>
                  </div>
                );
              })}
            </div>
        </section>

        {/* TRANSACTIONS TABLE */}
        <section className="col-span-full bg-white p-8 md:p-12 rounded-[4rem] border-2 border-slate-50 shadow-sm overflow-hidden mb-20">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4 border-b pb-6">
            <h2 className="text-2xl font-black italic uppercase tracking-tighter">Business Transactions Log</h2>
            <button onClick={exportSalesReportPDF} className="bg-primary text-white px-8 py-3 rounded-2xl font-black uppercase text-xs shadow-xl shadow-primary/20 hover:scale-105 transition-all">Export Sales Report (PDF)</button>          
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-separate border-spacing-y-4">
              <thead>
                <tr className="text-slate-400 uppercase text-[10px] font-black tracking-widest px-6">
                  <th>Client Details</th><th>Order Items (Cart)</th><th className="text-center">Trx ID</th><th className="text-center">Process</th><th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id} className="bg-slate-50 hover:bg-slate-100/50 transition-all group">
                    <td className="px-6 py-8 rounded-l-[2rem] font-bold text-xs"><span className="text-sm">{o.customerName}</span><br/><span className="text-[10px] font-normal text-slate-400 block max-w-[150px] truncate mt-1 italic leading-tight">{o.address}</span>{o.customerNote && <div className="mt-2 p-2 bg-yellow-50 text-yellow-700 text-[9px] rounded-lg border border-yellow-100 italic">" {o.customerNote} "</div>}</td>
                    <td className="px-6 py-8 font-black uppercase text-sm">{o.items ? <div className="space-y-1">{o.items.map((item, idx) => (<div key={idx} className="text-[10px] flex justify-between gap-4 border-b border-slate-200 pb-1 last:border-0"><span className="text-slate-700">• {item.name}</span><span className="text-primary font-black">(x{item.quantity})</span></div>))}<p className="text-primary font-mono font-black text-xs mt-2 pt-1">TOTAL: Rs.{o.totalAmount || o.price}</p></div> : <>{o.productName} <br/><span className="text-primary font-mono font-normal text-[10px] tracking-widest mt-1 block">Rs.{o.price}</span></>}</td>
                    <td className="px-6 py-8 font-mono text-[10px] text-slate-500 font-black text-center bg-white/50 rounded-xl shadow-inner mx-4">{o.transactionId}</td>
                    
                    {/* --- UPDATED STATUS BADGE WITH COLORS --- */}
                    <td className="px-6 py-8 text-center">
                        <select 
                            onChange={(e)=>updateDoc(doc(db,"orders",o.id), {status: e.target.value})} 
                            className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm cursor-pointer border-2 transition-all ${getStatusStyle(o.status)}`}
                            value={o.status}
                        >
                            <option value="Pending">Pending</option>
                            <option value="Processing">Processing</option>
                            <option value="Packed">Packed</option>
                            <option value="Shipped">Shipped</option>
                            <option value="Delivered">Delivered</option>
                        </select>
                    </td>

                    <td className="px-6 py-8 rounded-r-[2rem] text-right"><div className="flex justify-end gap-2"><button onClick={()=>generateInvoice(o)} className="bg-primary text-white p-3 px-5 rounded-2xl text-[9px] font-black uppercase shadow-lg hover:scale-105 active:scale-95 transition-all">Bill</button><button onClick={()=>{if(window.confirm("Remove Entry?")) deleteDoc(doc(db,"orders",o.id))}} className="bg-white text-red-500 p-3 px-5 rounded-2xl text-[9px] font-black border border-red-100 hover:bg-red-500 hover:text-white transition-all">Del</button></div></td>
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