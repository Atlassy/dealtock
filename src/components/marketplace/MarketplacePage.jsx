// src/components/marketplace/MarketplacePage.jsx
// Sprint 3 — City-locked returned products filter
// Changes:
//   - "Dealtock Deal" badge on returned products
//   - City-locked banner when buyer has local deals
//   - Source type filter tab (All / New / Returned Deals)
//   - Condition badge (Sealed ✓) on returned products
//   - asking_price used for returned product display
//   - Detail modal shows condition + source_type info

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useMarketplaceProducts } from '../../hooks/useMarketplaceProducts';
import { useAuth } from '../../contexts/SupabaseAuthContext';
import { useCart } from '../../hooks/useCart';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Package, Eye, ZoomIn, ShoppingCart,
  Truck, Tag, Sparkles, Shield, X, ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIES = [
  { name: 'Electronics', icon: '📱', color: 'bg-blue-100 text-blue-600' },
  { name: 'Fashion',     icon: '👕', color: 'bg-pink-100 text-pink-600' },
  { name: 'Home',        icon: '🏠', color: 'bg-green-100 text-green-600' },
  { name: 'Beauty',      icon: '💄', color: 'bg-purple-100 text-purple-600' },
  { name: 'Sports',      icon: '⚽', color: 'bg-orange-100 text-orange-600' },
  { name: 'Books',       icon: '📚', color: 'bg-yellow-100 text-yellow-600' },
  { name: 'Promotions',  icon: '🎉', color: 'bg-red-100 text-red-600', isPromo: true },
];

const SOURCE_TABS = [
  { key: 'all',      label: 'All Products',   icon: '🛍️' },
  { key: 'new',      label: 'New Stock',       icon: '✨' },
  { key: 'returned', label: 'Dealtock Deals',  icon: '🔥' },
];

// ── Category Card ─────────────────────────────────────────────────
const CategoryCard = ({ name, icon, color, onClick }) => (
  <div
    onClick={onClick}
    className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center hover:shadow-lg transition cursor-pointer border border-gray-200 dark:border-gray-700 group"
  >
    <div className={`w-10 h-10 ${color} rounded-full flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform`}>
      <span className="text-xl">{icon}</span>
    </div>
    <p className="font-medium text-gray-900 dark:text-white text-sm">{name}</p>
  </div>
);

// ── City-locked Deal Banner ───────────────────────────────────────
const CityDealsBanner = ({ city, count, onFilter }) => (
  <motion.div
    initial={{ opacity: 0, y: -12 }}
    animate={{ opacity: 1, y: 0 }}
    className="mb-4 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl p-4 flex items-center justify-between shadow-md"
  >
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
        <MapPin className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-white font-bold text-sm">
          🔥 {count} local deal{count > 1 ? 's' : ''} near you in {city}!
        </p>
        <p className="text-orange-100 text-xs mt-0.5">
          Sealed returned parcels · Instant local delivery · Big discounts
        </p>
      </div>
    </div>
    <button
      onClick={onFilter}
      className="flex items-center gap-1 bg-white text-orange-600 font-semibold text-xs px-3 py-2 rounded-lg hover:bg-orange-50 transition flex-shrink-0 ml-3"
    >
      See deals <ChevronRight className="w-3 h-3" />
    </button>
  </motion.div>
);

