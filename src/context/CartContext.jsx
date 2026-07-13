import React, { createContext, useState, useEffect } from 'react';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  // LocalStorage se purana cart uthao agar hai toh
  const [cartItems, setCartItems] = useState(() => {
    const savedCart = localStorage.getItem('omni_cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  // Jab bhi cart change ho, LocalStorage mein save karo
  useEffect(() => {
    localStorage.setItem('omni_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  // 1. Add to Cart
  // CartContext.jsx ke andar addToCart function aisa hona chahiye:
const addToCart = (product, qty = 1) => {
  // Check karein agar stock 0 hai toh add na kare
  if (product.stock <= 0) {
    alert("Sorry! This product is Out of Stock.");
    return;
  }

  setCartItems(prev => {
    const isExist = prev.find(item => item.id === product.id);
    if (isExist) {
      // Check karein ke cart mein quantity stock se zyada na ho jaye
      if (isExist.quantity + Number(qty) > product.stock) {
        alert("Cannot add more! Stock limit reached.");
        return prev;
      }
      return prev.map(item => 
        item.id === product.id ? { ...item, quantity: item.quantity + Number(qty) } : item
      );
    }
    return [...prev, { ...product, quantity: Number(qty) }];
  });
};

  // 2. Remove from Cart
  const removeFromCart = (id) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  // 3. Update Quantity
  const updateQty = (id, newQty) => {
    if (newQty < 1) return;
    setCartItems(prev => prev.map(item => 
      item.id === id ? { ...item, quantity: newQty } : item
    ));
  };

  // 4. Clear Cart
  const clearCart = () => setCartItems([]);

  // Total Price calculate karo
  const totalPrice = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQty, clearCart, totalPrice, totalItems }}>
      {children}
    </CartContext.Provider>
  );
};