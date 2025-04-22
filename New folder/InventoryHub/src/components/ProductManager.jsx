import React, { useState, useEffect } from "react";
import axios from "axios";

const ProductManager = () => {
  // Product state management
  const [products, setProducts] = useState([]);
  const [currentProduct, setCurrentProduct] = useState({ name: "", price: "", quantity: "" });
  
  // UI state management
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'ascending' });
  const [error, setError] = useState("");
  
  // Modal state management
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  
  // Delete confirmation state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  // Duplicate product state
  const [duplicateProduct, setDuplicateProduct] = useState(null);
  const [duplicateConfirmOpen, setDuplicateConfirmOpen] = useState(false);

  // Load products on component mount
  useEffect(() => {
    fetchProducts();
  }, []);

  // Fetch all products
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/products");
      setProducts(response.data);
    } catch (error) {
      console.error("Error fetching products:", error);
      setError("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  // Check if product name already exists
  const checkProductExists = (name) => {
    return products.find(product => 
      product.name.toLowerCase() === name.toLowerCase() && 
      (modalMode === "add" || product.id !== currentProduct.id)
    );
  };

  // Open modal for adding product
  const openAddModal = () => {
    setCurrentProduct({ name: "", price: "", quantity: "" });
    setModalMode("add");
    setModalOpen(true);
  };

  // Open modal for editing product
  const openEditModal = async (productId) => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/products/${productId}`);
      setCurrentProduct(response.data);
      setModalMode("edit");
      setModalOpen(true);
    } catch (error) {
      setError("Failed to load product data");
      console.error("Error fetching product:", error);
    } finally {
      setLoading(false);
    }
  };

  // Close modal
  const closeModal = () => {
    setModalOpen(false);
    setError("");
  };

  // Handle form input changes
  const handleChange = (e) => {
    setCurrentProduct({ ...currentProduct, [e.target.name]: e.target.value });
  };

  // Handle form submission (add or update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Check for existing product with the same name
    if (modalMode === "add") {
      const existingProduct = checkProductExists(currentProduct.name);
      if (existingProduct) {
        setDuplicateProduct(existingProduct);
        setDuplicateConfirmOpen(true);
        return;
      }
    }

    submitProduct();
  };

  // Submit product after validation
  const submitProduct = async () => {
    setSaving(true);

    const productData = {
      ...currentProduct,
      price: parseFloat(currentProduct.price),
      quantity: parseInt(currentProduct.quantity, 10)
    };

    try {
      if (modalMode === "add") {
        const response = await axios.post("/api/products", productData);
        setProducts([...products, response.data]);
      } else {
        const response = await axios.put(`/api/products/${currentProduct.id}`, productData);
        setProducts(products.map(product => 
          product.id === currentProduct.id ? response.data : product
        ));
      }
      closeModal();
      setDuplicateConfirmOpen(false);
    } catch (error) {
      setError(`Failed to ${modalMode === "add" ? 'add' : 'update'} product. Please try again.`);
      console.error(`Error ${modalMode === "add" ? 'adding' : 'updating'} product:`, error);
    } finally {
      setSaving(false);
    }
  };

  // Handle updating existing product instead of creating duplicate
  const handleUpdateExisting = () => {
    setCurrentProduct({
      ...duplicateProduct,
      price: currentProduct.price || duplicateProduct.price,
      quantity: currentProduct.quantity || duplicateProduct.quantity
    });
    setModalMode("edit");
    setDuplicateConfirmOpen(false);
  };

  // Open delete confirmation
  const openDeleteConfirm = (product) => {
    setProductToDelete(product);
    setDeleteConfirmOpen(true);
  };

  // Close delete confirmation
  const closeDeleteConfirm = () => {
    setDeleteConfirmOpen(false);
    setProductToDelete(null);
  };

  // Confirm delete
  const confirmDelete = async () => {
    try {
      await axios.delete(`/api/products/${productToDelete.id}`);
      setProducts(products.filter(product => product.id !== productToDelete.id));
      closeDeleteConfirm();
    } catch (error) {
      console.error("Error deleting product:", error);
      setError("Failed to delete product");
    }
  };

  // Sorting functionality
  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const sortedProducts = React.useMemo(() => {
    let sortableItems = [...products];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [products, sortConfig]);

  // Filtering functionality
  const filteredProducts = sortedProducts.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Utility functions
  const getSortIndicator = (key) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === 'ascending' ? ' ↑' : ' ↓';
    }
    return '';
  };

  const getStockStatus = (quantity) => {
    if (quantity === 0) {
      return { 
        label: "Out of Stock", 
        color: "bg-red-50 text-red-700 border-red-100",
        textColor: "text-red-700",
        bgColor: "bg-red-50",
        icon: "⚠️"
      };
    } else if (quantity < 10) {
      return { 
        label: "Low Stock", 
        color: "bg-amber-50 text-amber-700 border-amber-100",
        textColor: "text-amber-700",
        bgColor: "bg-amber-50",
        icon: "⚠️"
      };
    } else {
      return { 
        label: "In Stock", 
        color: "bg-emerald-50 text-emerald-700 border-emerald-100",
        textColor: "text-emerald-700",
        bgColor: "bg-emerald-50",
        icon: "✓"
      };
    }
  };

  // Render loading state
  if (loading && products.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-indigo-500 border-r-transparent"></div>
          <p className="mt-4 text-slate-600 font-medium">Loading inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Inventory Management</h1>
          <p className="text-slate-500">Manage your products, track inventory, and monitor stock levels</p>
        </div>

        {/* Action Bar */}
        <div className="bg-white rounded-xl shadow-sm mb-8 p-5 border border-slate-100">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search products by name..."
                className="pl-10 pr-4 py-3 w-full bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button 
                onClick={fetchProducts}
                className="px-4 py-3 border border-slate-200 rounded-lg bg-white text-slate-600 hover:bg-slate-50 transition-all flex items-center shadow-sm"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
              <button 
                onClick={openAddModal}
                className="px-5 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-all flex items-center shadow-sm"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Product
              </button>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && !modalOpen && (
          <div className="mb-6 bg-red-50 text-red-700 p-4 rounded-lg border border-red-100 shadow-sm animate-fade-in">
            <div className="flex">
              <svg className="w-5 h-5 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-1 9a1 1 0 102 0V11a1 1 0 10-2 0v4z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm text-center py-16 px-4 border border-slate-100">
            <svg className="mx-auto h-16 w-16 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <h2 className="mt-4 text-xl font-semibold text-slate-700">No products found</h2>
            <p className="mt-2 text-slate-500 max-w-md mx-auto">
              {searchTerm ? 
                `We couldn't find any products matching "${searchTerm}". Try a different search term or add a new product.` : 
                "Your inventory is empty. Start by adding your first product to manage your inventory."}
            </p>
            <button 
              onClick={openAddModal}
              className="mt-6 px-6 py-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 inline-flex items-center transition-all shadow-sm"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              {searchTerm ? "Add New Product" : "Add Your First Product"}
            </button>
          </div>
        ) : (
          /* Product Table */
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-100">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th 
                      className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-all"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center">
                        <span>Product Name</span>
                        <span className="ml-1 text-slate-400">{getSortIndicator('name')}</span>
                      </div>
                    </th>
                    <th 
                      className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-all"
                      onClick={() => handleSort('price')}
                    >
                      <div className="flex items-center">
                        <span>Price</span>
                        <span className="ml-1 text-slate-400">{getSortIndicator('price')}</span>
                      </div>
                    </th>
                    <th 
                      className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-all"
                      onClick={() => handleSort('quantity')}
                    >
                      <div className="flex items-center">
                        <span>Quantity</span>
                        <span className="ml-1 text-slate-400">{getSortIndicator('quantity')}</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map((product) => {
                    const stockStatus = getStockStatus(product.quantity);
                    return (
                      <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-5 text-sm font-medium text-slate-800">
                          {product.name}
                        </td>
                        <td className="px-6 py-5 text-sm text-slate-600 font-mono">
                          <span className="text-slate-900 font-semibold">₹{product.price.toFixed(2)}</span>
                        </td>
                        <td className="px-6 py-5 text-sm text-slate-600">
                          <span className={`font-semibold ${product.quantity === 0 ? 'text-red-600' : product.quantity < 10 ? 'text-amber-600' : 'text-slate-900'}`}>
                            {product.quantity.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${stockStatus.color}`}>
                            <span className="mr-1">{stockStatus.icon}</span>
                            {stockStatus.label}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-sm font-medium text-right">
                          <div className="flex space-x-4 justify-end">
                            <button 
                              className="text-indigo-500 hover:text-indigo-600 hover:underline transition-colors flex items-center"
                              onClick={() => openEditModal(product.id)}
                            >
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Edit
                            </button>
                            <button 
                              className="text-rose-600 hover:text-rose-800 hover:underline transition-colors flex items-center"
                              onClick={() => openDeleteConfirm(product)}
                            >
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Results Summary */}
        <div className="mt-4 text-sm text-slate-500 flex items-center">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>
            {filteredProducts.length === products.length 
              ? `Showing all ${products.length} products` 
              : `Showing ${filteredProducts.length} of ${products.length} products`}
          </span>
        </div>
      </div>
      
      {/* Add/Edit Product Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900 bg-opacity-70 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-auto overflow-hidden">
            {/* Modal Header */}
            <div className="bg-indigo-500 text-white px-6 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">
                  {modalMode === "add" ? "Add New Product" : "Edit Product"}
                </h3>
                <button
                  onClick={closeModal}
                  className="text-white hover:text-indigo-100 transition-colors"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {error && (
                <div className="mb-5 bg-red-50 text-red-700 p-3 rounded-lg border border-red-100 flex items-start">
                  <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-1 9a1 1 0 102 0V11a1 1 0 10-2 0v4z" clipRule="evenodd" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-5">
                  <label className="block text-slate-700 font-medium mb-2" htmlFor="name">Product Name</label>
                  <input
                    id="name"
                    type="text"
                    name="name"
                    className="w-full border border-slate-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-slate-50"
                    value={currentProduct.name}
                    onChange={handleChange}
                    placeholder="Enter product name"
                    required
                  />
                </div>
                
                <div className="mb-5">
                  <label className="block text-slate-700 font-medium mb-2" htmlFor="price">Price (₹)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-slate-500">₹</span>
                    </div>
                    <input
                      id="price"
                      type="number"
                      name="price"
                      step="0.01"
                      min="0"
                      className="w-full border border-slate-300 p-3 pl-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-slate-50"
                      value={currentProduct.price}
                      onChange={handleChange}
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>
                
                <div className="mb-6">
                  <label className="block text-slate-700 font-medium mb-2" htmlFor="quantity">Quantity</label>
                  <input
                    id="quantity"
                    type="number"
                    name="quantity"
                    min="0"
                    className="w-full border border-slate-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-slate-50"
                    value={currentProduct.quantity}
                    onChange={handleChange}
                    placeholder="Enter quantity"
                    required
                  />
                </div>
                
                <div className="flex items-center justify-end space-x-3 mt-8">
                  <button 
                    type="button" 
                    className="px-5 py-2.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors font-medium"
                    onClick={closeModal}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-5 py-2.5 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors flex items-center shadow-sm font-medium"
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </>
                    ) : (
                      modalMode === "add" ? "Add Product" : "Update Product"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 bg-slate-900 bg-opacity-70 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-auto">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-50 mb-4">
                <svg className="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Delete Product</h3>
              <p className="text-slate-600">
                Are you sure you want to delete <span className="font-semibold">{productToDelete?.name}</span>? This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-center space-x-3 mt-6">
              <button
                onClick={closeDeleteConfirm}
                className="px-5 py-2.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm font-medium"
              >
                Delete Product
              </button>
            </div>
          </div>
          </div>
      )}

      {/* Duplicate Product Confirmation Modal */}
      {duplicateConfirmOpen && (
        <div className="fixed inset-0 bg-slate-900 bg-opacity-70 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-auto">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-amber-50 mb-4">
                <svg className="h-10 w-10 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Duplicate Product</h3>
              <p className="text-slate-600">
                A product with the name <span className="font-semibold">{currentProduct.name}</span> already exists. What would you like to do?
              </p>
            </div>
            <div className="flex justify-center space-x-3 mt-6">
              <button
                onClick={() => setDuplicateConfirmOpen(false)}
                className="px-5 py-2.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateExisting}
                className="px-5 py-2.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors shadow-sm font-medium"
              >
                Update Existing
              </button>
              <button
                onClick={submitProduct}
                className="px-5 py-2.5 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors shadow-sm font-medium"
              >
                Create New
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManager;