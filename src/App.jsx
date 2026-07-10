import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';

import Home from './pages/Home';
import AdminDashboard from './pages/AdminDashboard';
import ProductDetails from './pages/ProductDetails'; // Naya page import kiya

function App() {
  return (
    <AppProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/product/:id" element={<ProductDetails />} /> {/* Ye line add ki */}
        </Routes>
      </Router>
    </AppProvider>
  );
}

export default App;