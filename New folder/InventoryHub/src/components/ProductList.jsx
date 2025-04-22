import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const navigate = useNavigate();
  
  // State for delete confirmation popup
  const [deletePopup, setDeletePopup] = useState({
    isOpen: false,
    productId: null,
    productName: "",
    position: { top: 0, left: 0 }
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/products");
      setProducts(response.data);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (id) => {
    navigate(`/edit-product/${id}`);
  };

  const openDeletePopup = (id, name, event) => {
    // Get position for the popup based on click event
    const rect = event.currentTarget.getBoundingClientRect();
    setDeletePopup({
      isOpen: true,
      productId: id,
      productName: name,
      position: { 
        top: rect.bottom + window.scrollY, 
        left: rect.left + window.scrollX 
      }
    });
  };

  const closeDeletePopup = () => {
    setDeletePopup({
      isOpen: false,
      productId: null,
      productName: "",
      position: { top: 0, left: 0 }
    });
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`/api/products/${deletePopup.productId}`);
      setProducts(products.filter(product => product.id !== deletePopup.productId));
      closeDeletePopup();
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  };

  const getStockStatus = (quantity) => {
    if (quantity === 0) {
      return { 
        label: "Out of Stock", 
        color: "bg-red-100 text-red-800 border-red-200",
        icon: "⚠️"
      };
    } else if (quantity < 10) {
      return { 
        label: "Low Stock", 
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
        icon: "⚠️"
      };
    } else {
      return { 
        label: "In Stock", 
        color: "bg-green-100 text-green-800 border-green-200",
        icon: "✓"
      };
    }
  };

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

  const filteredProducts = sortedProducts.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSortIndicator = (key) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === 'ascending' ? ' ↑' : ' ↓';
    }
    return '';
  };

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (deletePopup.isOpen && !event.target.closest('.delete-popup')) {
        closeDeletePopup();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [deletePopup.isOpen]);

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Product List</h2>
        <button 
          onClick={() => navigate('/add-product')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md shadow transition duration-200 flex items-center"
        >
          <span className="mr-1">+</span> Add Product
        </button>
      </div>

      <div className="mb-6 bg-white rounded-lg shadow p-4">
        <div className="flex items-center">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search products..."
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={fetchProducts}
            className="ml-3 px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-2 text-gray-600">Loading products...</p>
        </div>
      ) : (
        <>
          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-lg shadow text-center py-8">
              <p className="text-gray-500">No products found.</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('id')}
                      >
                        ID {getSortIndicator('id')}
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('name')}
                      >
                        Name {getSortIndicator('name')}
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('price')}
                      >
                        Price {getSortIndicator('price')}
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('quantity')}
                      >
                        Quantity {getSortIndicator('quantity')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stock Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredProducts.map((product) => {
                      const stockStatus = getStockStatus(product.quantity);
                      return (
                        <tr key={product.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            #{product.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {product.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            ${product.price.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {product.quantity}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${stockStatus.color} border`}>
                              <span className="mr-1">{stockStatus.icon}</span>
                              {stockStatus.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button 
                                className="bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-1 rounded-md transition duration-200" 
                                onClick={() => handleEdit(product.id)}
                              >
                                Edit
                              </button>
                              <button 
                                className="bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1 rounded-md transition duration-200" 
                                onClick={(e) => openDeletePopup(product.id, product.name, e)}
                              >
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
          <div className="mt-4 text-sm text-gray-500">
            Showing {filteredProducts.length} of {products.length} products
          </div>
        </>
      )}
      
      {/* Simple Delete Confirmation Popup */}
      {deletePopup.isOpen && (
        <div 
          className="delete-popup fixed z-50 bg-white shadow-lg rounded-md border border-gray-200 p-4"
          style={{
            top: `${deletePopup.position.top}px`,
            left: `${deletePopup.position.left}px`,
          }}
        >
          <p className="text-sm font-medium mb-3">
            Are you sure you want to delete <span className="font-bold">{deletePopup.productName}</span>?
          </p>
          <div className="flex space-x-2 justify-end">
            <button
              onClick={closeDeletePopup}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md transition"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded-md transition"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductList;