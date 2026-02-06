import React from 'react';
import { motion } from 'framer-motion';
import { ProductCard } from '@/components/dashboard/ProductCard';
import { Package } from 'lucide-react';

export function ProductGrid({ products, texts, appLanguage, formatDate, formatPrice, onOpenEditModal }) {
  const currentTexts = texts[appLanguage] || texts.fr;

  if (products.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-12"
      >
        <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-300 mb-2">
          {currentTexts.noProductsFound}
        </h3>
        <p className="text-gray-400">
          {currentTexts.noProductsMatchFilters}
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.4 }}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      {products.map((product, index) => (
        <ProductCard
          key={product.id}
          product={product}
          index={index}
          texts={texts}
          appLanguage={appLanguage}
          formatDate={formatDate}
          formatPrice={formatPrice}
          onOpenEditModal={onOpenEditModal}
        />
      ))}
    </motion.div>
  );
}