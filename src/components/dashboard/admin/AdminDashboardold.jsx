// src/components/dashboard/admin/AdminDashboard.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../../../contexts/SupabaseAuthContext";
import { supabase } from "../../../lib/supabaseClient";
import { 
  TrendingUp, 
  Truck, 
  Shield, 
  Eye, 
  Percent,
  RefreshCw,
  FileText  // Add this import for the invoices icon
} from "lucide-react";
import { toast } from "sonner";

// Import section components
import OverviewSection from './components/OverviewSection';
import DeliveryCompaniesSection from './components/DeliveryCompaniesSection';
import EscrowManagementSection from './components/EscrowManagementSection';
import OrderOversightSection from './components/OrderOversightSection';
import CommissionRulesManager from './components/CommissionRulesManager';

// Import invoice components
import InvoicesList from './invoices/InvoicesList';

const TABS = {
  OVERVIEW: 'overview',
  DELIVERY: 'delivery',
  ESCROW: 'escrow',
  ORDERS: 'orders',
  COMMISSIONS: 'commissions',
  INVOICES: 'invoices'  // Add new tab
};

const AdminDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(TABS.OVERVIEW);
  const [refreshing, setRefreshing] = useState(false);
  
  // Data states
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingEscrows: 0,
    activeDeliveries: 0,
    deliveredOrders: 0,
    shippedOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    totalEscrowAmount: 0,
    codOrders: 0,
    codCollected: 0,
    totalSellers: 0,
    totalDropshippers: 0,
    // Add invoice stats
    totalInvoices: 0,
    pendingInvoices: 0,
    paidInvoices: 0,
    overdueInvoices: 0
  });
  
  const [deliveryCompanies, setDeliveryCompanies] = useState([]);
  const [escrows, setEscrows] = useState([]);
  const [orders, setOrders] = useState([]);
  const [invoices, setInvoices] = useState([]);  // Add invoices state
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Parallel data fetching with error handling
      const [
        deliveryResult, 
        escrowResult, 
        ordersResult, 
        activityResult,
        profilesResult,
        invoicesResult  // Add invoices fetch
      ] = await Promise.allSettled([
        supabase.from('delivery_companies').select('*').order('created_at', { ascending: false }),
        supabase.from('escrow_holdings')
          .select(`
            *,
            delivery_companies:delivery_company_id (id, name),
            orders:order_id (id, order_number, final_customer_price, status, payment_status, created_at)
          `)
          .order('held_at', { ascending: false }),
        supabase.from('orders')
          .select(`
            *,
            seller:profiles!seller_id (id, email, full_name),
            delivery_company:delivery_companies (id, name)
          `)
          .order('created_at', { ascending: false })
          .limit(100),
        supabase.from('admin_actions')
          .select('*, admin:admin_id (id, full_name, email)')
          .order('created_at', { ascending: false })
          .limit(10),
        supabase.from('profiles')
          .select('role')
          .in('role', ['seller', 'dropshipper']),
        supabase.from('invoices')
          .select('status')
      ]);

      // Process delivery companies
      if (deliveryResult.status === 'fulfilled') {
        setDeliveryCompanies(deliveryResult.value.data || []);
      }

      // Process escrows
      if (escrowResult.status === 'fulfilled') {
        setEscrows(escrowResult.value.data || []);
      }

      // Process orders and calculate stats
      if (ordersResult.status === 'fulfilled') {
        const ordersData = ordersResult.value.data || [];
        setOrders(ordersData);
        
        // Calculate order stats
        const pendingEscrows = escrowResult.value?.data?.filter(e => !e.released_at)?.length || 0;
        const totalEscrowAmount = escrowResult.value?.data?.reduce((sum, e) => sum + (e.amount_held || 0), 0) || 0;
        const totalRevenue = ordersData.reduce((sum, o) => sum + (o.final_customer_price || 0), 0);
        
        const ordersDelivered = ordersData.filter(o => o.status === 'delivered').length;
		const ordersShipped = ordersData.filter(o => ['shipped', 'in_transit'].includes(o.status)).length;
        const ordersPending = ordersData.filter(o => ['ordered', 'ready', 'picked'].includes(o.status)).length;
        const codOrders = ordersData.filter(o => o.payment_method === 'COD').length;
        const codCollected = ordersData.filter(o => o.cod_collection_status === 'collected').length;

        // Process invoice stats
        if (invoicesResult.status === 'fulfilled') {
          const invoicesData = invoicesResult.value.data || [];
          setInvoices(invoicesData);
          
          const totalInvoices = invoicesData.length;
          const pendingInvoices = invoicesData.filter(i => i.status === 'generated' || i.status === 'sent').length;
          const paidInvoices = invoicesData.filter(i => i.status === 'paid').length;
          const overdueInvoices = invoicesData.filter(i => i.status === 'overdue').length;

          setStats({
            totalOrders: ordersData.length,
            pendingEscrows,
            activeDeliveries: deliveryResult.value?.data?.filter(d => d.is_active).length || 0,
            deliveredOrders: ordersDelivered,
            shippedOrders: ordersShipped,
            pendingOrders: ordersPending,
            totalRevenue,
            totalEscrowAmount,
            codOrders,
            codCollected,
            totalSellers: profilesResult.status === 'fulfilled' 
              ? profilesResult.value.data?.filter(p => p.role === 'seller').length || 0 
              : 0,
            totalDropshippers: profilesResult.status === 'fulfilled' 
              ? profilesResult.value.data?.filter(p => p.role === 'dropshipper').length || 0 
              : 0,
            totalInvoices,
            pendingInvoices,
            paidInvoices,
            overdueInvoices
          });
        }
      }

      // Process activity
      if (activityResult.status === 'fulfilled') {
        setRecentActivity(activityResult.value.data || []);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const handleBulkReleaseEscrow = async (selectedIds) => {
    if (!selectedIds || selectedIds.length === 0) {
      toast.warning('No escrows selected');
      return;
    }

    if (!window.confirm(`Release ${selectedIds.length} selected escrow(s)?`)) return;

    try {
      const { error } = await supabase
        .from('escrow_holdings')
        .update({ 
          released_at: new Date().toISOString(),
          release_reason: 'bulk_released'
        })
        .in('id', selectedIds)
        .is('released_at', null);

      if (error) throw error;

      toast.success(`${selectedIds.length} escrow(s) released`);
      fetchDashboardData();
    } catch (error) {
      console.error('Bulk release error:', error);
      toast.error('Failed to release some escrows');
    }
  };

  const handleExportData = (type, data) => {
    if (!data || data.length === 0) {
      toast.warning('No data to export');
      return;
    }

    const csv = [
      Object.keys(data[0] || {}),
      ...data.map(row => Object.values(row).map(val => 
        typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val
      ))
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success(`Exported ${data.length} ${type}`);
  };

  const tabs = [
    { key: TABS.OVERVIEW, label: 'Overview', icon: TrendingUp },
    { key: TABS.ORDERS, label: 'Order Oversight', icon: Eye },
    { key: TABS.INVOICES, label: 'Invoices', icon: FileText },  // Add invoices tab
    { key: TABS.ESCROW, label: 'Escrow Management', icon: Shield },
    { key: TABS.DELIVERY, label: 'Delivery Companies', icon: Truck },
    { key: TABS.COMMISSIONS, label: 'Commissions', icon: Percent }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto"></div>
            <h2 className="mt-6 text-xl font-semibold text-gray-900">Loading Dashboard</h2>
            <p className="mt-2 text-gray-600">Preparing your admin overview...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex flex-wrap gap-4 justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-sm md:text-base text-gray-600 mt-1">
              Welcome back, {user?.user_metadata?.full_name || user?.email}
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-4 py-2 bg-white border rounded-lg hover:bg-gray-50 flex items-center gap-2 text-sm shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh All Data'}
          </button>
        </div>

        {/* Tabs Navigation */}
        <div className="flex border-b mb-6 overflow-x-auto pb-1 bg-white rounded-t-lg px-2">
          {tabs.map(tab => (
            <button
              key={tab.key}
              className={`px-4 py-3 font-medium whitespace-nowrap flex items-center gap-2 text-sm transition-all ${
                activeTab === tab.key 
                  ? 'border-b-2 border-blue-500 text-blue-600 -mb-px' 
                  : 'text-gray-500 hover:text-gray-700 hover:border-b-2 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab(tab.key)}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.key === TABS.INVOICES && stats.pendingInvoices > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                  {stats.pendingInvoices}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {activeTab === TABS.OVERVIEW && (
            <OverviewSection 
              stats={stats}
              recentActivity={recentActivity}
              onRefresh={handleRefresh}
              isLoading={refreshing}
              onTabChange={setActiveTab}
            />
          )}
          
          {activeTab === TABS.ORDERS && (
            <OrderOversightSection 
              orders={orders}
              stats={stats}
              onRefresh={fetchDashboardData}
              onExport={() => handleExportData('orders', orders)}
            />
          )}
          
          {activeTab === TABS.INVOICES && (
            <InvoicesList />
          )}
          
          {activeTab === TABS.ESCROW && (
            <EscrowManagementSection 
              escrows={escrows}
              onRefresh={fetchDashboardData}
              onBulkRelease={handleBulkReleaseEscrow}
              onExport={() => handleExportData('escrows', escrows)}
            />
          )}
          
          {activeTab === TABS.DELIVERY && (
            <DeliveryCompaniesSection 
              companies={deliveryCompanies}
              onRefresh={fetchDashboardData}
              onExport={() => handleExportData('delivery-companies', deliveryCompanies)}
            />
          )}
          
          {activeTab === TABS.COMMISSIONS && (
            <CommissionRulesManager />
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;