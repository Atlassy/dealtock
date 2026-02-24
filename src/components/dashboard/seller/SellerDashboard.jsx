// src/components/dashboard/seller/SellerDashboard.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../../../contexts/SupabaseAuthContext";
import { supabase } from "../../../lib/supabaseClient";
import { motion } from "framer-motion";
import { 
  Package, 
  TrendingUp,
  Percent,
  Euro,
  Filter,
  RefreshCw,
  MapPin,
  Tag,
  Layers,
  FileText,
  Image as ImageIcon,
  DollarSign,
  Hash,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info
} from "lucide-react";
import { toast } from "sonner";

// ============================================
// CONSTANTS
// ============================================
const CATEGORIES = [
  "Electronics", 
  "Fashion", 
  "Home", 
  "Beauty", 
  "Sports", 
  "Books", 
  "Automotive", 
  "Other"
];

const CONDITIONS = [
  { value: "new", label: "New", color: "green" },
  { value: "opened_like_new", label: "Opened - Like New", color: "blue" },
  { value: "damaged", label: "Damaged / For Parts", color: "orange" }
];

const STATUSES = [
  { value: "available", label: "Available", color: "green" },
  { value: "pending", label: "Pending", color: "yellow" },
  { value: "sold", label: "Sold", color: "purple" },
  { value: "shipped", label: "Shipped", color: "blue" },
  { value: "delivered", label: "Delivered", color: "indigo" },
  { value: "returned", label: "Returned", color: "red" }
];

const MOROCCAN_CITIES = [
  "Casablanca", "Rabat", "Fes", "Marrakech", "Agadir", "Tanger", 
  "Meknes", "Oujda", "Kenitra", "Sale", "Temara", "Safi", 
  "El Jadida", "Beni Mellal", "Khouribga", "Mohammedia", "Settat",
  "Berrechid", "Nador", "Taza", "Essaouira", "Laayoune", "Dakhla"
];

