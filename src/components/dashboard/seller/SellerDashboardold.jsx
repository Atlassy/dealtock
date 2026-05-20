// src/components/dashboard/seller/SellerDashboard.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../../../contexts/SupabaseAuthContext";
import { supabase } from "../../../lib/supabaseClient";
import { motion } from "framer-motion";
import { 
  Package, 
  TrendingUp,
  Percent,
  DollarSign,
  RefreshCw,
  MapPin,
  Layers,
  AlertCircle,
  Info,
  Truck,
  Clock,
  ShoppingBag,
  BarChart3,
  Smartphone,
  Monitor,
  Target,
  Zap,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  XCircle,
  Shield,
  Wallet,
  CreditCard,
  ChevronUp,
  ChevronDown
} from "lucide-react";
import { toast } from "sonner";

// Import components
import SellerOrders from './SellerOrders';
import ProductTable from '../ProductTable';

// ============================================
// DASHBOARD SKELETON
// ============================================
const DashboardSkeleton = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 p-8">
    <div className="animate-pulse space-y-6">
      <div className="h-8 bg-gray-700/50 rounded w-1/4"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-32 bg-gray-700/30 rounded-xl"></div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-64 bg-gray-700/30 rounded-xl"></div>
        ))}
      </div>
    </div>
  </div>
);

