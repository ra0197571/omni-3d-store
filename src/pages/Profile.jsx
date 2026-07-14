import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { AppContext } from '../context/AppContext';
import { db } from '../services/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Footer from '../components/Footer';

export default function Profile() {
  const { user } = useContext(AuthContext);
  const { settings } = useContext(AppContext);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({ name: "", phone: "", address: "" });
  const themeColor = settings.primaryColor || "#ff0000";

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        const docSnap = await getDoc(doc(db, "users", user.uid));
        if (docSnap.exists()) setProfile(docSnap.data());
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  const handleSave = async () => {
    try {
      await setDoc(doc(db, "users", user.uid), profile, { merge: true });
      alert("Profile Updated Successfully!");
    } catch (e) { alert(e.message); }
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-black animate-pulse uppercase italic text-slate-300">Syncing Profile...</div>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <nav className="p-6 max-w-7xl mx-auto flex justify-between">
        <Link to="/" className="font-black italic uppercase" style={{ color: themeColor }}>← Back to Store</Link>
      </nav>

      <div className="max-w-4xl mx-auto p-6 md:p-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-8 md:p-12 rounded-[4rem] shadow-2xl border-b-8" style={{ borderBottomColor: themeColor }}>
          <h1 className="text-4xl font-black uppercase italic mb-8">User <span style={{ color: themeColor }}>Profile</span></h1>
          
          <div className="space-y-6">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 ml-4 mb-2 block">Full Name</label>
              <input type="text" value={profile.name} className="w-full p-5 bg-slate-50 rounded-3xl font-bold outline-none border-2 border-transparent focus:border-primary transition-all" onChange={(e) => setProfile({...profile, name: e.target.value})} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div>
                 <label className="text-[10px] font-black uppercase text-slate-400 ml-4 mb-2 block">Phone Number</label>
                 <input type="text" value={profile.phone} placeholder="03XXXXXXXXX" className="w-full p-5 bg-slate-50 rounded-3xl font-bold outline-none" onChange={(e) => setProfile({...profile, phone: e.target.value})} />
               </div>
               <div>
                 <label className="text-[10px] font-black uppercase text-slate-400 ml-4 mb-2 block">Email (Login)</label>
                 <input type="text" value={user?.email} disabled className="w-full p-5 bg-slate-100 rounded-3xl font-bold text-slate-400 cursor-not-allowed" />
               </div>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 ml-4 mb-2 block">Permanent Delivery Address</label>
              <textarea value={profile.address} className="w-full p-5 bg-slate-50 rounded-3xl font-bold outline-none h-32 resize-none" onChange={(e) => setProfile({...profile, address: e.target.value})} />
            </div>

            <button onClick={handleSave} className="w-full py-6 rounded-[2rem] text-white font-black uppercase text-xl shadow-xl active:scale-95 transition-all mt-6" style={{ backgroundColor: themeColor }}>Save My Information</button>
          </div>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
}