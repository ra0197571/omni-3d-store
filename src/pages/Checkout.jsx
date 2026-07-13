import React, { useState, useContext } from 'react';
import { db } from '../services/firebase';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { AppContext } from '../context/AppContext';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Footer from '../components/Footer';

export default function Checkout() {
  const { settings } = useContext(AppContext);
  const { cartItems, totalPrice, clearCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [custName, setCustName] = useState("");
  const [custAddress, setCustAddress] = useState("");
  const [note, setNote] = useState("");
  const [transId, setTransId] = useState("");
  const [loading, setLoading] = useState(false);

  const themeColor = settings.primaryColor || "#ff0000";

  const handleFinalOrder = async (e) => {
    e.preventDefault();
    if (!custName || !custAddress || !transId) return alert("Fill all details!");
    setLoading(true);

    try {
      // 1. Save Order to Firestore
      const orderData = {
        customerName: custName,
        address: custAddress,
        customerNote: note,
        items: cartItems, // Poora array save hoga
        totalAmount: totalPrice,
        transactionId: transId,
        status: "Pending",
        createdAt: new Date(),
        userId: user ? user.uid : "guest"
      };

      await addDoc(collection(db, "orders"), orderData);

      // 2. Update Stock for each item
      for (const item of cartItems) {
        const productRef = doc(db, "products", item.id);
        await updateDoc(productRef, {
            stock: Number(item.stock) - Number(item.quantity)
        });
      }

      // 3. WhatsApp Message Logic
      const itemsList = cartItems.map(i => `- ${i.name} (x${i.quantity})`).join('%0A');
      const message = `*📦 NEW MULTI-ORDER!*%0A---------------------------%0A*Items:*%0A${itemsList}%0A---------------------------%0A*Total Bill:* Rs. ${totalPrice}%0A*Customer:* ${custName}%0A*Trx ID:* ${transId}`;
      
      window.open(`https://wa.me/${settings.whatsapp}?text=${message}`, '_blank');

      // 4. Cleanup
      clearCart();
      alert("Order Placed Successfully!");
      navigate('/track');
    } catch (err) {
      alert("Error: " + err.message);
    }
    setLoading(false);
  };

  if (cartItems.length === 0) return <div className="p-20 text-center font-black">YOUR CART IS EMPTY</div>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <nav className="p-6 flex justify-between items-center max-w-7xl mx-auto">
        <Link to="/cart" className="font-black italic uppercase text-xs" style={{ color: themeColor }}>← Edit Cart</Link>
        <h1 className="text-xl font-black uppercase italic">Final Checkout</h1>
      </nav>

      <div className="max-w-7xl mx-auto p-6 md:p-10 flex flex-col lg:flex-row gap-10">
        
        {/* Left: Shipping Form */}
        <div className="flex-[1.5] space-y-6">
          <motion.div initial={{opacity:0, x:-20}} animate={{opacity:1, x:0}} className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100">
            <h2 className="text-2xl font-black uppercase italic mb-8">Shipping Information</h2>
            <form onSubmit={handleFinalOrder} className="space-y-5">
              <input type="text" placeholder="Full Name" className="w-full p-5 bg-slate-50 rounded-2xl font-bold outline-none border focus:border-primary" onChange={e => setCustName(e.target.value)} />
              <textarea placeholder="Full Delivery Address" className="w-full p-5 bg-slate-50 rounded-2xl h-28 font-bold outline-none border focus:border-primary" onChange={e => setCustAddress(e.target.value)} />
              <textarea placeholder="Order Note (Optional)" className="w-full p-5 bg-slate-50 rounded-2xl h-20 font-bold outline-none border focus:border-primary text-sm italic" onChange={e => setNote(e.target.value)} />
              
              <div className="pt-6 border-t">
                 <p className="text-[10px] font-black uppercase text-slate-400 mb-3 ml-2">Manual Payment Verification</p>
                 <div className="bg-slate-900 text-white p-6 rounded-[2.5rem] flex flex-col md:flex-row justify-between items-center gap-4">
                    {settings.jazzCashNo && <div className="text-center md:text-left"><p className="text-[10px] opacity-40">JAZZCASH</p><p className="font-black text-primary" style={{ color: themeColor }}>{settings.jazzCashNo}</p></div>}
                    {settings.easyPaisaNo && <div className="text-center md:text-left"><p className="text-[10px] opacity-40">EASYPAISA</p><p className="font-black text-primary" style={{ color: themeColor }}>{settings.easyPaisaNo}</p></div>}
                 </div>
                 <input type="text" placeholder="Enter Transaction ID" className="mt-4 w-full p-5 bg-primary/5 border-2 rounded-2xl text-center font-black text-2xl" style={{ borderColor: themeColor, color: themeColor }} onChange={e => setTransId(e.target.value)} />
              </div>

              <button disabled={loading} className="w-full py-6 rounded-3xl text-white font-black uppercase text-xl shadow-2xl active:scale-95 transition-all mt-6" style={{ backgroundColor: themeColor }}>
                {loading ? "PROCESSING..." : "Place Order Now"}
              </button>
            </form>
          </motion.div>
        </div>

        {/* Right: Summary */}
        <div className="flex-1">
          <div className="bg-white p-8 rounded-[3rem] shadow-lg sticky top-24">
            <h3 className="text-lg font-black uppercase italic mb-6">In Your Bag</h3>
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {cartItems.map(item => (
                <div key={item.id} className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <img src={item.image} className="w-10 h-10 rounded-lg object-cover" alt="" />
                    <div><p className="text-[10px] font-black uppercase leading-none">{item.name}</p><p className="text-[9px] font-bold text-slate-400 mt-1">Qty: {item.quantity}</p></div>
                  </div>
                  <p className="font-bold text-xs">Rs.{item.price * item.quantity}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 pt-6 border-t border-dashed border-slate-200">
               <div className="flex justify-between items-center">
                  <p className="font-black uppercase italic text-slate-400">Total Bill</p>
                  <p className="text-3xl font-black" style={{ color: themeColor }}>Rs.{totalPrice}</p>
               </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}