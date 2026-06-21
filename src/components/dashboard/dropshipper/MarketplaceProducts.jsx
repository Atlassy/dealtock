// src/components/dashboard/dropshipper/MarketplaceProducts.jsx
import { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  ShoppingCart,
  MapPin,
  Package,
  Star
} from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';
import { toast } from 'sonner';
import ProductCard from './ProductCard';
import { useTranslation } from 'react-i18next';

const MarketplaceProducts = ({ onPlaceOrder }) => {
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedCity, setSelectedCity] = useState('all');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [categories, setCategories] = useState([]);
  const [cities, setCities] = useState([]);

  useEffect(() => {
    fetchProducts();
    fetchFilters();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      
      // Fixed query - include category_id for commission calculation
      let query = supabase
        .from('products')
        .select(`
          *,
          seller:user_id (
            full_name,
            average_rating
          )
        `)
        .eq('available_for_sale', true)
        .eq('status', 'available')
        .gt('quantity', 0);

      // Apply filters
      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory);
      }
      
      if (selectedCity !== 'all') {
        query = query.eq('location', selectedCity);
      }
      
      if (priceRange.min) {
        query = query.gte('purchase_price', parseFloat(priceRange.min));
      }
      
      if (priceRange.max) {
        query = query.lte('purchase_price', parseFloat(priceRange.max));
      }
      
      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error(t('marketplaceProducts.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const fetchFilters = async () => {
    try {
      // Fetch unique categories
      const { data: categoryData } = await supabase
        .from('products')
        .select('category')
        .eq('available_for_sale', true)
        .eq('status', 'available')
        .gt('quantity', 0);
      
      if (categoryData) {
        const uniqueCategories = [...new Set(categoryData.map(p => p.category).filter(Boolean))];
        setCategories(uniqueCategories);
      }

      // Fetch unique cities
      const { data: cityData } = await supabase
        .from('products')
        .select('location')
        .eq('available_for_sale', true)
        .eq('status', 'available')
        .gt('quantity', 0);
      
      if (cityData) {
        const uniqueCities = [...new Set(cityData.map(p => p.location).filter(Boolean))];
        setCities(uniqueCities);
      }
    } catch (error) {
      console.error('Error fetching filters:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProducts();
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedCity('all');
    setPriceRange({ min: '', max: '' });
    setTimeout(fetchProducts, 0);
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <form onSubmit={handleSearch} className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
            <input
              type="text"
              placeholder={t('marketplaceProducts.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Filters Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">{t('marketplaceProducts.allCategories')}</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">{t('marketplaceProducts.allCities')}</option>
              {cities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>

            <div className="flex gap-2">
              <input
                type="number"
                placeholder={t('marketplaceProducts.minPrice')}
                value={priceRange.min}
                onChange={(e) => setPriceRange({...priceRange, min: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="number"
                placeholder={t('marketplaceProducts.maxPrice')}
                value={priceRange.max}
                onChange={(e) => setPriceRange({...priceRange, max: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Filter className="w-4 h-4 inline mr-2" />
                {t('marketplaceProducts.applyFilters')}
              </button>
              <button
                type="button"
                onClick={clearFilters}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {t('marketplaceProducts.clear')}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(n => (
            <div key={n} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 animate-pulse">
              <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
          <Package className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t('marketplaceProducts.noProductsFound')}</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">{t('marketplaceProducts.tryAdjusting')}</p>
          <button
            onClick={clearFilters}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {t('marketplaceProducts.clearAllFilters')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map(product => (
            <ProductCard
              key={product.id}
              product={{
                ...product,
                seller_name: product.seller?.full_name || t('marketplaceProducts.unknownSeller'),
                seller_rating: product.seller?.average_rating || 0,
                category_id: product.category_id, // Pass category_id for commission
                seller_id: product.user_id // Pass seller_id for commission
              }}
              onPlaceOrder={onPlaceOrder}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MarketplaceProducts;