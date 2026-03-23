// src/components/dashboard/ProductTable.jsx
import React from 'react';
import { Info, AlertTriangle , } from 'lucide-react';
import { ChevronUp, ChevronDown } from 'lucide-react';


const ProductTable = ({ products, onEdit, onDelete, onSort, sortConfig }) => {
  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '-';
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'available': 
        return 'bg-green-100 text-green-800 border-green-200';
      case 'sold': 
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default: 
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStockWarningClass = (quantity) => {
    if (quantity <= 0) return 'bg-red-50';
    if (quantity <= 3) return 'bg-yellow-50';
    return '';
  };

  const getSortIcon = (column) => {
    if (sortConfig?.key !== column) {
      return <ChevronUp className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="w-3 h-3 text-blue-600" />
      : <ChevronDown className="w-3 h-3 text-blue-600" />;
  };

  const handleSort = (column) => {
    if (onSort) {
      onSort(column);
    }
  };

  const renderSortableHeader = (label, column, width = 'auto') => {
    return (
      <th 
        className={`text-left py-3 px-4 text-sm font-medium text-gray-700 cursor-pointer group hover:text-blue-600 transition-colors ${width}`}
        onClick={() => handleSort(column)}
      >
        <div className="flex items-center gap-1">
          {label}
          {getSortIcon(column)}
        </div>
      </th>
    );
  };

  const renderTooltip = (content, position = 'top') => {
    return (
      <div className="relative inline-block group/tooltip">
        <Info className="w-3.5 h-3.5 text-gray-400 cursor-help hover:text-blue-500 transition-colors" />
        <div className={`absolute ${position === 'top' ? 'bottom-full left-1/2 -translate-x-1/2 mb-2' : 'top-full left-1/2 -translate-x-1/2 mt-2'} hidden group-hover/tooltip:block z-50`}>
          <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap max-w-xs shadow-lg">
            {content}
            <div className={`absolute ${position === 'top' ? 'top-full left-1/2 -translate-x-1/2' : 'bottom-full left-1/2 -translate-x-1/2'} border-4 border-transparent ${position === 'top' ? 'border-t-gray-900' : 'border-b-gray-900'}`}></div>
          </div>
        </div>
      </div>
    );
  };

  const formatPriceRange = (min, max) => {
    if (min === null && max === null) return 'all prices';
    if (min === null) return `up to ${formatCurrency(max)}`;
    if (max === null) return `${formatCurrency(min)}+`;
    return `${formatCurrency(min)} - ${formatCurrency(max)}`;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full bg-white rounded-lg shadow-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            {renderSortableHeader('Product', 'name', 'min-w-[220px]')}
            {renderSortableHeader('Category', 'category', 'min-w-[120px]')}
            {renderSortableHeader('Location', 'location', 'min-w-[100px]')}
            {renderSortableHeader('Qty', 'quantity', 'min-w-[80px]')}
            {renderSortableHeader('Purchase Price', 'purchase_price', 'min-w-[100px]')}
            {renderSortableHeader('Commission (MAD)', 'commission', 'min-w-[100px]')}
            {renderSortableHeader('Commission Rate', 'commission_rate', 'min-w-[100px]')}
            {renderSortableHeader('Est. Net Amount', 'net_amount', 'min-w-[120px]')}
            {renderSortableHeader('Status', 'status', 'min-w-[100px]')}
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 min-w-[140px]">Actions</th>
           </tr>
        </thead>
        <tbody>
          {products.map((product, index) => {
            const stockWarning = product.quantity <= 3 && product.quantity > 0;
            const outOfStock = product.quantity <= 0;
            const rowClass = `${getStockWarningClass(product.quantity)} ${index % 2 === 0 ? '' : 'bg-gray-50/50'} transition-colors`;
            
            const priceRangeText = product.commission_min_amount || product.commission_max_amount
              ? formatPriceRange(product.commission_min_amount, product.commission_max_amount)
              : 'all prices';
            
            const isPremiumSeller = product.is_premium || false;
            const premiumNote = isPremiumSeller ? ' (Premium sellers get 80% discount)' : '';
            
            const commissionTooltip = `Commission: ${product.commission_rate || 0}% based on ${product.category || 'Other'} category and price range ${priceRangeText}${premiumNote}`;
            const netAmountTooltip = "Provisional amount after commission. Final amount may vary based on actual sale.";
            
            return (
              <tr 
                key={product.id} 
                className={`border-b border-gray-100 hover:bg-gray-100 transition-colors ${rowClass}`}
              >
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    {product.image_url ? (
                      <img 
                        src={product.image_url} 
                        alt={product.name}
                        className="w-10 h-10 rounded-lg object-cover border border-gray-200 flex-shrink-0"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://via.placeholder.com/40?text=No+Image';
                        }}
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200 flex-shrink-0">
                        <span className="text-gray-400 text-xs">No img</span>
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 truncate">{product.name}</p>
                      {product.sku && (
                        <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className="text-gray-700 text-sm">{product.category || '-'}</span>
                </td>
                <td className="py-3 px-4">
                  <span className="text-gray-700 text-sm">{product.location || '-'}</span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1">
                    <span className={`font-medium text-gray-900 ${stockWarning ? 'text-orange-600' : ''} ${outOfStock ? 'text-red-600' : ''}`}>
                      {product.quantity || product.quantity === 0 ? product.quantity : '-'}
                    </span>
                    {stockWarning && !outOfStock && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                        <AlertTriangle className="w-3 h-3" />
                        Low stock
                      </span>
                    )}
                    {outOfStock && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-red-100 text-red-800 text-xs rounded-full">
                        Out of stock
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className="font-medium text-gray-900 text-sm">{formatCurrency(product.purchase_price)}</span>
                </td>
                <td className="py-3 px-4">
                  <span className="font-medium text-red-600 text-sm">{formatCurrency(product.commission)}</span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1">
                    <span className="font-medium text-blue-600 text-sm">
                      {product.commission_rate ? `${product.commission_rate}%` : '-'}
                    </span>
                    {product.commission_rate && renderTooltip(commissionTooltip)}
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1">
                    <span className="font-medium text-green-600 text-sm">{formatCurrency(product.net_amount)}</span>
                    {renderTooltip(netAmountTooltip)}
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(product.status)}`}>
                    {product.status === 'available' ? 'Available' : product.status === 'sold' ? 'Sold' : product.status}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex gap-2">
                    <button
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-sm font-medium shadow-sm hover:shadow"
                      onClick={() => onEdit(product)}
                    >
                      Edit
                    </button>
                    <button
                      className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all text-sm font-medium shadow-sm hover:shadow"
                      onClick={() => onDelete(product.id)}
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
      
      {products.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg">
          <p className="text-gray-500">No products found</p>
        </div>
      )}
    </div>
  );
};

export default ProductTable;