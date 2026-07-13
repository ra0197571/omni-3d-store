import React, { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
// Context Providers ka sahi rasta (Path)
import { AppProvider } from './context/AppContext'
import { AuthProvider } from './context/AuthContext'
import './styles/index.css'
import App from './App.jsx'
import { CartProvider } from './context/CartContext';
ReactDOM.createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <AppProvider>
        <CartProvider> {/* <--- Ye add kiya */}
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </CartProvider>
      </AppProvider>
    </AuthProvider>
  </StrictMode>
)