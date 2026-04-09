// src/components/marketplace/MarketplacePage.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useMarketplaceProducts } from '../../hooks/useMarketplaceProducts';
import { useAuth } from '../../contexts/SupabaseAuthContext';
import { motion } from 'framer-motion';
import ProductDetailModal from './components/ProductDetailModal';
import { 
  MapPin, 
  Package,
  Eye,
  ZoomIn,
  ShoppingCart,
  Truck,
  Sparkles,
  TrendingUp,
  Gift
} from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIES = [
  { name: 'Electronics', icon: '📱', color: 'bg-blue-100 text-blue-600' },
  { name: 'Fashion', icon: '👕', color: 'bg-pink-100 text-pink-600' },
  { name: 'Home', icon: '🏠', color: 'bg-green-100 text-green-600' },
  { name: 'Beauty', icon: '💄', color: 'bg-purple-100 text-purple-600' },
  { name: 'Sports', icon: '⚽', color: 'bg-orange-100 text-orange-600' },
  { name: 'Books', icon: '📚', color: 'bg-yellow-100 text-yellow-600' },
  { name: 'Promotions', icon: '🎉', color: 'bg-red-100 text-red-600', isPromo: true }
];

// Category Card Component
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

// Product Card Component with Add to Cart
const ProductCard = ({ product, priceInfo, formatPrice, onViewDetails, onAddToCart }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  
  const handleAddToCart = async (e) => {
    e.stopPropagation();
    setAddingToCart(true);
    await onAddToCart(product, priceInfo.price);
    setAddingToCart(false);
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer group"
    >
      {/* Image Container with Zoom Effect */}
      <div className="relative h-40 bg-gray-100 dark:bg-gray-700 overflow-hidden">
        {product.image_url && !imageError ? (
          <>
            <img 
              src={product.image_url} 
              alt={product.name}
              className={`w-full h-full object-contain transition-all duration-500 ${
                isHovered ? 'scale-110' : 'scale-100'
              }`}
              onError={() => setImageError(true)}
            />
            {/* Zoom Indicator on Hover */}
            <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-300 ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}>
              <div className="bg-white/90 rounded-full p-1.5">
                <ZoomIn className="w-4 h-4 text-gray-700" />
              </div>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-10 h-10 text-gray-400" />
          </div>
        )}
        
        {/* Stock Badge */}
        {product.quantity <= 3 && product.quantity > 0 && (
          <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
            Only {product.quantity} left
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-3">
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-1 mb-1">
          {product.name}
        </h3>
        
        {/* Location */}
        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-2">
          <MapPin className="w-3 h-3" />
          <span className="truncate">{product.location || 'Location?'}</span>
        </div>
        
        {/* Price and Buttons */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{priceInfo.label}</p>
            <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {formatPrice(priceInfo.price)}
            </p>
          </div>
          <div className="flex gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails(e);
              }}
              className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
              title="View Details"
            >
              <Eye className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={handleAddToCart}
              disabled={addingToCart}
              className="p-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg transition disabled:opacity-50"
              title="Add to Cart"
            >
              <ShoppingCart className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const MarketplacePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
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

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [cart, setCart] = useState([]);
  
  const { products, loading, error, userRole, getPriceForRole, refetch } = useMarketplaceProducts(filters);

  // Load cart from localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  // Save cart to localStorage
  const saveCart = (items) => {
    localStorage.setItem('cart', JSON.stringify(items));
    setCart(items);
  };

  // Add to cart function
  const addToCart = (product, price) => {
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      const updatedCart = cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
      saveCart(updatedCart);
      toast.success(`Added another ${product.name} to cart`);
    } else {
      const newItem = {
        id: product.id,
        name: product.name,
        price: price,
        image_url: product.image_url,
        category: product.category,
        stock: product.quantity,
        quantity: 1
      };
      saveCart([...cart, newItem]);
      toast.success(`${product.name} added to cart`);
    }
  };

  // Read all filter parameters from URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    
    const newFilters = {
      search: params.get('search') || '',
      category: params.get('category') || '',
      location: params.get('city') || '',
      minPrice: params.get('min_price') || '',
      maxPrice: params.get('max_price') || '',
      condition: params.get('condition') || '',
      sortBy: params.get('sort') === 'price_low' ? 'price_asc' : 
               params.get('sort') === 'price_high' ? 'price_desc' : 
               params.get('sort') === 'name' ? 'name' : 'created_at',
      sortOrder: 'desc'
    };
    
    setFilters(newFilters);
  }, [location.search]);

  const handleOrderClick = (product, e) => {
    e.stopPropagation();
    setSelectedProduct(product);
    setShowDetailModal(true);
  };

  const handleCategoryClick = (categoryName) => {
    const params = new URLSearchParams(location.search);
    if (categoryName === 'Promotions') {
      // Handle promotions - could filter by discounted products
      params.set('promo', 'true');
    } else {
      params.set('category', categoryName);
    }
    navigate(`/marketplace?${params.toString()}`);
  };

  const formatPrice = (price) => {
    if (!price && price !== 0) return '0 MAD';
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Category Grid - Reduced gap */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Shop by Category</h2>
            <Link to="/categories" className="text-sm text-blue-600 hover:text-blue-700">
              View All
            </Link>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-2">
            {CATEGORIES.map((category) => (
              <CategoryCard 
                key={category.name} 
                {...category} 
                onClick={() => handleCategoryClick(category.name)}
              />
            ))}
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-3 animate-pulse">
                <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-1"></div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
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
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">No products found</h3>
            <p className="text-gray-500 dark:text-gray-400">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.map((product) => {
              const priceInfo = getPriceForRole(product);
              if (priceInfo.invalid || priceInfo.price <= 0) return null;
              
              return (
                <ProductCard
                  key={product.id}
                  product={product}
                  priceInfo={priceInfo}
                  formatPrice={formatPrice}
                  onViewDetails={(e) => handleOrderClick(product, e)}
                  onAddToCart={addToCart}
                />
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
          userRole={userRole}
          onOrderSuccess={(order) => {
            console.log('Order placed:', order);
            setShowDetailModal(false);
            refetch();
          }}
        />
      )}
    </div>
  );
};

export default MarketplacePage;