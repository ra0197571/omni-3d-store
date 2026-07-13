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

  // --- SECURITY VIEW SYSTEM (Updated with Session Check) ---
  const [view, setView] = useState(sessionStorage.getItem('admin_session') ? 'dashboard' : 'password'); 
  const [inputPass, setInputPass] = useState("");
  const [inputOtp, setInputOtp] = useState("");
  const [serverOtp, setServerOtp] = useState("");
  const [isLocked, setIsLocked] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  // --- ORIGINAL DATA STATES ---
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]); 
  const [categories, setCategories] = useState([]);
  const [editId, setEditId] = useState(null);

  // --- ORIGINAL FORM STATES ---
  const [pName, setPName] = useState("");
  const [pPrice, setPPrice] = useState("");
  const [pImg, setPImg] = useState("");
  const [pCat, setPCat] = useState("");
  const [pStock, setPStock] = useState(""); 
  const [pDesc, setPDesc] = useState(""); 
  const [pModel, setPModel] = useState(""); 
  const [newCatName, setNewCatName] = useState("");

  // 1. SECURITY: Firebase Auth Check
  useEffect(() => {
    if (!authLoading && (!user || user.email !== ADMIN_EMAIL)) {
        navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // 2. SECURITY: Lockout Protocol
  useEffect(() => {
    const lockUntil = localStorage.getItem('admin_lock_until');
    if (lockUntil && Date.now() < lockUntil) {
      setIsLocked(true);
      const remaining = Math.round((lockUntil - Date.now()) / 1000);
      setTimeLeft(remaining);
      const timer = setInterval(() => {
        setTimeLeft(t => { 
            if (t <= 1) { clearInterval(timer); setIsLocked(false); return 0; } 
            return t - 1; 
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, []);

  // 3. SECURITY: OTP Handler
  const triggerOtp = async () => {
    if (inputPass !== MASTER_PASSWORD) {
        let attempts = Number(localStorage.getItem('failed_attempts') || 0) + 1;
        if (attempts >= 3) {
            localStorage.setItem('admin_lock_until', Date.now() + LOCKOUT_MINUTES * 60 * 1000);
            setIsLocked(true);
        } else {
            localStorage.setItem('failed_attempts', attempts);
            alert(`Wrong Password! Attempt ${attempts}/3`);
        }
        return;
    }
    
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    setServerOtp(otpCode);
    
    try {
      await emailjs.send(
        'service_vzqm198', 
        'template_y9i1xxn', 
        { to_email: ADMIN_EMAIL, passcode: otpCode, store_name: settings.storeName || "Omni-3D" },
        'pKPMMS-CLiLSsujqa' 
      );
      setView('otp');
      localStorage.setItem('failed_attempts', 0);
    } catch (err) { alert("Email Failed"); }
  };

  // 4. REAL-TIME DATA (Only active in Dashboard View)
  useEffect(() => {
    if (view === 'dashboard') {
      const unsubProducts = onSnapshot(collection(db, "products"), (s) => setProducts(s.docs.map(d => ({ id: d.id, ...d.data() }))));
      const unsubOrders = onSnapshot(collection(db, "orders"), (s) => setOrders(s.docs.map(d => ({ id: d.id, ...d.data() }))));
      const unsubCats = onSnapshot(collection(db, "categories"), (s) => setCategories(s.docs.map(d => ({ id: d.id, ...d.data() }))));
      return () => { unsubProducts(); unsubOrders(); unsubCats(); };
    }
  }, [view]);

  // --- BUSINESS LOGIC FUNCTIONS ---
  const totalRevenue = orders.reduce((acc, curr) => acc + Number(curr.price || 0), 0);
  const inventoryValue = products.reduce((acc, p) => acc + (Number(p.price) * Number(p.stock || 0)), 0);

  const categorySales = categories.map(cat => {
    const total = orders.reduce((acc, o) => {
        const prod = products.find(p => p.name === o.productName);
        if (prod && prod.category === cat.name) return acc + Number(o.price || 0);
        return acc;
    }, 0);
    return { name: cat.name, total };
  });
  const maxSale = Math.max(...categorySales.map(s => s.total), 1);

  const addCategory = async () => {
    if(!newCatName) return alert("Name missing");
    await addDoc(collection(db, "categories"), { name: newCatName });
    setNewCatName("");
  };

  const generateInvoice = (order) => {
  try {
    const doc = new jsPDF();
    const primary = settings.primaryColor || "#ff0000";

    // Header logic (wahi purani)
    doc.setFillColor(primary); doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor("#ffffff"); doc.setFontSize(24); doc.text(settings.storeName?.toUpperCase() || "STORE", 20, 25);

    // Multi-Items Table Rows
    // Agar order.items hai toh map karo, warna single item (purana order) dikhao
    const tableBody = order.items ? 
      order.items.map(item => [item.name, `x${item.quantity}`, `Rs.${item.price}`, `Rs.${item.price * item.quantity}`]) :
      [[order.productName, "x1", `Rs.${order.price}`, `Rs.${order.price}`]];

    autoTable(doc, {
      startY: 70,
      head: [['Product Name', 'Qty', 'Unit Price', 'Subtotal']],
      body: tableBody,
      headStyles: { fillColor: primary }
    });

    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text(`GRAND TOTAL: Rs.${order.totalAmount || order.price}`, 140, finalY);

    doc.save(`Bill_${order.customerName}.pdf`);
  } catch (err) { alert("PDF Error: " + err.message); }
};

  const exportSalesReportPDF = () => {
    const doc = new jsPDF();
    autoTable(doc, {
      startY: 30, head: [['#', 'Customer', 'Product', 'Trx ID', 'Status', 'Amount']],
      body: orders.map((o, i) => [i + 1, o.customerName, o.productName, o.transactionId, o.status, `Rs. ${o.price}`]),
      headStyles: { fillColor: [30, 41, 59] },
      foot: [['', '', '', '', 'TOTAL:', `Rs. ${totalRevenue}`]],
      footStyles: { fillColor: settings.primaryColor || "#ff0000" }
    });
    doc.save("Sales_Report.pdf");
  };

  const exportInventoryPDF = () => {
    const doc = new jsPDF();
    autoTable(doc, {
      startY: 30, head: [['#', 'Name', 'Category', 'Stock', 'Price']],
      body: products.map((p, i) => [i + 1, p.name, p.category, p.stock, `Rs. ${p.price}`]),
      headStyles: { fillColor: settings.primaryColor || "#ff0000" }
    });
    doc.save("Inventory_Report.pdf");
  };

  const updateSettings = async (field, value) => {
    await setDoc(doc(db, "settings", "storeConfig"), { ...settings, [field]: value }, { merge: true });
  };

  const handlePublish = async (e) => {
    e.preventDefault();
    if(!pName || !pPrice || !pImg || !pCat || !pStock) return alert("Fill fields!");
    const data = { name: pName, price: pPrice, image: pImg, category: pCat, stock: Number(pStock), description: pDesc, model3D: pModel };
    if (editId) { await updateDoc(doc(db, "products", editId), data); setEditId(null); }
    else { await addDoc(collection(db, "products"), { ...data, createdAt: new Date() }); }
    setPName(""); setPPrice(""); setPImg(""); setPCat(""); setPStock(""); setPDesc("");
  };
  const [uploading, setUploading] = useState(false);

const handleImageUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  setUploading(true);
  const apiKey = "5ef060cc49c578628a4f76bfebc26739"; // <--- Dashboard se copy ki hui key yahan paste karein
  const formData = new FormData();
  formData.append("image", file);

  try {
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
      method: "POST",
      body: formData,
    });
    const data = await response.json();
    if (data.success) {
      setPImg(data.data.url); // Firestore mein ye link save hoga
    }
  } catch (error) {
    alert("Upload failed. Try again.");
  } finally {
    setUploading(false);
  }
};
  // --- RENDER SECURITY VIEWS ---

  if (view === 'password') return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6 font-sans">
      <motion.div initial={{opacity:0}} animate={{opacity:1}} className="bg-white p-12 rounded-[3rem] shadow-2xl w-full max-w-md text-center">
        <h2 className="text-3xl font-black uppercase italic mb-8">System Access</h2>
        {isLocked ? <div className="p-8 bg-red-50 text-red-600 rounded-3xl font-black border-2">LOCKED: {timeLeft}s</div> : (
          <div className="space-y-4">
            <input type="password" placeholder="Admin Password" value={inputPass} onChange={e => setInputPass(e.target.value)} className="w-full p-5 bg-slate-50 border-none rounded-2xl text-center font-bold outline-none focus:ring-4 ring-primary/20" />
            <button onClick={triggerOtp} className="w-full bg-slate-900 text-white p-5 rounded-2xl font-black uppercase">Verify & Send OTP</button>
          </div>
        )}
      </motion.div>
    </div>
  );

  if (view === 'otp') return (
    <div className="min-h-screen flex items-center justify-center bg-primary p-6 font-sans">
      <motion.div initial={{scale:0.9}} animate={{scale:1}} className="bg-white p-12 rounded-[4rem] shadow-2xl w-full max-w-md text-center">
        <h2 className="text-3xl font-black italic mb-2 uppercase">Verification</h2>
        <p className="text-[10px] font-black text-slate-400 mb-8 uppercase tracking-widest">Sent to {ADMIN_EMAIL}</p>
        <input type="text" maxLength="6" value={inputOtp} onChange={e => setInputOtp(e.target.value)} className="w-full p-6 bg-slate-50 rounded-3xl text-center text-4xl font-mono font-black tracking-[12px] outline-none" />
        <button onClick={() => {
            if(inputOtp === serverOtp) {
                sessionStorage.setItem('admin_session', 'active');
                setView('dashboard');
            } else { alert("Invalid OTP"); }
        }} className="w-full bg-slate-900 text-white p-6 rounded-3xl font-black uppercase mt-8 shadow-2xl">Unlock Dashboard</button>
      </motion.div>
    </div>
  );

  return (
    <div className="p-4 md:p-10 max-w-[1600px] mx-auto flex flex-col gap-10 bg-white min-h-screen font-sans">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-slate-900 text-white p-8 rounded-[3rem] shadow-2xl gap-4 border-b-8 border-primary">
        <Link to="/" className="text-primary font-black uppercase italic text-xs hover:text-white transition-all">← Back to Storefront</Link>
        <h1 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter">OMNI-3D <span className="text-primary">CONTROL</span></h1>
        <button onClick={() => {
            sessionStorage.removeItem('admin_session');
            setView('password');
        }} className="bg-red-500/10 text-red-500 px-6 py-2 rounded-full font-black uppercase text-[10px] tracking-widest border border-red-500/20 hover:bg-red-500 hover:text-white transition-all">Logout & Lock</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* COLUMN 1: IDENTITY, PAYMENTS, CATEGORIES */}
        <div className="space-y-10">
          <section className="bg-white p-6 md:p-8 rounded-[3rem] border-2 border-slate-50 shadow-sm space-y-6">
  <h2 className="text-xl font-black italic text-slate-800 uppercase border-b pb-4 tracking-tighter">Store Identity</h2>
  
  <div className="space-y-6">
    {/* --- BRAND LOGO UPLOAD AREA --- */}
    <div className="flex flex-col items-center gap-4 p-6 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200 group hover:border-primary transition-all">
       <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Official Brand Logo</p>
       
       {/* Logo Preview */}
       <div className="h-24 w-24 bg-white rounded-3xl shadow-inner flex items-center justify-center overflow-hidden border-2 border-white">
          {settings.logoUrl ? (
            <img src={settings.logoUrl} className="h-full w-full object-contain p-2" alt="Store Logo" />
          ) : (
            <span className="text-3xl grayscale opacity-20">🖼️</span>
          )}
       </div>

       {/* Hidden File Input */}
       <input 
         type="file" 
         id="logo-upload" 
         accept="image/*"
         className="hidden" 
         onChange={async (e) => {
           const file = e.target.files[0];
           if(file) {
             const url = await handleImageUpload(e); // Aapka existing ImgBB function use hoga
             if(url) {
               await updateSettings('logoUrl', url); // Database mein save
               alert("Brand Logo Updated!");
             }
           }
         }} 
       />
       
       {/* Styled Label as Button */}
       <label 
         htmlFor="logo-upload" 
         className={`px-6 py-2 rounded-xl font-black uppercase text-[9px] cursor-pointer transition-all shadow-lg active:scale-95 ${uploading ? 'bg-slate-200 text-slate-400' : 'bg-slate-900 text-white hover:bg-primary'}`}
       >
         {uploading ? "Uploading..." : settings.logoUrl ? "Change Logo" : "Upload Logo"}
       </label>
    </div>

    {/* --- STORE NAME INPUT --- */}
    <div>
      <p className="text-[10px] font-black uppercase text-slate-400 mb-1 ml-2">Store Display Name</p>
      <input 
        type="text" 
        value={settings.storeName} 
        className="w-full p-4 bg-slate-50 border rounded-2xl font-bold focus:border-primary outline-none transition-all" 
        onChange={(e)=>updateSettings('storeName', e.target.value)} 
      />
    </div>

    {/* --- WHATSAPP & THEME COLOR --- */}
    <div className="grid grid-cols-2 gap-4 border-t pt-6 border-dashed">
       <div className="space-y-1">
         <p className="text-[9px] font-bold text-slate-400 ml-1 uppercase">Order WhatsApp</p>
         <input 
           type="text" 
           value={settings.whatsapp} 
           className="w-full p-4 bg-slate-50 border rounded-xl text-xs font-bold focus:border-primary outline-none" 
           onChange={(e)=>updateSettings('whatsapp', e.target.value)} 
         />
       </div>
       <div className="space-y-1">
         <p className="text-[9px] font-bold text-slate-400 ml-1 uppercase">Branding Color</p>
         <input 
           type="color" 
           value={settings.primaryColor} 
           className="w-full h-12 cursor-pointer rounded-xl border-none p-1 bg-slate-50 shadow-inner" 
           onChange={(e)=>updateSettings('primaryColor', e.target.value)} 
         />
       </div>
    </div>
  </div>
</section>

          <section className="bg-white p-6 md:p-8 rounded-[3rem] border-2 border-slate-50 shadow-sm space-y-4">
            <h2 className="text-xl font-black italic uppercase">Payments (Manual)</h2>
            <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-400 ml-2">JAZZCASH</p>
                <input type="text" value={settings.jazzCashNo} className="w-full p-4 bg-slate-50 border rounded-xl font-bold text-sm" onChange={(e)=>updateSettings('jazzCashNo', e.target.value)} />
                <p className="text-[10px] font-black text-slate-400 ml-2">EASYPAISA</p>
                <input type="text" value={settings.easyPaisaNo} className="w-full p-4 bg-slate-50 border rounded-xl font-bold text-sm" onChange={(e)=>updateSettings('easyPaisaNo', e.target.value)} />
            </div>
          </section>

          <section className="bg-white p-6 md:p-8 rounded-[3rem] border-2 border-slate-50 shadow-sm space-y-4">
            <h2 className="text-xl font-black italic uppercase">Manage Categories</h2>
            <div className="flex gap-2">
                <input type="text" value={newCatName} placeholder="Name" className="w-full p-4 bg-slate-50 border rounded-xl font-bold text-sm" onChange={(e)=>setNewCatName(e.target.value)} />
                <button onClick={addCategory} className="bg-primary text-white px-6 rounded-xl font-black uppercase text-[10px]">Add</button>
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
                {categories.map(c => (
                    <div key={c.id} className="bg-slate-50 px-4 py-2 rounded-full text-[10px] font-bold border flex items-center gap-2">
                        {c.name}
                        <button onClick={()=>deleteDoc(doc(db,"categories",c.id))} className="text-red-500 font-black">x</button>
                    </div>
                ))}
            </div>
          </section>
        </div>

        {/* COLUMN 2: PUBLISH ITEM */}
       <section className="bg-slate-900 text-white p-8 md:p-10 rounded-[4rem] shadow-2xl border-b-8 border-primary relative overflow-hidden">
    <h2 className="text-3xl font-black mb-8 text-primary italic border-b border-white/10 pb-4 uppercase tracking-tighter">
      {editId ? "Update Item" : "Publish Item"}
    </h2>
    
    <form onSubmit={handlePublish} className="space-y-4 text-slate-800">
      {/* Product Name */}
      <input type="text" placeholder="Product Name" value={pName} className="w-full p-5 bg-white border-none rounded-2xl font-bold focus:ring-4 ring-primary/20 outline-none transition-all" onChange={(e)=>setPName(e.target.value)} />
      
      {/* Price & Stock */}
      <div className="flex gap-4">
        <div className="w-1/2">
          <p className="text-[9px] text-white/40 mb-1 font-black ml-2 uppercase">Price (PKR)</p>
          <input type="number" placeholder="0.00" value={pPrice} className="w-full p-5 bg-white border-none rounded-2xl font-bold outline-none" onChange={(e)=>setPPrice(e.target.value)} />
        </div>
        <div className="w-1/2">
          <p className="text-[9px] text-white/40 mb-1 font-black ml-2 uppercase">Stock Qty</p>
          <input type="number" placeholder="0" value={pStock} className="w-full p-5 bg-white border-none rounded-2xl font-bold outline-none" onChange={(e)=>setPStock(e.target.value)} />
        </div>
      </div>

      {/* --- NEW IMAGE UPLOAD SECTION --- */}
      <div className="space-y-2">
          <p className="text-[9px] text-white/40 mb-1 font-black ml-2 uppercase italic">Step 1: Upload Product Photo</p>
          <div className="relative group">
            <input 
              type="file" 
              accept="image/*"
              className="hidden" 
              id="file-upload"
              onChange={handleImageUpload} 
            />
            <label 
              htmlFor="file-upload" 
              className={`w-full p-5 bg-white/10 border-2 border-dashed border-white/20 rounded-2xl flex items-center justify-center cursor-pointer hover:border-primary transition-all ${uploading ? 'animate-pulse opacity-50' : ''}`}
            >
              <span className="text-white font-black uppercase text-xs">
                {uploading ? "Uploading to Cloud..." : pImg ? "Change Photo ✅" : "Select Photo from Device"}
              </span>
            </label>
          </div>
          {pImg && (
            <div className="mt-2 flex items-center gap-3 bg-white/5 p-2 rounded-xl border border-white/10">
               <img src={pImg} className="w-10 h-10 rounded-lg object-cover" alt="Preview" />
               <p className="text-[8px] text-primary font-black uppercase">Image Uploaded Successfully</p>
            </div>
          )}
      </div>

      {/* 3D Path */}
      <div className="space-y-1">
        <p className="text-[9px] text-white/40 mb-1 font-black ml-2 uppercase italic">Step 2: 3D Model Path (Optional)</p>
        <input type="text" placeholder="/models/shoe.glb" value={pModel} className="w-full p-5 bg-white/10 text-white border-none rounded-2xl text-xs italic outline-none focus:bg-white/20 transition-all" onChange={(e)=>setPModel(e.target.value)} />
      </div>

      {/* Category Selection */}
      <select value={pCat} className="w-full p-5 bg-white border-none rounded-2xl font-bold text-slate-400" onChange={(e)=>setPCat(e.target.value)}>
        <option value="">Choose Category</option>
        {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
      </select>

      {/* Description */}
      <textarea placeholder="Product Description..." value={pDesc} className="w-full p-5 bg-white border-none rounded-2xl h-36 font-medium resize-none" onChange={(e)=>setPDesc(e.target.value)} />
      
      {/* Submit Button */}
      <button 
        disabled={uploading}
        className={`w-full bg-primary text-white p-6 rounded-3xl font-black uppercase text-xl shadow-xl active:scale-95 transition-all mt-4 ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {editId ? "Update Product" : "Confirm & Publish"}
      </button>
    </form>
</section>

        {/* COLUMN 3: WAREHOUSE LIST */}
        <section className="bg-white p-8 rounded-[3rem] border-2 border-slate-50 shadow-sm h-full overflow-hidden">
          <div className="flex justify-between items-center mb-8 border-b pb-4">
            <h2 className="text-xl font-black italic uppercase tracking-tighter">Warehouse ({products.length})</h2>
            <button onClick={exportInventoryPDF} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase hover:bg-primary transition-all">Export PDF</button>
          </div>
          <div className="space-y-4 overflow-y-auto max-h-[750px] pr-2 custom-scrollbar">
            {products.map(p => (
              <div key={p.id} className="p-4 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center justify-between hover:border-primary transition-all group">
                <div className="flex items-center space-x-4">
                  <img src={p.image} className="w-14 h-14 rounded-2xl object-cover shadow-lg border-2 border-white group-hover:scale-110 transition" />
                  <div>
                    <p className="font-black text-sm uppercase italic leading-none">{p.name}</p>
                    <p className={`text-[9px] font-black mt-2 tracking-widest text-primary`}>STOCK: {p.stock}</p>
                  </div>
                </div>
                <div className="flex space-x-1">
                  <button onClick={() => { setEditId(p.id); setPName(p.name); setPPrice(p.price); setPImg(p.image); setPCat(p.category); setPStock(p.stock); setPDesc(p.description || ""); setPModel(p.model3D || ""); window.scrollTo(0,0); }} className="p-2 bg-blue-50 text-blue-600 rounded-xl text-[9px] font-black hover:bg-blue-600 hover:text-white transition">EDIT</button>
                  <button onClick={()=> deleteDoc(doc(db,"products",p.id))} className="p-2 bg-red-50 text-red-500 rounded-xl text-[9px] font-black hover:bg-red-600 hover:text-white transition">DEL</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ANALYTICS SCORECARDS */}
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
            </div>
        </section>

        {/* ORDERS TABLE */}
       <section className="col-span-full bg-white p-8 md:p-12 rounded-[4rem] border-2 border-slate-50 shadow-sm overflow-hidden mb-20">
  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4 border-b pb-6">
    <h2 className="text-2xl font-black italic uppercase tracking-tighter">Business Transactions Log</h2>
    <button onClick={exportSalesReportPDF} className="bg-primary text-white px-8 py-3 rounded-2xl font-black uppercase text-xs shadow-xl shadow-primary/20 hover:scale-105 transition-all">
      Export Sales Report (PDF)
    </button>          
  </div>
  
  <div className="overflow-x-auto">
    <table className="w-full text-left border-separate border-spacing-y-4">
      <thead>
        <tr className="text-slate-400 uppercase text-[10px] tracking-widest font-black px-6">
          <th className="px-6 pb-2">Client Details</th>
          <th className="px-6 pb-2">Order Items (Cart)</th>
          <th className="px-6 pb-2 text-center">Trx ID</th>
          <th className="px-6 pb-2 text-center">Process</th>
          <th className="px-6 pb-2 text-right">Actions</th>
        </tr>
      </thead>
      <tbody>
        {orders.map(o => (
          <tr key={o.id} className="bg-slate-50 hover:bg-slate-100/50 transition-all group">
            {/* 1. Client Details with Address & Note */}
            <td className="px-6 py-8 rounded-l-[2rem] font-bold text-xs">
              <span className="text-sm">{o.customerName}</span>
              <br/>
              <span className="text-[10px] font-normal text-slate-400 block max-w-[200px] truncate mt-1 italic leading-tight">{o.address}</span>
              {o.customerNote && (
                <div className="mt-2 p-2 bg-yellow-50 text-yellow-700 text-[9px] rounded-lg border border-yellow-100 italic">
                  " {o.customerNote} "
                </div>
              )}
            </td>

            {/* 2. Order Items List (Handles Cart & Single Orders) */}
            <td className="px-6 py-8 font-black uppercase text-sm">
              {o.items ? (
                <div className="space-y-1">
                  {o.items.map((item, idx) => (
                    <div key={idx} className="text-[10px] flex justify-between gap-4 border-b border-slate-200 pb-1 last:border-0">
                      <span className="text-slate-700">• {item.name}</span>
                      <span className="text-primary font-black">(x{item.quantity})</span>
                    </div>
                  ))}
                  <p className="text-primary font-mono font-black text-xs mt-2 pt-1">
                    TOTAL: Rs.{o.totalAmount || o.price}
                  </p>
                </div>
              ) : (
                <>
                  {o.productName} <br/>
                  <span className="text-primary font-mono font-normal text-[10px] tracking-widest mt-1 block">Rs.{o.price}</span>
                </>
              )}
            </td>

            {/* 3. Transaction ID */}
            <td className="px-6 py-8 font-mono text-[10px] text-slate-500 font-black text-center bg-white/50 rounded-xl shadow-inner mx-4">
              {o.transactionId}
            </td>

            {/* 4. Status Badge */}
            <td className="px-6 py-8 text-center">
              <span className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm ${o.status === 'Pending' ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'}`}>
                {o.status}
              </span>
            </td>

            {/* 5. Action Buttons */}
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
  </div>
</section>
      </div>
    </div>
  );
}