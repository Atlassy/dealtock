// src/components/dashboard/seller/EditProductForm.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { toast } from 'sonner';
import { 
  RefreshCw, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  Info,
  DollarSign,
  MapPin,
  Image as ImageIcon,
  Tag,
  Layers,
  Package
} from 'lucide-react';

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
// EDIT PRODUCT FORM COMPONENT
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
      setOriginalSku(product.sku || ''); // Store original SKU
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
      // Don't send sale_price - marketplace calculates it
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
      <div className="bg-gray-50 dark:bg-gray-900/40 rounded-lg p-5">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
          <Info className="w-5 h-5 text-blue-500" />
          Basic Information
        </h3>
        
        <div className="space-y-4">
          {/* Product Name - Required */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Product Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.name ? 'border-red-500 dark:border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-gray-300 dark:border-gray-700'
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Detailed description of your product..."
            />
          </div>

          {/* Category & SKU */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                  className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.sku ? 'border-red-500 dark:border-red-500 bg-red-50 dark:bg-red-900/20' :
                    formData.sku && formData.sku !== originalSku && !errors.sku ? 'border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20' :
                    'border-gray-300 dark:border-gray-700'
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
      <div className="bg-gray-50 dark:bg-gray-900/40 rounded-lg p-5">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-green-500" />
          Pricing & Inventory
        </h3>
        
        <div className="space-y-4">
          {/* Purchase Price - ONLY price field for sellers */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Your Selling Price (MAD) <span className="text-red-500">*</span>
              <span className="ml-2 text-xs text-gray-500">You receive this amount</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 dark:text-gray-400">DH</span>
              </div>
              <input
                type="number"
                name="purchase_price"
                value={formData.purchase_price}
                onChange={handleChange}
                className={`w-full pl-12 pr-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.purchase_price ? 'border-red-500 dark:border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-gray-300 dark:border-gray-700'
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
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 dark:text-blue-400 mb-3 flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Marketplace Pricing Preview
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Your Price:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{formData.purchase_price} MAD</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Marketplace Fee (30%):</span>
                  <span className="text-blue-600 dark:text-blue-400 font-medium">+{marketplaceFee} MAD</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-blue-200 dark:border-blue-800">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Customer Pays:</span>
                  <span className="font-bold text-green-600 dark:text-green-400">{marketplacePrice} MAD</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  ⚡ B2B buyers see your price directly • B2C customers pay with 30% markup • Delivery fee added at checkout
                </p>
              </div>
            </div>
          )}

          {/* Quantity & Condition */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.quantity ? 'border-red-500 dark:border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-gray-300 dark:border-gray-700'
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Condition
              </label>
              <select
                name="condition"
                value={formData.condition}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
      <div className="bg-gray-50 dark:bg-gray-900/40 rounded-lg p-5">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-kraft-500" />
          Location & Shipping
        </h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Product Location (City) <span className="text-red-500">*</span>
            <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">Used to calculate delivery fees</span>
          </label>
          <select
            name="location"
            value={formData.location}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.location ? 'border-red-500 dark:border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-gray-300 dark:border-gray-700'
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
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            📦 Delivery fees will be calculated automatically based on customer's location
          </p>
        </div>
      </div>

      {/* Media */}
      <div className="bg-gray-50 dark:bg-gray-900/40 rounded-lg p-5">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-purple-500" />
          Media
        </h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Image URL
          </label>
          <input
            type="url"
            name="image_url"
            value={formData.image_url}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="https://example.com/image.jpg"
          />
          {formData.image_url && (
            <div className="mt-3">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Image Preview:</p>
              <img
                src={formData.image_url}
                alt="Preview"
                className="w-24 h-24 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
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
      <div className="bg-gray-50 dark:bg-gray-900/40 rounded-lg p-5">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
          <Layers className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          Status & Availability
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Order Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {STATUSES.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
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
              className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="available_checkbox" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Available for sale
            </label>
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
              {formData.available_for_sale ? '✅ Visible' : '❌ Hidden'}
            </span>
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition font-medium flex items-center justify-center gap-2"
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

export default EditProductForm;