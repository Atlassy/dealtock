// src/components/dashboard/dropshipper/MarketplaceProducts.jsx
import { useState, useEffect } from 'react';
import { Search, Filter, MapPin, Package, Star, TrendingUp, X } from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';
import { useToast } from '../../ui/use-toast';

const MarketplaceProducts = ({ onPlaceOrder }) => {
  const { toast } = useToast();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: '',
    city: '',
    search: '',
    minPrice: '',
    maxPrice: ''
  });
  const [categories, setCategories] = useState([]);
  const [cities, setCities] = useState([]);
  const [showCalculator, setShowCalculator] = useState({});
  const [markupValues, setMarkupValues] = useState({});

  useEffect(() => {
    fetchProducts();
    fetchFilterOptions();
  }, [filters.category, filters.city, filters.search]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('products')
        .select(`
          id,
          name,
          description,
          category,
          purchase_price,
          image_url,
          location,
          condition,
          quantity,
          user_id,
          profiles!products_user_id_fkey (
            full_name,
            average_rating
          )
        `)
        .eq('available_for_sale', true)
        .eq('status', 'available')
        .gt('quantity', 0);

      // Apply filters
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      if (filters.city) {
        query = query.eq('location', filters.city);
      }
      if (filters.search) {
        query = query.ilike('name', `%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Apply price filters client-side
      let filteredData = data || [];
      if (filters.minPrice) {
        filteredData = filteredData.filter(p => p.purchase_price >= parseFloat(filters.minPrice));
      }
      if (filters.maxPrice) {
        filteredData = filteredData.filter(p => p.purchase_price <= parseFloat(filters.maxPrice));
      }

      setProducts(filteredData);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchFilterOptions = async () => {
    try {
      // Get unique categories
      const { data: catData } = await supabase
        .from('products')
        .select('category')
        .eq('available_for_sale', true)
        .eq('status', 'available')
        .gt('quantity', 0);

      if (catData) {
        const uniqueCats = [...new Set(catData.map(c => c.category).filter(Boolean))];
        setCategories(uniqueCats);
      }

      // Get unique cities
      const { data: cityData } = await supabase
        .from('products')
        .select('location')
        .eq('available_for_sale', true)
        .eq('status', 'available')
        .gt('quantity', 0);

      if (cityData) {
        const uniqueCities = [...new Set(cityData.map(c => c.location).filter(Boolean))];
        setCities(uniqueCities);
      }
    } catch (error) {
      console.error('Error fetching filters:', error);
    }
  };

  const handleMarkupChange = (productId, percent) => {
    setMarkupValues(prev => ({
      ...prev,
      [productId]: percent
    }));
  };

  const toggleCalculator = (productId) => {
    setShowCalculator(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }));
    // Initialize markup if not set
    if (!markupValues[productId]) {
      setMarkupValues(prev => ({
        ...prev,
        [productId]: 20
      }));
    }
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      city: '',
      search: '',
      minPrice: '',
      maxPrice: ''
    });
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search products..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <select
            value={filters.city}
            onChange={(e) => setFilters({ ...filters, city: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="">All Cities</option>
            {cities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>

          <input
            type="number"
            placeholder="Min Price (MAD)"
            value={filters.minPrice}
            onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2"
          />

          <input
            type="number"
            placeholder="Max Price (MAD)"
            value={filters.maxPrice}
            onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2"
          />
        </div>

        {(filters.category || filters.city || filters.search || filters.minPrice || filters.maxPrice) && (
          <div className="flex justify-end">
            <button
              onClick={clearFilters}
              className="flex items-center text-sm text-gray-600 hover:text-gray-900"
            >
              <X className="w-4 h-4 mr-1" />
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map(product => {
            const markup = markupValues[product.id] || 20;
            const basePrice = Number(product.purchase_price) || 0;
            const markupAmount = (basePrice * markup) / 100;
            const customerPrice = basePrice + markupAmount;
            const profit = markupAmount;

            return (
              <div key={product.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                {/* Product Image */}
                <div className="relative h-48 bg-gray-100">
                  {product.image_url ? (
                    <img 
                      src={product.image_url} 
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Package className="w-12 h-12" />
                    </div>
                  )}
                  {product.condition && (
                    <span className="absolute top-2 right-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                      {product.condition}
                    </span>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-1">{product.name}</h3>
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">{product.description}</p>

                  {/* Seller & Location */}
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      {product.location}
                    </div>
                    <div className="flex items-center">
                      <Star className="w-4 h-4 mr-1 text-yellow-400" />
                      {product.profiles?.average_rating?.toFixed(1) || 'New'}
                    </div>
                  </div>

                  {/* Seller name */}
                  <div className="text-xs text-gray-400 mb-3">
                    Seller: {product.profiles?.full_name || 'Unknown'}
                  </div>

                  {/* Pricing */}
                  <div className="border-t pt-3 mt-2">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">Base Price:</span>
                      <span className="font-medium">{basePrice.toFixed(2)} MAD</span>
                    </div>

                    {showCalculator[product.id] ? (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">
                            Your Markup (%)
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={markup}
                            onChange={(e) => handleMarkupChange(product.id, parseInt(e.target.value))}
                            className="w-full"
                          />
                          <div className="flex justify-between text-sm">
                            <span>{markup}%</span>
                            <span className="text-green-600">+{markupAmount.toFixed(2)} MAD</span>
                          </div>
                        </div>

                        <div className="bg-blue-50 p-3 rounded-lg">
                          <div className="flex justify-between text-sm mb-1">
                            <span>Customer pays:</span>
                            <span className="font-bold">{customerPrice.toFixed(2)} MAD</span>
                          </div>
                          <div className="flex justify-between text-sm text-green-600">
                            <span>Your profit:</span>
                            <span className="font-bold">{profit.toFixed(2)} MAD</span>
                          </div>
                        </div>

                        <div className="flex space-x-2">
                          <button
                            onClick={() => toggleCalculator(product.id)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => onPlaceOrder({
                              ...product,
                              markup: markup,
                              customerPrice: customerPrice,
                              profit: profit
                            })}
                            className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                          >
                            Place Order
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => toggleCalculator(product.id)}
                        className="w-full flex items-center justify-center space-x-2 bg-gray-50 hover:bg-gray-100 text-gray-700 py-2 rounded-lg transition-colors"
                      >
                        <TrendingUp className="w-4 h-4" />
                        <span>Calculate Your Profit</span>
                      </button>
                    )}
                  </div>

                  {/* Stock */}
                  <div className="flex items-center text-xs text-gray-500 mt-3">
                    <Package className="w-3 h-3 mr-1" />
                    Stock: {product.quantity}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && products.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No products found matching your criteria
        </div>
      )}
    </div>
  );
};

export default MarketplaceProducts;