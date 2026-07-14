import React, { useState, useContext, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, addDoc, doc, updateDoc, getDoc, query, where, getDocs } from 'firebase/firestore'; 
import { AppContext } from '../context/AppContext';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Footer from '../components/Footer';

export default function Checkout() {
  const { settings } = useContext(AppContext);
  const { cartItems, totalPrice, clearCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  // Form States
  const [custName, setCustName] = useState("");
  const [custAddress, setCustAddress] = useState("");
  const [note, setNote] = useState("");
  const [transId, setTransId] = useState("");
  const [loading, setLoading] = useState(false);

  // Coupon States
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);

  const themeColor = settings.primaryColor || "#ff0000";

  // --- AUTO-FILL PROFILE LOGIC ---
  useEffect(() => {
    const loadProfile = async () => {
      if (user) {
        const docSnap = await getDoc(doc(db, "users", user.uid));
        if (docSnap.exists()) {
          const data = docSnap.data();
          setCustName(data.name || "");
          setCustAddress(data.address || "");
        }
      }
    };
    loadProfile();
  }, [user]);

  // --- CALCULATIONS (Dynamic Shipping & Coupon) ---
  const shipping = Number(settings.shippingFee || 0);
  const discountAmount = totalPrice * (discount / 100);
  const finalPrice = (totalPrice - discountAmount) + shipping;

  // --- COUPON HANDLER ---
  const applyCoupon = async () => {
    try {
      const q = query(collection(db, "coupons"), where("code", "==", couponCode.toUpperCase()));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const data = snap.docs[0].data();
        setDiscount(Number(data.discount));
        alert(`🎉 Coupon Applied! ${data.discount}% Discount added.`);
      } else {
        alert("❌ Invalid Coupon Code");
        setDiscount(0);
      }
    } catch (e) { alert("Error checking coupon"); }
  };

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
        items: cartItems,
        totalAmount: finalPrice,
        subtotal: totalPrice,
        shippingFee: shipping,
        discountApplied: discountAmount,
        transactionId: transId,
        status: "Pending",
        createdAt: new Date(),
        userId: user ? user.uid : "guest"
      };

      await addDoc(collection(db, "orders"), orderData);

      // 2. Update Stock
      for (const item of cartItems) {
        const productRef = doc(db, "products", item.id);
        await updateDoc(productRef, {
            stock: Number(item.stock) - Number(item.quantity)
        });
      }

      // 3. WhatsApp Redirect Professional Message
      const itemsList = cartItems.map(i => `- ${i.name} (x${i.quantity})`).join('%0A');
      const message = `*📦 NEW ORDER PLACED!*%0A---------------------------%0A*Items:*%0A${itemsList}%0A---------------------------%0A*Subtotal:* Rs. ${totalPrice}%0A*Shipping:* ${shipping === 0 ? "FREE" : "Rs. " + shipping}%0A*Discount:* -Rs. ${discountAmount}%0A*FINAL TOTAL:* Rs. ${finalPrice}%0A---------------------------%0A*Customer:* ${custName}%0A*Address:* ${custAddress}%0A*Trx ID:* ${transId}`;
      
      window.open(`https://wa.me/${settings.whatsapp}?text=${message}`, '_blank');

      clearCart();
      alert("Order Placed Successfully!");
      navigate('/track');
    } catch (err) { alert("Order Error: " + err.message); }
    setLoading(false);
  };

  if (cartItems.length === 0) return <div className="p-20 text-center font-black uppercase italic opacity-20 text-4xl">Your Cart is Empty</div>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <nav className="p-6 flex justify-between items-center max-w-7xl mx-auto">
        <Link to="/cart" className="font-black italic uppercase text-xs" style={{ color: themeColor }}>← Edit Cart</Link>
        <h1 className="text-xl font-black uppercase italic text-slate-800">Final <span style={{ color: themeColor }}>Checkout</span></h1>
      </nav>

      <div className="max-w-7xl mx-auto p-4 md:p-10 flex flex-col lg:flex-row gap-10">
        
        {/* LEFT: SHIPPING FORM */}
        <div className="flex-[1.5] space-y-6">
          <motion.div initial={{opacity:0, x:-20}} animate={{opacity:1, x:0}} className="bg-white p-8 md:p-12 rounded-[3.5rem] shadow-2xl border border-slate-100">
            <h2 className="text-2xl font-black uppercase italic mb-8">Shipping Information</h2>
            <form onSubmit={handleFinalOrder} className="space-y-6">
              <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase text-slate-400 ml-3">Full Name</label>
                 <input type="text" placeholder="Ahmad Ali" value={custName || ""} className="w-full p-5 bg-slate-50 rounded-2xl font-bold outline-none border focus:border-primary transition-all" onChange={e => setCustName(e.target.value)} />
              </div>

              <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase text-slate-400 ml-3">Delivery Address</label>
                 <textarea placeholder="House#, Street, City" value={custAddress || ""} className="w-full p-5 bg-slate-50 rounded-2xl h-28 font-bold outline-none border focus:border-primary resize-none transition-all" onChange={e => setCustAddress(e.target.value)} />
              </div>

              <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase text-slate-400 ml-3">Order Note (Optional)</label>
                 <textarea placeholder="Special instructions for delivery..." value={note || ""} className="w-full p-5 bg-slate-50 rounded-2xl h-20 font-bold outline-none border focus:border-primary text-sm italic transition-all" onChange={e => setNote(e.target.value)} />
              </div>
              
              <div className="pt-6 border-t mt-6">
                 <p className="text-[10px] font-black uppercase text-slate-400 mb-4 ml-2">Manual Payment Details</p>
                 <div className="bg-slate-900 text-white p-6 rounded-[2.5rem] flex flex-col md:flex-row justify-between items-center gap-4 shadow-xl">
                    {settings.jazzCashNo && <div className="text-center md:text-left"><p className="text-[9px] opacity-40 font-black">JAZZCASH</p><p className="font-black text-lg" style={{ color: themeColor }}>{settings.jazzCashNo}</p></div>}
                    {settings.easyPaisaNo && <div className="text-center md:text-left"><p className="text-[9px] opacity-40 font-black">EASYPAISA</p><p className="font-black text-lg" style={{ color: themeColor }}>{settings.easyPaisaNo}</p></div>}
                 </div>
                 <div className="mt-6 space-y-1">
                    <label className="text-[10px] font-black uppercase text-primary ml-3" style={{ color: themeColor }}>Enter 10-Digit Transaction ID</label>
                    <input type="text" placeholder="Trx ID" value={transId || ""} className="w-full p-5 bg-primary/5 border-2 rounded-3xl text-center font-black text-3xl tracking-tighter" style={{ borderColor: themeColor, color: themeColor }} onChange={e => setTransId(e.target.value)} />
                 </div>
              </div>

              <button disabled={loading} className="w-full py-6 rounded-3xl text-white font-black uppercase text-xl shadow-2xl active:scale-95 transition-all mt-8 hover:brightness-110" style={{ backgroundColor: themeColor }}>
                {loading ? "SAVING ORDER..." : "Place Order Now"}
              </button>
            </form>
          </motion.div>
        </div>

        {/* RIGHT: SUMMARY & BILL */}
        <div className="flex-1">
          <div className="bg-white p-8 rounded-[3.5rem] shadow-xl sticky top-24 border border-slate-50">
            <h3 className="text-lg font-black uppercase italic mb-8 border-b pb-4">In Your Bag</h3>
            <div className="space-y-4 max-h-[350px] overflow-y-auto custom-scrollbar pr-2">
              {cartItems.map(item => (
                <div key={item.id} className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <img src={item.image} className="w-12 h-12 rounded-xl object-cover shadow-sm" alt="" />
                    <div><p className="text-[10px] font-black leading-tight uppercase">{item.name}</p><p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">Quantity: {item.quantity}</p></div>
                  </div>
                  <p className="font-black text-xs text-slate-800">Rs.{item.price * item.quantity}</p>
                </div>
              ))}
            </div>

            {/* --- COUPON SECTION --- */}
            <div className="mt-10 pt-6 border-t border-dashed border-slate-200">
               <p className="text-[10px] font-black uppercase text-slate-400 mb-3 ml-2">Have a Promo Code?</p>
               <div className="flex gap-2 mb-8">
                 <input type="text" placeholder="CODE" className="flex-1 p-4 bg-slate-50 rounded-2xl font-black text-sm outline-none border focus:border-primary uppercase" onChange={e => setCouponCode(e.target.value)} />
                 <button onClick={applyCoupon} className="bg-slate-900 text-white px-6 rounded-2xl font-black uppercase text-[10px] hover:bg-black transition-all">Apply</button>
               </div>

               {/* Bill Rows */}
               <div className="space-y-3 px-2">
                  <div className="flex justify-between text-[11px] font-bold text-slate-400 uppercase">
                    <span>Subtotal</span>
                    <span>Rs.{totalPrice}</span>
                  </div>
                  <div className="flex justify-between text-[11px] font-bold uppercase">
                    <span className="text-slate-400">Shipping</span>
                    <span className={shipping === 0 ? "text-green-500" : "text-slate-600"}>{shipping === 0 ? "FREE" : `+ Rs.${shipping}`}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-[11px] font-bold text-green-500 uppercase">
                      <span>Coupon Discount ({discount}%)</span>
                      <span>- Rs.{discountAmount}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center pt-4 border-t border-slate-100 mt-4">
                     <p className="font-black uppercase italic text-slate-800">Grand Total</p>
                     <p className="text-4xl font-black font-mono tracking-tighter" style={{ color: themeColor }}>Rs.{finalPrice}</p>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}