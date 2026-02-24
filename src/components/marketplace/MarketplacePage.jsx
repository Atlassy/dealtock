// src/components/marketplace/MarketplacePage.jsx
import React, { useState } from 'react';
import { useMarketplaceProducts } from '../../hooks/useMarketplaceProducts';
import { useAuth } from '../../contexts/SupabaseAuthContext'; // ✅ Changed from useSupabase to useAuth

import { motion, AnimatePresence } from 'framer-motion';
import ProductDetailModal from './components/ProductDetailModal'; // Add this import
import { 
  Search, 
  Filter,
  X,
  MapPin,
  Package,
  Star,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal
} from 'lucide-react';

const CATEGORIES = ["Electronics", "Fashion", "Home", "Beauty", "Sports", "Books", "Automotive", "Other"];
const CONDITIONS = ["new", "opened_like_new", "damaged"];
const MOROCCAN_CITIES = [
  "Casablanca", "Rabat", "Fes", "Marrakech", "Agadir", "Tanger", 
  "Meknes", "Oujda", "Kenitra", "Sale", "Temara", "Safi", 
  "El Jadida", "Beni Mellal", "Khouribga", "Mohammedia", "Settat",
  "Berrechid", "Nador", "Taza", "Essaouira", "Laayoune", "Dakhla"
];

