import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import ProductManager from "./components/ProductManager";
import BillingPage from "./components/BillingPage";

const App = () => {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50">
        {/* Header with inline navigation */}
        <header className="bg-indigo-500 shadow-lg">
          <div className="container mx-auto flex items-center justify-between py-4 px-6">
            <h1 className="text-xl font-bold text-white">Inventory System</h1>
            
            {/* Inline Navigation */}
            <nav className="flex">
              <Link to="/" className="px-4 py-2 mx-1 text-white hover:bg-indigo-600 rounded-md transition-colors duration-200">
                Inventory
              </Link>
              <Link to="/billing" className="px-4 py-2 mx-1 text-white hover:bg-indigo-600 rounded-md transition-colors duration-200">
                Billing
              </Link>
            </nav>
          </div>
        </header>
        
        {/* Main Content */}
        <main className="container mx-auto p-6">
          <div className="bg-white rounded-lg shadow-lg p-6 border border-indigo-100">
            <Routes>
              <Route path="/" element={<ProductManager />} />
              <Route path="/billing" element={<BillingPage />} />
              <Route path="/add-product" element={<ProductManager />} />
              <Route path="/edit-product/:id" element={<ProductManager />} />
            </Routes>
          </div>
        </main>
        
        {/* Footer */}
        <footer className="bg-indigo-500 text-white p-4 mt-8">
          <div className="container mx-auto text-center text-sm">
            <p>© {new Date().getFullYear()} Inventory System | All Rights Reserved</p>
          </div>
        </footer>
      </div>
    </Router>
  );
};

export default App;