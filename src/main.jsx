import React, { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
// Context Providers ka sahi rasta (Path)
import { AppProvider } from './context/AppContext'
import { AuthProvider } from './context/AuthContext'
import './styles/index.css'
import App from './App.jsx'
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext'
ReactDOM.createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <AppProvider>
        <CartProvider> 
          <WishlistProvider> 
             <BrowserRouter>
                <App />
             </BrowserRouter>
           </WishlistProvider>
        </CartProvider>
      </AppProvider>
    </AuthProvider>
  </StrictMode>
)