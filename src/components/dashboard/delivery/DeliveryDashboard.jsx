// src/components/dashboard/delivery/DeliveryDashboard.jsx - USING YOUR REAL SCHEMA
import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../../contexts/SupabaseAuthContext";
import { supabase } from "../../../lib/supabaseClient";
import { 
  Truck, 
  Package, 
  Clock, 
  CheckCircle, 
  MapPin, 
  DollarSign,
  RefreshCw,
  Phone,
  User,
  Calendar,
  AlertCircle,
  X,
  FileText,
  Home,
  Mail,
  Weight
} from "lucide-react";
import { toast } from "sonner";

const DeliveryDashboard = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [deliveryCompanyId, setDeliveryCompanyId] = useState(null);
  const [stats, setStats] = useState({
    totalDeliveries: 0,
    inTransit: 0,
    delivered: 0,
    pending: 0,
    totalEarnings: 0,
    todayEarnings: 0
  });
  const { user } = useAuth();

  // Get the delivery company ID for this user
  const getDeliveryCompanyId = useCallback(async () => {
    try {
      if (!user?.email) return null;

      // First check if user is in delivery_companies table (as per your schema)
      const { data: companyData, error: companyError } = await supabase
        .from('delivery_companies')
        .select('id, name, is_active')
        .eq('email', user.email)
        .maybeSingle();

      if (!companyError && companyData) {
        setDeliveryCompanyId(companyData.id);
        return companyData.id;
      }
      
      // If not found, check profiles table for delivery role
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, company')
        .eq('id', user.id)
        .eq('role', 'delivery')
        .maybeSingle();

      if (profileError) {
        console.log('Profile error:', profileError);
        return null;
      }
      
      if (profileData) {
        // Try to find delivery company by name from profile company field
        const { data: companyByName } = await supabase
          .from('delivery_companies')
          .select('id')
          .eq('name', profileData.company)
          .maybeSingle();
        
        if (companyByName) {
          setDeliveryCompanyId(companyByName.id);
          return companyByName.id;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error getting delivery company:', error);
      return null;
    }
  }, [user]);

  const fetchDeliveries = useCallback(async () => {
    setLoading(true);
    try {
      const companyId = await getDeliveryCompanyId();

      if (!companyId) {
        console.log('No delivery company assigned');
        setDeliveries([]);
        setLoading(false);
        return;
      }

      // Fetch orders assigned to this delivery company
      // Using your exact schema with correct foreign key relationships
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          customer_id,
          seller_id,
          status,
          product_price,
          final_customer_price,
          shipping_fee,
          shipping_city,
          shipping_address,
          carrier_tracking_code,
          delivery_notes,
          delivery_weight_kg,
          delivery_service_type,
          delivery_picked_at,
          delivery_confirmed_at,
          created_at,
          updated_at,
          profiles!orders_customer_id_fkey (
            id,
            full_name,
            email,
            phone
          )
        `)
        .eq('delivery_company_id', companyId)
        .in('status', ['ready', 'picked', 'shipped', 'in_transit', 'out_for_delivery', 'delivered'])
        .order('created_at', { ascending: false });

      if (ordersError) {
        console.error('Orders query error:', ordersError);
        throw ordersError;
      }

      // Transform the data for display
      const transformedDeliveries = (ordersData || []).map(order => {
        // Parse shipping_address if it's stored as JSONB
        const shippingAddress = order.shipping_address || {};
        const customer = order.profiles || {};
        
        // Handle shipping_address being a JSON object
        let addressText = '';
        let city = order.shipping_city || '';
        
        if (typeof shippingAddress === 'object' && shippingAddress !== null) {
          const addrParts = [];
          if (shippingAddress.address) addrParts.push(shippingAddress.address);
          if (shippingAddress.street) addrParts.push(shippingAddress.street);
          if (shippingAddress.city) {
            city = shippingAddress.city;
            addrParts.push(shippingAddress.city);
          }
          if (shippingAddress.postal_code) addrParts.push(shippingAddress.postal_code);
          addressText = addrParts.join(', ');
        }
        
        return {
          id: order.id,
          order_number: order.order_number,
          customer_name: customer?.full_name || shippingAddress?.full_name || shippingAddress?.name || 'Unknown',
          customer_phone: customer?.phone || shippingAddress?.phone || 'No phone',
          customer_email: customer?.email || shippingAddress?.email || '',
          customer_id: order.customer_id,
          seller_id: order.seller_id,
          address: addressText || shippingAddress?.address || '',
          city: city || order.shipping_city || 'Unknown',
          full_address: addressText || `${shippingAddress?.address || ''}, ${city}`.trim(),
          status: order.status,
          amount: order.final_customer_price || 0,
          product_price: order.product_price || 0,
          shipping_fee: order.shipping_fee || 0,
          weight: order.delivery_weight_kg || 1,
          service_type: order.delivery_service_type || 'standard',
          notes: order.delivery_notes || shippingAddress?.notes || '',
          tracking_code: order.carrier_tracking_code,
          picked_at: order.delivery_picked_at,
          confirmed_at: order.delivery_confirmed_at,
          created_at: order.created_at,
          updated_at: order.updated_at,
          shipping_address: shippingAddress
        };
      });

      setDeliveries(transformedDeliveries);
      
      // Calculate stats
      const totalDeliveries = transformedDeliveries.length;
      const inTransit = transformedDeliveries.filter(d => 
        ['picked', 'shipped', 'in_transit', 'out_for_delivery'].includes(d.status)
      ).length;
      const delivered = transformedDeliveries.filter(d => d.status === 'delivered').length;
      const pending = transformedDeliveries.filter(d => d.status === 'ready').length;
      
      // Calculate earnings (only delivered orders)
      const totalEarnings = transformedDeliveries
        .filter(d => d.status === 'delivered')
        .reduce((sum, d) => sum + d.amount, 0);
      
      // Today's deliveries
      const today = new Date().toISOString().split('T')[0];
      const todayDelivered = transformedDeliveries.filter(d => {
        if (d.status !== 'delivered' || !d.confirmed_at) return false;
        return d.confirmed_at.split('T')[0] === today;
      }).length;
      
      const todayEarnings = transformedDeliveries
        .filter(d => d.status === 'delivered' && d.confirmed_at?.split('T')[0] === today)
        .reduce((sum, d) => sum + d.amount, 0);

      setStats({
        totalDeliveries,
        inTransit,
        delivered,
        pending,
        totalEarnings,
        todayEarnings
      });

    } catch (error) {
      console.error('Error fetching deliveries:', error);
      toast.error('Failed to load delivery data: ' + error.message);
      setDeliveries([]);
    } finally {
      setLoading(false);
    }
  }, [getDeliveryCompanyId]);

  useEffect(() => {
    if (user) {
      fetchDeliveries();
      
      // Set up real-time subscription for order updates
      const subscription = supabase
        .channel('delivery-orders-changes')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'orders',
            filter: deliveryCompanyId ? `delivery_company_id=eq.${deliveryCompanyId}` : undefined
          },
          () => {
            fetchDeliveries();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user, fetchDeliveries, deliveryCompanyId]);

  const updateDeliveryStatus = async (orderId, newStatus) => {
    try {
      // Prepare update data based on your schema
      const updateData = {
        status: newStatus,
        updated_at: new Date().toISOString()
      };

      // Add timestamps based on status
      if (newStatus === 'picked') {
        updateData.delivery_picked_at = new Date().toISOString();
      } else if (newStatus === 'delivered') {
        updateData.delivery_confirmed_at = new Date().toISOString();
      }

      // Update in Supabase
      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);

      if (error) throw error;

      // Log to order_status_history
      const delivery = deliveries.find(d => d.id === orderId);
      await supabase
        .from('order_status_history')
        .insert({
          order_id: orderId,
          old_status: delivery?.status,
          new_status: newStatus,
          changed_by: user?.id,
          created_at: new Date().toISOString()
        });

      // Update local state
      setDeliveries(prevDeliveries => 
        prevDeliveries.map(d => 
          d.id === orderId ? { ...d, status: newStatus } : d
        )
      );

      toast.success(
        <div>
          <strong className="block">Delivery Updated</strong>
          <span className="text-sm">Order {delivery?.order_number} is now {newStatus.replace(/_/g, ' ')}</span>
        </div>
      );

    } catch (error) {
      console.error('Error updating delivery:', error);
      toast.error('Failed to update delivery status: ' + error.message);
    }
  };

  const viewOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedOrder(null);
  };

  const getStatusBadge = (status) => {
    const badges = {
      ready: {
        bg: "bg-blue-100 dark:bg-blue-900/30",
        text: "text-blue-800 dark:text-blue-400",
        label: "Ready for Pickup",
        icon: Package
      },
      picked: {
        bg: "bg-purple-100 dark:bg-purple-900/30",
        text: "text-purple-800 dark:text-purple-400",
        label: "Picked Up",
        icon: Package
      },
      shipped: {
        bg: "bg-indigo-100 dark:bg-indigo-900/30",
        text: "text-indigo-800 dark:text-indigo-400",
        label: "Shipped",
        icon: Truck
      },
      in_transit: {
        bg: "bg-yellow-100 dark:bg-yellow-900/30",
        text: "text-yellow-800 dark:text-yellow-400",
        label: "In Transit",
        icon: Clock
      },
      out_for_delivery: {
        bg: "bg-kraft-100 dark:bg-kraft-900/30",
        text: "text-kraft-800 dark:text-kraft-400",
        label: "Out for Delivery",
        icon: Truck
      },
      delivered: {
        bg: "bg-green-100 dark:bg-green-900/30",
        text: "text-green-800 dark:text-green-400",
        label: "Delivered",
        icon: CheckCircle
      },
      settled: {
        bg: "bg-gray-100 dark:bg-gray-700",
        text: "text-gray-800 dark:text-gray-300",
        label: "Settled",
        icon: CheckCircle
      },
      returned: {
        bg: "bg-red-100 dark:bg-red-900/30",
        text: "text-red-800 dark:text-red-400",
        label: "Returned",
        icon: AlertCircle
      },
      cancelled: {
        bg: "bg-red-100 dark:bg-red-900/30",
        text: "text-red-800 dark:text-red-400",
        label: "Cancelled",
        icon: AlertCircle
      }
    };

    const badge = badges[status] || badges.ready;
    const Icon = badge.icon;

    return (
      <span className={`${badge.bg} ${badge.text} px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 inline-flex`}>
        <Icon className="w-3.5 h-3.5" />
        {badge.label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid date';
    }
  };

  // If no deliveries, show this
  if (!loading && deliveries.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Truck className="w-8 h-8 text-blue-500" />
              Delivery Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              {user?.email} • No active deliveries
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
            <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
              <Package className="w-12 h-12 text-gray-400 dark:text-gray-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No Deliveries Found</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md mx-auto">
              There are no orders currently assigned to your delivery company.
            </p>
            <button
              onClick={() => fetchDeliveries()}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors inline-flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
            <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Truck className="w-8 h-8 text-blue-500" />
              Delivery Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              {user?.email} • {deliveries.length} active {deliveries.length === 1 ? 'delivery' : 'deliveries'}
            </p>
          </div>
          <button
            onClick={() => fetchDeliveries()}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm text-gray-900 dark:text-white"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Deliveries</p>
                <p className="text-3xl font-bold mt-2 text-gray-900 dark:text-white">{stats.totalDeliveries}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {stats.pending} ready for pickup
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">In Transit</p>
                <p className="text-3xl font-bold mt-2 text-gray-900 dark:text-white">{stats.inTransit}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Currently on the road
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center">
                <Truck className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Delivered</p>
                <p className="text-3xl font-bold mt-2 text-gray-900 dark:text-white">{stats.delivered}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {stats.delivered > 0 ? `${((stats.delivered / stats.totalDeliveries) * 100).toFixed(1)}% success rate` : 'No deliveries yet'}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Earnings</p>
                <p className="text-3xl font-bold mt-2 text-gray-900 dark:text-white">
                  MAD {stats.totalEarnings.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  MAD {stats.todayEarnings.toFixed(2)} today
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Deliveries Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
              <Package className="w-5 h-5" />
              Active Deliveries
            </h2>
            <span className="text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full">
              {deliveries.length} total
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full table-fixed">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="text-left p-4 text-sm font-medium text-gray-600 dark:text-gray-300 w-[16%]">Order #</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600 dark:text-gray-300 w-[20%]">Customer</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600 dark:text-gray-300 w-[14%]">City</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600 dark:text-gray-300 w-[12%]">Amount</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600 dark:text-gray-300 w-[16%]">Status</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600 dark:text-gray-300 w-[22%]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {deliveries.map(delivery => (
                  <tr key={delivery.id} className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="p-4">
                      <div className="font-medium text-gray-900 dark:text-white truncate">{delivery.order_number || 'N/A'}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">ID: {delivery.id.substring(0, 8)}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-gray-900 dark:text-white truncate">{delivery.customer_name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{delivery.customer_phone}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                        <span className="text-gray-700 dark:text-gray-300 truncate">{delivery.city}</span>
                      </div>
                    </td>
                    <td className="p-4 font-medium text-green-600 dark:text-green-400">
                      MAD {delivery.amount.toFixed(2)}
                    </td>
                    <td className="p-4">
                      {getStatusBadge(delivery.status)}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-2">
                        {delivery.status === 'ready' && (
                          <button
                            onClick={() => updateDeliveryStatus(delivery.id, 'picked')}
                            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                          >
                            Pick Up
                          </button>
                        )}
                        {(delivery.status === 'picked' || delivery.status === 'shipped') && (
                          <button
                            onClick={() => updateDeliveryStatus(delivery.id, 'in_transit')}
                            className="px-3 py-1 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
                          >
                            Start Trip
                          </button>
                        )}
                        {delivery.status === 'in_transit' && (
                          <button
                            onClick={() => updateDeliveryStatus(delivery.id, 'out_for_delivery')}
                            className="px-3 py-1 text-sm bg-kraft-500 text-white rounded hover:bg-kraft-600 transition-colors"
                          >
                            Out for Delivery
                          </button>
                        )}
                        {delivery.status === 'out_for_delivery' && (
                          <button
                            onClick={() => updateDeliveryStatus(delivery.id, 'delivered')}
                            className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                          >
                            Confirm
                          </button>
                        )}
                        <button
                          onClick={() => viewOrderDetails(delivery)}
                          className="px-3 py-1 text-sm border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          Details
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Order Details Modal */}
        {showDetailsModal && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <FileText className="w-6 h-6 text-blue-500" />
                  Order Details
                </h2>
                <button
                  onClick={closeDetailsModal}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Order Info */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-blue-600 font-medium">Order Number</p>
                      <p className="text-lg font-bold text-gray-900">{selectedOrder.order_number || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-blue-600 font-medium">Order ID</p>
                      <p className="text-sm text-gray-600 break-all">{selectedOrder.id}</p>
                    </div>
                  </div>
                </div>

                {/* Customer Information */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <User className="w-5 h-5 text-gray-500" />
                    Customer Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div>
                      <p className="text-xs text-gray-500">Name</p>
                      <p className="font-medium">{selectedOrder.customer_name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Phone</p>
                      <p className="font-medium">{selectedOrder.customer_phone}</p>
                    </div>
                    {selectedOrder.customer_email && (
                      <div className="col-span-2">
                        <p className="text-xs text-gray-500">Email</p>
                        <p className="font-medium">{selectedOrder.customer_email}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Delivery Address */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Home className="w-5 h-5 text-gray-500" />
                    Delivery Address
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="font-medium">{selectedOrder.full_address}</p>
                    <p className="text-sm text-gray-600 mt-1">City: {selectedOrder.city}</p>
                  </div>
                </div>

                {/* Order Details */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Package className="w-5 h-5 text-gray-500" />
                    Order Details
                  </h3>
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div>
                      <p className="text-xs text-gray-500">Total Amount</p>
                      <p className="font-bold text-green-600">MAD {selectedOrder.amount.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Product Price</p>
                      <p className="font-medium">MAD {selectedOrder.product_price?.toFixed(2) || '0.00'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Shipping Fee</p>
                      <p className="font-medium">MAD {selectedOrder.shipping_fee?.toFixed(2) || '0.00'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Weight</p>
                      <p className="font-medium flex items-center gap-1">
                        <Weight className="w-4 h-4" />
                        {selectedOrder.weight} kg
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500">Service Type</p>
                      <p className="font-medium capitalize">{selectedOrder.service_type}</p>
                    </div>
                  </div>
                </div>

                {/* Tracking */}
                {selectedOrder.tracking_code && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Truck className="w-5 h-5 text-gray-500" />
                      Tracking Information
                    </h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="font-mono text-sm">{selectedOrder.tracking_code}</p>
                    </div>
                  </div>
                )}

                {/* Delivery Notes */}
                {selectedOrder.notes && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-gray-500" />
                      Delivery Notes
                    </h3>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <p className="text-gray-700">{selectedOrder.notes}</p>
                    </div>
                  </div>
                )}

                {/* Timeline */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-gray-500" />
                    Timeline
                  </h3>
                  <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Order Created:</span>
                      <span className="font-medium">{formatDate(selectedOrder.created_at)}</span>
                    </div>
                    {selectedOrder.picked_at && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Picked Up:</span>
                        <span className="font-medium">{formatDate(selectedOrder.picked_at)}</span>
                      </div>
                    )}
                    {selectedOrder.confirmed_at && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Delivered:</span>
                        <span className="font-medium">{formatDate(selectedOrder.confirmed_at)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Last Updated:</span>
                      <span className="font-medium">{formatDate(selectedOrder.updated_at)}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t">
                  {selectedOrder.status === 'out_for_delivery' && (
                    <button
                      onClick={() => {
                        updateDeliveryStatus(selectedOrder.id, 'delivered');
                        closeDetailsModal();
                      }}
                      className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                    >
                      Mark as Delivered
                    </button>
                  )}
                  <button
                    onClick={closeDetailsModal}
                    className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeliveryDashboard;