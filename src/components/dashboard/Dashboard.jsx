import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/SupabaseAuthContext";
import { supabase } from "../../lib/supabaseClient";
import { motion } from "framer-motion";
import { useNotifications } from "@/hooks/useNotifications";
import NotificationDropdown from "../../components/notifications/NotificationDropdown";
import { Package, TrendingUp, Percent, Euro,Filter, RefreshCw} from "lucide-react";
import { toast } from "sonner";
import ProductTable from "./ProductTable";
import AddProductForm from "./AddProductForm";
import EditProductForm from "./EditProductForm";
import DashboardHeader from "./DashboardHeader";  // No curly braces
import DashboardSkeleton from "./DashboardSkeleton";  // Add this import

const Dashboard = () => {
	const [bestSellers, setBestSellers] = useState([]);
	const [profile, setProfile] = useState(null);  // Add this state
	
  const [products, setProducts] = useState([]);
  const [sortConfig, setSortConfig] = useState({
    key: "totalSales",
    direction: "desc"
  });

  const [productsLoading, setProductsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalSales: 0,
    totalCommission: 0,
    averageCommissionRate: 0,
    netAmount: 0,
  });

  const { notifications, unreadCount } = useNotifications(user);
  const [open, setOpen] = useState(false);

  const markAsRead = async (id) => {
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", id);
  };

  const isLoading = authLoading || productsLoading;
  const filteredProducts = selectedStatus === "all" 
    ? products 
    : products.filter(product => product.status === selectedStatus);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', user.id)
            .single();
          
          if (data) {
            setProfile(data);
          }
        } catch (error) {
          console.error('Error fetching profile:', error);
        }
      }
    };

    if (user) {
      fetchProducts();
      fetchProfile();
    } else if (!authLoading) {
      setProductsLoading(false);
    }
  }, [user, authLoading]);

  const computeBestSellingProducts = (allProducts) => {
    const sold = allProducts.filter(p => p.status === "sold");

    return sold.map(p => {
      const soldQty = p.quantity || 1;
      const totalSales = (p.sale_price || 0) * soldQty;

      const firstSaleDate = p.sale_date || p.created_at;
      const daysActive = Math.max(
        1,
        Math.ceil((Date.now() - new Date(firstSaleDate)) / (1000 * 60 * 60 * 24))
      );
      
      return {
        id: p.id,
        name: p.name,
        totalSales,
        unitsSold: soldQty,
        avgSalesPerDay: (soldQty / daysActive).toFixed(2),
        conversionRate: p.quantity
          ? Math.round((soldQty / p.quantity) * 100)
          : 0,
        lastSaleDate: p.sale_date
      };
    })
    .sort((a, b) => b.totalSales - a.totalSales);
  };

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction:
        prev.key === key && prev.direction === "desc"
          ? "asc"
          : "desc"
    }));
  };

  const sortedBestSellers = [...bestSellers].sort((a, b) => {
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];

    if (sortConfig.direction === "asc") {
      return aValue > bValue ? 1 : -1;
    }
    return aValue < bValue ? 1 : -1;
  });

  const calculateStats = (allProducts) => {
    const totalProducts = allProducts.length;
    const soldProducts = allProducts.filter(p => p.status === 'sold');
    const totalSales = soldProducts.reduce((sum, p) => sum + ((p.sale_price || 0) * (p.quantity || 1)), 0);
    const totalCommission = soldProducts.reduce((sum, p) => sum + (p.commission || 0), 0);
    const netAmount = totalSales - totalCommission;
    const averageCommissionRate = totalSales > 0 
      ? ((totalCommission / totalSales) * 100).toFixed(1) 
      : 0;

    setStats({
      totalProducts,
      totalSales,
      totalCommission,
      averageCommissionRate,
      netAmount,
    });
  };

  const fetchProducts = async () => {
    setProductsLoading(true);
    try {
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("*")
        .eq("user_id", user.id)
        .order('created_at', { ascending: false });

      if (productsError) {
        console.error("Error fetching products:", productsError);
        toast.error("Failed to load products");
      } else {
        setProducts(productsData || []);
        calculateStats(productsData || []);
        setBestSellers(computeBestSellingProducts(productsData || []));
      }
    } catch (err) {
      console.error("Error in fetchProducts:", err);
      toast.error("Failed to load dashboard data");
    } finally {
      setProductsLoading(false);
    }
  };

  const handleAddProduct = async (productData) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert([
          {
            ...productData,
            user_id: user.id,
            available_for_sale: productData.quantity > 0
          }
        ])
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          toast.error("Product name already exists. Please update quantity instead.");
          return;
        }
        throw error;
      }

      setProducts(prev => [data, ...prev]);
      calculateStats([data, ...products]);
      setShowAddForm(false);
      toast.success("Product added successfully");

    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to add product");
    }
  };

  const handleUpdateProduct = async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          toast.error("Product name already exists. Please update quantity instead.");
          return;
        }
        throw error;
      }

      const updatedProducts = products.map(p => 
        p.id === id ? data : p
      );
      setProducts(updatedProducts);
      setEditingProduct(null);
      calculateStats(updatedProducts);
      
      toast.success("Product updated successfully");
      return { success: true };
      
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error(error.message || "Failed to update product");
      return { success: false, error: error.message };
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      const updatedProducts = products.filter(p => p.id !== id);
      setProducts(updatedProducts);
      calculateStats(updatedProducts);
      
      toast.success("Product deleted successfully");
      return { success: true };
      
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error(error.message || "Failed to delete product");
      return { success: false, error: error.message };
    }
  };

  const handleRefresh = () => {
    if (user) {
      fetchProducts();
      toast.info("Dashboard refreshed");
    }
  };

  if (isLoading) return <DashboardSkeleton />;
  if (!user) return (
    <div className="h-screen flex items-center justify-center text-gray-600">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Please log in to view your dashboard</h2>
        <p>You need to be authenticated to access your products and commission data.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 text-white">
      {/* Updated DashboardHeader with welcome message */}
      <DashboardHeader 
        userEmail={user?.email}
        userName={profile?.full_name}
        onRefresh={handleRefresh}
        productsLoading={productsLoading}
        onAddProduct={() => setShowAddForm(true)}
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* REMOVED: Welcome Section - Now it's in DashboardHeader */}

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8"
        >
          {/* Total Products */}
          <div className="glass-effect border-white/20 rounded-xl p-6 hover:border-blue-500/50 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-300">Total Products</p>
                <p className="text-3xl font-bold mt-2">{stats.totalProducts}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          {/* Total Sales */}
          <div className="glass-effect border-white/20 rounded-xl p-6 hover:border-orange-500/50 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-300">Total Sales</p>
                <p className="text-3xl font-bold mt-2">{stats.totalSales.toFixed(2)} MAD</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          {/* Net Amount */}
          <div className="glass-effect border-white/20 rounded-xl p-6 hover:border-green-500/50 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-300">Net Amount</p>
                <p className="text-3xl font-bold mt-2">{stats.netAmount.toFixed(2)} MAD</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                {/* Keep the SVG icon */}
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  {/* Your SVG path here */}
                </svg>
              </div>
            </div>
          </div>

          {/* Total Commission */}
          <div className="glass-effect border-white/20 rounded-xl p-6 hover:border-red-500/50 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-300">Total Commission</p>
                <p className="text-3xl font-bold mt-2">{stats.totalCommission.toFixed(2)} MAD</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Percent className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          {/* Average Commission Rate */}
          <div className="glass-effect border-white/20 rounded-xl p-6 hover:border-teal-500/50 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-300">Avg Commission Rate</p>
                <p className="text-3xl font-bold mt-2">{stats.averageCommissionRate}%</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-xl flex items-center justify-center">
                <Euro className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Products Table Section */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
          <div className="px-6 py-4 border-b border-white/10 bg-white/5">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Your Products</h2>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-all text-white text-sm appearance-none pl-8 pr-10"
                  >
                    <option value="all">All Status</option>
                    <option value="available">Available</option>
                    <option value="sold_out">Sold Out</option>
                    <option value="shipped">Shipped</option>
                    <option value="pending">Pending</option>
                  </select>
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <Filter className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
                <span className="text-sm text-gray-400">{filteredProducts.length} product(s)</span>
                <button
                  className="text-sm bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-all text-white"
                  onClick={() => setShowAddForm(true)}
                >
                  + Add New
                </button>
              </div>
            </div>
          </div>

          <div className="p-4">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-300 mb-2">No products found</h3>
                <p className="text-gray-400 mb-6">
                  {selectedStatus === "all" 
                    ? "Start by adding your first product!" 
                    : `No ${selectedStatus} products found.`}
                </p>
                <button
                  className="px-6 py-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg font-medium hover:from-purple-600 hover:to-blue-600 transition-all text-white"
                  onClick={() => setShowAddForm(true)}
                >
                  + Add Your First Product
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-lg p-0 overflow-hidden">
                <ProductTable
                  products={filteredProducts}
                  onEdit={setEditingProduct}
                  onDelete={handleDeleteProduct}
                />
              </div>
            )}
          </div>
        </motion.div>

        {/* Best-Selling Products Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-10"
        >
          <div className="glass-effect border-white/20 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">🔥 Best-Selling Products</h2>
              <span className="text-sm text-gray-400">Ranked by total sales</span>
            </div>

            <div className="overflow-x-auto">
              {bestSellers.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  No sales data yet. Best sellers will appear once products are sold.
                </div>
              ) : (
                <table className="min-w-full text-sm text-left text-gray-300">
                  <thead className="bg-white/5 text-gray-400 uppercase text-xs">
                    <tr>
                      <th className="px-6 py-3">Product</th>
                      <th className="px-6 py-3">Product ID</th>
                      <th className="px-6 py-3">Quantity</th>
                      <th className="px-6 py-3">Units Sold</th>
                      <th
                        className="px-6 py-3 cursor-pointer hover:text-gray-200"
                        onClick={() => handleSort("totalSales")}
                      >
                        Total Sales {sortConfig.key === "totalSales" && (sortConfig.direction === "asc" ? "▲" : "▼")}
                      </th>
                      <th
                        className="px-6 py-3 cursor-pointer hover:text-gray-200"
                        onClick={() => handleSort("avgSalesPerDay")}
                      >
                        Avg / Day {sortConfig.key === "avgSalesPerDay" && (sortConfig.direction === "asc" ? "▲" : "▼")}
                      </th>
                      <th className="px-6 py-3">Conversion</th>
                      <th className="px-6 py-3">Last Sale</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedBestSellers.map((product, index) => (
                      <tr
                        key={product.id}
                        className="border-b border-white/10 hover:bg-white/5 transition"
                      >
                        <td className="px-6 py-4 font-medium text-white">
                          {index + 1}. {product.name}
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-400">
                          {product.id}
                        </td>
                        <td className="px-6 py-4">{product.unitsSold}</td>
                        <td>{product.quantity}</td>
                        <td className="px-6 py-4 font-semibold text-green-400">
                          {product.totalSales.toFixed(2)} MAD
                        </td>
                        <td className="px-6 py-4">{product.avgSalesPerDay}</td>
                        <td className="px-6 py-4">{product.conversionRate}%</td>
                        <td className="px-6 py-4 text-xs">
                          {product.lastSaleDate
                            ? new Date(product.lastSaleDate).toLocaleDateString()
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Add Product Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-auto shadow-2xl"
          >
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Add New Product</h2>
              <button
                className="text-2xl text-gray-500 hover:text-gray-700 transition-all"
                onClick={() => setShowAddForm(false)}
              >
                X
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

      {/* Edit Product Form Modal */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-effect border-white/20 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center p-6 border-b border-white/10">
              <h2 className="text-2xl font-bold">Edit Product</h2>
              <button
                className="text-2xl text-gray-400 hover:text-white transition-all"
                onClick={() => setEditingProduct(null)}
              >
                X
              </button>
            </div>
            <div className="p-6">
              <EditProductForm
                product={editingProduct}
                onSubmit={(updates) => handleUpdateProduct(editingProduct.id, updates)}
                onCancel={() => setEditingProduct(null)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;