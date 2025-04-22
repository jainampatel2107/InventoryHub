import React, { useState, useEffect } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "./ui/dialog";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardFooter 
} from "./ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "./ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "./ui/accordion";
import { Badge } from "./ui/badge";
import { ShoppingCart, Plus, Minus, Calendar, FileText, RefreshCw, Search } from "lucide-react";

// Store information
const STORE_NAME = "My Store";
const STORE_ADDRESS = "123 Store Street, City, State 12345";
const STORE_PHONE = "(123) 456-7890";

const BillingPage = () => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [total, setTotal] = useState(0);
  const [bills, setBills] = useState([]);
  const [generatedBill, setGeneratedBill] = useState(null);
  const [billDialogOpen, setBillDialogOpen] = useState(false);
  const [quantities, setQuantities] = useState({});
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchProducts();
    fetchBills();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get("/api/products");
      setProducts(response.data);
      
      // Initialize quantities state
      const initialQuantities = {};
      response.data.forEach(product => {
        initialQuantities[product.id] = 1;
      });
      setQuantities(initialQuantities);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const fetchBills = async () => {
    try {
      const response = await axios.get("/api/bills");
      setBills(response.data);
    } catch (error) {
      console.error("Error fetching bills:", error);
    }
  };

  const updateQuantity = (productId, value) => {
    setQuantities({
      ...quantities,
      [productId]: value
    });
  };

  const addToCart = (product) => {
    const quantity = quantities[product.id];
    
    if (quantity > product.quantity) {
      alert("Not enough stock available");
      return;
    }
    
    // Check if product is already in cart
    const existingItemIndex = cart.findIndex(item => item.id === product.id);
    
    if (existingItemIndex !== -1) {
      // Update existing item
      const updatedCart = [...cart];
      updatedCart[existingItemIndex].quantity += quantity;
      
      if (updatedCart[existingItemIndex].quantity > product.quantity) {
        alert("Not enough stock available");
        return;
      }
      
      setCart(updatedCart);
      updateTotal(updatedCart);
    } else {
      // Add new item
      const updatedCart = [...cart, { ...product, quantity }];
      setCart(updatedCart);
      updateTotal(updatedCart);
    }
  };

  const removeFromCart = (productId) => {
    const updatedCart = cart.filter(item => item.id !== productId);
    setCart(updatedCart);
    updateTotal(updatedCart);
  };

  const updateCartItemQuantity = (productId, newQuantity) => {
    const product = products.find(p => p.id === productId);
    
    if (newQuantity > product.quantity) {
      alert("Not enough stock available");
      return;
    }
    
    const updatedCart = cart.map(item => 
      item.id === productId ? { ...item, quantity: newQuantity } : item
    );
    
    setCart(updatedCart);
    updateTotal(updatedCart);
  };

  const updateTotal = (cartItems) => {
    const totalAmount = cartItems.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0
    );
    setTotal(totalAmount);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert("Cart is empty");
      return;
    }

    try {
      // Prepare cart items with correct quantities and format for submission
      const cartItems = cart.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity
      }));
      
      const response = await axios.post("/api/bills", {
        items: cartItems,
        total: total
      });
      
      setGeneratedBill({
        ...response.data,
        products: cartItems,
        total: total
      });
      
      setBillDialogOpen(true);
      setCart([]);
      setTotal(0);
      fetchProducts();
      fetchBills();
    } catch (error) {
      console.error("Error generating bill:", error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const generatePDF = (bill) => {
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text(STORE_NAME, 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(STORE_ADDRESS, 105, 30, { align: 'center' });
    doc.text(STORE_PHONE, 105, 35, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`Bill #${bill.id}`, 20, 50);
    doc.text(`Date: ${formatDate(bill.date)}`, 20, 60);
    
    doc.setLineWidth(0.1);
    
    doc.setFillColor(240, 240, 240);
    doc.rect(20, 70, 170, 10, 'F');
    doc.setTextColor(0, 0, 0);
    doc.text("Item", 25, 77);
    doc.text("Qty", 105, 77);
    doc.text("Price", 125, 77);
    doc.text("Total", 160, 77);
    
    let y = 80;
    bill.products.forEach((item, i) => {
      const isGray = i % 2 === 0;
      if (isGray) {
        doc.setFillColor(250, 250, 250);
        doc.rect(20, y, 170, 10, 'F');
      }
      
      doc.text(item.name.substring(0, 40), 25, y + 7);
      doc.text(item.quantity.toString(), 105, y + 7);
      doc.text(`inr${item.price.toFixed(2)}`, 125, y + 7);
      doc.text(`inr${(item.price * item.quantity).toFixed(2)}`, 160, y + 7);
      
      y += 10;
    });
    
    doc.rect(20, 70, 170, y - 70, 'S');
    
    for (let i = 0; i <= bill.products.length; i++) {
      doc.line(20, 70 + i * 10, 190, 70 + i * 10);
    }
    
    doc.line(100, 70, 100, y);
    doc.line(120, 70, 120, y);
    doc.line(150, 70, 150, y);
    
    doc.setFillColor(240, 240, 240);
    doc.rect(120, y + 10, 70, 10, 'F');
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text("Total:", 125, y + 17);
    doc.text(`inr${bill.total.toFixed(2)}`, 160, y + 17);
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text("Thank you for your business!", 105, y + 40, { align: 'center' });
    
    doc.save(`Bill_${bill.id}.pdf`);
  };

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadgeColor = (quantity) => {
    if (quantity > 10) return "bg-green-100 text-green-800 border-green-200";
    if (quantity > 0) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    return "bg-red-100 text-red-800 border-red-200";
  };

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Billing Management</h1>
        <p className="text-gray-500">Create bills, manage cart, and view bill history</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Products Section */}
        <div className="md:col-span-2">
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="bg-gray-50 border-b border-gray-200 px-6 py-4">
              <CardTitle className="text-lg font-bold text-gray-800">Available Products</CardTitle>
            </CardHeader>
            
            <div className="p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center gap-4">
                <div className="relative flex-grow">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search products by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <button 
                  onClick={fetchProducts}
                  className="flex items-center gap-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                >
                  <RefreshCw size={16} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>
            
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="py-3 text-gray-700">Product Name</TableHead>
                      <TableHead className="py-3 text-gray-700 text-right">Price</TableHead>
                      <TableHead className="py-3 text-gray-700 text-center">Available</TableHead>
                      <TableHead className="py-3 text-gray-700 text-center">Quantity</TableHead>
                      <TableHead className="py-3 text-gray-700"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                          {searchTerm ? "No products found matching your search" : "No products available"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredProducts.map((product) => (
                        <TableRow key={product.id} className="border-b hover:bg-gray-50">
                          <TableCell className="font-medium text-gray-800 py-3">{product.name}</TableCell>
                          <TableCell className="text-right font-medium text-gray-700 py-3">
                          ₹{product.price?.toFixed(2) || "0.00"}
                          </TableCell>
                          <TableCell className="text-center py-3">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(product.quantity)}`}>
                              {product.quantity}
                            </span>
                          </TableCell>
                          <TableCell className="py-3">
                            <div className="flex items-center justify-center">
                              <button 
                                className="p-1 bg-gray-100 rounded-l-md border border-gray-300 hover:bg-gray-200 transition-colors"
                                onClick={() => updateQuantity(product.id, Math.max(1, quantities[product.id] - 1))}
                              >
                                <Minus size={16} className="text-gray-600" />
                              </button>
                              <input
                                type="number"
                                min="1"
                                max={product.quantity}
                                value={quantities[product.id] || 1}
                                onChange={(e) => updateQuantity(product.id, parseInt(e.target.value) || 1)}
                                className="w-12 p-1 text-center border-t border-b border-gray-300 focus:outline-none"
                              />
                              <button 
                                className="p-1 bg-gray-100 rounded-r-md border border-gray-300 hover:bg-gray-200 transition-colors"
                                onClick={() => updateQuantity(product.id, Math.min(product.quantity, (quantities[product.id] || 1) + 1))}
                              >
                                <Plus size={16} className="text-gray-600" />
                              </button>
                            </div>
                          </TableCell>
                          <TableCell className="py-3">
                            <button
                              className="w-full bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1.5 rounded-md transition-colors flex items-center justify-center gap-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                              onClick={() => addToCart(product)}
                              disabled={product.quantity === 0}
                            >
                              <Plus size={16} />
                              Add to Cart
                            </button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cart Section */}
        <div className="md:col-span-1">
          <Card className="border border-gray-200 shadow-sm h-full flex flex-col">
            <CardHeader className="bg-gray-50 border-b border-gray-200 px-6 py-4">
              <CardTitle className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <ShoppingCart size={18} className="text-indigo-500" />
                Current Bill
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 flex-grow">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-8">
                  <ShoppingCart size={48} className="text-gray-300 mb-3" />
                  <p className="text-gray-500 text-center">Your cart is empty</p>
                  <p className="text-gray-400 text-sm text-center mt-1">Add products from the available list</p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {cart.map((item) => (
                    <li key={item.id} className="border border-gray-200 rounded-md p-3 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start">
                        <p className="font-medium text-gray-800">{item.name}</p>
                        <p className="font-medium text-gray-800">₹{((item.price || 0) * (item.quantity || 1)).toFixed(2)}</p>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <div className="flex items-center mt-1">
                          <button 
                            className="p-1 bg-gray-100 rounded-l-sm border border-gray-300 text-xs hover:bg-gray-200 transition-colors"
                            onClick={() => updateCartItemQuantity(item.id, Math.max(1, item.quantity - 1))}
                          >
                            <Minus size={12} className="text-gray-600" />
                          </button>
                          <span className="px-2 text-sm border-t border-b border-gray-300">
                            {item.quantity}
                          </span>
                          <button 
                            className="p-1 bg-gray-100 rounded-r-sm border border-gray-300 text-xs hover:bg-gray-200 transition-colors"
                            onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus size={12} className="text-gray-600" />
                          </button>
                        </div>
                        <button 
                          className="text-red-500 text-xs font-medium hover:text-red-700 transition-colors"
                          onClick={() => removeFromCart(item.id)}
                        >
                          Remove
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
            <CardFooter className="bg-gray-50 border-t border-gray-200 flex justify-between items-center p-4">
              <div>
                <p className="font-medium text-sm text-gray-600">Total Amount:</p>
                <p className="text-lg font-bold text-gray-800">₹{total.toFixed(2)}</p>
              </div>
              <button
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                onClick={handleCheckout}
                disabled={cart.length === 0}
              >
                Generate Bill
              </button>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Bill History Section */}
      <Card className="mt-6 border border-gray-200 shadow-sm">
        <CardHeader className="bg-gray-50 border-b border-gray-200 px-6 py-4">
          <CardTitle className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <FileText size={18} className="text-indigo-500" />
            Bill History
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {bills.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <FileText size={48} className="text-gray-300 mb-3" />
              <p className="text-gray-500 text-center">No bills generated yet</p>
              <p className="text-gray-400 text-sm text-center mt-1">Bills will appear here once generated</p>
            </div>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {bills.map((bill) => (
                <AccordionItem key={bill.id} value={`bill-${bill.id}`} className="border-b border-gray-200 last:border-0">
                  <AccordionTrigger className="px-6 py-4 hover:bg-gray-50 transition-colors text-gray-800">
                    <div className="flex flex-col md:flex-row md:justify-between w-full text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-bold">Bill #{bill.id}</span>
                        <Badge variant="outline" className="ml-2 bg-gray-100 text-gray-800 border-gray-200 font-medium">
                        ₹{(bill.total || 0).toFixed(2)}
                        </Badge>
                      </div>
                      <div className="flex items-center text-sm text-gray-500 mt-1 md:mt-0">
                        <Calendar size={14} className="mr-1" />
                        {formatDate(bill.date || new Date().toISOString())}
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="px-6 pb-6">
                      <div className="bg-gray-50 p-3 rounded-md mb-4 border border-gray-200">
                        <p className="text-sm text-gray-500">
                          <span className="font-medium">Bill Date:</span> {formatDate(bill.date || new Date().toISOString())}
                        </p>
                      </div>
                      <div className="overflow-x-auto border border-gray-200 rounded-md">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-gray-50">
                              <TableHead className="py-3 text-gray-700">Product</TableHead>
                              <TableHead className="py-3 text-gray-700 text-right">Qty</TableHead>
                              <TableHead className="py-3 text-gray-700 text-right">Price</TableHead>
                              <TableHead className="py-3 text-gray-700 text-right">Total</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {bill.products && bill.products.map((product, idx) => (
                              <TableRow key={idx} className="hover:bg-gray-50">
                                <TableCell className="py-3 text-gray-800">{product.name}</TableCell>
                                <TableCell className="py-3 text-gray-800 text-right">{product.quantity || 0}</TableCell>
                                <TableCell className="py-3 text-gray-800 text-right">₹{(product.price || 0).toFixed(2)}</TableCell>
                                <TableCell className="py-3 text-gray-800 text-right font-medium">₹{((product.price || 0) * (product.quantity || 1)).toFixed(2)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      <div className="flex justify-end mt-4">
                        <div className="bg-indigo-50 p-3 rounded-md border border-indigo-100">
                          <span className="font-medium text-gray-700">Total Amount: </span>
                          <span className="font-bold text-indigo-700">₹{(bill.total || 0).toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="flex justify-end mt-4">
                        <button
                          className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-md transition-colors text-sm font-medium flex items-center gap-2"
                          onClick={() => generatePDF(bill)}
                        >
                          <FileText size={16} />
                          Download PDF
                        </button>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>

      {/* Bill Generated Dialog */}
      <Dialog open={billDialogOpen} onOpenChange={setBillDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white text-black shadow-lg border border-gray-200 rounded-lg">
          <DialogHeader className="border-b border-gray-200 pb-4">
            <DialogTitle className="text-xl font-bold text-gray-800">Bill Generated Successfully</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <div className="bg-gray-50 p-3 rounded-md mb-4 border border-gray-200">
              <div className="flex justify-between text-sm text-gray-700">
                <span className="font-medium">Bill ID: #{generatedBill?.id || ""}</span>
                <span>{formatDate(generatedBill?.date || new Date().toISOString())}</span>
              </div>
            </div>
            
            <div className="overflow-x-auto border border-gray-200 rounded-md">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="py-3 text-gray-700">Item</TableHead>
                    <TableHead className="py-3 text-gray-700 text-right">Qty</TableHead>
                    <TableHead className="py-3 text-gray-700 text-right">Price</TableHead>
                    <TableHead className="py-3 text-gray-700 text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {generatedBill?.products?.map((item, index) => (
                    <TableRow key={index} className="hover:bg-gray-50">
                      <TableCell className="py-3 text-gray-800">{item.name}</TableCell>
                      <TableCell className="py-3 text-gray-800 text-right">{item.quantity || 0}</TableCell>
                      <TableCell className="py-3 text-gray-800 text-right">₹{(item.price || 0).toFixed(2)}</TableCell>
                      <TableCell className="py-3 text-gray-800 text-right font-medium">₹{((item.price || 0) * (item.quantity || 1)).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            <div className="flex justify-end mt-4">
              <div className="bg-indigo-50 p-3 rounded-md border border-indigo-100">
                <span className="font-medium text-gray-700">Total Amount: </span>
                <span className="font-bold text-indigo-700">₹{(generatedBill?.total || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          <DialogFooter className="flex justify-end space-x-2 pt-4 border-t border-gray-200">
            <button 
              className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-md transition-colors font-medium flex items-center gap-2"
              onClick={() => {
                generatePDF(generatedBill);
                setBillDialogOpen(false);
              }}
            >
              <FileText size={16} />
              Download PDF
            </button>
            <button 
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md transition-colors font-medium"
              onClick={() => setBillDialogOpen(false)}
            >
              Close
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BillingPage;