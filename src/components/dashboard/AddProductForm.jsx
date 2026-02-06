
import React, { useState } from 'react';

const CATEGORIES = ["Electronics", "Fashion", "Home", "Beauty", "Sports", "Other"];
const STATUSES = ["available", "unavailable"];

const AddProductForm = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    quantity: 1,
    sale_price: '',
    status: 'available'
  });
  
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'quantity' || name === 'sale_price' 
        ? (value === '' ? '' : Number(value))
        : value 
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const submissionData = {
      ...formData,
      sale_price: formData.sale_price ? parseFloat(formData.sale_price) : null,
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

      {/* Sale Price Field - MAD Currency */}
      <div>
        <label className="block text-sm text-gray-600 mb-1">Sale Price (MAD) *</label>
        <input
          type="number"
          name="sale_price"
          value={formData.sale_price}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded"
          placeholder="0.00"
          required
          step="0.01"
          min="0"
        />
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