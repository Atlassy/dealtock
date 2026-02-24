import React, { useState } from 'react';

const CATEGORIES = ["Electronics", "Fashion", "Home", "Beauty", "Sports", "Other"];
const STATUSES = ["available", "unavailable"];

const AddProductForm = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    quantity: 1,
    purchase_price: '',  // CHANGED: sale_price → purchase_price
    location: '',        // ADDED: location field
    description: '',     // ADDED: description field
    status: 'available'
  });
  
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'quantity' || name === 'purchase_price'  // CHANGED: sale_price → purchase_price
        ? (value === '' ? '' : Number(value))
        : value 
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const submissionData = {
      ...formData,
      purchase_price: formData.purchase_price ? parseFloat(formData.purchase_price) : null, // CHANGED
      quantity: formData.quantity || 1
    };

    await onSubmit(submissionData);
    setLoading(false);
  };

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
          className="w-full px-3 py-2 border rounded"
          placeholder="Enter product name"
          required
        />
      </div>

      {/* Description Field - ADDED */}
      <div>
        <label className="block text-sm text-gray-600 mb-1">Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded"
          placeholder="Product description"
          rows="3"
        />
      </div>

      {/* Category Field */}
      <div>
        <label className="block text-sm text-gray-600 mb-1">Category</label>
        <select
          name="category"
          value={formData.category}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded"
        >
          <option value="">Select category</option>
          {CATEGORIES.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Location Field - ADDED */}
      <div>
        <label className="block text-sm text-gray-600 mb-1">Location (City)</label>
        <input
          type="text"
          name="location"
          value={formData.location}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded"
          placeholder="e.g., Casablanca, Rabat"
        />
      </div>

      {/* Quantity Field */}
      <div>
        <label className="block text-sm text-gray-600 mb-1">Quantity *</label>
        <input
          type="number"
          name="quantity"
          value={formData.quantity}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded"
          placeholder="1"
          min="1"
          required
        />
      </div>

      {/* Purchase Price Field - CHANGED from sale_price to purchase_price */}
      <div>
        <label className="block text-sm text-gray-600 mb-1">
          Your Price (MAD) *
          <span className="text-xs text-gray-500 ml-2">You receive this amount per sale</span>
        </label>
        <input
          type="number"
          name="purchase_price"  // CHANGED: sale_price → purchase_price
          value={formData.purchase_price}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded"
          placeholder="0.00"
          required
          step="0.01"
          min="0"
        />
        <p className="text-xs text-gray-500 mt-1">
          Marketplace customers will pay: <strong>
            {formData.purchase_price ? (formData.purchase_price * 1.2).toFixed(2) : '0.00'} MAD
          </strong> (includes 20% marketplace fee)
        </p>
      </div>

      {/* Status Field */}
      <div>
        <label className="block text-sm text-gray-600 mb-1">Status *</label>
        <select
          name="status"
          value={formData.status}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded"
        >
          {STATUSES.map(s => (
            <option key={s} value={s}>
              {s === 'available' ? 'Available' : 'Unavailable'}
            </option>
          ))}
        </select>
      </div>

      {/* Marketplace Pricing Info Box - ADDED */}
      <div className="bg-blue-50 border border-blue-200 rounded p-3">
        <h4 className="font-semibold text-blue-800 mb-1">Marketplace Pricing</h4>
        <p className="text-sm text-blue-700">
          • You set: <strong>Your Price</strong> (what you receive)<br/>
          • B2B buyers see: <strong>Your Price</strong> (no markup)<br/>
          • B2C customers pay: <strong>Your Price + 20%</strong> marketplace fee
        </p>
      </div>

      {/* Buttons */}
      <div className="flex gap-3 pt-2">
        <button 
          type="button" 
          onClick={onCancel}
          className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          disabled={loading}
        >
          Cancel
        </button>
        <button 
          type="submit"
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          disabled={loading}
        >
          {loading ? 'Adding...' : 'Add Product'}
        </button>
      </div>
    </form>
  );
};

export default AddProductForm;