// ── Product Card ──────────────────────────────────────────────────
const ProductCard = ({ product, priceInfo, formatPrice, onViewDetails, onAddToCart, buyerCity }) => {
  const [isHovered,    setIsHovered]    = useState(false);
  const [imageError,   setImageError]   = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [showZoom,     setShowZoom]     = useState(false);

  const isReturned  = product.source_type === 'returned';
  const isCityMatch = isReturned && product.city_locked &&
    buyerCity && product.city?.toLowerCase() === buyerCity.toLowerCase();

  const handleAddToCart = async (e) => {
    e.stopPropagation();
    setAddingToCart(true);
    await onAddToCart(product, priceInfo.price);
    setAddingToCart(false);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`bg-white dark:bg-gray-800 rounded-xl border transition-all duration-300 overflow-hidden cursor-pointer group ${
          isReturned
            ? 'border-orange-200 dark:border-orange-800 hover:shadow-xl hover:shadow-orange-100'
            : 'border-gray-200 dark:border-gray-700 hover:shadow-xl'
        }`}
      >
        {/* Image */}
        <div className="relative h-40 bg-gray-100 dark:bg-gray-700 overflow-hidden">
          {product.image_url && !imageError ? (
            <>
              <img
                src={product.image_url}
                alt={product.name}
                className={`w-full h-full object-contain transition-all duration-500 ${isHovered ? 'scale-110' : 'scale-100'}`}
                onError={() => setImageError(true)}
              />
              <div
                onClick={(e) => { e.stopPropagation(); setShowZoom(true); }}
                className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'} cursor-pointer`}
              >
                <div className="bg-white/90 rounded-full p-1.5 hover:scale-110 transition-transform">
                  <ZoomIn className="w-4 h-4 text-gray-700" />
                </div>
              </div>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-10 h-10 text-gray-400" />
            </div>
          )}

          {/* Returned product badge — top left */}
          {isReturned && (
            <div className="absolute top-2 left-2 flex flex-col gap-1">
              <span className="flex items-center gap-1 px-2 py-0.5 bg-orange-500 text-white text-xs font-bold rounded-full shadow">
                <Sparkles className="w-3 h-3" /> Dealtock Deal
              </span>
              {/* Sealed condition badge */}
              <span className="flex items-center gap-1 px-2 py-0.5 bg-green-500 text-white text-xs font-semibold rounded-full shadow">
                <Shield className="w-3 h-3" /> Sealed ✓
              </span>
            </div>
          )}

          {/* City match badge — top right */}
          {isCityMatch && (
            <span className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 bg-blue-600 text-white text-xs font-semibold rounded-full shadow">
              <MapPin className="w-3 h-3" /> Local
            </span>
          )}

          {/* Low stock */}
          {product.quantity <= 3 && product.quantity > 0 && !isReturned && (
            <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
              Only {product.quantity} left
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-3">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-1 mb-1">
            {product.name}
          </h3>

          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-2">
            <MapPin className="w-3 h-3" />
            <span className="truncate">
              {product.city || 'Morocco'}
              {product.city_locked && (
                <span className="ml-1 text-orange-500 font-medium">· Local pickup</span>
              )}
            </span>
          </div>

          {/* Price row */}
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{priceInfo.label}</p>
              <p className={`text-lg font-bold ${isReturned ? 'text-orange-600' : 'text-blue-600 dark:text-blue-400'}`}>
                {formatPrice(priceInfo.price)}
              </p>
            </div>
            <div className="flex gap-1">
              <button
                onClick={(e) => { e.stopPropagation(); onViewDetails(e); }}
                className="p-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition"
                title="View Details"
              >
                <Eye className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </button>
              <button
                onClick={handleAddToCart}
                disabled={addingToCart}
                className={`p-1.5 rounded-lg transition disabled:opacity-50 ${
                  isReturned
                    ? 'bg-orange-500 hover:bg-orange-600'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
                title="Add to Cart"
              >
                <ShoppingCart className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Image zoom modal */}
      {showZoom && product.image_url && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-[100] cursor-pointer"
          onClick={() => setShowZoom(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh] p-4">
            <img
              src={product.image_url}
              alt={product.name}
              className="max-w-full max-h-[90vh] object-contain"
            />
            <button
              onClick={() => setShowZoom(false)}
              className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 rounded-full p-2 transition"
            >
              <X className="w-6 h-6 text-white" />
            </button>
            <p className="text-white text-center mt-4 text-sm">{product.name}</p>
          </div>
        </div>
      )}
    </>
  );
};

// ── Main Page ─────────────────────────────────────────────────────
const MarketplacePage = () => {
  const { user, profile }     = useAuth();
  const { addToCart: addToCartHook } = useCart();
  const navigate              = useNavigate();
  const location              = useLocation();

  const [filters, setFilters] = useState({
    search:     '',
    category:   '',
    location:   '',
    minPrice:   '',
    maxPrice:   '',
    condition:  '',
    sortBy:     'created_at',
    sortOrder:  'desc',
    sourceType: 'all',   // Sprint 3: 'all' | 'new' | 'returned'
  });

  const [selectedProduct, setSelectedProduct]           = useState(null);
  const [selectedProductPriceInfo, setSelectedProductPriceInfo] = useState(null);
  const [showDetailModal, setShowDetailModal]           = useState(false);

  const {
    products, loading, error, userRole,
    buyerCity, cityLockedCount,
    getPriceForRole, refetch
  } = useMarketplaceProducts(filters);

  // Sync URL params → filters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setFilters(prev => ({
      ...prev,
      search:     params.get('search')   || '',
      category:   params.get('category') || '',
      location:   params.get('city')     || '',
      minPrice:   params.get('min_price')|| '',
      maxPrice:   params.get('max_price')|| '',
      condition:  params.get('condition')|| '',
      sourceType: params.get('source')   || 'all',
      sortBy:     params.get('sort') === 'price_low'  ? 'price_low'  :
                  params.get('sort') === 'price_high' ? 'price_high' :
                  params.get('sort') === 'name'       ? 'name'       : 'created_at',
    }));
  }, [location.search]);

  const addToCart = async (product, price) => {
    if (product.quantity <= 0) { toast.error(`${product.name} is out of stock`); return false; }
    const success = await addToCartHook(product, 1);
    if (success) toast.success(`${product.name} added to cart`);
    else toast.error(`Cannot add ${product.name}. Insufficient stock.`);
    return success;
  };

  const handleOrderClick = (product, e) => {
    e.stopPropagation();
    setSelectedProduct(product);
    setSelectedProductPriceInfo(getPriceForRole(product));
    setShowDetailModal(true);
  };

  const handleCategoryClick = (categoryName) => {
    const params = new URLSearchParams(location.search);
    if (categoryName === 'Promotions') params.set('promo', 'true');
    else params.set('category', categoryName);
    navigate(`/marketplace?${params.toString()}`);
  };

  const handleSourceTab = (key) => {
    const params = new URLSearchParams(location.search);
    if (key === 'all') params.delete('source');
    else params.set('source', key);
    navigate(`/marketplace?${params.toString()}`);
  };

  const handleCityDealsClick = () => {
    const params = new URLSearchParams(location.search);
    params.set('source', 'returned');
    if (buyerCity) params.set('city', buyerCity);
    navigate(`/marketplace?${params.toString()}`);
  };

  const formatPrice = (price) => {
    if (!price && price !== 0) return '0 MAD';
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency', currency: 'MAD',
      minimumFractionDigits: 0, maximumFractionDigits: 0
    }).format(price);
  };

  const activeSource = filters.sourceType || 'all';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">

        {/* City deals banner — only shown when buyer has local returned deals */}
        <AnimatePresence>
          {cityLockedCount > 0 && buyerCity && activeSource !== 'returned' && (
            <CityDealsBanner
              city={buyerCity}
              count={cityLockedCount}
              onFilter={handleCityDealsClick}
            />
          )}
        </AnimatePresence>

        {/* Category grid */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Shop by Category</h2>
            <Link to="/categories" className="text-sm text-blue-600 hover:text-blue-700">View All</Link>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-2">
            {CATEGORIES.map(cat => (
              <CategoryCard key={cat.name} {...cat} onClick={() => handleCategoryClick(cat.name)} />
            ))}
          </div>
        </div>

        {/* Source type tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {SOURCE_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => handleSourceTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                activeSource === tab.key
                  ? tab.key === 'returned'
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-200'
                    : 'bg-blue-600 text-white shadow-md'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-blue-300'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
              {tab.key === 'returned' && cityLockedCount > 0 && buyerCity && (
                <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs font-bold ${
                  activeSource === 'returned' ? 'bg-white/30 text-white' : 'bg-orange-500 text-white'
                }`}>
                  {cityLockedCount}
                </span>
              )}
            </button>
          ))}

          {/* City filter indicator */}
          {filters.location && (
            <div className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl text-sm text-blue-700 dark:text-blue-300">
              <MapPin className="w-3.5 h-3.5" />
              {filters.location}
              <button
                onClick={() => {
                  const params = new URLSearchParams(location.search);
                  params.delete('city');
                  navigate(`/marketplace?${params.toString()}`);
                }}
                className="ml-1 hover:text-blue-900"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* Returned deals context banner */}
        {activeSource === 'returned' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4 flex items-start gap-3"
          >
            <Sparkles className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-orange-800 dark:text-orange-300">
                Dealtock Deals — Returned & Sealed Products
              </p>
              <p className="text-xs text-orange-600 dark:text-orange-400 mt-0.5">
                These are sealed, unopened parcels that couldn't be delivered to their original recipient.
                Products are verified by Dealtock and delivered by the same company that holds the stock —
                meaning faster delivery and bigger discounts.
                {filters.location
                  ? ` Showing deals available in ${filters.location}.`
                  : buyerCity
                  ? ` Showing deals near you in ${buyerCity} and elsewhere.`
                  : ' Set your city to see local deals first.'}
              </p>
            </div>
          </motion.div>
        )}

        {/* Products grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-3 animate-pulse">
                <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg mb-2" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-1" />
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600 dark:text-red-400">Error loading products: {error}</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
              {activeSource === 'returned'
                ? 'No Dealtock Deals available right now'
                : 'No products found'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {activeSource === 'returned'
                ? 'Check back soon — delivery companies add new sealed deals daily.'
                : 'Try adjusting your filters'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.map(product => {
              const priceInfo = getPriceForRole(product);
              if (priceInfo.invalid || priceInfo.price <= 0) return null;
              return (
                <ProductCard
                  key={product.id}
                  product={product}
                  priceInfo={priceInfo}
                  formatPrice={formatPrice}
                  buyerCity={buyerCity}
                  onViewDetails={(e) => handleOrderClick(product, e)}
                  onAddToCart={addToCart}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Product detail modal */}
      {selectedProduct && selectedProductPriceInfo && showDetailModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowDetailModal(false)}
        >
          <div
            className={`bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl ${
              selectedProduct.source_type === 'returned' ? 'border-2 border-orange-300' : ''
            }`}
            onClick={e => e.stopPropagation()}
          >
            {/* Returned deal header strip */}
            {selectedProduct.source_type === 'returned' && (
              <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200">
                <Sparkles className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-semibold text-orange-700 dark:text-orange-300">
                  Dealtock Deal — Sealed & Verified
                </span>
                <Shield className="w-4 h-4 text-green-500 ml-auto" />
                <span className="text-xs text-green-600 font-medium">Condition A</span>
              </div>
            )}

            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {selectedProduct.name}
            </h2>

            {selectedProduct.image_url && (
              <img
                src={selectedProduct.image_url}
                alt={selectedProduct.name}
                className="w-full h-64 object-contain mb-4 rounded-xl"
              />
            )}

            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {selectedProduct.description || 'No description available'}
            </p>

            {/* Price */}
            <div className="mb-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">{selectedProductPriceInfo.label}</p>
              <p className={`text-2xl font-bold ${
                selectedProduct.source_type === 'returned'
                  ? 'text-orange-600' : 'text-blue-600 dark:text-blue-400'
              }`}>
                {formatPrice(selectedProductPriceInfo.price)}
              </p>
            </div>

            {/* Info grid */}
            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl space-y-2">
              {selectedProduct.source_type === 'returned' && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Type:</span>
                  <span className="text-orange-600 font-semibold">🔥 Returned & Sealed</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Condition:</span>
                <span className="text-gray-700 dark:text-gray-300 capitalize">
                  {selectedProduct.condition === 'A'
                    ? '✅ Sealed / Unopened'
                    : selectedProduct.condition || 'New'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">City:</span>
                <span className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
                  <MapPin className="w-3 h-3" />
                  {selectedProduct.city || selectedProduct.location || 'Morocco'}
                  {selectedProduct.city_locked && (
                    <span className="text-blue-500 text-xs">(local delivery)</span>
                  )}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Stock:</span>
                <span className={selectedProduct.quantity <= 3 ? 'text-red-500' : 'text-gray-700 dark:text-gray-300'}>
                  {selectedProduct.quantity > 0 ? `${selectedProduct.quantity} unit${selectedProduct.quantity > 1 ? 's' : ''}` : 'Out of stock'}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { addToCart(selectedProduct, selectedProductPriceInfo.price); setShowDetailModal(false); }}
                disabled={selectedProduct.quantity <= 0}
                className={`flex-1 px-4 py-2.5 text-white rounded-xl font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed ${
                  selectedProduct.source_type === 'returned'
                    ? 'bg-orange-500 hover:bg-orange-600'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                Add to Cart
              </button>
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketplacePage;
