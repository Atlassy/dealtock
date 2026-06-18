// src/components/dashboard/ProductTable.jsx
import React from 'react';
import { Info, AlertTriangle, Pencil, Trash2 } from 'lucide-react';
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
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 border-green-200 dark:border-green-800';
      case 'sold':
        return 'bg-kraft-100 dark:bg-kraft-900/30 text-kraft-800 dark:text-kraft-400 border-kraft-200 dark:border-kraft-800';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-600';
    }
  };

  const getStockWarningClass = (quantity) => {
    if (quantity <= 0) return 'bg-red-50 dark:bg-red-900/20';
    if (quantity <= 3) return 'bg-yellow-50 dark:bg-yellow-900/20';
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
        className={`text-left py-2 px-2 text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer group hover:text-blue-600 dark:hover:text-blue-400 transition-colors ${width}`}
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
      <table className="w-full table-fixed bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            {renderSortableHeader('Product', 'name', 'w-[20%]')}
            {renderSortableHeader('Category', 'category', 'w-[9%]')}
            {renderSortableHeader('Location', 'location', 'w-[9%]')}
            {renderSortableHeader('Qty', 'quantity', 'w-[6%]')}
            {renderSortableHeader('Purchase Price', 'purchase_price', 'w-[10%]')}
            {renderSortableHeader('Commission (MAD)', 'commission', 'w-[10%]')}
            {renderSortableHeader('Commission Rate', 'commission_rate', 'w-[9%]')}
            {renderSortableHeader('Est. Net Amount', 'net_amount', 'w-[10%]')}
            {renderSortableHeader('Status', 'status', 'w-[9%]')}
            <th className="text-left py-3 px-2 text-sm font-medium text-gray-700 dark:text-gray-300 w-[8%]">Actions</th>
           </tr>
        </thead>
        <tbody>
          {products.map((product, index) => {
            const stockWarning = product.quantity <= 3 && product.quantity > 0;
            const outOfStock = product.quantity <= 0;
            const rowClass = `${getStockWarningClass(product.quantity)} ${index % 2 === 0 ? '' : 'bg-gray-50/50 dark:bg-gray-900/40'} transition-colors`;
            
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
                className={`border-b border-gray-100 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${rowClass}`}
              >
                <td className="py-2 px-2">
                  <div className="flex items-center gap-3">
                    {product.image_url ? (
                      <img 
                        src={product.image_url} 
                        alt={product.name}
                        className="w-10 h-10 rounded-lg object-cover border border-gray-200 dark:border-gray-700 flex-shrink-0"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://via.placeholder.com/40?text=No+Image';
                        }}
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center border border-gray-200 dark:border-gray-700 flex-shrink-0">
                        <span className="text-gray-400 dark:text-gray-500 text-xs">No img</span>
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 dark:text-white truncate">{product.name}</p>
                      {product.sku && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">SKU: {product.sku}</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="py-2 px-2">
                  <span className="text-gray-700 dark:text-gray-300 text-sm truncate block">{product.category || '-'}</span>
                </td>
                <td className="py-2 px-2">
                  <span className="text-gray-700 dark:text-gray-300 text-sm truncate block">{product.location || '-'}</span>
                </td>
                <td className="py-2 px-2">
                  <div className="flex items-center gap-1">
                    <span className={`font-medium text-gray-900 dark:text-white ${stockWarning ? 'text-kraft-600 dark:text-kraft-400' : ''} ${outOfStock ? 'text-red-600 dark:text-red-400' : ''}`}>
                      {product.quantity || product.quantity === 0 ? product.quantity : '-'}
                    </span>
                    {stockWarning && !outOfStock && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 text-xs rounded-full">
                        <AlertTriangle className="w-3 h-3" />
                        Low stock
                      </span>
                    )}
                    {outOfStock && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 text-xs rounded-full">
                        Out of stock
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-2 px-2">
                  <span className="font-medium text-gray-900 dark:text-white text-sm">{formatCurrency(product.purchase_price)}</span>
                </td>
                <td className="py-2 px-2">
                  <span className="font-medium text-red-600 dark:text-red-400 text-sm">{formatCurrency(product.commission)}</span>
                </td>
                <td className="py-2 px-2">
                  <div className="flex items-center gap-1">
                    <span className="font-medium text-blue-600 dark:text-blue-400 text-sm">
                      {product.commission_rate ? `${product.commission_rate}%` : '-'}
                    </span>
                    {product.commission_rate && renderTooltip(commissionTooltip)}
                  </div>
                </td>
                <td className="py-2 px-2">
                  <div className="flex items-center gap-1">
                    <span className="font-medium text-green-600 dark:text-green-400 text-sm">{formatCurrency(product.net_amount)}</span>
                    {renderTooltip(netAmountTooltip)}
                  </div>
                </td>
                <td className="py-2 px-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(product.status)}`}>
                    {product.status === 'available' ? 'Available' : product.status === 'sold' ? 'Sold' : product.status}
                  </span>
                </td>
                <td className="py-2 px-2">
                  <div className="flex gap-1.5">
                    <button
                      className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-sm hover:shadow"
                      onClick={() => onEdit(product)}
                      aria-label="Edit"
                      title="Edit"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      className="p-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all shadow-sm hover:shadow"
                      onClick={() => onDelete(product.id)}
                      aria-label="Delete"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      
      {products.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400">No products found</p>
        </div>
      )}
    </div>
  );
};

export default ProductTable;