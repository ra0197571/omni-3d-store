import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import Hero3D from '../components/3d/Hero3D';
import { Link } from 'react-router-dom';

export default function Home() {
  const { settings } = useContext(AppContext);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null); // Checkout ke liye
  const [custName, setCustName] = useState("");
  const [custAddress, setCustAddress] = useState("");

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "products"), (s) => {
      setProducts(s.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const sendWhatsAppOrder = () => {
    if (!custName || !custAddress) return alert("Please fill your details!");
    
    const message = `*🔥 NEW ORDER ALERT!*%0A---------------------------%0A*Store:* ${settings.storeName}%0A*Product:* ${selectedProduct.name}%0A*Price:* Rs. ${selectedProduct.price}%0A---------------------------%0A*Customer:* ${custName}%0A*Address:* ${custAddress}%0A---------------------------%0A_Please confirm my order._`;
    
    window.open(`https://wa.me/${settings.whatsapp}?text=${message}`, '_blank');
    setSelectedProduct(null);
  };

  return (
    <div className="min-h-screen">
      <nav className="p-6 bg-primary text-white flex justify-between items-center shadow-2xl sticky top-0 z-50">
        <h1 className="text-3xl font-black italic uppercase tracking-tighter">{settings.storeName}</h1>
        <Link to="/admin" className="bg-white/20 px-5 py-2 rounded-full hover:bg-white/40 backdrop-blur-md">Admin</Link>
      </nav>

      {/* Hero Section */}
      <div className="flex flex-col md:flex-row items-center max-w-7xl mx-auto p-10 min-h-[70vh]">
        <div className="flex-1 text-center md:text-left">
          <motion.h2 initial={{x:-50, opacity:0}} animate={{x:0, opacity:1}} className="text-8xl font-black uppercase leading-none">
            Next Gen <br /> <span className="text-primary italic">Shopping</span>
          </motion.h2>
          <p className="mt-5 text-slate-500 font-medium tracking-widest uppercase">Premium 3D Experience</p>
        </div>
        <div className="flex-1 w-full h-[500px]">
          <Hero3D color={settings.primaryColor} />
        </div>
      </div>

      {/* Products */}
      <div className="max-w-7xl mx-auto p-10 grid grid-cols-1 md:grid-cols-4 gap-8">
        {products.map(p => (
          <motion.div whileHover={{y:-10}} key={p.id} className="bg-white p-4 rounded-[2.5rem] shadow-sm hover:shadow-2xl border border-slate-100 group">
             <div className="h-64 bg-slate-100 rounded-[2rem] mb-4 overflow-hidden">
                <img src={p.image} className="w-full h-full object-cover group-hover:scale-110 transition duration-700" />
             </div>
             <h3 className="font-bold text-xl px-2">{p.name}</h3>
             <div className="flex justify-between items-center mt-4 px-2">
                <span className="text-primary font-black text-2xl font-mono">Rs. {p.price}</span>
                <button 
                  onClick={() => setSelectedProduct(p)}
                  className="bg-primary text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-primary/30 active:scale-95 transition"
                >
                  Buy Now
                </button>
             </div>
          </motion.div>
        ))}
      </div>

      {/* --- CHECKOUT MODAL --- */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-5 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white p-8 rounded-[3rem] max-w-md w-full shadow-2xl overflow-hidden relative"
            >
              <h2 className="text-2xl font-black mb-4 uppercase italic text-primary">Complete Your Order</h2>
              <p className="text-slate-500 mb-6 font-medium">Buying: <span className="text-slate-900">{selectedProduct.name}</span></p>
              
              <div className="space-y-4">
                <input type="text" placeholder="Your Name" className="w-full p-4 bg-slate-100 rounded-2xl border-none outline-none focus:ring-2 ring-primary" onChange={(e)=>setCustName(e.target.value)} />
                <textarea placeholder="Delivery Address" className="w-full p-4 bg-slate-100 rounded-2xl border-none outline-none focus:ring-2 ring-primary" onChange={(e)=>setCustAddress(e.target.value)} />
                
                <div className="bg-primary/10 p-5 rounded-2xl border border-primary/20">
                   <p className="text-xs font-bold text-primary mb-2 uppercase">Payment Details (Manual)</p>
                   {settings.jazzCashNo && <p className="text-sm">JazzCash: <span className="font-bold">{settings.jazzCashNo}</span></p>}
                   {settings.easyPaisaNo && <p className="text-sm">EasyPaisa: <span className="font-bold">{settings.easyPaisaNo}</span></p>}
                   <p className="text-[10px] mt-2 text-slate-400 italic">*Payment kar ke screenshot WhatsApp pe bhejein.</p>
                </div>

                <button onClick={sendWhatsAppOrder} className="w-full bg-primary text-white p-5 rounded-2xl font-black uppercase text-lg shadow-xl shadow-primary/30">
                  Confirm via WhatsApp
                </button>
                <button onClick={() => setSelectedProduct(null)} className="w-full text-slate-400 font-bold">Cancel</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}