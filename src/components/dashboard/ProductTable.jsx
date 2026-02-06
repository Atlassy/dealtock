// src/components/dashboard/ProductTable.jsx - WITH QUANTITY COLUMN
import React from 'react';

const ProductTable = ({ products, onEdit, onDelete }) => {
  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '-';
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'available': 
        return 'bg-green-100 text-green-800 border-green-200';
      case 'sold': 
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'shipped': 
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default: 
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full bg-white rounded-lg shadow-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Name</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Category</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Quantity</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Sale Price</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Commission</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Net Amount</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product, index) => (
            <tr 
              key={product.id} 
              className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
              }`}
            >
              <td className="py-3 px-4">
                <div className="flex items-center">
                  {product.image_url && (
                    <img 
                      src={product.image_url} 
                      alt={product.name}
                      className="w-10 h-10 rounded-lg object-cover mr-3 border border-gray-200"
                    />
                  )}
                  <div>
                    <p className="font-medium text-gray-900">{product.name}</p>
                    {product.sku && (
                      <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                    )}
                  </div>
                </div>
              </td>
              <td className="py-3 px-4">
                <span className="text-gray-700">{product.category || '-'}</span>
              </td>
              <td className="py-3 px-4">
                <span className="font-medium text-gray-900">
                  {product.quantity || product.quantity === 0 ? product.quantity : '-'}
                </span>
              </td>
              <td className="py-3 px-4">
                <span className="font-medium text-gray-900">{formatCurrency(product.sale_price)}</span>
              </td>
              <td className="py-3 px-4">
                <span className="font-medium text-red-600">{formatCurrency(product.commission)}</span>
              </td>
              <td className="py-3 px-4">
                <span className="font-medium text-green-600">{formatCurrency(product.net_amount)}</span>
              </td>
              <td className="py-3 px-4">
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(product.status)}`}>
                  {product.status}
                </span>
              </td>
              <td className="py-3 px-4">
                <div className="flex gap-2">
                  <button
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-sm font-medium"
                    onClick={() => onEdit(product)}
                  >
                    Edit
                  </button>
                  <button
                    className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all text-sm font-medium"
                    onClick={() => onDelete(product.id)}
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ProductTable;