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
import { useTranslation } from 'react-i18next';
import { StampBadge } from '../ui/stamp-badge';

const CATEGORIES = [
  { name: 'Electronics', icon: '📱', color: 'bg-blue-100 text-blue-600' },
  { name: 'Fashion',     icon: '👕', color: 'bg-pink-100 text-pink-600' },
  { name: 'Home',        icon: '🏠', color: 'bg-green-100 text-green-600' },
  { name: 'Beauty',      icon: '💄', color: 'bg-purple-100 text-purple-600' },
  { name: 'Sports',      icon: '⚽', color: 'bg-kraft-100 text-kraft-600' },
  { name: 'Books',       icon: '📚', color: 'bg-yellow-100 text-yellow-600' },
  { name: 'Promotions',  icon: '🎉', color: 'bg-red-100 text-red-600', isPromo: true },
];

const SOURCE_TAB_KEYS = [
  { key: 'all',      tKey: 'tabs.all',      icon: '🛍️' },
  { key: 'new',      tKey: 'tabs.new',      icon: '✨' },
  { key: 'returned', tKey: 'tabs.returned', icon: '🔥' },
];

// ── Category Card ─────────────────────────────────────────────────
const CategoryCard = ({ name, icon, color, onClick }) => {
  const { t } = useTranslation();
  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center hover:shadow-lg transition cursor-pointer border border-gray-200 dark:border-gray-700 group"
    >
      <div className={`w-10 h-10 ${color} rounded-full flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform`}>
        <span className="text-xl">{icon}</span>
      </div>
      <p className="font-medium text-gray-900 dark:text-white text-sm">{t(`categories.${name}`)}</p>
    </div>
  );
};

// ── City-locked Deal Banner ───────────────────────────────────────
const CityDealsBanner = ({ city, count, onFilter }) => {
  const { t } = useTranslation();
  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-4 bg-kraft-700 rounded-xl p-4 flex items-center justify-between shadow-md"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
          <MapPin className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-white font-bold text-sm">
            🔥 {t('marketplace.localDealsNear', { count, city })}
          </p>
          <p className="text-kraft-100 text-xs mt-0.5">
            {t('marketplace.localDealsSub')}
          </p>
        </div>
      </div>
      <button
        onClick={onFilter}
        className="flex items-center gap-1 bg-white text-kraft-600 font-semibold text-xs px-3 py-2 rounded-lg hover:bg-kraft-50 transition flex-shrink-0 ml-3"
      >
        {t('marketplace.seeDeals')} <ChevronRight className="w-3 h-3" />
      </button>
    </motion.div>
  );
};

// ── Product Card ──────────────────────────────────────────────────
const ProductCard = ({ product, priceInfo, formatPrice, onViewDetails, onAddToCart, buyerCity }) => {
  const { t } = useTranslation();
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
            ? 'border-kraft-200 dark:border-kraft-800 hover:shadow-xl hover:shadow-kraft-100'
            : 'border-gray-200 dark:border-gray-700 hover:shadow-xl'
        }`}
      >
        {/* Image */}
        <div className="relative h-36 sm:h-44 bg-gray-100 dark:bg-gray-700 overflow-hidden">
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
              <StampBadge variant="kraft" className="shadow">
                <Sparkles className="w-3 h-3" /> {t('marketplace.dealtockDeal')}
              </StampBadge>
              <StampBadge variant="verified" className="shadow">
                <Shield className="w-3 h-3" /> {t('marketplace.sealed')}
              </StampBadge>
            </div>
          )}

          {/* City match badge — top right */}
          {isCityMatch && (
            <span className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 bg-blue-600 text-white text-xs font-semibold rounded-full shadow">
              <MapPin className="w-3 h-3" /> {t('marketplace.local')}
            </span>
          )}

          {/* Low stock */}
          {product.quantity <= 3 && product.quantity > 0 && !isReturned && (
            <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
              {t('marketplace.onlyXLeft', { count: product.quantity })}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-2 sm:p-3" onClick={(e) => { e.stopPropagation(); onViewDetails(e); }}>
          <h3 className="font-medium text-gray-900 dark:text-white text-xs sm:text-sm line-clamp-2 mb-1 leading-tight">
            {product.name}
          </h3>

          <div className="flex items-center gap-0.5 text-[10px] text-gray-400 dark:text-gray-500 mb-1.5">
            <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
            <span className="truncate">
              {product.city || t('navbar.morocco')}
              {product.city_locked && (
                <span className="ml-0.5 text-kraft-500 font-medium">· {t('marketplace.localPickup')}</span>
              )}
            </span>
          </div>

          {/* Price */}
          <p className={`text-sm sm:text-base font-bold mb-2 ${isReturned ? 'text-kraft-600' : 'text-[#B12704] dark:text-orange-400'}`}>
            {formatPrice(priceInfo.price)}
          </p>

          {/* Action buttons */}
          <div className="flex gap-1.5">
            <button
              onClick={(e) => { e.stopPropagation(); onViewDetails(e); }}
              className="flex-1 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 active:scale-95 transition"
            >
              {t('marketplace.viewDetails')}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleAddToCart(e); }}
              disabled={addingToCart}
              className={`flex-1 py-1.5 text-xs rounded-lg text-white font-medium transition disabled:opacity-50 active:scale-95 ${
                isReturned ? 'bg-kraft-500 hover:bg-kraft-600' : 'bg-[#FF9900] hover:bg-[#e88900]'
              }`}
            >
              {addingToCart ? '...' : t('marketplace.addToCart')}
            </button>
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
  const { t }                 = useTranslation();
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
    // ── PRIX FIX ─────────────────────────────────────────────────
    // On passe le prix B2C déjà calculé par getPriceForRole()
    // pour éviter que useCart recalcule avec sale_price brut (sans commission)
    const success = await addToCartHook(product, 1, price);
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
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('marketplace.shopByCategory')}</h2>
            <Link to="/categories" className="text-sm text-blue-600 hover:text-blue-700">{t('marketplace.viewAll')}</Link>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-2">
            {CATEGORIES.map(cat => (
              <CategoryCard key={cat.name} {...cat} onClick={() => handleCategoryClick(cat.name)} />
            ))}
          </div>
        </div>

        {/* Source type tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {SOURCE_TAB_KEYS.map(tab => (
            <button
              key={tab.key}
              onClick={() => handleSourceTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                activeSource === tab.key
                  ? tab.key === 'returned'
                    ? 'bg-kraft-500 text-white shadow-md shadow-kraft-200'
                    : 'bg-blue-600 text-white shadow-md'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-blue-300'
              }`}
            >
              <span>{tab.icon}</span>
              {t(`marketplace.${tab.tKey}`)}
              {tab.key === 'returned' && cityLockedCount > 0 && buyerCity && (
                <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs font-bold ${
                  activeSource === 'returned' ? 'bg-white/30 text-white' : 'bg-kraft-500 text-white'
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
            className="mb-4 bg-kraft-50 dark:bg-kraft-900/20 border border-kraft-200 dark:border-kraft-800 rounded-xl p-4 flex items-start gap-3"
          >
            <Sparkles className="w-5 h-5 text-kraft-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-kraft-800 dark:text-kraft-300">
                {t('marketplace.dealsTitle')}
              </p>
              <p className="text-xs text-kraft-600 dark:text-kraft-400 mt-0.5">
                {t('marketplace.dealsBody')}{' '}
                {filters.location
                  ? t('marketplace.dealsBodyCity', { city: filters.location })
                  : buyerCity
                  ? t('marketplace.dealsBodyBuyerCity', { city: buyerCity })
                  : t('marketplace.dealsBodySetCity')}
              </p>
            </div>
          </motion.div>
        )}

        {/* Products grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
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
            <p className="text-red-600 dark:text-red-400">{t('marketplace.errorLoading', { error })}</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
              {activeSource === 'returned'
                ? t('marketplace.noReturnedTitle')
                : t('marketplace.noResultsTitle')}
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {activeSource === 'returned'
                ? t('marketplace.noReturnedBody')
                : t('marketplace.noResultsBody')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
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
          className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50"
          onClick={() => setShowDetailModal(false)}
        >
          <div
            className={`bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl p-4 sm:p-6 max-w-2xl w-full mx-0 sm:mx-4 max-h-[92vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl ${
              selectedProduct.source_type === 'returned' ? 'border-2 border-kraft-300' : ''
            }`}
            onClick={e => e.stopPropagation()}
          >
            {/* Returned deal header strip */}
            {selectedProduct.source_type === 'returned' && (
              <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-kraft-50 dark:bg-kraft-900/20 rounded-xl border border-kraft-200">
                <Sparkles className="w-4 h-4 text-kraft-500" />
                <span className="text-sm font-semibold text-kraft-700 dark:text-kraft-300">
                  {t('marketplace.dealtockDeal')} — {t('marketplace.sealed')} & Verified
                </span>
                <Shield className="w-4 h-4 text-green-500 ml-auto" />
                <span className="text-xs text-green-600 font-medium">{t('marketplace.condition')} A</span>
              </div>
            )}

            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {selectedProduct.name}
            </h2>

            {selectedProduct.image_url && (
              <img
                src={selectedProduct.image_url}
                alt={selectedProduct.name}
                className="w-full h-40 sm:h-64 object-contain mb-4 rounded-xl"
              />
            )}

            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {selectedProduct.description || t('marketplace.noDescription')}
            </p>

            {/* Price */}
            <div className="mb-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">{selectedProductPriceInfo.label}</p>
              <p className={`text-2xl font-bold ${
                selectedProduct.source_type === 'returned'
                  ? 'text-kraft-600' : 'text-blue-600 dark:text-blue-400'
              }`}>
                {formatPrice(selectedProductPriceInfo.price)}
              </p>
            </div>

            {/* Info grid */}
            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl space-y-2">
              {selectedProduct.source_type === 'returned' && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">{t('marketplace.type')}:</span>
                  <span className="text-kraft-600 font-semibold">🔥 {t('marketplace.returnedAndSealed')}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">{t('marketplace.condition')}:</span>
                <span className="text-gray-700 dark:text-gray-300 capitalize">
                  {selectedProduct.condition === 'A'
                    ? `✅ ${t('marketplace.sealedUnopened')}`
                    : selectedProduct.condition || t('marketplace.new')}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">{t('marketplace.city')}:</span>
                <span className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
                  <MapPin className="w-3 h-3" />
                  {selectedProduct.city || selectedProduct.location || t('navbar.morocco')}
                  {selectedProduct.city_locked && (
                    <span className="text-blue-500 text-xs">({t('marketplace.localDelivery')})</span>
                  )}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">{t('marketplace.stock')}:</span>
                <span className={selectedProduct.quantity <= 3 ? 'text-red-500' : 'text-gray-700 dark:text-gray-300'}>
                  {selectedProduct.quantity > 0 ? `${selectedProduct.quantity} ${t('marketplace.unit', { count: selectedProduct.quantity })}` : t('marketplace.outOfStock')}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { addToCart(selectedProduct, selectedProductPriceInfo.price); setShowDetailModal(false); }}
                disabled={selectedProduct.quantity <= 0}
                className={`flex-1 px-4 py-2.5 text-white rounded-xl font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed ${
                  selectedProduct.source_type === 'returned'
                    ? 'bg-kraft-500 hover:bg-kraft-600'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {t('marketplace.addToCart')}
              </button>
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition"
              >
                {t('marketplace.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketplacePage;
