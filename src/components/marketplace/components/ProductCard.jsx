// src/components/marketplace/components/ProductCard.jsx
import React from 'react';
import { Star, Package, MapPin, Building2 } from 'lucide-react';

export default function ProductCard({ product, onClick, canOrder }) {
  const seller = product.profiles;
  
  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
    >
      {/* Product Image */}
      <div className="aspect-square bg-gray-100 relative">
        {product.image_url ? (
          <img 
            src={product.image_url} 
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <Package className="h-12 w-12" />
          </div>
        )}
        {product.quantity <= 5 && (
          <span className="absolute top-2 right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
            Only {product.quantity} left
          </span>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-1 line-clamp-2">{product.name}</h3>
        
        {/* Seller Info */}
        <div className="flex items-center gap-2 mb-2 text-sm text-gray-600">
          <Building2 className="h-4 w-4" />
          <span className="truncate">{seller?.company || seller?.full_name || 'Unknown Seller'}</span>
          {seller?.average_rating > 0 && (
            <>
              <Star className="h-4 w-4 text-yellow-400 fill-current" />
              <span>{seller.average_rating.toFixed(1)}</span>
            </>
          )}
        </div>

        {/* Location */}
        {seller?.city && (
          <div className="flex items-center gap-1 text-sm text-gray-500 mb-3">
            <MapPin className="h-4 w-4" />
            <span>{seller.city}</span>
          </div>
        )}

        {/* Price and Condition */}
        <div className="flex items-center justify-between mt-2">
          <div>
            <span className="text-2xl font-bold text-primary">
              {product.sale_price?.toFixed(2)} MAD
            </span>
            {product.condition && product.condition !== 'new' && (
              <span className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded">
                {product.condition.replace('_', ' ')}
              </span>
            )}
          </div>
          {canOrder && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
            >
              Order
            </button>
          )}
        </div>
      </div>
    </div>
  );
}