import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import TrackOrder from './pages/TrackOrder';
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
          <Route path="/product/:id" element={<ProductDetails />} /> 
          <Route path="/track" element={<TrackOrder />} />
        </Routes>
      </Router>
    </AppProvider>
  );
}

export default App;