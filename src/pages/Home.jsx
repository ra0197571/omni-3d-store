import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { collection, onSnapshot, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import Hero3D from '../components/3d/Hero3D';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer'; 
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import { WishlistContext } from '../context/WishlistContext';

export default function Home() {
  const { settings } = useContext(AppContext);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState(""); 
  const [activeCat, setActiveCat] = useState("All");
  const [selectedProduct, setSelectedProduct] = useState(null); 
  const [custName, setCustName] = useState("");
  const [custAddress, setCustAddress] = useState("");
  const [transId, setTransId] = useState("");

  // Pehle saare Contexts sahi se nikaalein (Fixed Wishlist error here)
  const { user, logout } = useContext(AuthContext); 
  const { addToCart, totalItems } = useContext(CartContext);
  const { wishlist, toggleWishlist, isInWishlist } = useContext(WishlistContext); // 'wishlist' nikaal liya ab crash nahi hoga
  
  const themeColor = settings.primaryColor || "#ff0000";

  useEffect(() => {
    const unsubProducts = onSnapshot(collection(db, "products"), (s) => {
      setProducts(s.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubCats = onSnapshot(collection(db, "categories"), (s) => {
      setCategories(s.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => { unsubProducts(); unsubCats(); };
  }, []);

  useEffect(() => {
    if (settings.storeName) {
      document.title = `${settings.storeName} | Next Gen Shopping`;
    }
  }, [settings.storeName]);

  const filteredProducts = products.filter(p => 
    (activeCat === "All" || p.category === activeCat) &&
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sendWhatsAppOrder = async () => {
      if (!custName || !custAddress || !transId) return alert("Fill details!");
      try {
          const productRef = doc(db, "products", selectedProduct.id);
          const newStock = Number(selectedProduct.stock) - 1;
          await updateDoc(productRef, { stock: newStock });

          await addDoc(collection(db, "orders"), {
            customerName: custName, 
            address: custAddress,
            productName: selectedProduct.name, 
            price: selectedProduct.price,
            transactionId: transId, 
            status: "Pending", 
            createdAt: new Date(),
            userId: user ? user.uid : "guest"
          });
      } catch (e) { alert(e.message); }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar - Dynamic Color and Logic Fix */}
      <nav style={{ backgroundColor: themeColor }} className="p-4 md:p-6 text-white flex justify-between items-center shadow-xl sticky top-0 z-50 transition-colors">
        
        {/* Logo / Store Name Area (100% Dynamic) */}
        <Link to="/" className="flex items-center gap-3 group">
          {settings.logoUrl && (
            <div className="bg-white p-1 rounded-full shadow-xl border border-white/20 group-hover:scale-110 transition-transform">
              <img 
                src={settings.logoUrl} 
                alt={settings.storeName} 
                className="h-10 w-10 md:h-12 md:w-12 object-contain rounded-full" 
              />
            </div>
          )}
          <h1 className="text-xl md:text-3xl font-black italic uppercase tracking-tighter">
            {settings.storeName}
          </h1>
        </Link>
          
        {/* Navigation Links */}
        <div className="flex items-center gap-2">
          <Link to="/track" className="hidden sm:block bg-white/10 px-4 py-2 rounded-full hover:bg-white/20 text-[10px] font-black uppercase tracking-widest transition">
            Track
          </Link>

          {/* Wishlist Link (Fixed Variable Error) */}
          <Link to="/wishlist" className="relative p-2 bg-white/10 rounded-full hover:bg-white/20 transition group">
            <span className="text-xl">
              {wishlist?.length > 0 ? "❤️" : "🤍"}
            </span>
            {wishlist?.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-white text-primary text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full shadow-lg border border-primary/20">
                {wishlist.length}
              </span>
            )}
          </Link>

          {/* Cart Link */}
          <Link to="/cart" className="relative p-2 bg-white/10 rounded-full hover:bg-white/20 transition">
            <span className="text-xl">🛒</span>
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full animate-bounce">
                {totalItems}
              </span>
            )}
          </Link>
           <Link to="/profile" className="text-[9px] font-black uppercase opacity-60 hidden md:block hover:text-white transition-colors">
             Hi, {user?.name || 'My Profile'}
           </Link>
          {/* User / Auth Section */}
          {user ? (
            <div className="flex items-center gap-2 bg-black/10 p-1 pl-4 rounded-full border border-white/10">
              <span className="text-[9px] font-black uppercase opacity-60 hidden md:block">
                Hi, {user?.name || 'User'}
              </span>
              <button 
                onClick={() => { if(window.confirm("Logout?")) logout(); }} 
                className="bg-white text-primary px-4 py-2 rounded-full text-[10px] font-black uppercase shadow-lg active:scale-95 transition"
                style={{ color: themeColor }}
              >
                Logout
              </button>
            </div>
          ) : (
            <Link to="/auth" className="bg-white px-6 py-2 rounded-full font-black text-[10px] uppercase shadow-lg hover:scale-105 transition" style={{ color: themeColor }}>
              Login
            </Link>
          )}
            
          <Link to="/admin" className="bg-slate-900 text-white px-4 py-2 rounded-full font-black text-[10px] uppercase border border-white/20">
            Admin
          </Link>
        </div>        
      </nav>

      {/* Hero Section */}
      {/* Hero Section - Now 100% Dynamic */}
<div className="flex flex-col md:flex-row items-center max-w-7xl mx-auto p-6 md:p-10 gap-10 min-h-[60vh]">
  <div className="flex-1 text-center md:text-left order-2 md:order-1">
    <motion.h2 
      initial={{x:-50, opacity:0}} 
      animate={{x:0, opacity:1}} 
      className="text-5xl md:text-8xl font-black uppercase leading-[0.9] tracking-tighter"
    >
      {/* Admin Panel se aane wali heading yahan split hogi */}
      {settings.heroHeading?.split(' ').slice(0, -1).join(' ')} <br /> 
      <span style={{ color: themeColor }} className="italic">
        {settings.heroHeading?.split(' ').slice(-1)}
      </span>
    </motion.h2>
    
    <p className="mt-5 text-slate-400 font-medium tracking-widest uppercase text-xs md:text-sm">
      {settings.heroSubheading || "Premium 3D Experience"}
    </p>
  </div>
  
  <div className="flex-1 w-full h-[350px] md:h-[500px] order-1 md:order-2">
    <Hero3D color={themeColor} />
  </div>
</div>

      {/* Search & Categories */}
      <div className="max-w-7xl mx-auto px-6 md:px-10 mb-10 space-y-6">
        <div className="relative">
          <input type="text" placeholder="What are you looking for?" className="w-full p-5 md:p-7 bg-slate-50 rounded-[2.5rem] border-none outline-none focus:ring-4 ring-primary/10 pl-14 text-lg shadow-inner" onChange={(e) => setSearchTerm(e.target.value)} />
          <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl opacity-30">🔍</span>
        </div>

        <div className="flex space-x-3 overflow-x-auto pb-4 no-scrollbar">
          <button onClick={() => setActiveCat("All")} className={`px-8 py-3 rounded-full font-black text-xs uppercase tracking-widest transition-all ${activeCat === "All" ? 'bg-primary text-white shadow-xl shadow-primary/30' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>All</button>
          {categories.map(c => (
            <button key={c.id} onClick={() => setActiveCat(c.name)} className={`px-8 py-3 rounded-full font-black text-xs uppercase tracking-widest whitespace-nowrap transition-all ${activeCat === c.name ? 'bg-primary text-white shadow-xl shadow-primary/30' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>{c.name}</button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto p-6 md:p-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {filteredProducts.map(p => (
          <Link to={`/product/${p.id}`} key={p.id}>
            <motion.div whileHover={{y:-10}} className="bg-white p-5 rounded-[2.5rem] shadow-sm hover:shadow-2xl border border-slate-50 transition group relative h-full flex flex-col justify-between">
               {p.stock <= 0 && <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase z-10">Sold Out</div>}
               
               <div className="h-64 bg-slate-50 rounded-[2rem] mb-4 overflow-hidden">
                  <img src={p.image} className={`w-full h-full object-cover group-hover:scale-110 transition duration-700 ${p.stock <= 0 ? 'grayscale opacity-50' : ''}`} alt={p.name} />
               </div>

               <div>
                 <div className="flex justify-between items-start mb-2 px-1">
                    <h3 className="font-black text-lg leading-tight uppercase italic truncate flex-1">{p.name}</h3>
                    <span className="text-[9px] font-bold text-slate-300 uppercase ml-2">{p.category}</span>
                 </div>
                 
                 <div className="flex justify-between items-center mt-6 px-1">
                    <span className="text-primary font-black text-2xl font-mono">Rs.{p.price}</span>
                    <button 
  onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleWishlist(p); }}
  className="absolute top-4 left-4 z-20 p-3 rounded-full bg-white/80 backdrop-blur shadow-lg active:scale-90 transition-all"
>
  <span className={isInWishlist(p.id) ? "text-red-500" : "text-slate-300"}>
    {isInWishlist(p.id) ? "❤️" : "🤍"}
  </span>
</button>
                    <button 
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedProduct(p); }} 
                      disabled={p.stock <= 0}
                      className={`${p.stock > 0 ? 'bg-primary shadow-primary/30' : 'bg-slate-200 text-slate-400 cursor-not-allowed'} text-white px-5 py-3 rounded-2xl font-black text-xs uppercase shadow-lg active:scale-95 transition-all`}
                    >
                      {p.stock > 0 ? 'Buy Now' : 'No Stock'}
                    </button>
                   
                 <button 
  disabled={p.stock <= 0} // <--- Ye line add karein
  onClick={(e) => { 
    e.preventDefault(); 
    e.stopPropagation(); 
    addToCart(p, 1); 
  }}
  className={`${p.stock <= 0 ? 'bg-slate-200 cursor-not-allowed opacity-50' : 'bg-slate-100 hover:bg-slate-200'} text-slate-800 p-3 rounded-2xl transition`}
>
  {p.stock <= 0 ? 'X' : '+ Add'} 
</button>
                 </div>
               </div>
            </motion.div>
          </Link>
        ))}
      </div>

      <Footer />

      {/* Checkout Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="bg-white p-8 rounded-[3rem] max-w-md w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
              <div className="flex items-center space-x-4 mb-8">
                <div className="p-4 bg-primary/10 rounded-2xl text-4xl">🛒</div>  
                <div>
                  <h2 className="text-2xl font-black uppercase italic text-primary leading-tight">Checkout</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{selectedProduct.name}</p>
                </div>
              </div>

              <div className="space-y-4">
                <input type="text" placeholder="Your Full Name" className="w-full p-5 bg-slate-50 rounded-2xl outline-none font-bold focus:ring-2 ring-primary" onChange={(e)=>setCustName(e.target.value)} />
                <textarea placeholder="Complete Delivery Address" className="w-full p-5 bg-slate-50 rounded-2xl outline-none h-24 font-bold focus:ring-2 ring-primary resize-none" onChange={(e)=>setCustAddress(e.target.value)} />
                
                <div className="bg-slate-900 text-white p-6 rounded-[2rem] border-4 border-primary/20">
                   <p className="text-[10px] font-black text-primary uppercase mb-3 tracking-[0.2em] text-center italic">Step 1: Pay Rs.{selectedProduct.price}</p>
                   <div className="space-y-2 text-xs font-bold font-mono">
                      {settings.jazzCashNo && <div className="bg-white/10 p-3 rounded-xl flex justify-between"><span>JazzCash</span><span className="text-primary">{settings.jazzCashNo}</span></div>}
                      {settings.easyPaisaNo && <div className="bg-white/10 p-3 rounded-xl flex justify-between"><span>EasyPaisa</span><span className="text-primary">{settings.easyPaisaNo}</span></div>}
                   </div>
                </div>

                <div className="space-y-1">
                   <p className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-1">Step 2: Enter Transaction ID</p>
                   <input type="text" placeholder="10-Digit ID" className="w-full p-5 bg-primary/5 border-2 border-primary rounded-2xl outline-none text-center font-black text-primary text-xl" onChange={(e) => setTransId(e.target.value)} />
                </div>

                <button onClick={sendWhatsAppOrder} className="w-full bg-primary text-white p-5 rounded-2xl font-black uppercase text-lg shadow-2xl shadow-primary/40 active:scale-95 transition-all">Confirm via WhatsApp</button>
                <button onClick={() => setSelectedProduct(null)} className="w-full text-slate-400 font-bold py-2 uppercase text-xs hover:text-red-500 transition">Cancel and Go Back</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}