// ============================================
// PRODUCT TABLE COMPONENT
// ============================================
const ProductTable = ({ products, onEdit, onDelete, onToggleAvailability }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-700">
          <tr>
            <th className="text-left p-4 font-medium">Product</th>
            <th className="text-left p-4 font-medium">SKU</th>
            <th className="text-left p-4 font-medium">Your Price</th>
            <th className="text-left p-4 font-medium">Quantity</th>
            <th className="text-left p-4 font-medium">Location</th>
            <th className="text-left p-4 font-medium">Status</th>
            <th className="text-left p-4 font-medium">Condition</th>
            <th className="text-left p-4 font-medium">Marketplace Price</th>
            <th className="text-left p-4 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map(product => {
            const marketplacePrice = product.purchase_price 
              ? (product.purchase_price * 1.20).toFixed(2) 
              : '0.00';
            
            return (
              <tr key={product.id} className="border-b hover:bg-gray-50/50 transition">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      {product.image_url ? (
                        <img 
                          src={product.image_url} 
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://via.placeholder.com/48?text=No+Image';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
                          <ImageIcon className="w-6 h-6 text-gray-500" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{product.name || "Unnamed Product"}</p>
                      <p className="text-xs text-gray-500 mt-1">{product.category || "Uncategorized"}</p>
                      {product.description && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-1">{product.description}</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                    {product.sku || '—'}
                  </span>
                </td>
                <td className="p-4">
                  <div>
                    <span className="font-bold text-gray-900">{product.purchase_price?.toFixed(2) || '0.00'} MAD</span>
                    <p className="text-xs text-green-600 mt-1">You receive this</p>
                  </div>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    product.quantity > 10 
                      ? 'bg-green-100 text-green-800' 
                      : product.quantity > 0 
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {product.quantity || 0} units
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-gray-500" />
                    <span className="text-sm">{product.location || 'Not set'}</span>
                  </div>
                </td>
                <td className="p-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    product.status === 'available' ? 'bg-green-100 text-green-800' :
                    product.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    product.status === 'sold' ? 'bg-purple-100 text-purple-800' :
                    product.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                    product.status === 'delivered' ? 'bg-indigo-100 text-indigo-800' :
                    product.status === 'returned' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {product.status || 'available'}
                  </span>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    product.condition === 'new' ? 'bg-green-100 text-green-800' :
                    product.condition === 'opened_like_new' ? 'bg-blue-100 text-blue-800' :
                    product.condition === 'damaged' ? 'bg-orange-100 text-orange-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {CONDITIONS.find(c => c.value === product.condition)?.label || product.condition || 'new'}
                  </span>
                </td>
                <td className="p-4">
                  <div>
                    <span className="font-medium text-blue-600">{marketplacePrice} MAD</span>
                    <p className="text-xs text-gray-500 mt-1">B2C (20% markup)</p>
                    <p className="text-xs text-gray-500">+ delivery fee</p>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => onEdit(product)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      title="Edit product"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button 
                      onClick={() => onToggleAvailability(product.id, !product.available_for_sale)}
                      className={`p-2 rounded-lg transition ${
                        product.available_for_sale 
                          ? 'text-green-600 hover:bg-green-50' 
                          : 'text-gray-400 hover:bg-gray-50'
                      }`}
                      title={product.available_for_sale ? 'Mark as unavailable' : 'Mark as available'}
                    >
                      {product.available_for_sale ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <XCircle className="w-4 h-4" />
                      )}
                    </button>
                    <button 
                      onClick={() => onDelete(product.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Delete product"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

// ============================================
// ADD PRODUCT FORM - COMPLETE VERSION
// ============================================
const AddProductForm = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    sku: '',
    purchase_price: '',
    quantity: 1,
    location: '',
    condition: 'new',
    image_url: '',
    available_for_sale: true,
    status: 'available'
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : 
              name === 'purchase_price' ? (value === '' ? '' : Number(value)) :
              name === 'quantity' ? (value === '' ? '' : parseInt(value) || 0) :
              value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name?.trim()) newErrors.name = 'Product name is required';
    if (!formData.purchase_price || formData.purchase_price <= 0) {
      newErrors.purchase_price = 'Price must be greater than 0';
    }
    if (!formData.quantity || formData.quantity < 1) {
      newErrors.quantity = 'Quantity must be at least 1';
    }
    if (!formData.location?.trim()) {
      newErrors.location = 'Location is required for shipping';
    }
    if (formData.image_url && !formData.image_url.match(/^https?:\/\/.+/)) {
      newErrors.image_url = 'Please enter a valid URL';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }
    
    setLoading(true);
    
    const submissionData = {
      ...formData,
      purchase_price: parseFloat(formData.purchase_price),
      quantity: parseInt(formData.quantity),
      sku: formData.sku || `SKU-${Date.now()}`,
      // NO sale_price - will be calculated by marketplace
    };

    await onSubmit(submissionData);
    setLoading(false);
  };

  // Calculate marketplace price preview
  const marketplacePrice = formData.purchase_price 
    ? (parseFloat(formData.purchase_price) * 1.20).toFixed(2) 
    : '0.00';
  const marketplaceFee = formData.purchase_price 
    ? (parseFloat(formData.purchase_price) * 0.20).toFixed(2) 
    : '0.00';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information Section */}
      <div className="bg-gray-50 rounded-lg p-5">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Info className="w-5 h-5 text-blue-500" />
          Basic Information
        </h3>
        
        <div className="space-y-4">
          {/* Product Name - Required */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.name ? 'border-red-500 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="e.g., iPhone 13 Pro Max"
              required
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Detailed description of your product..."
            />
          </div>

          {/* Category & SKU */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select category</option>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SKU (Optional)
              </label>
              <input
                type="text"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Auto-generated if empty"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Pricing & Inventory Section */}
      <div className="bg-gray-50 rounded-lg p-5">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-green-500" />
          Pricing & Inventory
        </h3>
        
        <div className="space-y-4">
          {/* Purchase Price - SELLER'S PRICE */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your Selling Price (MAD) <span className="text-red-500">*</span>
              <span className="ml-2 text-xs text-gray-500">You receive this amount</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500">DH</span>
              </div>
              <input
                type="number"
                name="purchase_price"
                value={formData.purchase_price}
                onChange={handleChange}
                className={`w-full pl-12 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.purchase_price ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="0.00"
                min="0"
                step="0.01"
                required
              />
            </div>
            {errors.purchase_price && (
              <p className="text-xs text-red-500 mt-1">{errors.purchase_price}</p>
            )}
            
            {/* Price Preview */}
            {formData.purchase_price > 0 && (
              <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Your Price:</span>
                  <span className="font-semibold text-gray-900">{formData.purchase_price} MAD</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Marketplace Fee (20%):</span>
                  <span className="text-blue-600 font-medium">+{marketplaceFee} MAD</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-blue-200">
                  <span className="text-sm font-medium text-gray-700">Customer Pays:</span>
                  <span className="font-bold text-green-600">{marketplacePrice} MAD</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  ⚡ B2B buyers see your price directly • B2C customers pay with 20% markup
                </p>
              </div>
            )}
          </div>

          {/* Quantity & Condition */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.quantity ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
                min="1"
                step="1"
                required
              />
              {errors.quantity && <p className="text-xs text-red-500 mt-1">{errors.quantity}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Condition
              </label>
              <select
                name="condition"
                value={formData.condition}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {CONDITIONS.map(cond => (
                  <option key={cond.value} value={cond.value}>{cond.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Location & Shipping Section */}
      <div className="bg-gray-50 rounded-lg p-5">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-orange-500" />
          Location & Shipping
        </h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Product Location (City) <span className="text-red-500">*</span>
            <span className="ml-2 text-xs text-gray-500">Used to calculate delivery fees</span>
          </label>
          <select
            name="location"
            value={formData.location}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.location ? 'border-red-500 bg-red-50' : 'border-gray-300'
            }`}
            required
          >
            <option value="">Select your city</option>
            {MOROCCAN_CITIES.sort().map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
          {errors.location && (
            <p className="text-xs text-red-500 mt-1">{errors.location}</p>
          )}
          <p className="text-xs text-gray-500 mt-2">
            📦 Delivery fees will be calculated automatically based on customer's location
          </p>
        </div>
      </div>

      {/* Media Section */}
      <div className="bg-gray-50 rounded-lg p-5">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-purple-500" />
          Media
        </h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Image URL
          </label>
          <input
            type="url"
            name="image_url"
            value={formData.image_url}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.image_url ? 'border-red-500 bg-red-50' : 'border-gray-300'
            }`}
            placeholder="https://example.com/image.jpg"
          />
          {errors.image_url && <p className="text-xs text-red-500 mt-1">{errors.image_url}</p>}
          
          {/* Image Preview */}
          {formData.image_url && (
            <div className="mt-3 flex items-center gap-3">
              <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                <img 
                  src={formData.image_url} 
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://via.placeholder.com/64?text=Invalid+URL';
                  }}
                />
              </div>
              <span className="text-xs text-gray-500">Image preview</span>
            </div>
          )}
        </div>
      </div>

      {/* Status & Availability */}
      <div className="bg-gray-50 rounded-lg p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">
              Available for sale
            </label>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="available_for_sale"
                checked={formData.available_for_sale}
                onChange={handleChange}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          <span className="text-xs text-gray-500">
            {formData.available_for_sale ? 'Product will appear in marketplace' : 'Product hidden from buyers'}
          </span>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex gap-4 pt-4 border-t border-gray-200">
        <button 
          type="button" 
          onClick={onCancel}
          className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
          disabled={loading}
        >
          Cancel
        </button>
        <button 
          type="submit"
          className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Adding Product...
            </span>
          ) : (
            'Add Product'
          )}
        </button>
      </div>
    </form>
  );
};

// ============================================
// EDIT PRODUCT FORM - COMPLETE VERSION
// ============================================
// ============================================
// EDIT PRODUCT FORM - COMPLETE CORRECTED VERSION
// ============================================
const EditProductForm = ({ product, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    sku: '',
    purchase_price: 0,
    quantity: 0,
    location: '',
    condition: 'new',
    image_url: '',
    available_for_sale: true,
    status: 'available'
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [originalSku, setOriginalSku] = useState(''); // Store original SKU
  const [isCheckingSku, setIsCheckingSku] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        category: product.category || '',
        sku: product.sku || '',
        purchase_price: product.purchase_price || 0,
        quantity: product.quantity || 0,
        location: product.location || '',
        condition: product.condition || 'new',
        image_url: product.image_url || '',
        available_for_sale: product.available_for_sale !== false,
        status: product.status || 'available'
      });
      setOriginalSku(product.sku || ''); // Store original SKU for comparison
    }
  }, [product]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : 
              name === 'purchase_price' ? (value === '' ? '' : Number(value)) :
              name === 'quantity' ? (value === '' ? '' : parseInt(value) || 0) :
              value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // SKU Validation Function
  const checkSkuAvailability = async (sku) => {
    if (!sku || sku === originalSku) return true; // Same SKU, no need to check
    
    setIsCheckingSku(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, sku')
        .eq('sku', sku)
        .neq('id', product.id) // Exclude current product
        .maybeSingle();

      if (error) throw error;
      return !data; // Return true if no duplicate found
    } catch (error) {
      console.error('SKU validation error:', error);
      return false;
    } finally {
      setIsCheckingSku(false);
    }
  };

  const validateForm = async () => {
    const newErrors = {};
    
    // Required fields validation
    if (!formData.name?.trim()) {
      newErrors.name = 'Product name is required';
    }
    
    if (!formData.purchase_price || formData.purchase_price <= 0) {
      newErrors.purchase_price = 'Price must be greater than 0';
    }
    
    if (!formData.quantity || formData.quantity < 0) {
      newErrors.quantity = 'Quantity cannot be negative';
    }
    
    if (!formData.location?.trim()) {
      newErrors.location = 'Location is required for shipping';
    }

    // SKU UNIQUE VALIDATION - Only check if SKU changed
    if (formData.sku && formData.sku !== originalSku) {
      const isAvailable = await checkSkuAvailability(formData.sku);
      if (!isAvailable) {
        newErrors.sku = 'This SKU already exists. Please use a different SKU.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const isValid = await validateForm();
    if (!isValid) {
      toast.error('Please fix the errors in the form');
      return;
    }
    
    setLoading(true);
    
    // Prepare submission data - Auto-generate SKU if empty
    const submissionData = {
      ...formData,
      sku: formData.sku?.trim() || `SKU-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      purchase_price: parseFloat(formData.purchase_price) || 0,
      quantity: parseInt(formData.quantity) || 0,
      updated_at: new Date().toISOString()
    };

    await onSubmit(submissionData);
    setLoading(false);
  };

  const marketplacePrice = formData.purchase_price 
    ? (formData.purchase_price * 1.20).toFixed(2) 
    : '0.00';
  const marketplaceFee = formData.purchase_price 
    ? (formData.purchase_price * 0.20).toFixed(2) 
    : '0.00';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="bg-gray-50 rounded-lg p-5">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Info className="w-5 h-5 text-blue-500" />
          Basic Information
        </h3>
        
        <div className="space-y-4">
          {/* Product Name - Required */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.name ? 'border-red-500 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="e.g., iPhone 13 Pro Max"
              required
            />
            {errors.name && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.name}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Detailed description of your product..."
            />
          </div>

          {/* Category & SKU */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select category</option>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            
            {/* SKU Field with Validation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SKU
                <span className="ml-2 text-xs text-gray-500 font-normal">
                  {formData.sku === originalSku ? '(unchanged)' : '(optional)'}
                </span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="sku"
                  value={formData.sku}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.sku ? 'border-red-500 bg-red-50' : 
                    formData.sku && formData.sku !== originalSku && !errors.sku ? 'border-yellow-300 bg-yellow-50' : 
                    'border-gray-300'
                  }`}
                  placeholder="Auto-generated if empty"
                />
                {isCheckingSku && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <RefreshCw className="w-4 h-4 animate-spin text-gray-400" />
                  </div>
                )}
              </div>
              {errors.sku ? (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.sku}
                </p>
              ) : formData.sku && formData.sku !== originalSku ? (
                <p className="text-xs text-yellow-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  ⚠️ SKU will be updated
                </p>
              ) : !formData.sku ? (
                <p className="text-xs text-gray-500 mt-1">
                  ℹ️ Leave empty to auto-generate SKU
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Pricing & Inventory */}
      <div className="bg-gray-50 rounded-lg p-5">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-green-500" />
          Pricing & Inventory
        </h3>
        
        <div className="space-y-4">
          {/* Purchase Price - ONLY price field for sellers */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your Selling Price (MAD) <span className="text-red-500">*</span>
              <span className="ml-2 text-xs text-gray-500">You receive this amount</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500">DH</span>
              </div>
              <input
                type="number"
                name="purchase_price"
                value={formData.purchase_price}
                onChange={handleChange}
                className={`w-full pl-12 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.purchase_price ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
                min="0"
                step="0.01"
                required
              />
            </div>
            {errors.purchase_price && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.purchase_price}
              </p>
            )}
          </div>

          {/* Marketplace Price Display - READ ONLY */}
          {formData.purchase_price > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Marketplace Pricing Preview
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Your Price:</span>
                  <span className="font-semibold text-gray-900">{formData.purchase_price} MAD</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Marketplace Fee (20%):</span>
                  <span className="text-blue-600 font-medium">+{marketplaceFee} MAD</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-blue-200">
                  <span className="text-sm font-medium text-gray-700">Customer Pays:</span>
                  <span className="font-bold text-green-600">{marketplacePrice} MAD</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  ⚡ B2B buyers see your price directly • B2C customers pay with 20% markup • Delivery fee added at checkout
                </p>
              </div>
            </div>
          )}

          {/* Quantity & Condition */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.quantity ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
                min="0"
                step="1"
                required
              />
              {errors.quantity && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.quantity}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Condition
              </label>
              <select
                name="condition"
                value={formData.condition}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {CONDITIONS.map(cond => (
                  <option key={cond.value} value={cond.value}>{cond.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Location & Shipping */}
      <div className="bg-gray-50 rounded-lg p-5">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-orange-500" />
          Location & Shipping
        </h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Product Location (City) <span className="text-red-500">*</span>
            <span className="ml-2 text-xs text-gray-500">Used to calculate delivery fees</span>
          </label>
          <select
            name="location"
            value={formData.location}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.location ? 'border-red-500 bg-red-50' : 'border-gray-300'
            }`}
            required
          >
            <option value="">Select your city</option>
            {MOROCCAN_CITIES.sort().map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
          {errors.location && (
            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.location}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-2">
            📦 Delivery fees will be calculated automatically based on customer's location
          </p>
        </div>
      </div>

      {/* Media */}
      <div className="bg-gray-50 rounded-lg p-5">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-purple-500" />
          Media
        </h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Image URL
          </label>
          <input
            type="url"
            name="image_url"
            value={formData.image_url}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="https://example.com/image.jpg"
          />
          {formData.image_url && (
            <div className="mt-3">
              <p className="text-xs text-gray-500 mb-2">Image Preview:</p>
              <img 
                src={formData.image_url} 
                alt="Preview"
                className="w-24 h-24 object-cover rounded-lg border border-gray-200"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://via.placeholder.com/96?text=Invalid+URL';
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Status & Availability */}
      <div className="bg-gray-50 rounded-lg p-5">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Layers className="w-5 h-5 text-gray-600" />
          Status & Availability
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Order Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {STATUSES.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Note: Only 'Available' products appear in marketplace
            </p>
          </div>
          <div className="flex items-center gap-3 pt-7">
            <input
              type="checkbox"
              name="available_for_sale"
              id="available_checkbox"
              checked={formData.available_for_sale}
              onChange={handleChange}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="available_checkbox" className="text-sm font-medium text-gray-700">
              Available for sale
            </label>
            <span className="text-xs text-gray-500 ml-2">
              {formData.available_for_sale ? '✅ Visible' : '❌ Hidden'}
            </span>
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex gap-4 pt-4 border-t border-gray-200">
        <button 
          type="button" 
          onClick={onCancel}
          className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium flex items-center justify-center gap-2"
          disabled={loading}
        >
          <XCircle className="w-4 h-4" />
          Cancel
        </button>
        <button 
          type="submit"
          className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          disabled={loading || isCheckingSku}
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4" />
              Save Changes
            </>
          )}
        </button>
      </div>
    </form>
  );
};

// ============================================
// DASHBOARD SKELETON
// ============================================
const DashboardSkeleton = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 p-8">
    <div className="animate-pulse space-y-6">
      <div className="h-8 bg-gray-700/50 rounded w-1/4"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-32 bg-gray-700/30 rounded-xl"></div>
        ))}
      </div>
      <div className="h-96 bg-gray-700/30 rounded-xl"></div>
    </div>
  </div>
);

// ============================================
// MAIN SELLER DASHBOARD COMPONENT
// ============================================
const SellerDashboard = () => {
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalSales: 0,
    totalCommission: 0,
    averageCommissionRate: 0,
    netAmount: 0,
    totalPotentialValue: 0,
    activeProducts: 0
  });

  // Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('full_name, company, avatar_url, city')
          .eq('id', user.id)
          .single();
        if (data) setProfile(data);
      }
    };
    fetchProfile();
  }, [user]);

  // Fetch products
  useEffect(() => {
    if (user) {
      fetchProducts();
    } else {
      setProductsLoading(false);
    }
  }, [user]);

  const fetchProducts = async () => {
    setProductsLoading(true);
    try {
      // Use RPC function for reliable authentication
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('get_seller_dashboard_products_v2');

      if (!rpcError && rpcData?.success) {
        setProducts(rpcData.products || []);
        calculateStats(rpcData.products || []);
      } else {
        // Fallback to direct query
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .eq("user_id", user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setProducts(data || []);
        calculateStats(data || []);
      }
    } catch (err) {
      console.error("Error fetching products:", err);
      toast.error("Failed to load products");
    } finally {
      setProductsLoading(false);
    }
  };

  const calculateStats = (allProducts) => {
    const totalProducts = allProducts.length;
    const activeProducts = allProducts.filter(p => p.available_for_sale && p.quantity > 0).length;
    const soldProducts = allProducts.filter(p => p.status === 'sold');
    const totalSales = soldProducts.reduce((sum, p) => sum + ((p.purchase_price || 0) * (p.quantity || 1)), 0);
    const totalCommission = soldProducts.reduce((sum, p) => sum + ((p.commission || 0)), 0);
    const averageCommissionRate = totalSales > 0 ? ((totalCommission / totalSales) * 100).toFixed(1) : 0;
    const netAmount = totalSales - totalCommission;
    const totalPotentialValue = allProducts.reduce((sum, p) => 
      sum + ((p.purchase_price || 0) * (p.quantity || 0)), 0);

    setStats({
      totalProducts,
      activeProducts,
      totalSales,
      totalCommission,
      averageCommissionRate,
      netAmount,
      totalPotentialValue
    });
  };

  const handleAddProduct = async (productData) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert([{
          ...productData,
          user_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      await fetchProducts(); // Refresh
      setShowAddForm(false);
      toast.success("Product added successfully");
      return { success: true };
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error(error.message || "Failed to add product");
      return { success: false };
    }
  };

  const handleUpdateProduct = async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      await fetchProducts(); // Refresh
      setEditingProduct(null);
      toast.success("Product updated successfully");
      return { success: true };
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error(error.message || "Failed to update product");
      return { success: false };
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      await fetchProducts(); // Refresh
      toast.success("Product deleted successfully");
      return { success: true };
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error(error.message || "Failed to delete product");
      return { success: false };
    }
  };

  const handleToggleAvailability = async (id, available) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({
          available_for_sale: available,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      await fetchProducts();
      toast.success(available ? "Product is now available" : "Product is now hidden");
    } catch (error) {
      console.error('Error toggling availability:', error);
      toast.error("Failed to update product status");
    }
  };

  const filteredProducts = selectedStatus === "all" 
    ? products 
    : products.filter(product => product.status === selectedStatus);

  if (productsLoading) return <DashboardSkeleton />;

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center text-gray-600">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Please Log In</h2>
          <p className="text-gray-500">You need to be authenticated to access your seller dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-effect border-b border-white/10 sticky top-0 z-50 backdrop-blur-xl bg-slate-900/50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  Seller Dashboard
                </h1>
                <p className="text-sm text-gray-400">
                  Welcome back, {profile?.full_name || user.email?.split('@')[0] || 'Seller'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg hover:bg-white/20 transition-all flex items-center gap-2 text-white"
                onClick={() => fetchProducts()}
                disabled={productsLoading}
              >
                <RefreshCw className={`w-4 h-4 ${productsLoading ? 'animate-spin' : ''}`} />
                {productsLoading ? 'Refreshing...' : 'Refresh'}
              </button>
              <button
                className="px-6 py-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg font-medium hover:from-purple-600 hover:to-blue-600 transition-all text-white shadow-lg hover:shadow-xl"
                onClick={() => setShowAddForm(true)}
              >
                + Add Product
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <div className="glass-effect border-white/20 rounded-xl p-6 hover:border-blue-500/50 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Total Products</p>
                <p className="text-3xl font-bold text-white mt-2">{stats.totalProducts}</p>
                <p className="text-xs text-gray-400 mt-1">{stats.activeProducts} active</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="glass-effect border-white/20 rounded-xl p-6 hover:border-green-500/50 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Inventory Value</p>
                <p className="text-3xl font-bold text-white mt-2">{stats.totalPotentialValue.toFixed(2)} MAD</p>
                <p className="text-xs text-gray-400 mt-1">Based on your price</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="glass-effect border-white/20 rounded-xl p-6 hover:border-orange-500/50 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Total Sales</p>
                <p className="text-3xl font-bold text-white mt-2">{stats.totalSales.toFixed(2)} MAD</p>
                <p className="text-xs text-gray-400 mt-1">You receive this</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="glass-effect border-white/20 rounded-xl p-6 hover:border-red-500/50 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Net Amount</p>
                <p className="text-3xl font-bold text-white mt-2">{stats.netAmount.toFixed(2)} MAD</p>
                <p className="text-xs text-gray-400 mt-1">After commission</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Percent className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Products Table Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-2xl overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-600" />
                  Your Products
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Manage your inventory and pricing
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="appearance-none bg-white border border-gray-300 px-4 py-2 pr-10 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="all">All Status</option>
                    {STATUSES.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                  <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
                <span className="text-sm bg-gray-100 px-3 py-1.5 rounded-lg text-gray-700 font-medium">
                  {filteredProducts.length} product(s)
                </span>
                <button
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                  onClick={() => setShowAddForm(true)}
                >
                  + Add New
                </button>
              </div>
            </div>
          </div>

          <div className="p-6">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  No products found
                </h3>
                <p className="text-gray-500 mb-6">
                  {selectedStatus === "all" 
                    ? "Start selling by adding your first product!" 
                    : `No ${selectedStatus} products found.`}
                </p>
                <button
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition shadow-lg hover:shadow-xl"
                  onClick={() => setShowAddForm(true)}
                >
                  + Add Your First Product
                </button>
              </div>
            ) : (
              <ProductTable
                products={filteredProducts}
                onEdit={setEditingProduct}
                onDelete={handleDeleteProduct}
                onToggleAvailability={handleToggleAvailability}
              />
            )}
          </div>
        </motion.div>

        {/* Pricing Info Box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6"
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Info className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold text-blue-900 mb-2">Marketplace Pricing</h4>
              <p className="text-sm text-blue-800">
                • <strong>Your Price:</strong> This is what you receive per sale<br/>
                • <strong>B2B Buyers:</strong> See your price directly (no markup)<br/>
                • <strong>B2C Customers:</strong> Pay your price + 20% marketplace fee + delivery fee<br/>
                • <strong>Delivery fees</strong> are calculated automatically based on customer location
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Modals */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl"
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">Add New Product</h2>
              <button
                className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg transition"
                onClick={() => setShowAddForm(false)}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <AddProductForm
                onSubmit={handleAddProduct}
                onCancel={() => setShowAddForm(false)}
              />
            </div>
          </motion.div>
        </div>
      )}

      {editingProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl"
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">Edit Product</h2>
              <button
                className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg transition"
                onClick={() => setEditingProduct(null)}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <EditProductForm
                product={editingProduct}
                onSubmit={(updates) => handleUpdateProduct(editingProduct.id, updates)}
                onCancel={() => setEditingProduct(null)}
              />
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default SellerDashboard;