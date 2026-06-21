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
import { useTranslation } from "react-i18next";

const DropshipperDashboard = () => {
  const { t } = useTranslation();
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
    { id: 'marketplace', label: t('dropshipperDashboard.tabs.marketplace'), icon: ShoppingBag },
    { id: 'orders', label: t('dropshipperDashboard.tabs.orders'), icon: Package },
    { id: 'customers', label: t('dropshipperDashboard.tabs.customers'), icon: Users },
    { id: 'earnings', label: t('dropshipperDashboard.tabs.earnings'), icon: TrendingUp },
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
      toast.error(t('dropshipperDashboard.loadStatsFailed'));
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 dark:border-blue-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('dropshipperDashboard.title')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t('dropshipperDashboard.subtitle')}
          </p>
        </div>
        <button
          onClick={() => setShowAddCustomer(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusCircle className="w-5 h-5 mr-2" />
          {t('dropshipperDashboard.addCustomer')}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title={t('dropshipperDashboard.stats.totalOrders')}
          value={stats.totalOrders}
          icon={Package}
          color="blue"
        />
        <StatCard
          title={t('dropshipperDashboard.stats.grossMarkup')}
          value={formatCurrency(stats.grossMarkup)}
          subtitle={t('dropshipperDashboard.stats.beforeFees')}
          icon={TrendingUp}
          color="green"
        />
        <StatCard
          title={t('dropshipperDashboard.stats.dealtockFees')}
          value={formatCurrency(stats.dealtockFees)}
          subtitle={t('dropshipperDashboard.stats.avgRate', { rate: stats.avgCommissionRate.toFixed(1) })}
          icon={Percent}
          color="orange"
        />
        <StatCard
          title={t('dropshipperDashboard.stats.netEarnings')}
          value={formatCurrency(stats.netEarnings)}
          subtitle={t('dropshipperDashboard.stats.afterFees')}
          icon={DollarSign}
          color="purple"
        />
        <StatCard
          title={t('dropshipperDashboard.stats.pendingOrders')}
          value={stats.pendingOrders}
          icon={Clock}
          color="yellow"
        />
      </div>

      {/* Secondary Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('dropshipperDashboard.stats.activeCustomers')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activeCustomers}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('dropshipperDashboard.stats.averageMarkup')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(stats.avgMarkup)}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex -mb-px space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
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