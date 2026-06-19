// src/components/dashboard/seller/Inventory.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/SupabaseAuthContext';
import { supabase } from '../../../lib/supabaseClient';
import { motion } from 'framer-motion';
import { 
  Package, 
  Plus, 
  Search, 
  Filter,
  RefreshCw,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  AlertCircle,
  DollarSign,
  BarChart3,
  Grid,
  List
} from 'lucide-react';
import { toast } from 'sonner';

// Import components
import ProductTable from '../ProductTable';
import AddProductForm from '../AddProductForm';
import EditProductForm from '../EditProductForm';

// ============================================
// CONSTANTS
// ============================================
const CATEGORIES = [
  "Electronics", 
  "Fashion", 
  "Home", 
  "Beauty", 
  "Sports", 
  "Books", 
  "Automotive", 
  "Other"
];

const STATUSES = [
  { value: "available", label: "Available", color: "green" },
  { value: "pending", label: "Pending", color: "yellow" },
  { value: "sold", label: "Sold", color: "purple" },
  { value: "shipped", label: "Shipped", color: "blue" },
  { value: "delivered", label: "Delivered", color: "indigo" },
  { value: "returned", label: "Returned", color: "red" }
];

// ============================================
// INVENTORY SKELETON
// ============================================
const InventorySkeleton = () => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
    <div className="animate-pulse space-y-6">
      <div className="h-8 bg-gray-200 dark:bg-gray-700/50 rounded w-1/4"></div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700/30 rounded-lg"></div>
        ))}
      </div>
      <div className="h-96 bg-gray-200 dark:bg-gray-700/30 rounded-xl"></div>
    </div>
  </div>
);

// ============================================
// STAT CARD COMPONENT
// ============================================
const StatCard = ({ title, value, icon: Icon, color = "blue", subtext }) => (
  <div className="bg-white dark:bg-transparent border border-gray-200 dark:border-white/20 dark:backdrop-blur-sm rounded-xl p-4 shadow-sm dark:shadow-none hover:border-blue-500/50 transition-all duration-300">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{title}</p>
        <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
        {subtext && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtext}</p>}
      </div>
      <div className={`w-10 h-10 bg-gradient-to-br from-${color}-500 to-${color}-600 rounded-lg flex items-center justify-center`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
    </div>
  </div>
);

