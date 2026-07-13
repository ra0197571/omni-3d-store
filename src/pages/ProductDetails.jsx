import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot, addDoc, updateDoc, collection } from 'firebase/firestore';
import { db } from '../services/firebase';
import { AppContext } from '../context/AppContext';
import { AuthContext } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import Product3DViewer from '../components/3d/Product3DViewer';
import Footer from '../components/Footer'; 

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { settings } = useContext(AppContext);
  const { user } = useContext(AuthContext);
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  // Checkout States
  const [showModal, setShowModal] = useState(false);
  const [custName, setCustName] = useState("");
  const [custAddress, setCustAddress] = useState("");
  const [transId, setTransId] = useState("");
  const [qty, setQty] = useState(1); // Default quantity 1
  const [note, setNote] = useState(""); // Extra message

  const themeColor = settings.primaryColor || "#ff0000";

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
    if (!custName || !custAddress || !transId) return alert("Please fill all details!");
    if (qty > product.stock) return alert("Not enough stock available!");

    try {
      // 1. Update Stock based on Quantity
      await updateDoc(doc(db, "products", id), { 
        stock: Number(product.stock) - Number(qty) 
      });
      
      // 2. Save Order with Details
      await addDoc(collection(db, "orders"), {
        customerName: custName, 
        address: custAddress,
        productName: product.name, 
        price: Number(product.price) * Number(qty),
        quantity: qty,
        customerNote: note,
        transactionId: transId, 
        status: "Pending", 
        createdAt: new Date(),
        userId: user ? user.uid : "guest"
      });

      // 3. Open WhatsApp
      const message = `*🔥 NEW ORDER!*%0A---------------------------%0A*Product:* ${product.name}%0A*Qty:* ${qty}%0A*Total Price:* Rs. ${Number(product.price) * qty}%0A*Note:* ${note || 'None'}%0A---------------------------%0A*Customer:* ${custName}%0A*Address:* ${custAddress}%0A*Trx ID:* ${transId}`;
      window.open(`https://wa.me/${settings.whatsapp}?text=${message}`, '_blank');
      
      alert("Order Placed Successfully!");
      setShowModal(false);
    } catch (e) {
      alert("Error: " + e.message);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-black animate-pulse">LOADING...</div>;
  if (!product) return <div className="h-screen flex items-center justify-center font-black">PRODUCT NOT FOUND</div>;

  return (
    <div className="min-h-screen bg-white font-sans">
      <div className="p-5 md:p-10 lg:p-20">
          <div className="max-w-7xl mx-auto flex justify-between items-center mb-16">
              <button onClick={() => navigate(-1)} className="font-black uppercase italic hover:tracking-widest transition-all" style={{ color: themeColor }}>← Back to Store</button>
              <span className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-300">OMNI-3D INTERACTIVE</span>
          </div>
          
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-16">
            <div className="flex-1 space-y-12">
              <div className="bg-slate-50 rounded-[3.5rem] overflow-hidden shadow-2xl border-4 border-white">
                <img src={product.image} className="w-full h-auto object-cover" alt={product.name} />
              </div>
              {product.model3D && <Product3DViewer modelUrl={product.model3D} />}
            </div>

            <div className="flex-1 space-y-12">
              <div className="space-y-4">
                 <span className="bg-slate-100 px-6 py-2 rounded-full text-[10px] font-black uppercase inline-block" style={{ color: themeColor }}>{product.category}</span>
                 <h1 className="text-6xl font-black uppercase italic leading-none">{product.name}</h1>
              </div>
              <p className="text-5xl font-black font-mono italic" style={{ color: themeColor }}>Rs.{product.price}</p>
              <p className="text-slate-600 text-xl font-medium">{product.description}</p>

              <div className="bg-slate-900 text-white p-10 rounded-[4rem] flex flex-col md:flex-row items-center justify-between gap-8 border-b-8" style={{ borderBottomColor: themeColor }}>
                 <p className="text-2xl font-black uppercase italic">{product.stock > 0 ? `${product.stock} In Stock` : "Out of Stock"}</p>
                 {product.stock > 0 && <button onClick={() => setShowModal(true)} className="w-full md:w-auto text-white px-14 py-6 rounded-3xl font-black uppercase italic text-xl shadow-xl active:scale-95 transition-all" style={{ backgroundColor: themeColor }}>Buy Now</button>}
              </div>
            </div>
          </div>
      </div>

      <Footer />

      {/* Checkout Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div initial={{scale:0.9, opacity:0}} animate={{scale:1, opacity:1}} className="bg-white p-8 md:p-12 rounded-[4rem] max-w-lg w-full shadow-2xl relative max-h-[95vh] overflow-y-auto border-t-8" style={{ borderTopColor: themeColor }}>
               
               <h2 className="text-3xl font-black uppercase italic text-center mb-10" style={{ color: themeColor }}>Checkout</h2>

               <div className="space-y-5">
                  {/* Order Preview */}
                  <div className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center border border-dashed border-slate-200">
                    <p className="font-bold uppercase text-xs">Product: {product.name}</p>
                    <div className="flex items-center gap-3">
                        <p className="text-[10px] font-black uppercase opacity-40">Qty:</p>
                        <input type="number" value={qty} min="1" max={product.stock} className="w-16 p-2 bg-white border-2 rounded-xl text-center font-black" style={{ borderColor: themeColor }} onChange={(e) => setQty(e.target.value)} />
                    </div>
                  </div>

                  <input type="text" placeholder="Your Full Name" className="w-full p-5 bg-slate-50 rounded-2xl font-bold outline-none" onChange={(e)=>setCustName(e.target.value)} />
                  <textarea placeholder="Delivery Address" className="w-full p-5 bg-slate-50 rounded-2xl h-24 font-bold outline-none" onChange={(e)=>setCustAddress(e.target.value)} />
                  
                  {/* Extra Note Box */}
                  <textarea placeholder="Any message for us? (Optional)" className="w-full p-5 bg-slate-50 rounded-2xl h-20 font-bold outline-none text-sm italic" onChange={(e)=>setNote(e.target.value)} />

                  <div className="bg-slate-900 text-white p-6 rounded-[2.5rem] shadow-xl text-center">
                    <p className="text-[10px] font-black uppercase mb-2 tracking-widest" style={{ color: themeColor }}>Grand Total</p>
                    <h3 className="text-4xl font-black italic">Rs.{Number(product.price) * qty}</h3>
                    <div className="mt-4 pt-4 border-t border-white/5 space-y-1 text-[10px] font-bold font-mono">
                      {settings.jazzCashNo && <div className="flex justify-between"><span>JazzCash</span><span style={{ color: themeColor }}>{settings.jazzCashNo}</span></div>}
                      {settings.easyPaisaNo && <div className="flex justify-between"><span>EasyPaisa</span><span style={{ color: themeColor }}>{settings.easyPaisaNo}</span></div>}
                    </div>
                  </div>

                  <input type="text" placeholder="Enter Transaction ID" className="w-full p-5 bg-primary/5 border-2 rounded-3xl outline-none text-center font-black text-2xl" style={{ borderColor: themeColor, color: themeColor }} onChange={(e)=>setTransId(e.target.value)} />

                  <button onClick={handleOrder} className="w-full text-white p-6 rounded-3xl font-black uppercase text-xl shadow-xl active:scale-95 transition-all" style={{ backgroundColor: themeColor }}>Confirm Order</button>
                  <button onClick={()=>setShowModal(false)} className="w-full text-slate-400 py-2 font-black uppercase text-[10px] text-center">Cancel</button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}