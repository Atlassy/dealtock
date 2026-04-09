// src/components/dashboard/dropshipper/DropshipperDashboard.jsx
import { useState, useEffect } from 'react';
import { 
  Package, 
  Users, 
  TrendingUp, 
  Clock,
  PlusCircle,
  ShoppingBag,
  DollarSign,
  Percent
} from 'lucide-react';
import { useAuth } from "../../../contexts/SupabaseAuthContext";
import { supabase } from "../../../lib/supabaseClient";
import StatCard from "./StatCard";
import MarketplaceProducts from "./MarketplaceProducts";
import DropshipperOrders from "./DropshipperOrders";
import DropshipperCustomersPage from "./DropshipperCustomersPage";
import DropshipperEarningsPage from "./DropshipperEarningsPage";
import AddCustomerModal from "./AddCustomerModal";
import PlaceOrderModal from "./PlaceOrderModal";
import { toast } from "sonner";

const DropshipperDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOrders: 0,
    grossMarkup: 0,
    dealtockFees: 0,
    netEarnings: 0,
    pendingOrders: 0,
    activeCustomers: 0,
    avgMarkup: 0,
    avgCommissionRate: 0
  });
  const [activeTab, setActiveTab] = useState('marketplace');
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [showPlaceOrder, setShowPlaceOrder] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Tabs configuration
  const tabs = [
    { id: 'marketplace', label: 'Marketplace', icon: ShoppingBag },
    { id: 'orders', label: 'My Orders', icon: Package },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'earnings', label: 'Earnings', icon: TrendingUp },
  ];

  useEffect(() => {
    if (user) {
      fetchStats();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          id,
          status,
          dropshipper_markup,
          dropshipper_commission_rate,
          dropshipper_commission_amount,
          dropshipper_net_earnings,
          customer_id
        `)
        .eq('dropshipper_id', user.id);

      if (error) throw error;

      if (orders) {
        const totalGrossMarkup = orders.reduce((sum, order) => 
          sum + (Number(order.dropshipper_markup) || 0), 0
        );
        
        const totalCommission = orders.reduce((sum, order) => 
          sum + (Number(order.dropshipper_commission_amount) || 0), 0
        );
        
        const totalNetEarnings = orders.reduce((sum, order) => 
          sum + (Number(order.dropshipper_net_earnings) || 0), 0
        );
        
        const pendingOrders = orders.filter(o => 
          ['ordered', 'approved', 'pickup_requested', 'ready_for_pickup', 
           'with_delivery_partner', 'in_transit', 'out_for_delivery'].includes(o.status)
        ).length;

        const uniqueCustomers = new Set(orders.map(o => o.customer_id).filter(Boolean)).size;

        const ordersWithMarkup = orders.filter(o => o.dropshipper_markup > 0);
        const avgMarkup = ordersWithMarkup.length > 0
          ? totalGrossMarkup / ordersWithMarkup.length
          : 0;

        const avgCommissionRate = totalGrossMarkup > 0
          ? (totalCommission / totalGrossMarkup) * 100
          : 0;

        setStats({
          totalOrders: orders.length,
          grossMarkup: totalGrossMarkup,
          dealtockFees: totalCommission,
          netEarnings: totalNetEarnings,
          pendingOrders,
          activeCustomers: uniqueCustomers,
          avgMarkup,
          avgCommissionRate
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error("Failed to load dashboard stats");
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = (product) => {
    setSelectedProduct(product);
    setShowPlaceOrder(true);
  };

  const formatCurrency = (value) => {
    const num = Number(value) || 0;
    return `${num.toFixed(2)} MAD`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Dropshipper Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Track your earnings and manage your business
          </p>
        </div>
        <button
          onClick={() => setShowAddCustomer(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusCircle className="w-5 h-5 mr-2" />
          Add Customer
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Orders"
          value={stats.totalOrders}
          icon={Package}
          color="blue"
        />
        <StatCard
          title="Gross Markup"
          value={formatCurrency(stats.grossMarkup)}
          subtitle="Before fees"
          icon={TrendingUp}
          color="green"
        />
        <StatCard
          title="Dealtock Fees"
          value={formatCurrency(stats.dealtockFees)}
          subtitle={`${stats.avgCommissionRate.toFixed(1)}% avg rate`}
          icon={Percent}
          color="orange"
        />
        <StatCard
          title="Net Earnings"
          value={formatCurrency(stats.netEarnings)}
          subtitle="After fees"
          icon={DollarSign}
          color="purple"
        />
        <StatCard
          title="Pending Orders"
          value={stats.pendingOrders}
          icon={Clock}
          color="yellow"
        />
      </div>

      {/* Secondary Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Customers</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeCustomers}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Average Markup</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.avgMarkup)}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <tab.icon className="w-5 h-5 mr-2" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'marketplace' && (
          <MarketplaceProducts onPlaceOrder={handlePlaceOrder} />
        )}
        
        {activeTab === 'orders' && (
          <DropshipperOrders 
            dropshipperId={user?.id}
            onUpdate={fetchStats}
          />
        )}
        
        {activeTab === 'customers' && (
          <DropshipperCustomersPage 
            dropshipperId={user?.id}
            onAddCustomer={() => setShowAddCustomer(true)}
            onUpdate={fetchStats}
          />
        )}
        
        {activeTab === 'earnings' && (
          <DropshipperEarningsPage 
            dropshipperId={user?.id}
            onUpdate={fetchStats}
          />
        )}
      </div>

      {/* Modals */}
      <AddCustomerModal
        isOpen={showAddCustomer}
        onClose={() => setShowAddCustomer(false)}
        onSuccess={() => {
          fetchStats();
          setActiveTab('customers');
        }}
        dropshipperId={user?.id}
      />

      {selectedProduct && (
        <PlaceOrderModal
          isOpen={showPlaceOrder}
          onClose={() => {
            setShowPlaceOrder(false);
            setSelectedProduct(null);
          }}
          product={selectedProduct}
          dropshipperId={user?.id}
          onSuccess={() => {
            fetchStats();
            setActiveTab('orders');
          }}
        />
      )}
    </div>
  );
};

export default DropshipperDashboard;