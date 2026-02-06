import React, { useEffect, useState } from "react";

const CATEGORIES = ["Electronics", "Fashion", "Home", "Beauty", "Sports", "Other"];
const STATUSES = ["available", "unavailable"];

const EditProductForm = ({ product, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    quantity: 0,
    purchase_price: 0,
    sale_price: 0,
    status: "available",
  });

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || "",
        category: product.category || "",
        quantity: product.quantity || 0,
        purchase_price: product.purchase_price || 0,
        sale_price: product.sale_price || 0,
        status: product.status || "available",
      });
    }
  }, [product]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: ["quantity", "purchase_price", "sale_price"].includes(name)
        ? Number(value)
        : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name Field */}
      <div>
        <label className="block text-sm text-gray-600 mb-1">Product Name</label>
        <input 
          name="name" 
          value={formData.name} 
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded"
          placeholder="Enter product name"
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
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Quantity Field */}
      <div>
        <label className="block text-sm text-gray-600 mb-1">Quantity</label>
        <input 
          type="number" 
          name="quantity" 
          value={formData.quantity} 
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded"
          placeholder="0"
          min="0"
        />
      </div>

      {/* Purchase Price Field - REMOVED from AddProductForm but kept here */}
      <div>
        <label className="block text-sm text-gray-600 mb-1">Purchase Price (MAD)</label>
        <input 
          type="number" 
          name="purchase_price" 
          value={formData.purchase_price} 
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded"
          placeholder="0.00"
          min="0"
          step="0.01"
        />
      </div>

      {/* Sale Price Field */}
      <div>
        <label className="block text-sm text-gray-600 mb-1">Sale Price (MAD)</label>
        <input 
          type="number" 
          name="sale_price" 
          value={formData.sale_price} 
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded"
          placeholder="0.00"
          min="0"
          step="0.01"
        />
      </div>

      {/* Status Field */}
      <div>
        <label className="block text-sm text-gray-600 mb-1">Status</label>
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
        >
          Cancel
        </button>
        <button 
          type="submit"
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Save
        </button>
      </div>
    </form>
  );
};

export default EditProductForm;