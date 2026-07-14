import React, { useContext } from 'react';
import { CartContext } from '../context/CartContext';
import { AppContext } from '../context/AppContext';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Footer from '../components/Footer';

export default function Cart() {
  const { cartItems, removeFromCart, updateQty, totalPrice, totalItems } = useContext(CartContext);
  const { settings } = useContext(AppContext);
  const themeColor = settings.primaryColor || "#ff0000";

  // --- NAYI DYNAMIC LOGIC ---
  const shipping = Number(settings.shippingFee || 0);
  const grandTotal = totalPrice + shipping;

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-6 bg-white font-sans">
        <h2 className="text-4xl font-black uppercase italic opacity-20">Your Cart is Empty</h2>
        <Link to="/" className="bg-slate-900 text-white px-10 py-4 rounded-full font-black uppercase text-xs shadow-xl">Start Shopping</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <nav className="p-6 max-w-7xl mx-auto flex justify-between items-center">
        <Link to="/" className="font-black italic uppercase tracking-tighter" style={{ color: themeColor }}>← Back to Store</Link>
        <h1 className="text-xl font-black uppercase italic">Shopping Bag ({totalItems})</h1>
      </nav>

      <div className="max-w-7xl mx-auto p-6 md:p-10 flex flex-col lg:flex-row gap-10">
        
        {/* Items List (Exactly your design) */}
        <div className="flex-[2] space-y-4">
          {cartItems.map(item => (
            <motion.div layout key={item.id} className="bg-white p-6 rounded-[2.5rem] flex items-center justify-between shadow-sm border border-slate-100 group">
              <div className="flex items-center gap-6">
                <img src={item.image} className="w-20 h-20 rounded-2xl object-cover shadow-lg" alt="" />
                <div>
                  <h3 className="font-black uppercase italic text-sm">{item.name}</h3>
                  <p className="text-xs font-bold text-slate-400 mt-1">Rs.{item.price}</p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center bg-slate-50 rounded-full p-1 border">
                  <button onClick={() => updateQty(item.id, item.quantity - 1)} className="w-8 h-8 font-bold">-</button>
                  <span className="w-8 text-center font-black text-xs">{item.quantity}</span>
                  <button onClick={() => updateQty(item.id, item.quantity + 1)} className="w-8 h-8 font-bold">+</button>
                </div>
                <button onClick={() => removeFromCart(item.id)} className="text-red-500 font-black text-[10px] uppercase tracking-widest hover:underline">Remove</button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Summary Card (Updated Logic) */}
        <div className="flex-1">
          <div className="bg-slate-900 text-white p-10 rounded-[3.5rem] shadow-2xl sticky top-24 border-b-8" style={{ borderBottomColor: themeColor }}>
            <h2 className="text-2xl font-black uppercase italic mb-8">Order Summary</h2>
            <div className="space-y-4 border-t border-white/10 pt-6">
              <div className="flex justify-between text-sm opacity-60 font-bold uppercase">
                <span>Subtotal</span>
                <span>Rs.{totalPrice}</span>
              </div>
              
              {/* --- YAHAN SHIPPNG DYNAMIC HO GAYI --- */}
              <div className="flex justify-between text-sm opacity-60 font-bold uppercase">
                <span>Shipping</span>
                <span className={shipping === 0 ? "text-green-400" : "text-white"}>
                    {shipping === 0 ? "FREE" : `Rs.${shipping}`}
                </span>
              </div>

              <div className="flex justify-between pt-4 border-t border-white/10">
                <span className="font-black uppercase italic">Total Bill</span>
                {/* --- TOTAL MEIN SHIPPING PLUS HO GAYI --- */}
                <span className="text-3xl font-black text-primary font-mono" style={{ color: themeColor }}>Rs.{grandTotal}</span>
              </div>
            </div>

            <Link to="/checkout" className="block w-full text-center mt-10 py-6 rounded-3xl font-black uppercase text-xl shadow-xl transition-all active:scale-95 hover:brightness-110" style={{ backgroundColor: themeColor }}>
                Checkout Now
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}