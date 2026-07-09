import React, { useState } from 'react';

function App() {
  const [storeName, setStoreName] = useState("OMNI 3D STORE");
  const [primaryColor, setPrimaryColor] = useState("#3b82f6");

  const handleColorChange = (color) => {
    setPrimaryColor(color);
    document.documentElement.style.setProperty('--primary-color', color);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-5">
      <div 
        className="p-10 rounded-3xl shadow-2xl text-white mb-10 w-full max-w-lg text-center transition-all duration-500"
        style={{ backgroundColor: primaryColor }}
      >
        <h1 className="text-4xl font-black uppercase tracking-tighter">{storeName}</h1>
        <p className="opacity-80 text-sm mt-2 font-medium italic">Ultra Pro Max Store</p>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border border-gray-200">
        <h3 className="text-xl font-bold mb-6 text-gray-800 border-b pb-4">Admin Dashboard</h3>
        
        <div className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Store Name</label>
            <input 
              type="text" 
              placeholder="Brand Name..." 
              className="border-2 border-gray-100 p-3 rounded-xl w-full focus:border-blue-500 outline-none"
              onChange={(e) => setStoreName(e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Theme Color</label>
            <input 
              type="color" 
              value={primaryColor}
              onChange={(e) => handleColorChange(e.target.value)}
              className="w-full h-12 cursor-pointer rounded-lg border-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;