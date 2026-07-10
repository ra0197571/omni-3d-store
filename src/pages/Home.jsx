import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { collection, onSnapshot, addDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import Hero3D from '../components/3d/Hero3D';
import { Link } from 'react-router-dom';

export default function Home() {
  const { settings } = useContext(AppContext);
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState(""); // Search State
  const [selectedProduct, setSelectedProduct] = useState(null); 
  const [custName, setCustName] = useState("");
  const [custAddress, setCustAddress] = useState("");
  const [transId, setTransId] = useState("");

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "products"), (s) => {
      setProducts(s.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  // --- SEARCH LOGIC (Inside Component) ---
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sendWhatsAppOrder = async () => {
    if (!custName || !custAddress || !transId) {
        return alert("Please fill all details including Transaction ID!");
    }
    
    const orderData = {
      customerName: custName,
      address: custAddress,
      productName: selectedProduct.name,
      price: selectedProduct.price,
      transactionId: transId,
      status: "Pending",
      createdAt: new Date()
    };

    try {
      await addDoc(collection(db, "orders"), orderData);
    } catch (e) {
      console.log("Firebase Error:", e);
    }

    const message = `*🔥 NEW ORDER ALERT!*%0A---------------------------%0A*Store:* ${settings.storeName}%0A*Product:* ${selectedProduct.name}%0A*Price:* Rs. ${selectedProduct.price}%0A*Trx ID:* ${transId}%0A---------------------------%0A*Customer:* ${custName}%0A*Address:* ${custAddress}`;
    
    window.open(`https://wa.me/${settings.whatsapp}?text=${message}`, '_blank');
    setSelectedProduct(null);
    setTransId("");
  };

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Navbar - Responsive Padding */}
      <nav className="p-4 md:p-6 bg-primary text-white flex justify-between items-center shadow-xl sticky top-0 z-50">
        <h1 className="text-xl md:text-3xl font-black italic uppercase tracking-tighter truncate max-w-[200px] md:max-w-none">
          {settings.storeName}
        </h1>
        <Link to="/admin" className="bg-white/20 px-4 py-2 rounded-full hover:bg-white/40 backdrop-blur-md text-sm md:text-base font-bold">
          Admin
        </Link>
      </nav>

      {/* Hero Section - Responsive Typography */}
      <div className="flex flex-col md:flex-row items-center max-w-7xl mx-auto p-6 md:p-10 gap-10 min-h-[60vh]">
        <div className="flex-1 text-center md:text-left order-2 md:order-1">
          <motion.h2 
            initial={{x:-50, opacity:0}} 
            animate={{x:0, opacity:1}} 
            className="text-5xl md:text-8xl font-black uppercase leading-[0.9] tracking-tighter"
          >
            Next Gen <br /> <span className="text-primary italic">Shopping</span>
          </motion.h2>
          <p className="mt-5 text-slate-400 font-medium tracking-widest uppercase text-xs md:text-sm">
            Premium 3D Experience
          </p>
        </div>
        <div className="flex-1 w-full h-[350px] md:h-[500px] order-1 md:order-2">
          <Hero3D color={settings.primaryColor} />
        </div>
      </div>

      {/* Search Bar Section - Modern Responsive Design */}
      <div className="max-w-7xl mx-auto px-6 md:px-10 mb-10">
        <div className="relative">
          <input 
            type="text" 
            placeholder="Search for products..." 
            className="w-full p-5 md:p-7 bg-white shadow-2xl shadow-primary/5 rounded-[2rem] border-none outline-none focus:ring-4 ring-primary/20 pl-14 text-lg"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl opacity-30">🔍</span>
        </div>
      </div>

      {/* Products Grid - 1 col on mobile, 2 on tablet, 4 on desktop */}
      <div className="max-w-7xl mx-auto p-6 md:p-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
        {filteredProducts.map(p => (
          <motion.div whileHover={{y:-10}} key={p.id} className="bg-white p-4 rounded-[2.5rem] shadow-sm hover:shadow-2xl border border-slate-100 group">
             <div className="h-64 bg-slate-100 rounded-[2rem] mb-4 overflow-hidden relative">
                <img src={p.image} className="w-full h-full object-cover group-hover:scale-110 transition duration-700" alt={p.name} />
             </div>
             <h3 className="font-bold text-xl px-2 truncate">{p.name}</h3>
             <div className="flex justify-between items-center mt-4 px-2">
                <span className="text-primary font-black text-2xl">Rs.{p.price}</span>
                <button 
                  onClick={() => setSelectedProduct(p)}
                  className="bg-primary text-white px-5 py-3 rounded-2xl font-bold shadow-lg shadow-primary/30 active:scale-95 transition text-sm"
                >
                  Buy Now
                </button>
             </div>
          </motion.div>
        ))}
        {filteredProducts.length === 0 && (
          <div className="col-span-full text-center p-20 text-slate-400 font-bold">No products found matching your search.</div>
        )}
      </div>

      {/* --- CHECKOUT MODAL - Fully Responsive --- */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-5 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ y: 50, opacity: 0 }} 
              animate={{ y: 0, opacity: 1 }} 
              exit={{ y: 50, opacity: 0 }}
              className="bg-white p-6 md:p-8 rounded-[2.5rem] md:rounded-[3rem] max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-3 md:p-4 bg-primary/20 rounded-2xl text-3xl">🛍️</div>  
                <h2 className="text-xl md:text-2xl font-black uppercase italic text-primary">Complete Order</h2>
              </div>
              
              <div className="space-y-4">
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">You are buying:</p>
                <div className="bg-slate-50 p-4 rounded-2xl font-bold text-slate-800 border">{selectedProduct.name}</div>

                <input type="text" placeholder="Your Name" className="w-full p-4 bg-slate-100 rounded-2xl outline-none focus:ring-2 ring-primary border-none" onChange={(e)=>setCustName(e.target.value)} />
                <textarea placeholder="Full Delivery Address" className="w-full p-4 bg-slate-100 rounded-2xl outline-none focus:ring-2 ring-primary border-none h-24" onChange={(e)=>setCustAddress(e.target.value)} />
                
                <div className="bg-primary/5 p-5 rounded-2xl border-2 border-dashed border-primary/20 text-center">
                   <p className="text-[10px] font-black text-primary uppercase mb-2">Send Payment To:</p>
                   <div className="text-sm font-bold space-y-1">
                      {settings.jazzCashNo && <div className="bg-white p-2 rounded-xl">JazzCash: {settings.jazzCashNo}</div>}
                      {settings.easyPaisaNo && <div className="bg-white p-2 rounded-xl">EasyPaisa: {settings.easyPaisaNo}</div>}
                   </div>
                </div>

                <input 
                  type="text" 
                  placeholder="Enter 10-Digit Trx ID" 
                  className="w-full p-5 bg-primary/10 border-2 border-primary rounded-2xl outline-none text-center font-black text-primary text-xl" 
                  onChange={(e) => setTransId(e.target.value)} 
                />

                <button onClick={sendWhatsAppOrder} className="w-full bg-primary text-white p-5 rounded-2xl font-black uppercase text-lg shadow-xl shadow-primary/40 active:scale-95 transition">
                  Confirm via WhatsApp
                </button>
                <button onClick={() => setSelectedProduct(null)} className="w-full text-slate-400 font-bold py-2 hover:text-red-500 transition">Cancel Order</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}