import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/SupabaseAuthContext";
import { supabase } from "../../lib/supabaseClient";
import { motion } from "framer-motion";
import AdminReturnsDashboard from "./admin/AdminReturnsDashboard";
import { 
  Package, 
  TrendingUp,  // ?? ADD THIS
  Percent,     // ?? ADD THIS
  Euro,        // ?? ADD THIS
  Filter,      // ?? OPTIONAL: if you use filter buttons
  RefreshCw    // ?? OPTIONAL: if you use refresh icon
} from "lucide-react";
import { toast } from "sonner";
import ProductTable from "./ProductTable";
import AddProductForm from "./AddProductForm";
import EditProductForm from "./EditProductForm";
import DashboardHeader from "./DashboardHeader";
import WarehouseDashboard from "./warehouse/WarehouseDashboard";


const Dashboard = () => {
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("all"); // Add this
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalSales: 0,
    totalCommission: 0,
    averageCommissionRate: 0
  });
  

  const isLoading = authLoading || productsLoading;

  // Filter products by status
  const filteredProducts = selectedStatus === "all" 
    ? products 
    : products.filter(product => product.status === selectedStatus);

  // Fetch products when user is available
  useEffect(() => {
    if (user) {
      fetchProducts();
    } else if (!authLoading) {
      setProductsLoading(false);
    }
  }, [user, authLoading]);


// New function to calculate stats from SOLD products only
const calculateStatsFromSoldProducts = (soldProducts) => {
  const totalSoldProducts = soldProducts.length;
  const totalSales = soldProducts.reduce((sum, p) => sum + (p.sale_price || 0), 0);
  const totalCommission = soldProducts.reduce((sum, p) => sum + (p.commission || 0), 0);
  const averageCommissionRate = totalSales > 0 
    ? ((totalCommission / totalSales) * 100).toFixed(1) 
    : 0;

  setStats({
    totalProducts: totalSoldProducts, // This now shows sold products count
    totalSales: totalSales,
    totalCommission: totalCommission,
    averageCommissionRate: averageCommissionRate
  });
};
const fetchProducts = async () => {
  setProductsLoading(true);
  try {
    // Fetch user's products
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
      
      // Calculate stats from ALL products
      calculateStats(productsData || []);
    }

  } catch (err) {
    console.error("Error in fetchProducts:", err);
    toast.error("Failed to load dashboard data");
  } finally {
    setProductsLoading(false);
  }
};

// Update the calculateStats function
const calculateStats = (allProducts) => {
  // Total Products = ALL products regardless of status
  const totalProducts = allProducts.length;
  
  // For sales and commissions, only count SOLD products
  const soldProducts = allProducts.filter(p => p.status === 'sold');
  const totalSales = soldProducts.reduce((sum, p) => sum + (p.sale_price || 0), 0);
  const totalCommission = soldProducts.reduce((sum, p) => sum + (p.commission || 0), 0);
  const averageCommissionRate = totalSales > 0 
    ? ((totalCommission / totalSales) * 100).toFixed(1) 
    : 0;

  setStats({
    totalProducts: totalProducts, // This should be ALL products
    totalSales: totalSales,
    totalCommission: totalCommission,
    averageCommissionRate: averageCommissionRate
  });
};



const handleAddProduct = async (productData) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .insert([{
        ...productData,
        user_id: user.id,
        status: productData.status || 'available'
      }])
      .select()
      .single();

    if (error) throw error;
    
    const updatedProducts = [data, ...products];
    setProducts(updatedProducts);
    setShowAddForm(false);
    // Recalculate stats with ALL products
    calculateStats(updatedProducts);
    
    toast.success("Product added successfully");
    return { success: true };
    
  } catch (error) {
    console.error('Error adding product:', error);
    toast.error(error.message || "Failed to add product");
    return { success: false, error: error.message };
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

    if (error) throw error;
    
    const updatedProducts = products.map(p => 
      p.id === id ? data : p
    );
    setProducts(updatedProducts);
    setEditingProduct(null);
    // Recalculate stats with ALL products
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
    // Recalculate stats with ALL products
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

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center text-gray-600">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Please log in to view your dashboard</h2>
          <p>You need to be authenticated to access your products and commission data.</p>
        </div>
      </div>
    );
  }
  

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 text-white">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-effect border-b border-white/10 sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  Product Dashboard
                </h1>
                <p className="text-sm text-gray-400">Manage your products and commissions</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg hover:bg-white/20 transition-all flex items-center gap-2"
                onClick={handleRefresh}
                disabled={productsLoading}
              >
                {productsLoading ? 'Refreshing...' : 'Refresh'}
              </button>
              <button
                className="px-6 py-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg font-medium hover:from-purple-600 hover:to-blue-600 transition-all"
                onClick={() => setShowAddForm(true)}
              >
                + Add Product
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <h2 className="text-3xl font-bold mb-2">
            Welcome back, {user.email}
          </h2>
          <p className="text-gray-300">
            Here is an overview of your products and commissions
          </p>
        </motion.div>

        {/* Stats Cards Grid - UPDATED FOR DARK THEME */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
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

          <div className="glass-effect border-white/20 rounded-xl p-6 hover:border-orange-500/50 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-300">Total Sales</p>
                <p className="text-3xl font-bold mt-2">${stats.totalSales.toFixed(2)}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="glass-effect border-white/20 rounded-xl p-6 hover:border-red-500/50 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-300">Total Commission</p>
                <p className="text-3xl font-bold mt-2">${stats.totalCommission.toFixed(2)}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Percent className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

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
       {/* Products Table Section in Dashboard.jsx */}
	   
<motion.div>
  <div className="px-6 py-4 border-b border-white/10 bg-white/5">
    <div className="flex justify-between items-center">
      <h2 className="text-xl font-bold text-white">Your Products</h2>
      <div className="flex items-center gap-4">
        {/* Status Filter Dropdown */}
        <div className="relative">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-all text-white text-sm appearance-none pl-8 pr-10"
          >
            <option value="all">All Status</option>
            <option value="available">Available</option>
            <option value="sold">Sold</option>
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

  {/* Rest of your table code remains the same */}
</motion.div>


<motion.div





>
  <div className="px-6 py-4 border-b border-white/10 bg-white/5">
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-4">
   
      </div>
    </div>
  </div>

  {/* Products Table - LIGHT BACKGROUND */}
  <div className="p-4">
    {filteredProducts.length === 0 ? (
      <div className="text-center py-12">
        <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-300 mb-2">
          No products found
        </h3>
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
switch (profile?.role) {
  case "seller":
    return <SellerDashboard />;

  case "dropshipper":
    return <DropshipperDashboard />;

  case "delivery":
    return <DeliveryDashboard />;

  case "warehouse":
    return <WarehouseDashboard />;   // ✅ NEW

  case "admin":
    return <AdminDashboard />;

  default:
    return <div>Unauthorized role</div>;
	{user.role === "admin" && (
  <>
    <Route path="/dashboard" element={<AdminDashboard />} />
    <Route path="/dashboard/returns" element={<AdminReturnsDashboard />} />
  </>
)}

}



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