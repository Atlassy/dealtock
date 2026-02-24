// src/components/marketplace/MarketplaceGrid.jsx
import React from 'react';
import MarketplaceCard from './MarketplaceCard';

export default function MarketplaceGrid({ products, onProductClick, canOrder }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {products.map((product) => (
        <MarketplaceCard
          key={product.id}
          product={product}
          onClick={() => onProductClick(product)}
          canOrder={canOrder}
        />
      ))}
    </div>
  );
}