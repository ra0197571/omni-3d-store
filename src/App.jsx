import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { doc, onSnapshot, setDoc, collection, addDoc, deleteDoc } from "firebase/firestore"; 

function App() {
  const [storeName, setStoreName] = useState("Loading...");
  const [primaryColor, setPrimaryColor] = useState("#3b82f6");
  const [products, setProducts] = useState([]);
  const [newProductName, setNewProductName] = useState("");
  const [newProductPrice, setNewProductPrice] = useState("");

  useEffect(() => {
    // 1. Settings Load Karna
    const configRef = doc(db, "settings", "storeConfig");
    onSnapshot(configRef, (docSnap) => {
      if (docSnap.exists()) {
        setStoreName(docSnap.data().storeName);
        setPrimaryColor(docSnap.data().primaryColor);
        document.documentElement.style.setProperty('--primary-color', docSnap.data().primaryColor);
      }
    });

    // 2. Products Load Karna (Real-time)
    const productsRef = collection(db, "products");
    const unsubProducts = onSnapshot(productsRef, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(items);
    });

    return () => unsubProducts();
  }, []);

  // Settings Save Karna
  const saveConfig = async (name, color) => {
    await setDoc(doc(db, "settings", "storeConfig"), { storeName: name, primaryColor: color });
  };

  // Naya Product Add Karna
  const addProduct = async (e) => {
    e.preventDefault();
    if (!newProductName || !newProductPrice) return;
    await addDoc(collection(db, "products"), {
      name: newProductName,
      price: newProductPrice,
      createdAt: new Date()
    });
    setNewProductName("");
    setNewProductPrice("");
  };

  // Product Delete Karna
  const deleteProduct = async (id) => {
    await deleteDoc(doc(db, "products", id));
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      {/* Header */}
      <header className="bg-primary p-10 text-white text-center shadow-2xl transition-all duration-500">
        <h1 className="text-5xl font-black uppercase italic">{storeName}</h1>
      </header>

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 p-10">
        
        {/* LEFT: ADMIN PANEL */}
        <div className="space-y-8">
          <section className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100">
            <h3 className="text-xl font-bold mb-6 text-primary italic border-b pb-2">Branding Settings</h3>
            <div className="space-y-4">
              <input 
                type="text" value={storeName} className="w-full p-3 border-2 rounded-xl outline-none focus:border-primary"
                onChange={(e) => { setStoreName(e.target.value); saveConfig(e.target.value, primaryColor); }}
              />
              <input 
                type="color" value={primaryColor} className="w-full h-12 cursor-pointer rounded-lg"
                onChange={(e) => { setPrimaryColor(e.target.value); saveConfig(storeName, e.target.value); }}
              />
            </div>
          </section>

          <section className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100">
            <h3 className="text-xl font-bold mb-6 text-green-600 italic border-b pb-2">Add New Product</h3>
            <form onSubmit={addProduct} className="space-y-4">
              <input 
                type="text" placeholder="Product Name" value={newProductName}
                className="w-full p-3 border-2 rounded-xl outline-none focus:border-green-500"
                onChange={(e) => setNewProductName(e.target.value)}
              />
              <input 
                type="number" placeholder="Price (PKR)" value={newProductPrice}
                className="w-full p-3 border-2 rounded-xl outline-none focus:border-green-500"
                onChange={(e) => setNewProductPrice(e.target.value)}
              />
              <button className="w-full bg-green-600 text-white p-3 rounded-xl font-bold hover:bg-green-700 transition">
                Add to Store
              </button>
            </form>
          </section>
        </div>

        {/* RIGHT: STOREFRONT (User View) */}
        <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
          <h3 className="text-xl font-bold mb-6 text-gray-800 italic border-b pb-2">Live Store View</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {products.map(product => (
              <div key={product.id} className="border p-4 rounded-2xl relative group hover:shadow-md transition">
                <div className="w-full h-32 bg-gray-100 rounded-xl mb-3 flex items-center justify-center text-gray-400">
                  No Image
                </div>
                <h4 className="font-bold text-gray-700">{product.name}</h4>
                <p className="text-primary font-black">Rs. {product.price}</p>
                <button 
                  onClick={() => deleteProduct(product.id)}
                  className="absolute top-2 right-2 text-red-400 opacity-0 group-hover:opacity-100 transition"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
          {products.length === 0 && <p className="text-center text-gray-400 mt-10">No products added yet.</p>}
        </div>

      </div>
    </div>
  );
}

export default App;