const MarketplacePage = () => {
  const { user } = useAuth(); // Get the current user
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    location: '',
    minPrice: '',
    maxPrice: '',
    condition: '',
    sortBy: 'created_at',
    sortOrder: 'desc'
  });

  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  
  // Add state for selected product and modal
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  const { products, loading, error, refetch, userRole, getPriceForRole } = useMarketplaceProducts(filters);

  // Add handler for order button
  const handleOrderClick = (product, e) => {
    e.stopPropagation(); // Prevent any parent click events
    setSelectedProduct(product);
    setShowDetailModal(true);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      category: '',
      location: '',
      minPrice: '',
      maxPrice: '',
      condition: '',
      sortBy: 'created_at',
      sortOrder: 'desc'
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== '' && value !== 'created_at' && value !== 'desc'
  );

  // Price formatter
  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price).replace('MAD', '').trim() + ' MAD';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Marketplace</h1>
            
            {/* Desktop Filter Toggle */}
            <button
              onClick={() => setIsFilterExpanded(!isFilterExpanded)}
              className="hidden md:flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
            >
              <Filter className="w-4 h-4" />
              {isFilterExpanded ? 'Hide Filters' : 'Show Filters'}
              {hasActiveFilters && (
                <span className="ml-2 w-2 h-2 bg-blue-500 rounded-full"></span>
              )}
            </button>

            {/* Mobile Filter Button */}
            <button
              onClick={() => setShowMobileFilters(true)}
              className="md:hidden flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg"
            >
              <Filter className="w-4 h-4" />
              Filters
              {hasActiveFilters && (
                <span className="ml-2 w-2 h-2 bg-blue-500 rounded-full"></span>
              )}
            </button>
          </div>

          {/* Compact Search Bar - Always Visible */}
          <div className="mt-4 flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search products..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="created_at">Newest First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="name">Name</option>
            </select>
          </div>
        </div>
      </div>

      {/* Expandable Filter Bar - Desktop */}
      <AnimatePresence>
        {isFilterExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="hidden md:block bg-white border-b overflow-hidden"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="grid grid-cols-4 gap-4">
                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">All Categories</option>
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Location Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <select
                    value={filters.location}
                    onChange={(e) => handleFilterChange('location', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">All Locations</option>
                    {MOROCCAN_CITIES.sort().map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>

                {/* Price Range */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price Range (MAD)</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.minPrice}
                      onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      min="0"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.maxPrice}
                      onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      min="0"
                    />
                  </div>
                </div>

                {/* Condition */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
                  <select
                    value={filters.condition}
                    onChange={(e) => handleFilterChange('condition', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">All Conditions</option>
                    {CONDITIONS.map(cond => (
                      <option key={cond} value={cond}>
                        {cond === 'new' ? 'New' : 
                         cond === 'opened_like_new' ? 'Like New' : 
                         'Damaged'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Clear Filters */}
                <div className="flex items-end">
                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition w-full"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Filters Modal */}
      <AnimatePresence>
        {showMobileFilters && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 md:hidden"
            onClick={() => setShowMobileFilters(false)}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween' }}
              className="absolute right-0 top-0 bottom-0 w-4/5 bg-white p-6 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold">Filters</h3>
                <button onClick={() => setShowMobileFilters(false)}>
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Mobile Filter Options */}
              <div className="space-y-4">
                {/* Category */}
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="">All Categories</option>
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium mb-1">Location</label>
                  <select
                    value={filters.location}
                    onChange={(e) => handleFilterChange('location', e.target.value)}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="">All Locations</option>
                    {MOROCCAN_CITIES.sort().map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>

                {/* Price Range */}
                <div>
                  <label className="block text-sm font-medium mb-1">Price Range (MAD)</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.minPrice}
                      onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                      className="w-1/2 p-2 border rounded-lg"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.maxPrice}
                      onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                      className="w-1/2 p-2 border rounded-lg"
                    />
                  </div>
                </div>

                {/* Condition */}
                <div>
                  <label className="block text-sm font-medium mb-1">Condition</label>
                  <select
                    value={filters.condition}
                    onChange={(e) => handleFilterChange('condition', e.target.value)}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="">All Conditions</option>
                    {CONDITIONS.map(cond => (
                      <option key={cond} value={cond}>
                        {cond === 'new' ? 'New' : 
                         cond === 'opened_like_new' ? 'Like New' : 
                         'Damaged'}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => {
                    setShowMobileFilters(false);
                  }}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium"
                >
                  Apply Filters
                </button>

                {hasActiveFilters && (
                  <button
                    onClick={() => {
                      clearFilters();
                      setShowMobileFilters(false);
                    }}
                    className="w-full py-3 text-red-600 border border-red-200 rounded-lg"
                  >
                    Clear All
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Products Grid - COMPACT CARDS */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg p-4 animate-pulse">
                <div className="h-32 bg-gray-200 rounded-lg mb-3"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-600">
            Error loading products: {error}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No products found</h3>
            <p className="text-gray-500">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.map((product) => {
              const priceInfo = getPriceForRole(product);
              
              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-shadow overflow-hidden"
                >
                  {/* Product Image */}
                  <div className="relative h-32 bg-gray-100">
                    {product.image_url ? (
                      <img 
                        src={product.image_url} 
                        alt={product.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://via.placeholder.com/128?text=No+Image';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                        <Package className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                    
                    {/* Stock Badge */}
                    {product.quantity <= 3 && (
                      <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                        Only {product.quantity} left
                      </div>
                    )}
                  </div>

                  {/* Product Info - COMPACT */}
                  <div className="p-3">
                    {/* Title and Location */}
                    <div className="mb-2">
                      <h3 className="font-semibold text-gray-900 text-sm line-clamp-1">
                        {product.name}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span>{product.location || 'Location?'}</span>
                        </div>
                        {product.condition && (
                          <span className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">
                            {product.condition === 'new' ? 'New' : 
                             product.condition === 'opened_like_new' ? 'Like New' : 
                             product.condition}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Category and Seller */}
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="text-gray-500">{product.category || 'Uncategorized'}</span>
                      <span className="text-gray-600 truncate max-w-[100px]">
                        {product.profiles?.company || product.profiles?.full_name || 'Seller'}
                      </span>
                    </div>

                    {/* Price - NOW SHOWING CORRECTLY */}
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                      <div>
                        <p className="text-xs text-gray-500">{priceInfo.label}</p>
                        <p className="text-lg font-bold text-blue-600">
                          {formatPrice(priceInfo.price)}
                        </p>
                      </div>
                      <button
                        onClick={(e) => handleOrderClick(product, e)} // ✅ Fixed handler
                        className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition"
                      >
                        Order
                      </button>
                    </div>

                    {/* Marketplace fee info for B2C customers */}
                    {userRole !== 'dropshipper' && priceInfo.marketplace_fee > 0 && (
                      <p className="text-xs text-gray-400 mt-1">
                        +{formatPrice(priceInfo.marketplace_fee)} marketplace fee
                      </p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetailModal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          product={selectedProduct}
          dropshipperId={user?.id}
          onOrderSuccess={() => {
            setShowDetailModal(false);
            refetch(); // Refresh the product list
          }}
        />
      )}
    </div>
  );
};

export default MarketplacePage;