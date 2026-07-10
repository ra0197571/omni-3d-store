import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext'; // Path Fixed

export default function Footer() {
  const { settings } = useContext(AppContext);
  return (
    <footer className="bg-slate-900 text-white mt-20 p-10 md:p-20 rounded-t-[3rem] md:rounded-t-[5rem]">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10">
        <div className="space-y-4">
          <h2 className="text-3xl font-black italic uppercase text-primary">{settings.storeName}</h2>
          <p className="text-slate-400 text-sm font-medium">Premium 3D Shopping Experience. The future of e-commerce is here.</p>
        </div>
        <div className="space-y-4">
          <h3 className="font-black uppercase text-xs tracking-widest text-slate-500">Contact Us</h3>
          <p className="font-bold text-sm">WhatsApp: {settings.whatsapp}</p>
          <p className="font-bold text-sm">Email: support@{settings.storeName.toLowerCase().replace(/\s/g, '')}.com</p>
        </div>
        <div className="space-y-4 text-right">
          <p className="text-[10px] font-black uppercase text-slate-500">© {new Date().getFullYear()} {settings.storeName}</p>
          <div className="flex justify-end gap-2 opacity-30 font-black text-[10px]">
            <span>JAZZCASH</span> • <span>EASYPAISA</span>
          </div>
        </div>
      </div>
    </footer>
  );
}