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
import { useTranslation } from 'react-i18next';

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

const STATUS_KEYS = ["available", "pending", "sold", "shipped", "delivered", "returned"];

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
  const { t } = useTranslation();
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
      toast.error(t('inventory.loadFailed'));
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
      toast.success(t('inventory.productAdded'));
    } catch (err) {
      console.error('Error adding product:', err);
      toast.error(err.message || t('inventory.addFailed'));
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
      toast.success(t('inventory.productUpdated'));
    } catch (err) {
      console.error('Error updating product:', err);
      toast.error(err.message || t('inventory.updateFailed'));
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
        toast.error(t('inventory.hasOrdersCannotDelete'), { duration: 6000 });
        return;
      }

      if (!window.confirm(t('inventory.confirmDelete'))) {
        return;
      }

      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      await fetchProducts();
      toast.success(t('inventory.productDeleted'));
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error(error.message || t('inventory.deleteFailed'));
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
      toast.success(available ? t('inventory.nowVisible') : t('inventory.nowHidden'));
    } catch (err) {
      console.error('Error toggling availability:', err);
      toast.error(t('inventory.toggleFailed'));
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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('inventory.pleaseLogIn')}</h2>
          <p className="text-gray-500 dark:text-gray-400">{t('inventory.needAuth')}</p>
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
              {t('inventory.title')}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">{t('inventory.subtitle')}</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Refresh Button - Same position as dashboard */}
            <button
              onClick={fetchProducts}
              disabled={loading}
              className="px-4 py-2 bg-gray-100 dark:bg-white/10 dark:backdrop-blur-sm rounded-lg hover:bg-gray-200 dark:hover:bg-white/20 transition-all flex items-center gap-2 text-gray-700 dark:text-white"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? t('inventory.refreshing') : t('inventory.refresh')}
            </button>

            {/* Add Product Button */}
            <button
              onClick={() => setShowAddForm(true)}
              className="px-6 py-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg font-medium hover:from-purple-600 hover:to-blue-600 transition-all text-white shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {t('inventory.addProduct')}
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
            title={t('inventory.stats.totalProducts')}
            value={stats.totalProducts}
            icon={Package}
            color="blue"
            subtext={t('inventory.stats.activeSub', { count: stats.activeProducts })}
          />
          <StatCard
            title={t('inventory.stats.inventoryValue')}
            value={formatCurrency(stats.totalValue)}
            icon={DollarSign}
            color="green"
            subtext={t('inventory.stats.basedOnPrice')}
          />
          <StatCard
            title={t('inventory.stats.lowStockItems')}
            value={stats.lowStockCount}
            icon={AlertCircle}
            color="red"
            subtext={t('inventory.stats.quantityLte3')}
          />
          <StatCard
            title={t('inventory.stats.categories')}
            value={categories.length}
            icon={BarChart3}
            color="purple"
            subtext={t('inventory.stats.productCategories')}
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
                placeholder={t('inventory.searchPlaceholder')}
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
                <option value="all" className="bg-white dark:bg-gray-800">{t('inventory.allStatus')}</option>
                {STATUS_KEYS.map(key => (
                  <option key={key} value={key} className="bg-white dark:bg-gray-800">{t(`inventory.statuses.${key}`)}</option>
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
                <option value="all" className="bg-white dark:bg-gray-800">{t('inventory.allCategories')}</option>
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
                <span className="hidden md:inline">{t('inventory.table')}</span>
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
                <span className="hidden md:inline">{t('inventory.grid')}</span>
              </button>
            </div>
          </div>

          {/* Results count */}
          <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            {t('inventory.showingResults', { filtered: filteredProducts.length, total: products.length })}
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
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{t('inventory.noProductsFound')}</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all'
                  ? t('inventory.tryAdjustingFilters')
                  : t('inventory.startAdding')}
              </p>
              <button
                onClick={() => setShowAddForm(true)}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-blue-600 transition shadow-lg"
              >
                <Plus className="w-4 h-4 inline mr-2" />
                {t('inventory.addFirstProduct')}
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
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{product.category || t('inventory.uncategorized')}</p>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{t('inventory.yourPrice')}</p>
                      <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{formatCurrency(product.purchase_price || 0)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500 dark:text-gray-400">{t('inventory.quantity')}</p>
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
                      {product.status ? t(`inventory.statuses.${product.status}`, { defaultValue: product.status }) : t('inventory.statuses.available')}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">
                      {t('inventory.sku', { sku: product.sku || 'N/A' })}
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
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{t('inventory.addNewProduct')}</h2>
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
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{t('inventory.editProduct')}</h2>
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