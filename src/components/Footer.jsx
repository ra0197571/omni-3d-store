import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';

export default function Footer() {
  const { settings } = useContext(AppContext);
  
  return (
    <footer className="bg-slate-900 text-white mt-20 p-10 md:p-20 rounded-t-[3rem] md:rounded-t-[5rem]">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-20">
        
        {/* Brand Info */}
        <div className="space-y-6">
          <h2 className="text-4xl font-black italic uppercase tracking-tighter text-primary">
            {settings.storeName || "OMNI STORE"}
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed font-medium">
            Next generation 3D shopping experience. Bringing the future of e-commerce to your fingertips with premium interactive products.
          </p>
        </div>

        {/* Dynamic Contact Info */}
        <div className="space-y-4">
          <h3 className="font-black uppercase italic text-xs tracking-[0.3em] text-slate-500 text-primary">Get in Touch</h3>
          <ul className="space-y-3 text-sm font-bold">
            <li className="flex items-center gap-3">
              <span className="bg-white/10 p-2 rounded-lg">📱</span> {settings.whatsapp}
            </li>
            <li className="flex items-center gap-3">
              <span className="bg-white/10 p-2 rounded-lg">✉️</span> {settings.email || `info@${settings.storeName?.toLowerCase().replace(/\s/g, '')}.com`}
            </li>
            <li className="flex items-center gap-3">
              <span className="bg-white/10 p-2 rounded-lg">📍</span> {settings.address || "Pakistan"}
            </li>
          </ul>
        </div>
         <div className="flex gap-4">
  {settings.facebook && <a href={settings.facebook} target="_blank" className="hover:text-primary transition-colors">FB</a>}
  {settings.instagram && <a href={settings.instagram} target="_blank" className="hover:text-primary transition-colors">IG</a>}
  {settings.youtube && <a href={settings.youtube} target="_blank" className="hover:text-primary transition-colors">YT</a>}
</div>
        {/* Payment & Security */}
        <div className="space-y-4">
          <h3 className="font-black uppercase italic text-xs tracking-[0.3em] text-slate-500">Secure Payments</h3>
          <div className="flex gap-4">
             <div className="bg-white/10 p-3 px-5 rounded-2xl text-[10px] font-black border border-white/5">JAZZCASH</div>
             <div className="bg-white/10 p-3 px-5 rounded-2xl text-[10px] font-black border border-white/5">EASYPAISA</div>
          </div>
          <p className="text-[10px] text-slate-500 uppercase font-black pt-6 opacity-40">
            © {new Date().getFullYear()} {settings.storeName} • All Rights Reserved
          </p>
        </div>

      </div>
    </footer>
  );
}