import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot, addDoc, updateDoc, collection } from 'firebase/firestore';
import { db } from '../services/firebase';
import { AppContext } from '../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import Product3DViewer from '../components/3d/Product3DViewer';
import Footer from '../components/Footer'; 

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
      // 1. Update Stock
      await updateDoc(doc(db, "products", id), { stock: Number(product.stock) - 1 });
      
      // 2. Save Order
      await addDoc(collection(db, "orders"), {
        customerName: custName, address: custAddress,
        productName: product.name, price: product.price,
        transactionId: transId, status: "Pending", createdAt: new Date()
      });

      // 3. Open WhatsApp
      const message = `*🔥 NEW ORDER!*%0A---------------------------%0A*Product:* ${product.name}%0A*Price:* Rs. ${product.price}%0A*Trx ID:* ${transId}%0A---------------------------%0A*Customer:* ${custName}%0A*Address:* ${custAddress}`;
      window.open(`https://wa.me/${settings.whatsapp}?text=${message}`, '_blank');
      
      setShowModal(false);
    } catch (e) {
      alert("Error placing order. Check connection.");
    }
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white space-y-4">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      <p className="font-black italic uppercase text-slate-300 tracking-[0.5em]">Loading Experience</p>
    </div>
  );

  if (!product) return <div className="h-screen flex items-center justify-center font-black uppercase text-red-500">Product not found.</div>;

  return (
    <div className="min-h-screen bg-white">
      <div className="p-5 md:p-10 lg:p-20">
          {/* Header */}
          <div className="max-w-7xl mx-auto flex justify-between items-center mb-16">
              <button onClick={() => navigate(-1)} className="font-black uppercase italic text-primary hover:tracking-widest transition-all">← Back to Store</button>
              <span className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-300 hidden md:block">OMNI-3D INTERACTIVE</span>
          </div>
          
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-16 md:gap-24">
            
            {/* Left Column: Visuals */}
            <div className="flex-1 space-y-12">
              <motion.div initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} className="bg-slate-50 rounded-[3.5rem] overflow-hidden shadow-2xl border-4 border-white">
                <img src={product.image} className="w-full h-auto object-cover" alt={product.name} />
              </motion.div>

              {/* 3D Model Section */}
              {product.model3D && (
                <motion.div initial={{opacity:0}} whileInView={{opacity:1}} viewport={{once:true}} className="space-y-6">
                  <div className="flex items-center space-x-4 border-l-4 border-primary pl-4">
                    <h3 className="font-black uppercase italic text-slate-400 text-sm tracking-[0.2em]">3D Interactive Preview</h3>
                  </div>
                  <Product3DViewer modelUrl={product.model3D} />
                  <p className="text-center text-[10px] font-black text-slate-300 uppercase tracking-widest italic">Touch to rotate • Scroll to zoom</p>
                </motion.div>
              )}
            </div>

            {/* Right Column: Information */}
            <div className="flex-1 space-y-12">
              <div className="space-y-4">
                 <span className="bg-primary/10 text-primary px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.3em] inline-block shadow-sm">
                    {product.category}
                 </span>
                 <h1 className="text-5xl md:text-7xl lg:text-8xl font-black uppercase italic leading-[0.85] tracking-tighter text-slate-900">
                    {product.name}
                 </h1>
              </div>

              <div className="flex items-baseline space-x-3">
                 <p className="text-5xl md:text-7xl font-black text-primary font-mono italic">Rs.{product.price}</p>
                 <span className="text-slate-300 font-bold uppercase text-[10px] tracking-widest">Inclusive of taxes</span>
              </div>
              
              <div className="space-y-6 border-t border-slate-100 pt-12">
                 <h3 className="font-black uppercase italic text-slate-400 tracking-[0.2em] text-xs">Product Description</h3>
                 <p className="text-slate-600 leading-relaxed text-xl font-medium whitespace-pre-wrap">
                    {product.description || "Experience the future of premium shopping with our next-generation 3D visualization and interactive store interface."}
                 </p>
              </div>

              {/* Action Box */}
              <div className="bg-slate-900 text-white p-10 rounded-[4rem] flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl border-b-8 border-primary">
                 <div className="text-center md:text-left">
                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-2">Availability</p>
                    <p className={`text-2xl font-black uppercase italic ${product.stock > 0 ? 'text-white' : 'text-red-500'}`}>
                       {product.stock > 0 ? `${product.stock} Units Left` : "Out of Stock"}
                    </p>
                 </div>
                 
                 {product.stock > 0 ? (
                   <button 
                     onClick={() => setShowModal(true)} 
                     className="w-full md:w-auto bg-primary text-white px-14 py-6 rounded-3xl font-black uppercase italic text-xl shadow-xl shadow-primary/40 active:scale-95 transition-all hover:px-16"
                   >
                     Buy Now
                   </button>
                 ) : (
                   <button disabled className="w-full md:w-auto bg-slate-800 text-slate-600 px-14 py-6 rounded-3xl font-black uppercase italic cursor-not-allowed border border-white/5">
                     Sold Out
                   </button>
                 )}
              </div>
            </div>
          </div>
      </div>

      <Footer />

      {/* Checkout Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div initial={{scale:0.9, opacity:0}} animate={{scale:1, opacity:1}} exit={{scale:0.9, opacity:0}} className="bg-white p-8 md:p-12 rounded-[4rem] max-w-md w-full shadow-2xl relative max-h-[95vh] overflow-y-auto border-t-8 border-primary">
               <div className="text-center mb-10">
                 <h2 className="text-3xl font-black uppercase italic text-primary leading-none">Checkout</h2>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Secure Manual Payment Process</p>
               </div>

               <div className="space-y-5">
                  <div className="space-y-1">
                     <label className="text-[10px] font-black uppercase text-slate-400 ml-3">Your Full Name</label>
                     <input type="text" placeholder="Ahmad Ali" className="w-full p-5 bg-slate-50 rounded-2xl font-bold outline-none focus:ring-2 ring-primary transition-all" onChange={(e)=>setCustName(e.target.value)} />
                  </div>

                  <div className="space-y-1">
                     <label className="text-[10px] font-black uppercase text-slate-400 ml-3">Delivery Address</label>
                     <textarea placeholder="Complete House Address..." className="w-full p-5 bg-slate-50 rounded-2xl h-28 font-bold outline-none focus:ring-2 ring-primary resize-none transition-all" onChange={(e)=>setCustAddress(e.target.value)} />
                  </div>

                  {/* Payment Details */}
                  <div className="bg-slate-900 text-white p-6 rounded-[2.5rem] border-2 border-primary/30 shadow-xl">
                    <p className="text-[10px] font-black text-primary uppercase mb-4 tracking-widest text-center italic underline">Payable: Rs.{product.price}</p>
                    <div className="space-y-3 text-xs font-bold font-mono">
                      {settings.jazzCashNo && <div className="flex justify-between border-b border-white/5 pb-2"><span>JazzCash</span><span className="text-primary">{settings.jazzCashNo}</span></div>}
                      {settings.easyPaisaNo && <div className="flex justify-between"><span>EasyPaisa</span><span className="text-primary">{settings.easyPaisaNo}</span></div>}
                    </div>
                  </div>

                  <div className="space-y-1">
                     <label className="text-[10px] font-black uppercase text-primary ml-3 tracking-widest italic">Enter Transaction ID (10-Digits)</label>
                     <input type="text" placeholder="Trx ID" className="w-full p-5 bg-primary/5 border-2 border-primary rounded-3xl outline-none text-center font-black text-primary text-2xl tracking-tighter" onChange={(e)=>setTransId(e.target.value)} />
                  </div>

                  <button onClick={handleOrder} className="w-full bg-primary text-white p-6 rounded-3xl font-black uppercase text-xl shadow-2xl shadow-primary/40 active:scale-95 transition-all mt-4 hover:shadow-primary/60">
                    Confirm Order
                  </button>
                  <button onClick={()=>setShowModal(false)} className="w-full text-slate-400 py-2 font-black uppercase text-[10px] tracking-[0.3em] hover:text-red-500 transition-colors">Wait, Go Back</button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}