// src/components/dashboard/dropshipper/DropshipperDashboard.jsx
import { useState, useEffect } from 'react';
import { 
  Package, 
  Users, 
  TrendingUp, 
  Clock,
  PlusCircle,
  ShoppingBag
} from 'lucide-react';
import { useAuth } from "../../../contexts/SupabaseAuthContext";
import { supabase } from "../../../lib/supabaseClient";
import DashboardLayout from "../DashboardLayout";
import StatCard from "./StatCard";
import MarketplaceProducts from "./MarketplaceProducts";
import DropshipperOrders from "./DropshipperOrders";
import CustomerList from "./CustomerList";
import Earnings from "./Earnings";
import AddCustomerModal from "./AddCustomerModal";
import PlaceOrderModal from "./PlaceOrderModal";
import { useToast } from "../../ui/use-toast";

const DropshipperDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalCommission: 0,
    pendingOrders: 0,
    activeCustomers: 0,
    avgOrderValue: 0
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
        .select('*')
        .eq('dropshipper_id', user.id);

      if (error) throw error;

      if (orders) {
        const totalCommission = orders.reduce((sum, order) => sum + (Number(order.dropshipper_markup) || 0), 0);
        const totalRevenue = orders.reduce((sum, order) => sum + (Number(order.final_customer_price) || 0), 0);
        const pendingOrders = orders.filter(o => 
          ['ordered', 'ready', 'picked', 'shipped', 'in_transit', 'out_for_delivery'].includes(o.status)
        ).length;
        const activeCustomers = new Set(orders.map(o => o.customer_id).filter(Boolean)).size;

        setStats({
          totalOrders: orders.length,
          totalRevenue,
          totalCommission,
          pendingOrders,
          activeCustomers,
          avgOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard stats",
        variant: "destructive",
      });
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
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <DashboardLayout role="dropshipper">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Dropshipper Dashboard
          </h1>
          <button
            onClick={() => setShowAddCustomer(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <PlusCircle className="w-5 h-5 mr-2" />
            Add Customer
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Orders"
            value={stats.totalOrders}
            icon={Package}
            color="blue"
          />
          <StatCard
            title="Total Revenue"
            value={formatCurrency(stats.totalRevenue)}
            icon={TrendingUp}
            color="green"
          />
          <StatCard
            title="Your Commission"
            value={formatCurrency(stats.totalCommission)}
            icon={TrendingUp}
            color="purple"
          />
          <StatCard
            title="Pending Orders"
            value={stats.pendingOrders}
            icon={Clock}
            color="yellow"
          />
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center py-4 px-1 border-b-2 font-medium text-sm
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
            <DropshipperOrders dropshipperId={user?.id} />
          )}
          
          {activeTab === 'customers' && (
            <CustomerList 
              dropshipperId={user?.id}
              onAddCustomer={() => setShowAddCustomer(true)}
            />
          )}
          
          {activeTab === 'earnings' && (
            <Earnings dropshipperId={user?.id} />
          )}
        </div>
      </div>

      {/* Modals */}
      <AddCustomerModal
        isOpen={showAddCustomer}
        onClose={() => setShowAddCustomer(false)}
        onSuccess={fetchStats}
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
    </DashboardLayout>
  );
};

export default DropshipperDashboard;