// ============================================
// HELPER COMPONENTS
// ============================================
const StatCard = ({ title, value, icon: Icon, color = "blue", trend, trendValue, subtext }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="glass-effect border-white/20 rounded-xl p-5 hover:border-blue-500/50 transition-all duration-300"
  >
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-400">{title}</p>
        <p className="text-2xl font-bold text-white mt-1">{value}</p>
        {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
        {trend && (
          <div className={`flex items-center mt-2 text-xs ${
            trend > 0 ? 'text-green-400' : 'text-red-400'
          }`}>
            {trend > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            <span>{Math.abs(trend)}% vs last month</span>
          </div>
        )}
      </div>
      <div className={`w-10 h-10 bg-gradient-to-br from-${color}-500 to-${color}-600 rounded-lg flex items-center justify-center flex-shrink-0`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
    </div>
  </motion.div>
);

const SalesTrendChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="glass-effect border-white/20 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">📈 Sales Trend (Last 30 Days)</h3>
        <div className="h-40 flex items-center justify-center">
          <p className="text-gray-400">No sales data available</p>
        </div>
      </div>
    );
  }
  
  const maxSales = Math.max(...data.map(d => d.sales), 1);
  
  return (
    <div className="glass-effect border-white/20 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">📈 Sales Trend (Last 30 Days)</h3>
      <div className="h-40 flex items-end gap-1">
        {data.map((day, i) => (
          <div key={i} className="flex-1 flex flex-col items-center group">
            <div className="relative w-full">
              <div 
                className="bg-gradient-to-t from-blue-500 to-blue-400 hover:from-blue-600 hover:to-blue-500 transition cursor-pointer rounded-t"
                style={{ height: `${Math.max((day.sales / maxSales) * 100, 2)}px` }}
              >
                <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10">
                  {day.date}: {day.sales.toFixed(0)} MAD ({day.orders} orders)
                </div>
              </div>
            </div>
            <span className="text-xs text-gray-400 mt-2 hidden md:block">
              {day.date.slice(-5)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const CategoryProgressBar = ({ category, percentage, count, color = "blue" }) => (
  <div className="mb-3">
    <div className="flex justify-between text-sm mb-1">
      <span className="text-gray-300">{category}</span>
      <span className="text-gray-400">{count} products</span>
    </div>
    <div className="w-full bg-gray-700 rounded-full h-2">
      <div 
        className={`bg-gradient-to-r from-${color}-500 to-${color}-400 h-2 rounded-full`}
        style={{ width: `${percentage}%` }}
      ></div>
    </div>
  </div>
);

const TopListItem = ({ rank, name, value, unit, color = "blue" }) => (
  <div className="flex items-center justify-between py-2 border-b border-gray-700 last:border-0">
    <div className="flex items-center gap-3">
      <div className={`w-6 h-6 rounded-full bg-${color}-500/20 flex items-center justify-center text-xs font-bold text-${color}-400`}>
        {rank}
      </div>
      <span className="text-gray-300">{name}</span>
    </div>
    <span className="text-white font-medium">{value} {unit}</span>
  </div>
);

const DeviceBreakdown = ({ mobile, desktop }) => {
  const total = mobile + desktop;
  const mobilePercent = total > 0 ? Math.round((mobile / total) * 100) : 0;
  const desktopPercent = total > 0 ? Math.round((desktop / total) * 100) : 0;

  return (
    <div className="glass-effect border-white/20 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">📱 Device Breakdown</h3>
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-300 flex items-center gap-1">
                <Smartphone className="w-4 h-4" /> Mobile
              </span>
              <span className="text-gray-400">{mobile} orders</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-purple-500 to-purple-400 h-2 rounded-full"
                style={{ width: `${mobilePercent}%` }}
              ></div>
            </div>
          </div>
          <span className="text-white font-bold">{mobilePercent}%</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-300 flex items-center gap-1">
                <Monitor className="w-4 h-4" /> Desktop
              </span>
              <span className="text-gray-400">{desktop} orders</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-blue-400 h-2 rounded-full"
                style={{ width: `${desktopPercent}%` }}
              ></div>
            </div>
          </div>
          <span className="text-white font-bold">{desktopPercent}%</span>
        </div>
      </div>
    </div>
  );
};

// ============================================
// ESCROW TAB COMPONENT
// ============================================
const EscrowTab = ({ dashboardData, setDashboardData, sellerId }) => {
  const [escrowOrders, setEscrowOrders] = useState([]);
  const [payoutHistory, setPayoutHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEscrowDetails();
  }, [sellerId]);

  const fetchEscrowDetails = async () => {
    setLoading(true);
    try {
      // Get products
      const { data: products } = await supabase
        .from('products')
        .select('id, name')
        .eq('user_id', sellerId);

      if (!products || products.length === 0) {
        setLoading(false);
        return;
      }

      const productIds = products.map(p => p.id);

      // Get escrow orders
      const { data: orders } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          product_id,
          product_price,
          final_customer_price,
          status,
          payment_status,
          delivered_at,
          created_at,
          settlements (
            id,
            settlement_status,
            wholesaler_net,
            dealtock_commission,
            created_at
          )
        `)
        .in('product_id', productIds)
        .in('status', ['delivered', 'settled'])
        .order('delivered_at', { ascending: false });

      // Get payout history
      const { data: payouts } = await supabase
        .from('payouts')
        .select('*')
        .eq('user_id', sellerId)
        .eq('role', 'seller')
        .order('created_at', { ascending: false })
        .limit(10);

      // Map product names to orders
      const ordersWithProductNames = orders?.map(order => ({
        ...order,
        product_name: products.find(p => p.id === order.product_id)?.name || 'Unknown Product'
      })) || [];

      setEscrowOrders(ordersWithProductNames);
      setPayoutHistory(payouts || []);

      // Calculate escrow metrics
      let escrowBalance = 0;
      let availableForPayout = 0;
      let totalReleased = 0;
      let pendingEscrowCount = 0;

      orders?.forEach(order => {
        if (order.settlements && order.settlements.length > 0) {
          const settlement = order.settlements[0];
          if (settlement.settlement_status === 'completed') {
            totalReleased += order.product_price || 0;
          } else if (settlement.settlement_status === 'pending') {
            escrowBalance += order.product_price || 0;
            pendingEscrowCount++;
          }
        } else if (order.status === 'delivered') {
          escrowBalance += order.product_price || 0;
          pendingEscrowCount++;
        }
      });

      availableForPayout = escrowBalance;

      // Update dashboardData with escrow metrics
      setDashboardData(prev => ({
        ...prev,
        escrowBalance,
        availableForPayout,
        totalReleased,
        pendingEscrowCount
      }));

    } catch (error) {
      console.error('Error fetching escrow details:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value).replace('MAD', '').trim() + ' MAD';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="bg-white/5 rounded-xl p-8">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Escrow Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-effect border-white/20 rounded-xl p-5">
          <p className="text-sm text-gray-400 mb-1">Escrow Balance</p>
          <p className="text-2xl font-bold text-blue-400">{formatCurrency(dashboardData.escrowBalance || 0)}</p>
          <p className="text-xs text-gray-400 mt-1">{dashboardData.pendingEscrowCount || 0} orders pending</p>
        </div>
        
        <div className="glass-effect border-white/20 rounded-xl p-5">
          <p className="text-sm text-gray-400 mb-1">Available for Payout</p>
          <p className="text-2xl font-bold text-green-400">{formatCurrency(dashboardData.availableForPayout || 0)}</p>
          <p className="text-xs text-gray-400 mt-1">Ready to withdraw</p>
        </div>
        
        <div className="glass-effect border-white/20 rounded-xl p-5">
          <p className="text-sm text-gray-400 mb-1">Total Released</p>
          <p className="text-2xl font-bold text-purple-400">{formatCurrency(dashboardData.totalReleased || 0)}</p>
          <p className="text-xs text-gray-400 mt-1">Paid to you</p>
        </div>
      </div>

      {/* Escrow Orders Table */}
      <div className="bg-white/5 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10">
          <h3 className="text-lg font-semibold text-white">Orders in Escrow</h3>
        </div>
        
        <div className="p-4">
          {escrowOrders.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No escrow orders found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-gray-400 text-sm">
                    <th className="pb-3">Order #</th>
                    <th className="pb-3">Product</th>
                    <th className="pb-3">Amount</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Delivery Date</th>
                    <th className="pb-3">Release Date</th>
                    </tr>
                </thead>
                <tbody className="text-gray-300">
                  {escrowOrders.map((order) => {
                    const settlement = order.settlements?.[0];
                    const isReleased = order.status === 'settled' || settlement?.settlement_status === 'completed';
                    const releaseDate = settlement?.created_at;
                    
                    return (
                      <tr key={order.id} className="border-t border-white/10">
                        <td className="py-3 font-mono text-sm">{order.order_number}</td>
                        <td className="py-3">{order.product_name}</td>
                        <td className="py-3 font-medium">{formatCurrency(order.product_price)}</td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            isReleased 
                              ? 'bg-green-500/20 text-green-400' 
                              : 'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {isReleased ? 'Released' : 'Held'}
                          </span>
                        </td>
                        <td className="py-3">{formatDate(order.delivered_at)}</td>
                        <td className="py-3">{releaseDate ? formatDate(releaseDate) : '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Payout History */}
      {payoutHistory.length > 0 && (
        <div className="bg-white/5 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10">
            <h3 className="text-lg font-semibold text-white">Recent Payouts</h3>
          </div>
          
          <div className="p-4">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-gray-400 text-sm">
                    <th className="pb-3">Date</th>
                    <th className="pb-3">Amount</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Reference</th>
                  </tr>
                </thead>
                <tbody className="text-gray-300">
                  {payoutHistory.map((payout) => (
                    <tr key={payout.id} className="border-t border-white/10">
                      <td className="py-3">{formatDate(payout.created_at)}</td>
                      <td className="py-3 font-medium text-green-400">{formatCurrency(payout.amount)}</td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          payout.status === 'paid' 
                            ? 'bg-green-500/20 text-green-400' 
                            : payout.status === 'pending'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {payout.status}
                        </span>
                      </td>
                      <td className="py-3 text-sm">{payout.payout_reference || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// MAIN SELLER DASHBOARD COMPONENT
// ============================================
const SellerDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });
  const [editingProduct, setEditingProduct] = useState(null);
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    // Products
    totalActiveProducts: 0,
    topQuantityProducts: [],
    
    // Inventory Value
    totalInventoryValue: 0,
    topInventoryProducts: [],
    
    // Order Stats
    orderCounts: {
      total: 0,
      pendingApproval: 0,
      inTransit: 0,
      failed: 0,
      delivered: 0
    },
    
    // Low Stock
    lowStockProducts: [],
    
    // Financials
    netAmount: 0,
    totalCommission: 0,
    totalTurnover: 0,
    
    // Top Sold
    topSoldProducts: [],
    
    // New Metrics
    salesTrend: [],
    conversionRate: 0,
    averageOrderValue: 0,
    topCategories: [],
    deviceBreakdown: { mobile: 0, desktop: 0 },
    averageFulfillmentTime: 0,
    codSuccessRate: 0,
    totalProductViews: 0,
    
    // Escrow Metrics
    escrowBalance: 0,
    availableForPayout: 0,
    totalReleased: 0,
    pendingEscrowCount: 0
  });

  // Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('full_name, company, avatar_url, city, address, phone, subscription_tier')
          .eq('id', user.id)
          .single();
        if (data) setProfile(data);
      }
    };
    fetchProfile();
  }, [user]);

  // Fetch all data
  useEffect(() => {
    if (user) {
      fetchDashboardData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch products
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("*")
        .eq("user_id", user.id)
        .order('created_at', { ascending: false });

      if (productsError) throw productsError;

      // Fetch commission rates for each product
      const productsWithCommission = await Promise.all(
        (productsData || []).map(async (product) => {
          // Determine which applies_to to use based on seller type
          const isPremium = profile?.subscription_tier === 'premium' || false;
          const appliesTo = isPremium ? 'Pro_Seller' : 'Seller';
          
          // Get commission rule for seller based on category and price
          const { data: commissionRule } = await supabase
            .from('commission_rules')
            .select('percentage, min_amount, max_amount')
            .eq('applies_to', appliesTo)
            .eq('is_active', true)
            .eq('category', product.category || 'Other')
            .lte('min_amount', product.purchase_price || 0)
            .gte('max_amount', product.purchase_price || 0)
            .maybeSingle();
          
          let commissionRate = commissionRule?.percentage || 0;
          let commissionMinAmount = commissionRule?.min_amount;
          let commissionMaxAmount = commissionRule?.max_amount;
          
          // If no specific rule, get default for that applies_to
          if (commissionRate === 0) {
            const { data: defaultRule } = await supabase
              .from('commission_rules')
              .select('percentage')
              .eq('applies_to', appliesTo)
              .eq('is_active', true)
              .eq('is_default', true)
              .maybeSingle();
            commissionRate = defaultRule?.percentage || 0;
          }
          
          // Calculate commission amount and net amount
          const commissionAmount = (product.purchase_price || 0) * (commissionRate / 100);
          const netAmount = (product.purchase_price || 0) - commissionAmount;
          
          return {
            ...product,
            commission_rate: commissionRate,
            commission: commissionAmount,
            net_amount: netAmount,
            is_premium: isPremium,
            commission_min_amount: commissionMinAmount,
            commission_max_amount: commissionMaxAmount
          };
        })
      );

      setProducts(productsWithCommission || []);

      // Fetch orders for this seller
      const productIds = (productsData || []).map(p => p.id);
      
      if (productIds.length > 0) {
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select(`
            *,
            products!inner(name, category)
          `)
          .in('product_id', productIds);

        if (ordersError) throw ordersError;
        setOrders(ordersData || []);
        
        // Calculate all metrics
        const metrics = calculateAllMetrics(productsWithCommission || [], ordersData || []);
        setDashboardData(prev => ({
          ...prev,
          ...metrics
        }));
      } else {
        // No products, set empty metrics
        setDashboardData(prev => ({
          ...prev,
          totalActiveProducts: 0,
          topQuantityProducts: [],
          totalInventoryValue: 0,
          topInventoryProducts: [],
          orderCounts: { total: 0, pendingApproval: 0, inTransit: 0, failed: 0, delivered: 0 },
          lowStockProducts: [],
          netAmount: 0,
          totalCommission: 0,
          totalTurnover: 0,
          topSoldProducts: [],
          salesTrend: [],
          conversionRate: 0,
          averageOrderValue: 0,
          topCategories: [],
          deviceBreakdown: { mobile: 0, desktop: 0 },
          averageFulfillmentTime: 0,
          codSuccessRate: 0,
          totalProductViews: 0
        }));
      }

    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const calculateAllMetrics = (products, orders) => {
    // Filter active products
    const activeProducts = products.filter(p => 
      p.available_for_sale && p.quantity > 0 && p.status === 'available'
    );
    
    // 1. Total Active Products
    const totalActiveProducts = activeProducts.length;

    // 2. Top 5 Products by Quantity
    const topQuantityProducts = [...products]
      .sort((a, b) => (b.quantity || 0) - (a.quantity || 0))
      .slice(0, 5)
      .map(p => ({
        id: p.id,
        name: p.name,
        quantity: p.quantity || 0,
        value: (p.purchase_price || 0) * (p.quantity || 0)
      }));

    // 3. Inventory Value
    const totalInventoryValue = products.reduce(
      (sum, p) => sum + ((p.purchase_price || 0) * (p.quantity || 0)), 
      0
    );

    // 4. Top 5 Products by Inventory Value
    const topInventoryProducts = [...products]
      .sort((a, b) => 
        ((b.purchase_price || 0) * (b.quantity || 0)) - 
        ((a.purchase_price || 0) * (a.quantity || 0))
      )
      .slice(0, 5)
      .map(p => ({
        id: p.id,
        name: p.name,
        quantity: p.quantity || 0,
        value: (p.purchase_price || 0) * (p.quantity || 0)
      }));

    // 5. Order Counts by Status
    const orderCounts = {
      total: orders.length,
      pendingApproval: orders.filter(o => o.status === 'ordered' || o.status === 'ready').length,
      inTransit: orders.filter(o => ['picked', 'shipped'].includes(o.status)).length,
      failed: orders.filter(o => o.status === 'failed' || o.payment_status === 'failed').length,
      delivered: orders.filter(o => o.status === 'delivered').length
    };

    // 6. Low Stock Products (quantity <= 3)
    const lowStockProducts = products
      .filter(p => p.quantity > 0 && p.quantity <= 3 && p.available_for_sale)
      .sort((a, b) => (a.quantity || 0) - (b.quantity || 0))
      .slice(0, 5)
      .map(p => ({
        id: p.id,
        name: p.name,
        quantity: p.quantity || 0,
        threshold: 3
      }));

    // 7. Financials
    const deliveredOrders = orders.filter(o => o.status === 'delivered');
    const totalRevenue = deliveredOrders.reduce(
      (sum, o) => sum + (o.final_customer_price || 0), 
      0
    );
    
    const totalCommission = products.reduce(
      (sum, p) => sum + (p.commission || 0), 
      0
    );

    const netAmount = totalRevenue - totalCommission;

    // 8. Turnover (total purchase_price of sold products)
    const totalTurnover = deliveredOrders.reduce(
      (sum, o) => sum + ((o.product_price || 0) * (o.ordered_quantity || 1)), 
      0
    );

    // 9. Top 5 Sold Products
    const soldProductCounts = {};
    deliveredOrders.forEach(o => {
      const productId = o.product_id;
      if (!soldProductCounts[productId]) {
        soldProductCounts[productId] = {
          id: productId,
          name: o.products?.name || 'Unknown',
          quantity: 0,
          revenue: 0
        };
      }
      soldProductCounts[productId].quantity += (o.ordered_quantity || 1);
      soldProductCounts[productId].revenue += (o.final_customer_price || 0);
    });

    const topSoldProducts = Object.values(soldProductCounts)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // 10. Sales Trend (last 30 days)
    const last30Days = [...Array(30)].map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    const salesTrend = last30Days.map(date => {
      const dayOrders = deliveredOrders.filter(o => 
        o.delivered_at?.startsWith(date)
      );
      return {
        date,
        sales: dayOrders.reduce((sum, o) => sum + (o.final_customer_price || 0), 0),
        orders: dayOrders.length
      };
    });

    // 11. Conversion Rate
    const totalProductViews = products.reduce((sum, p) => sum + (p.view_count || 0), 0);
    const conversionRate = totalProductViews > 0 
      ? Number(((deliveredOrders.length / totalProductViews) * 100).toFixed(1))
      : 0;

    // 12. Average Order Value
    const averageOrderValue = deliveredOrders.length > 0
      ? totalRevenue / deliveredOrders.length
      : 0;

    // 13. Top Categories
    const categoryData = {};
    products.forEach(p => {
      if (p.category) {
        if (!categoryData[p.category]) {
          categoryData[p.category] = { count: 0, products: [] };
        }
        categoryData[p.category].count++;
        categoryData[p.category].products.push(p.id);
      }
    });

    const topCategories = Object.entries(categoryData)
      .map(([category, data]) => ({ 
        category, 
        count: data.count,
        percentage: products.length > 0 ? Math.round((data.count / products.length) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 14. Device Breakdown (simulated)
    const deviceBreakdown = {
      mobile: orders.filter((_, i) => i % 3 === 0).length,
      desktop: orders.filter((_, i) => i % 3 !== 0).length
    };

    // 15. Average Fulfillment Time (hours from order to shipped)
    const fulfilledOrders = orders.filter(o => o.shipped_at && o.ordered_at);
    const totalFulfillmentTime = fulfilledOrders.reduce((sum, o) => {
      const orderTime = new Date(o.ordered_at).getTime();
      const shipTime = new Date(o.shipped_at).getTime();
      return sum + (shipTime - orderTime) / (1000 * 60 * 60);
    }, 0);
    const averageFulfillmentTime = fulfilledOrders.length > 0
      ? Math.round(totalFulfillmentTime / fulfilledOrders.length)
      : 0;

    // 16. COD Success Rate
    const codOrders = orders.filter(o => o.payment_method === 'COD');
    const successfulCod = codOrders.filter(o => o.payment_status === 'collected');
    const codSuccessRate = codOrders.length > 0
      ? Math.round((successfulCod.length / codOrders.length) * 100)
      : 0;

    return {
      totalActiveProducts,
      topQuantityProducts,
      totalInventoryValue,
      topInventoryProducts,
      orderCounts,
      lowStockProducts,
      netAmount,
      totalCommission,
      totalTurnover,
      topSoldProducts,
      salesTrend,
      conversionRate,
      averageOrderValue,
      topCategories,
      deviceBreakdown,
      averageFulfillmentTime,
      codSuccessRate,
      totalProductViews
    };
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value).replace('MAD', '').trim() + ' MAD';
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('fr-MA').format(value);
  };

  const handleRefresh = () => {
    fetchDashboardData();
    toast.success("Dashboard refreshed");
  };

  const handleSort = (column) => {
    let direction = 'asc';
    if (sortConfig.key === column && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key: column, direction });
    
    // Sort products
    const sorted = [...products].sort((a, b) => {
      let aVal = a[column];
      let bVal = b[column];
      
      if (column === 'name') {
        aVal = aVal?.toLowerCase() || '';
        bVal = bVal?.toLowerCase() || '';
      } else if (column === 'purchase_price' || column === 'commission' || column === 'net_amount' || column === 'quantity' || column === 'commission_rate') {
        aVal = aVal || 0;
        bVal = bVal || 0;
      }
      
      if (direction === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
    
    setProducts(sorted);
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
      
      toast.success("Product deleted successfully");
      fetchDashboardData(); // Refresh all data
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error(error.message || "Failed to delete product");
    }
  };

  if (loading) return <DashboardSkeleton />;

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center text-gray-600">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Please Log In</h2>
          <p className="text-gray-500">You need to be authenticated to access your seller dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
      {/* Tab Navigation - Simplified, no duplicate header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <div className="flex gap-4 flex-wrap">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              activeTab === 'dashboard'
                ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Dashboard
          </button>
          
          <button
            onClick={() => setActiveTab('products')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              activeTab === 'products'
                ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <Package className="w-4 h-4" />
            Products
          </button>
          
          <button
            onClick={() => setActiveTab('escrow')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all relative ${
              activeTab === 'escrow'
                ? 'bg-gradient-to-r from-green-500 to-teal-500 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <Shield className="w-4 h-4" />
            Escrow
            {dashboardData.pendingEscrowCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {dashboardData.pendingEscrowCount}
              </span>
            )}
          </button>
          
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all relative ${
              activeTab === 'orders'
                ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            Orders
            {dashboardData.orderCounts.pendingApproval > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {dashboardData.orderCounts.pendingApproval}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' ? (
          <>
            {/* Key Metrics Row */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8"
            >
              <StatCard 
                title="Active Products" 
                value={formatNumber(dashboardData.totalActiveProducts)} 
                icon={Package} 
                color="blue"
                subtext={`${products.length} total products`}
              />
              <StatCard 
                title="Inventory Value" 
                value={formatCurrency(dashboardData.totalInventoryValue)} 
                icon={DollarSign} 
                color="green"
                subtext="Based on your price"
              />
              <StatCard 
                title="Total Orders" 
                value={formatNumber(dashboardData.orderCounts.total)} 
                icon={ShoppingBag} 
                color="purple"
                subtext={`${dashboardData.orderCounts.delivered} delivered`}
              />
              <StatCard 
                title="Net Revenue" 
                value={formatCurrency(dashboardData.netAmount)} 
                icon={TrendingUp} 
                color="orange"
                subtext={`${formatCurrency(dashboardData.totalCommission)} commission`}
              />
              <StatCard 
                title="Escrow Balance" 
                value={formatCurrency(dashboardData.escrowBalance)} 
                icon={Shield} 
                color="teal"
                subtext={`${dashboardData.pendingEscrowCount} orders`}
              />
            </motion.div>

            {/* Second Row - More Metrics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
            >
              <StatCard 
                title="Conversion Rate" 
                value={`${dashboardData.conversionRate}%`} 
                icon={Target} 
                color="pink"
                subtext={`${formatNumber(dashboardData.totalProductViews)} views`}
              />
              <StatCard 
                title="Avg Order Value" 
                value={formatCurrency(dashboardData.averageOrderValue)} 
                icon={Zap} 
                color="yellow"
                subtext="Per order"
              />
              <StatCard 
                title="COD Success" 
                value={`${dashboardData.codSuccessRate}%`} 
                icon={CheckCircle} 
                color="green"
                subtext="Cash on delivery"
              />
              <StatCard 
                title="Fulfillment Time" 
                value={`${dashboardData.averageFulfillmentTime}h`} 
                icon={Clock} 
                color="cyan"
                subtext="Order to shipped"
              />
            </motion.div>

            {/* Sales Trend Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-8"
            >
              <SalesTrendChart data={dashboardData.salesTrend} />
            </motion.div>

            {/* Three Column Layout for Top Lists */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Top Products by Quantity */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 }}
                className="glass-effect border-white/20 rounded-xl p-6"
              >
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-400" />
                  Top Products by Quantity
                </h3>
                <div className="space-y-1">
                  {dashboardData.topQuantityProducts.length > 0 ? (
                    dashboardData.topQuantityProducts.map((product, index) => (
                      <TopListItem 
                        key={product.id}
                        rank={index + 1}
                        name={product.name}
                        value={product.quantity}
                        unit="units"
                        color="blue"
                      />
                    ))
                  ) : (
                    <p className="text-gray-400 text-center py-4">No products found</p>
                  )}
                </div>
              </motion.div>

              {/* Top Products by Inventory Value */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="glass-effect border-white/20 rounded-xl p-6"
              >
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-400" />
                  Top by Inventory Value
                </h3>
                <div className="space-y-1">
                  {dashboardData.topInventoryProducts.length > 0 ? (
                    dashboardData.topInventoryProducts.map((product, index) => (
                      <TopListItem 
                        key={product.id}
                        rank={index + 1}
                        name={product.name}
                        value={formatCurrency(product.value)}
                        unit=""
                        color="green"
                      />
                    ))
                  ) : (
                    <p className="text-gray-400 text-center py-4">No products found</p>
                  )}
                </div>
              </motion.div>

              {/* Low Stock Warning */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 }}
                className="glass-effect border-white/20 rounded-xl p-6"
              >
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  Low Stock Alert
                </h3>
                <div className="space-y-1">
                  {dashboardData.lowStockProducts.length > 0 ? (
                    dashboardData.lowStockProducts.map((product, index) => (
                      <div key={product.id} className="flex items-center justify-between py-2 border-b border-gray-700 last:border-0">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center text-xs font-bold text-red-400">
                            {index + 1}
                          </div>
                          <span className="text-gray-300">{product.name}</span>
                        </div>
                        <span className="text-red-400 font-medium">{product.quantity} left</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400 text-center py-4">All stock levels are healthy</p>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Top Categories and Device Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Top Categories */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="glass-effect border-white/20 rounded-xl p-6"
              >
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-yellow-400" />
                  Top Categories
                </h3>
                <div className="space-y-3">
                  {dashboardData.topCategories.length > 0 ? (
                    dashboardData.topCategories.map((cat, index) => {
                      const colors = ['blue', 'purple', 'green', 'orange', 'pink'];
                      return (
                        <CategoryProgressBar 
                          key={cat.category}
                          category={cat.category}
                          percentage={cat.percentage}
                          count={cat.count}
                          color={colors[index % colors.length]}
                        />
                      );
                    })
                  ) : (
                    <p className="text-gray-400 text-center py-4">No categories found</p>
                  )}
                </div>
              </motion.div>

              {/* Device Breakdown */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.45 }}
              >
                <DeviceBreakdown 
                  mobile={dashboardData.deviceBreakdown.mobile}
                  desktop={dashboardData.deviceBreakdown.desktop}
                />
              </motion.div>
            </div>

            {/* Top Sold Products */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="glass-effect border-white/20 rounded-xl p-6 mb-8"
            >
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                Best Selling Products
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dashboardData.topSoldProducts.length > 0 ? (
                  dashboardData.topSoldProducts.map((product, index) => (
                    <div key={product.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-gray-400">#{index + 1}</span>
                        <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
                          {product.quantity} sold
                        </span>
                      </div>
                      <p className="text-white font-medium mb-1">{product.name}</p>
                      <p className="text-sm text-gray-400">Revenue: {formatCurrency(product.revenue)}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 text-center col-span-3 py-4">No sales data yet</p>
                )}
              </div>
            </motion.div>

            {/* Info Box */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
              className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Info className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-blue-400 mb-2">Business Insights</h4>
                  <p className="text-sm text-gray-300">
                    • Your conversion rate of <strong>{dashboardData.conversionRate}%</strong> means {dashboardData.totalProductViews} product views led to {dashboardData.orderCounts.delivered} sales.<br/>
                    • Average order value is <strong>{formatCurrency(dashboardData.averageOrderValue)}</strong> - {dashboardData.averageOrderValue > 500 ? 'great!' : 'consider bundling products to increase this.'}<br/>
                    • COD success rate is <strong>{dashboardData.codSuccessRate}%</strong> - {dashboardData.codSuccessRate > 90 ? 'excellent!' : 'you may want to follow up on failed deliveries.'}<br/>
                    • Your top category is <strong>{dashboardData.topCategories[0]?.category || 'N/A'}</strong> - consider adding more products in this category.<br/>
                    • You have <strong>{formatCurrency(dashboardData.escrowBalance)}</strong> in escrow across {dashboardData.pendingEscrowCount} orders.
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        ) : activeTab === 'products' ? (
          /* PRODUCTS SECTION */
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">Your Products</h2>
                <button
                  onClick={() => {}} // Add product modal trigger
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  + Add Product
                </button>
              </div>
            </div>
            <ProductTable 
              products={products}
              onEdit={setEditingProduct}
              onDelete={handleDeleteProduct}
              onSort={handleSort}
              sortConfig={sortConfig}
            />
          </div>
        ) : activeTab === 'escrow' ? (
          <EscrowTab 
            dashboardData={dashboardData} 
            setDashboardData={setDashboardData}
            sellerId={user.id} 
          />
        ) : (
          <SellerOrders sellerId={user.id} />
        )}
      </div>
    </div>
  );
};

export default SellerDashboard;