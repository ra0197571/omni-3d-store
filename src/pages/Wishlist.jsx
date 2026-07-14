import React, { useContext } from 'react';
import { WishlistContext } from '../context/WishlistContext';
import { AppContext } from '../context/AppContext';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';

export default function Wishlist() {
  const { wishlist, toggleWishlist } = useContext(WishlistContext);
  const { settings } = useContext(AppContext);
  const themeColor = settings.primaryColor || "#ff0000";

  if (wishlist.length === 0) return (
    <div className="h-screen flex flex-col items-center justify-center space-y-4">
      <h2 className="text-4xl font-black uppercase italic opacity-20">Wishlist is empty</h2>
      <Link to="/" className="bg-slate-900 text-white px-8 py-3 rounded-full font-black uppercase text-xs">Go Shopping</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <nav className="p-6 max-w-7xl mx-auto flex justify-between items-center">
        <Link to="/" className="font-black italic uppercase" style={{ color: themeColor }}>← Back</Link>
        <h1 className="text-xl font-black uppercase italic text-slate-800">Your Favorites ({wishlist.length})</h1>
      </nav>

      <div className="max-w-7xl mx-auto p-6 md:p-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {wishlist.map(p => (
          <div key={p.id} className="bg-white p-5 rounded-[2.5rem] shadow-sm relative group border border-slate-100">
             <button onClick={() => toggleWishlist(p)} className="absolute top-4 right-4 bg-red-50 text-red-500 p-2 rounded-xl text-[10px] font-black uppercase">Remove</button>
             <img src={p.image} className="h-48 w-full object-cover rounded-[2rem] mb-4" alt="" />
             <h3 className="font-black uppercase italic text-sm">{p.name}</h3>
             <p className="font-black text-primary mt-2" style={{ color: themeColor }}>Rs.{p.price}</p>
             <Link to={`/product/${p.id}`} className="block text-center mt-4 bg-slate-900 text-white py-3 rounded-2xl text-[10px] font-black uppercase">View Product</Link>
          </div>
        ))}
      </div>
      <Footer />
    </div>
  );
}