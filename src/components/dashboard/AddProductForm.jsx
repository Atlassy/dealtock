// src/components/dashboard/AddProductForm.jsx - COMPLETE VERSION
import React, { useState } from 'react';
import { toast } from 'sonner';

const CATEGORIES = ["Electronics", "Fashion", "Home", "Beauty", "Sports", "Automotive", "Books", "Other"];
const STATUSES = ["available", "pending", "sold"];

const AddProductForm = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    quantity: 1,
    purchase_price: '',
    location: '',
    description: '',
    sku: '',
    condition: 'new',
    image_url: '',
    status: 'available',
    available_for_sale: true
  });
  
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked :
              name === 'quantity' || name === 'purchase_price'
        ? (value === '' ? '' : Number(value))
        : value 
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.name?.trim()) {
      toast.error('Product name is required');
      return;
    }
    
    if (!formData.purchase_price || formData.purchase_price <= 0) {
      toast.error('Please enter a valid price');
      return;
    }
    
    if (!formData.quantity || formData.quantity < 1) {
      toast.error('Quantity must be at least 1');
      return;
    }

    if (!formData.location?.trim()) {
      toast.error('Location is required for shipping');
      return;
    }

    setLoading(true);
    
    // Auto-generate SKU if not provided
    const submissionData = {
      ...formData,
      sku: formData.sku?.trim() || `SKU-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      purchase_price: parseFloat(formData.purchase_price) || 0,
      quantity: parseInt(formData.quantity) || 0
    };

    const result = await onSubmit(submissionData);
    if (result?.success) {
      // Reset form on success
      setFormData({
        name: '',
        category: '',
        quantity: 1,
        purchase_price: '',
        location: '',
        description: '',
        sku: '',
        condition: 'new',
        image_url: '',
        status: 'available',
        available_for_sale: true
      });
    }
    setLoading(false);
  };

  const marketplacePrice = formData.purchase_price 
    ? (parseFloat(formData.purchase_price) * 1.20).toFixed(2) 
    : '0.00';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name Field */}
      <div>
        <label className="block text-sm text-gray-600 mb-1">Product Name *</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
          placeholder="Enter product name"
          required
        />
      </div>

      {/* Description Field */}
      <div>
        <label className="block text-sm text-gray-600 mb-1">Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
          placeholder="Product description"
          rows="3"
        />
      </div>

      {/* Category Field */}
      <div>
        <label className="block text-sm text-gray-600 mb-1">Category *</label>
        <select
          name="category"
          value={formData.category}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="">Select category</option>
          {CATEGORIES.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* SKU Field */}
      <div>
        <label className="block text-sm text-gray-600 mb-1">SKU (Optional)</label>
        <input
          type="text"
          name="sku"
          value={formData.sku}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
          placeholder="Leave empty to auto-generate"
        />
      </div>

      {/* Location Field */}
      <div>
        <label className="block text-sm text-gray-600 mb-1">Location (City) *</label>
        <input
          type="text"
          name="location"
          value={formData.location}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., Casablanca, Rabat"
          required
        />
      </div>

      {/* Condition Field */}
      <div>
        <label className="block text-sm text-gray-600 mb-1">Condition</label>
        <select
          name="condition"
          value={formData.condition}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
        >
          <option value="new">New</option>
          <option value="opened_like_new">Opened - Like New</option>
          <option value="damaged">Damaged / For Parts</option>
        </select>
      </div>

      {/* Quantity Field */}
      <div>
        <label className="block text-sm text-gray-600 mb-1">Quantity *</label>
        <input
          type="number"
          name="quantity"
          value={formData.quantity}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
          min="1"
          required
        />
      </div>

      {/* Purchase Price Field */}
      <div>
        <label className="block text-sm text-gray-600 mb-1">
          Your Price (MAD) *
          <span className="text-xs text-gray-500 ml-2">You receive this amount per sale</span>
        </label>
        <input
          type="number"
          name="purchase_price"
          value={formData.purchase_price}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
          placeholder="0.00"
          required
          step="0.01"
          min="0"
        />
      </div>

      {/* Image URL Field */}
      <div>
        <label className="block text-sm text-gray-600 mb-1">Image URL (Optional)</label>
        <input
          type="url"
          name="image_url"
          value={formData.image_url}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
          placeholder="https://example.com/image.jpg"
        />
      </div>

      {/* Available for Sale Checkbox */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          name="available_for_sale"
          id="available_for_sale"
          checked={formData.available_for_sale}
          onChange={handleChange}
          className="w-4 h-4 text-blue-600 rounded"
        />
        <label htmlFor="available_for_sale" className="text-sm text-gray-700">
          Available for sale
        </label>
      </div>

      {/* Marketplace Pricing Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded p-4">
        <h4 className="font-semibold text-blue-800 mb-2">Marketplace Pricing Preview</h4>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span>Your Price:</span>
            <span className="font-semibold">{formData.purchase_price || '0'} MAD</span>
          </div>
          <div className="flex justify-between text-green-600">
            <span>Marketplace Fee (20%):</span>
            <span>+{(formData.purchase_price * 0.2 || 0).toFixed(2)} MAD</span>
          </div>
          <div className="border-t border-blue-200 pt-1 mt-1 flex justify-between font-bold">
            <span>Customer Pays:</span>
            <span>{marketplacePrice} MAD</span>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          ⚡ B2B buyers see your price directly • B2C customers pay with 20% markup
        </p>
      </div>

      {/* Buttons */}
      <div className="flex gap-3 pt-2">
        <button 
          type="button" 
          onClick={onCancel}
          className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition"
          disabled={loading}
        >
          Cancel
        </button>
        <button 
          type="submit"
          className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded hover:from-blue-700 hover:to-blue-800 transition disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Adding...' : 'Add Product'}
        </button>
      </div>
    </form>
  );
};

export default AddProductForm;