import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot, addDoc, updateDoc, collection } from 'firebase/firestore';
import { db } from '../services/firebase';
import { AppContext } from '../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { settings } = useContext(AppContext);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  // Checkout States
  const [showModal, setShowModal] = useState(false);
  const [custName, setCustName] = useState("");
  const [custAddress, setCustAddress] = useState("");
  const [transId, setTransId] = useState("");

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "products", id), (doc) => {
      if (doc.exists()) {
        setProduct({ id: doc.id, ...doc.data() });
      }
      setLoading(false);
    });
    return () => unsub();
  }, [id]);

  const handleOrder = async () => {
    if (!custName || !custAddress || !transId) return alert("Fill all details!");
    try {
      // Stock Update
      await updateDoc(doc(db, "products", id), { stock: Number(product.stock) - 1 });
      // Save Order
      await addDoc(collection(db, "orders"), {
        customerName: custName, address: custAddress,
        productName: product.name, price: product.price,
        transactionId: transId, status: "Pending", createdAt: new Date()
      });
      // WhatsApp
      const message = `*🔥 NEW ORDER!*%0A*Product:* ${product.name}%0A*Trx ID:* ${transId}%0A*Customer:* ${custName}`;
      window.open(`https://wa.me/${settings.whatsapp}?text=${message}`, '_blank');
      setShowModal(false);
    } catch (e) { alert("Error!"); }
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-black italic">Loading...</div>;
  if (!product) return <div className="h-screen flex items-center justify-center">Product not found.</div>;

  return (
    <div className="min-h-screen bg-white p-5 md:p-20">
      <button onClick={() => navigate(-1)} className="mb-10 font-bold text-primary">← Go Back</button>
      
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-20">
        {/* Left: Image */}
        <div className="flex-1">
          <motion.div initial={{opacity:0, scale:0.9}} animate={{opacity:1, scale:1}} className="bg-slate-50 rounded-[3rem] overflow-hidden sticky top-20 shadow-2xl">
            <img src={product.image} className="w-full h-full object-cover" alt={product.name} />
          </motion.div>
        </div>

        {/* Right: Info */}
        <div className="flex-1 space-y-8">
          <div className="space-y-2">
             <span className="bg-primary/10 text-primary px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest">{product.category}</span>
             <h1 className="text-5xl md:text-7xl font-black uppercase italic leading-none">{product.name}</h1>
          </div>

          <p className="text-5xl font-black text-primary font-mono italic">Rs.{product.price}</p>
          
          <div className="space-y-4 border-t pt-8">
             <h3 className="font-black uppercase italic text-slate-400">Description</h3>
             <p className="text-slate-600 leading-relaxed text-lg whitespace-pre-wrap">{product.description || "No description provided."}</p>
          </div>

          <div className="bg-slate-50 p-6 rounded-3xl flex items-center justify-between border">
             <div>
                <p className="text-[10px] font-black text-slate-400 uppercase">Availability</p>
                <p className={`font-black uppercase italic ${product.stock > 0 ? 'text-green-500' : 'text-red-500'}`}>
                   {product.stock > 0 ? `${product.stock} Units in Stock` : "Out of Stock"}
                </p>
             </div>
             {product.stock > 0 && (
               <button onClick={() => setShowModal(true)} className="bg-primary text-white px-10 py-5 rounded-2xl font-black uppercase italic shadow-xl shadow-primary/30 active:scale-95 transition">Buy Now</button>
             )}
          </div>
        </div>
      </div>

      {/* Checkout Modal (Same Logic) */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div initial={{y:100}} animate={{y:0}} className="bg-white p-8 rounded-[3rem] max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
               {/* Same modal content as Home.jsx... (Simplified for brevity) */}
               <h2 className="text-2xl font-black uppercase italic text-primary mb-6">Complete Checkout</h2>
               <div className="space-y-4 text-sm">
                  <input type="text" placeholder="Name" className="w-full p-5 bg-slate-50 rounded-2xl" onChange={(e)=>setCustName(e.target.value)} />
                  <textarea placeholder="Address" className="w-full p-5 bg-slate-50 rounded-2xl h-24" onChange={(e)=>setCustAddress(e.target.value)} />
                  <div className="bg-slate-900 text-white p-6 rounded-2xl font-mono text-xs">
                    JazzCash/EasyPaisa: {settings.jazzCashNo || settings.whatsapp}
                  </div>
                  <input type="text" placeholder="Transaction ID" className="w-full p-5 bg-primary/5 border-2 border-primary rounded-2xl font-black text-center text-xl" onChange={(e)=>setTransId(e.target.value)} />
                  <button onClick={handleOrder} className="w-full bg-primary text-white p-5 rounded-2xl font-black uppercase shadow-2xl">Confirm Order</button>
                  <button onClick={()=>setShowModal(false)} className="w-full text-slate-400 py-2 font-bold uppercase text-[10px] tracking-widest">Cancel</button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}