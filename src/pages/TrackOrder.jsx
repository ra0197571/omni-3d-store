import React, { useState, useContext, useEffect } from 'react'; // useContext aur useEffect add kiya
import { db } from '../services/firebase';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import Footer from '../components/Footer';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext'; // AuthContext import kiya

export default function TrackOrder() {
  const { user } = useContext(AuthContext); // User ko yahan define kiya
  const [trxId, setTrxId] = useState("");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [history, setHistory] = useState([]); // History state

  // --- LIVE ORDER HISTORY FETCH ---
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
    <div className="min-h-screen bg-white font-sans">
      <nav className="p-6 flex justify-between items-center max-w-7xl mx-auto">
        <Link to="/" className="font-black italic text-primary uppercase tracking-tighter">← Back to Store</Link>
      </nav>

      <div className="max-w-4xl mx-auto p-6 md:p-20 text-center space-y-10">
        <div className="space-y-4">
          <h1 className="text-5xl md:text-7xl font-black uppercase italic leading-none">Track Your <br/> <span className="text-primary font-mono">Package</span></h1>
          <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Enter your 10-digit transaction ID to see status</p>
        </div>

        <form onSubmit={handleTrack} className="relative max-w-lg mx-auto">
          <input 
            type="text" 
            placeholder="e.g. 0123456789" 
            className="w-full p-6 md:p-8 bg-slate-50 rounded-[2.5rem] border-none outline-none focus:ring-4 ring-primary/10 text-center font-black text-2xl shadow-inner"
            onChange={(e) => setTrxId(e.target.value)}
          />
          <button className="mt-6 w-full bg-slate-900 text-white p-6 rounded-[2rem] font-black uppercase shadow-xl active:scale-95 transition-all">Track Order Live</button>
        </form>

        <div className="pt-10">
          {loading && <div className="animate-bounce font-black text-primary uppercase">Searching Database...</div>}
          
          <AnimatePresence>
            {searched && !loading && (
              order ? (
                <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="bg-slate-900 text-white p-10 rounded-[3rem] text-left border-b-8 border-primary shadow-2xl">
                  <div className="flex justify-between items-start mb-8">
                     <div>
                        <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Customer Name</p>
                        <h2 className="text-2xl font-black uppercase italic">{order.customerName}</h2>
                     </div>
                     <div className="text-right">
                        <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Order Status</p>
                        <span className="bg-white text-slate-900 px-4 py-1 rounded-full font-black uppercase text-[10px] shadow-lg">{order.status}</span>
                     </div>
                  </div>
                  
                  <div className="space-y-4 border-t border-white/10 pt-6">
                    <div className="flex justify-between text-sm">
                       <span className="text-slate-400">Product:</span>
                       <span className="font-bold">{order.productName}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                       <span className="text-slate-400">Amount Paid:</span>
                       <span className="font-bold">Rs.{order.price}</span>
                    </div>
                  </div>

                  {/* Status Progress Bar */}
                  <div className="mt-10 flex gap-2">
                     <div className={`h-2 flex-1 rounded-full ${order.status === 'Pending' || order.status === 'Shipped' || order.status === 'Delivered' ? 'bg-primary shadow-[0_0_15px_rgba(255,0,0,0.5)]' : 'bg-white/10'}`}></div>
                     <div className={`h-2 flex-1 rounded-full ${order.status === 'Shipped' || order.status === 'Delivered' ? 'bg-primary shadow-[0_0_15px_rgba(255,0,0,0.5)]' : 'bg-white/10'}`}></div>
                     <div className={`h-2 flex-1 rounded-full ${order.status === 'Delivered' ? 'bg-primary shadow-[0_0_15px_rgba(255,0,0,0.5)]' : 'bg-white/10'}`}></div>
                  </div>
                  <p className="mt-4 text-[10px] font-bold text-center text-slate-500 uppercase tracking-widest">Processing • Shipped • Delivered</p>
                </motion.div>
              ) : (
                <p className="font-black text-red-500 uppercase italic">Order not found. Check your Transaction ID.</p>
              )
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* --- LIVE ORDER HISTORY (Professional View) --- */}
      {user && (
        <div className="max-w-4xl mx-auto p-6 md:p-10 border-t border-slate-100 mt-20 mb-20">
          <h2 className="text-3xl font-black italic uppercase mb-8 tracking-tighter">Your <span className="text-primary">Order History</span></h2>
          <div className="grid gap-6">
            {history.length > 0 ? (
              history.map(item => (
                <div key={item.id} className="bg-slate-50 p-6 rounded-[2rem] flex flex-col md:flex-row justify-between items-center border border-slate-100 hover:shadow-xl transition-all group">
                   <div className="text-center md:text-left">
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Product Info</p>
                      <h3 className="font-black uppercase italic group-hover:text-primary transition-colors">{item.productName}</h3>
                      <p className="text-xs font-bold text-slate-500 font-mono mt-1">Trx: {item.transactionId}</p>
                   </div>
                   <div className="mt-4 md:mt-0 text-center">
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Status</p>
                      <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${item.status === 'Pending' ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'}`}>
                        {item.status}
                      </span>
                   </div>
                   <div className="mt-4 md:mt-0 text-center md:text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Price</p>
                      <p className="font-black text-xl text-slate-900">Rs.{item.price}</p>
                   </div>
                </div>
              ))
            ) : (
              <p className="text-slate-400 font-bold italic text-center py-10 bg-slate-50 rounded-[2rem]">You haven't placed any orders yet.</p>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}