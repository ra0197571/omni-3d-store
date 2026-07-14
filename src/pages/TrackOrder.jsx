import React, { useState, useContext, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import Footer from '../components/Footer';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function TrackOrder() {
  const { user } = useContext(AuthContext);
  const [trxId, setTrxId] = useState("");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [history, setHistory] = useState([]);

  // --- 5 PROFESSIONAL STATUSES ---
  const statuses = ["Pending", "Processing", "Packed", "Shipped", "Delivered"];

  useEffect(() => {
    if (user) {
      const q = query(collection(db, "orders"), where("userId", "==", user.uid));
      const unsub = onSnapshot(q, (snapshot) => {
        setHistory(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
      return () => unsub();
    }
  }, [user]);

  const handleTrack = async (e) => {
    e.preventDefault();
    if(!trxId) return;
    setLoading(true);
    setSearched(true);
    try {
      const q = query(collection(db, "orders"), where("transactionId", "==", trxId));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        setOrder(querySnapshot.docs[0].data());
      } else {
        setOrder(null);
      }
    } catch (e) { console.log(e); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      <nav className="p-6 flex justify-between items-center max-w-7xl mx-auto">
        <Link to="/" className="font-black italic text-primary uppercase tracking-tighter hover:scale-105 transition-all">← Back to Store</Link>
      </nav>

      <div className="max-w-4xl mx-auto p-6 md:p-20 text-center space-y-10">
        <div className="space-y-4">
          <h1 className="text-5xl md:text-7xl font-black uppercase italic leading-none tracking-tighter">Track Your <br/> <span className="text-primary">Package</span></h1>
          <p className="text-slate-400 font-bold uppercase text-xs tracking-[0.2em]">Live Order Monitoring System</p>
        </div>

        <form onSubmit={handleTrack} className="relative max-w-lg mx-auto">
          <input 
            type="text" 
            placeholder="Enter Transaction ID" 
            className="w-full p-6 md:p-8 bg-slate-50 rounded-[2.5rem] border-none outline-none focus:ring-4 ring-primary/10 text-center font-black text-2xl shadow-inner"
            onChange={(e) => setTrxId(e.target.value)}
          />
          <button className="mt-6 w-full bg-slate-900 text-white p-6 rounded-[2rem] font-black uppercase shadow-2xl active:scale-95 transition-all hover:bg-black">Track Order Live</button>
        </form>

        <div className="pt-10">
          {loading && <div className="animate-pulse font-black text-primary uppercase tracking-widest">Accessing Satellite Data...</div>}
          
          <AnimatePresence>
            {searched && !loading && (
              order ? (
                <motion.div initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} className="bg-slate-900 text-white p-10 rounded-[4rem] text-left border-b-[12px] border-primary shadow-2xl">
                  <div className="flex justify-between items-start mb-10">
                     <div>
                        <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Receiver Name</p>
                        <h2 className="text-3xl font-black uppercase italic">{order.customerName}</h2>
                     </div>
                     <div className="text-right">
                        <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Current Milestone</p>
                        <span className="bg-white text-primary px-5 py-2 rounded-full font-black uppercase text-[10px] shadow-lg">{order.status}</span>
                     </div>
                  </div>
                  
                  <div className="space-y-4 border-t border-white/10 pt-8">
                    <div className="flex justify-between items-center text-sm border-b border-white/5 pb-4">
                       <span className="text-slate-500 font-bold uppercase tracking-widest">Ordered Item</span>
                       <span className="font-black italic">{order.productName}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                       <span className="text-slate-500 font-bold uppercase tracking-widest">Total Valuation</span>
                       <span className="font-black text-xl text-primary font-mono">Rs.{order.totalAmount || order.price}</span>
                    </div>
                  </div>

                  {/* --- NEW 5-STEP PROGRESS BAR --- */}
                  <div className="mt-12 flex gap-1 items-start">
                    {statuses.map((s, i) => {
                      const orderStatusIndex = statuses.indexOf(order.status);
                      const isCompleted = i <= orderStatusIndex;
                      
                      return (
                        <div key={s} className="flex-1 flex flex-col items-center gap-3">
                          {/* Progress Line */}
                          <div className={`h-2.5 w-full rounded-full transition-all duration-700 ${isCompleted ? 'bg-primary shadow-[0_0_20px_rgba(255,0,0,0.6)]' : 'bg-white/10'}`}></div>
                          {/* Status Label */}
                          <p className={`text-[8px] md:text-[9px] font-black uppercase tracking-tighter text-center leading-none ${isCompleted ? 'text-primary' : 'text-slate-600'}`}>
                            {s}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  <p className="mt-8 text-[9px] font-bold text-center text-slate-500 uppercase tracking-[0.3em] italic border-t border-white/5 pt-6">Your order is being handled with 3D Precision</p>
                </motion.div>
              ) : (
                <p className="font-black text-red-500 uppercase italic bg-red-50 p-6 rounded-3xl inline-block border-2 border-red-100 shadow-sm">Invalid Transaction ID. Please verify and try again.</p>
              )
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* --- LIVE ORDER HISTORY --- */}
      {user && (
        <div className="max-w-4xl mx-auto p-6 md:p-10 border-t border-slate-100 mt-20 mb-20">
          <h2 className="text-4xl font-black italic uppercase mb-10 tracking-tighter">Your <span className="text-primary underline">Order History</span></h2>
          <div className="grid gap-6">
            {history.length > 0 ? (
              history.map(item => (
                <div key={item.id} className="bg-white p-8 rounded-[3rem] flex flex-col md:flex-row justify-between items-center border border-slate-200 hover:shadow-2xl transition-all group cursor-pointer">
                   <div className="text-center md:text-left">
                      <p className="text-[10px] font-black text-slate-300 uppercase mb-1">Manifest</p>
                      <h3 className="font-black text-xl uppercase italic group-hover:text-primary transition-colors leading-none">{item.productName}</h3>
                      <p className="text-[10px] font-bold text-slate-400 font-mono mt-2">TXN: {item.transactionId}</p>
                   </div>
                   <div className="mt-4 md:mt-0 text-center">
                      <p className="text-[10px] font-black text-slate-300 uppercase mb-2">Stage</p>
                      <span className={`px-6 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${item.status === 'Delivered' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                        {item.status}
                      </span>
                   </div>
                   <div className="mt-4 md:mt-0 text-center md:text-right">
                      <p className="text-[10px] font-black text-slate-300 uppercase mb-1">Invoice</p>
                      <p className="font-black text-2xl text-slate-900 font-mono">Rs.{item.totalAmount || item.price}</p>
                   </div>
                </div>
              ))
            ) : (
              <p className="text-slate-400 font-bold italic text-center py-20 bg-slate-50 rounded-[4rem] border-2 border-dashed border-slate-100 uppercase tracking-widest">No previous transaction found in our system.</p>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}