// ============================================
// MAIN INVENTORY COMPONENT
// ============================================
const Inventory = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    totalValue: 0,
    lowStockCount: 0
  });

  useEffect(() => {
    if (user) {
      fetchProducts();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setProducts(data || []);
      calculateStats(data || []);
      
    } catch (err) {
      console.error('Error fetching products:', err);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (productsData) => {
    const totalProducts = productsData.length;
    const activeProducts = productsData.filter(p => 
      p.available_for_sale && p.quantity > 0 && p.status === 'available'
    ).length;
    
    const totalValue = productsData.reduce(
      (sum, p) => sum + ((p.purchase_price || 0) * (p.quantity || 0)), 
      0
    );
    
    const lowStockCount = productsData.filter(p => 
      p.quantity > 0 && p.quantity <= 3 && p.available_for_sale
    ).length;

    setStats({
      totalProducts,
      activeProducts,
      totalValue,
      lowStockCount
    });
  };

  const handleAddProduct = async (productData) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert([{
          ...productData,
          user_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      await fetchProducts();
      setShowAddForm(false);
      toast.success('Product added successfully');
    } catch (err) {
      console.error('Error adding product:', err);
      toast.error(err.message || 'Failed to add product');
    }
  };

  const handleUpdateProduct = async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      await fetchProducts();
      setEditingProduct(null);
      toast.success('Product updated successfully');
    } catch (err) {
      console.error('Error updating product:', err);
      toast.error(err.message || 'Failed to update product');
    }
  };

  const handleDeleteProduct = async (id) => {
    try {
      // Check if product has orders
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id')
        .eq('product_id', id)
        .limit(1);

      if (ordersError) throw ordersError;

      if (orders && orders.length > 0) {
        toast.error(
          'This product has orders and cannot be deleted. ' +
          'You can mark it as "unavailable" instead to hide it from new buyers.',
          { duration: 6000 }
        );
        return;
      }

      if (!window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
        return;
      }

      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      await fetchProducts();
      toast.success('Product deleted successfully');
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error(error.message || 'Failed to delete product');
    }
  };

  const handleToggleAvailability = async (id, available) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({
          available_for_sale: available,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      await fetchProducts();
      toast.success(available ? 'Product is now visible' : 'Product is now hidden');
    } catch (err) {
      console.error('Error toggling availability:', err);
      toast.error('Failed to update product status');
    }
  };

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Get unique categories for filter
  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value).replace('MAD', '').trim() + ' MAD';
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Please Log In</h2>
          <p className="text-gray-500 dark:text-gray-400">You need to be authenticated to access your inventory.</p>
        </div>
      </div>
    );
  }

  if (loading) return <InventorySkeleton />;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400 bg-clip-text text-transparent">
              Inventory Management
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your products and stock levels</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Refresh Button - Same position as dashboard */}
            <button
              onClick={fetchProducts}
              disabled={loading}
              className="px-4 py-2 bg-gray-100 dark:bg-white/10 dark:backdrop-blur-sm rounded-lg hover:bg-gray-200 dark:hover:bg-white/20 transition-all flex items-center gap-2 text-gray-700 dark:text-white"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>

            {/* Add Product Button */}
            <button
              onClick={() => setShowAddForm(true)}
              className="px-6 py-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg font-medium hover:from-purple-600 hover:to-blue-600 transition-all text-white shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Product
            </button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6"
        >
          <StatCard 
            title="Total Products" 
            value={stats.totalProducts} 
            icon={Package} 
            color="blue"
            subtext={`${stats.activeProducts} active`}
          />
          <StatCard 
            title="Inventory Value" 
            value={formatCurrency(stats.totalValue)} 
            icon={DollarSign} 
            color="green"
            subtext="Based on your price"
          />
          <StatCard 
            title="Low Stock Items" 
            value={stats.lowStockCount} 
            icon={AlertCircle} 
            color="red"
            subtext="Quantity ≤ 3"
          />
          <StatCard 
            title="Categories" 
            value={categories.length} 
            icon={BarChart3} 
            color="purple"
            subtext="Product categories"
          />
        </motion.div>

        {/* Filters and Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white dark:bg-transparent border border-gray-200 dark:border-white/20 dark:backdrop-blur-sm rounded-xl p-4 mb-6 shadow-sm dark:shadow-none"
        >
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Search */}
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search products by name or SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400"
              />
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white"
              >
                <option value="all" className="bg-white dark:bg-gray-800">All Status</option>
                {STATUSES.map(s => (
                  <option key={s.value} value={s.value} className="bg-white dark:bg-gray-800">{s.label}</option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white"
              >
                <option value="all" className="bg-white dark:bg-gray-800">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat} className="bg-white dark:bg-gray-800">{cat}</option>
                ))}
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('table')}
                className={`flex-1 px-3 py-2 rounded-lg flex items-center justify-center gap-2 transition ${
                  viewMode === 'table'
                    ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/20'
                }`}
              >
                <List className="w-4 h-4" />
                <span className="hidden md:inline">Table</span>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`flex-1 px-3 py-2 rounded-lg flex items-center justify-center gap-2 transition ${
                  viewMode === 'grid'
                    ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/20'
                }`}
              >
                <Grid className="w-4 h-4" />
                <span className="hidden md:inline">Grid</span>
              </button>
            </div>
          </div>

          {/* Results count */}
          <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            Showing {filteredProducts.length} of {products.length} products
          </div>
        </motion.div>

        {/* Products Display */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-white/5 border border-gray-200 dark:border-transparent rounded-xl overflow-hidden shadow-sm dark:shadow-none"
        >
          {filteredProducts.length === 0 ? (
            <div className="text-center py-16">
              <Package className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No products found</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Start by adding your first product!'}
              </p>
              <button
                onClick={() => setShowAddForm(true)}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-blue-600 transition shadow-lg"
              >
                <Plus className="w-4 h-4 inline mr-2" />
                Add Your First Product
              </button>
            </div>
          ) : viewMode === 'table' ? (
            <ProductTable
              products={filteredProducts}
              onEdit={setEditingProduct}
              onDelete={handleDeleteProduct}
              onToggleAvailability={handleToggleAvailability}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
              {filteredProducts.map((product) => (
                <div key={product.id} className="bg-gray-50 dark:bg-white/10 rounded-lg p-4 border border-gray-200 dark:border-white/20 hover:border-blue-500/50 transition">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://via.placeholder.com/64?text=No+Image';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-300 dark:bg-gray-600">
                          <Package className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingProduct(product)}
                        className="p-2 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-500/30 transition"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleAvailability(product.id, !product.available_for_sale)}
                        className={`p-2 rounded-lg transition ${
                          product.available_for_sale
                            ? 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-500/30'
                            : 'bg-gray-200 dark:bg-gray-500/20 text-gray-500 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-500/30'
                        }`}
                      >
                        {product.available_for_sale ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="p-2 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-500/30 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">{product.name}</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{product.category || 'Uncategorized'}</p>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Your Price</p>
                      <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{formatCurrency(product.purchase_price || 0)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Quantity</p>
                      <p className={`text-lg font-bold ${
                        product.quantity <= 3 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                      }`}>
                        {product.quantity || 0}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className={`px-2 py-1 rounded-full ${
                      product.status === 'available' ? 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400' :
                      product.status === 'sold' ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400' :
                      'bg-gray-200 dark:bg-gray-500/20 text-gray-600 dark:text-gray-400'
                    }`}>
                      {product.status || 'available'}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">
                      SKU: {product.sku || 'N/A'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Add Product Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl"
          >
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Add New Product</h2>
              <button
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                onClick={() => setShowAddForm(false)}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <AddProductForm
                onSubmit={handleAddProduct}
                onCancel={() => setShowAddForm(false)}
              />
            </div>
          </motion.div>
        </div>
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl"
          >
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Edit Product</h2>
              <button
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                onClick={() => setEditingProduct(null)}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <EditProductForm
                product={editingProduct}
                onSubmit={(updates) => handleUpdateProduct(editingProduct.id, updates)}
                onCancel={() => setEditingProduct(null)}
              />
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Inventory;