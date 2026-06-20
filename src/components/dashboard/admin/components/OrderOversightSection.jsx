// src/components/dashboard/admin/components/OrderOversightSection.jsx
import React, { useState, useEffect } from "react";
import { 
  Eye, 
  Package, 
  Truck, 
  CheckCircle, 
  AlertCircle,
  XCircle,
  RefreshCw,
  Search,
  Filter,
  Download,
  Calendar,
  User,
  DollarSign,
  Clock,
  MapPin,
  Phone,
  Mail
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "../../../../lib/supabaseClient";
import { formatCurrency, formatDate, formatDateTime, downloadCSV } from '../utils/helpers';

// ✅ FIXED: Match your actual database statuses from orders table
const ORDER_STATUSES = [
  'ordered', 'approved', 'processing', 'ready_for_pickup',
  'picked_up', 'in_transit', 'delivered',
  'cancelled', 'returned', 'failed', 'refunded'
];

const PAYMENT_STATUSES = ['pending', 'collected', 'paid', 'failed', 'refunded'];
const PAYMENT_METHODS = ['COD', 'card', 'bank_transfer', 'wallet'];

const OrderOversightSection = ({ orders: initialOrders, stats, onRefresh, onExport }) => {
  const [orders, setOrders] = useState(initialOrders || []);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [computedDeliveryFee, setComputedDeliveryFee] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });

  // Update orders when prop changes
  useEffect(() => {
    setOrders(initialOrders || []);
  }, [initialOrders]);

  // Look up the matching delivery_fee_rules row for the selected order's
  // destination city / weight / carrier, so admins can compare it against
  // whatever shipping_fee was actually stored on the order.
  useEffect(() => {
    if (!selectedOrder) {
      setComputedDeliveryFee(null);
      return;
    }

    const lookupFee = async () => {
      const destCity = (selectedOrder.shipping_city || '').trim().toLowerCase();
      if (!destCity) {
        setComputedDeliveryFee(null);
        return;
      }

      const { data, error } = await supabase
        .from('delivery_fee_rules')
        .select('*')
        .eq('is_active', true)
        .or(`to_city_normalized.eq.${destCity},to_city.ilike.${destCity}`)
        .order('priority', { ascending: false });

      if (error || !data || data.length === 0) {
        setComputedDeliveryFee(null);
        return;
      }

      const weight = selectedOrder.delivery_weight_kg || 1;
      const fitsWeight = (r) =>
        (r.weight_min == null || weight >= r.weight_min) &&
        (r.max_weight == null || weight <= r.max_weight);

      // Prefer a rule tied to this order's delivery company, then any
      // generic rule (no company set), then fall back to the first match.
      const companyId = selectedOrder.delivery_company_id;
      const rule = data.find(r => fitsWeight(r) && (r.delivery_company_id === companyId || r.company_id === companyId))
        || data.find(r => fitsWeight(r) && !r.delivery_company_id && !r.company_id)
        || data.find(fitsWeight)
        || data[0];

      const fee = (rule.base_fee || 0)
        + (rule.per_kg_fee || 0) * weight
        + (selectedOrder.is_cod ? (rule.cod_fee || 0) : 0);

      setComputedDeliveryFee({ fee, rule });
    };

    lookupFee();
  }, [selectedOrder]);

  // Filter and sort orders
  const filteredOrders = orders
    .filter(order => {
      // Status filter
      if (statusFilter !== 'all' && order.status !== statusFilter) return false;
      
      // Payment filter
      if (paymentFilter !== 'all' && order.payment_method !== paymentFilter) return false;
      
      // Date range filter
      if (dateRange.start && new Date(order.created_at) < new Date(dateRange.start)) return false;
      if (dateRange.end && new Date(order.created_at) > new Date(dateRange.end)) return false;
      
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const orderNumber = order.order_number?.toLowerCase() || '';
        const sellerName = order.seller?.full_name?.toLowerCase() || 
                          order.seller?.email?.toLowerCase() || '';
        const customerName = order.shipping_address?.name?.toLowerCase() || '';
        const customerPhone = order.shipping_address?.phone?.toLowerCase() || '';
        
        return orderNumber.includes(searchLower) || 
               sellerName.includes(searchLower) ||
               customerName.includes(searchLower) ||
               customerPhone.includes(searchLower);
      }
      
      return true;
    })
    .sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      
      if (sortConfig.direction === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

  // Calculate order statistics
  const orderStats = {
    total: orders.length,
    byStatus: ORDER_STATUSES.reduce((acc, status) => {
      acc[status] = orders.filter(o => o.status === status).length;
      return acc;
    }, {}),
    byPayment: PAYMENT_METHODS.reduce((acc, method) => {
      acc[method] = orders.filter(o => o.payment_method === method).length;
      return acc;
    }, {}),
    totalCOD: orders.filter(o => o.payment_method === 'COD').length,
    totalCollected: orders.filter(o => o.payment_status === 'collected').length,
    totalValue: orders.reduce((sum, o) => sum + (o.final_customer_price || 0), 0)
  };

  // ✅ FIXED: Use RPC function for status updates
  const handleStatusUpdate = async (orderId, newStatus) => {
    if (!window.confirm(`Update order status to ${newStatus}?`)) return;

    try {
      setLoading(true);
      
        const { data, error } = await supabase
      .rpc('update_order_status', {
        p_order_id: orderId,
        p_new_status: newStatus,
        p_reason: null  // Add this third parameter
      });

      if (error) {
        console.error('RPC Error:', error);
        toast.error(error.message || 'Failed to update order status');
        return;
      }

      toast.success('Order status updated successfully');
      onRefresh();
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Failed to update order status');
    } finally {
      setLoading(false);
    }
  };

  // Handle payment status update
  const handlePaymentUpdate = async (orderId, newStatus) => {
    if (!window.confirm(`Update payment status to ${newStatus}?`)) return;

    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('orders')
        .update({ 
          payment_status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;

      toast.success('Payment status updated');
      onRefresh();
    } catch (error) {
      console.error('Error updating payment:', error);
      toast.error('Failed to update payment status');
    } finally {
      setLoading(false);
    }
  };

  // Handle assign delivery company
  const handleAssignDelivery = async (orderId, companyId) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('orders')
        .update({ 
          delivery_company_id: companyId,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;

      toast.success('Delivery company assigned');
      onRefresh();
    } catch (error) {
      console.error('Error assigning delivery:', error);
      toast.error('Failed to assign delivery company');
    } finally {
      setLoading(false);
    }
  };

  // Export orders
  const handleExport = () => {
    const exportData = filteredOrders.map(o => ({
      'Order Number': o.order_number,
      'Order ID': o.id,
      'Seller': o.seller?.full_name || o.seller?.email || 'N/A',
      'Customer Name': o.shipping_address?.name || 'N/A',
      'Customer Phone': o.shipping_address?.phone || 'N/A',
      'Customer Address': o.shipping_address?.address || 'N/A',
      'City': o.shipping_city || 'N/A',
      'Amount': o.final_customer_price,
      'Payment Method': o.payment_method,
      'Payment Status': o.payment_status,
      'Order Status': o.status,
      'Delivery Company': o.delivery_company?.name || 'N/A',
      'COD Collection': o.cod_collection_status || 'N/A',
      'Created At': formatDateTime(o.created_at),
      'Updated At': formatDateTime(o.updated_at)
    }));
    
    downloadCSV(exportData, 'orders');
    toast.success('Orders exported');
  };

  const handleSort = (key) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'desc' ? 'asc' : 'desc'
    });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'desc' ? '↓' : '↑';
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'delivered':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'shipped':
      case 'in_transit':
     
        return <Truck className="w-4 h-4 text-blue-500" />;
      case 'returned':
      case 'cancelled':
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'processing':
      case 'ready_for_pickup':
        return <Package className="w-4 h-4 text-purple-500" />;
      case 'ordered':
      case 'approved':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap gap-4 justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Eye className="w-6 h-6" />
            Order Oversight
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            Monitor and manage all platform orders
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-200 flex items-center gap-2 text-sm"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={onRefresh}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-200 flex items-center gap-2 text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards - Updated with correct statuses */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Orders</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{orderStats.total}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{formatCurrency(orderStats.totalValue)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {orderStats.byStatus.ordered + orderStats.byStatus.approved}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Awaiting processing</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
  <p className="text-sm text-gray-600 dark:text-gray-400">In Transit</p>
  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
    {(orderStats.byStatus.picked_up || 0) + (orderStats.byStatus.in_transit || 0)}
  </p>
  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">On the way</p>
</div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">Delivered</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {orderStats.byStatus.delivered}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Completed orders</p>
        </div>
      </div>

      {/* Secondary Stats - Updated */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">COD Orders</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{orderStats.totalCOD}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{orderStats.totalCollected} collected</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">Returns/Failed</p>
          <p className="text-2xl font-bold text-kraft-600 dark:text-kraft-400">
            {orderStats.byStatus.returned + orderStats.byStatus.failed}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Issues to resolve</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">Cancelled/Refunded</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">
            {orderStats.byStatus.cancelled + orderStats.byStatus.refunded}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Closed orders</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 space-y-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search by order #, seller, customer, phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg w-full text-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400 dark:text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg min-w-[150px] text-sm"
            >
              <option value="all">All Status</option>
              {ORDER_STATUSES.map(status => (
                <option key={status} value={status}>
                  {status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </option>
              ))}
            </select>

            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg min-w-[150px] text-sm"
            >
              <option value="all">All Payments</option>
              {PAYMENT_METHODS.map(method => (
                <option key={method} value={method}>
                  {method === 'COD' ? 'Cash on Delivery' : method.charAt(0).toUpperCase() + method.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-sm text-gray-600 dark:text-gray-400">Date Range:</span>
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm"
          />
          <span className="text-gray-700 dark:text-gray-300">to</span>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm"
          />
          {(dateRange.start || dateRange.end) && (
            <button
              onClick={() => setDateRange({ start: '', end: '' })}
              className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="text-left p-4 font-medium text-sm text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => handleSort('order_number')}>
                  Order # {getSortIcon('order_number')}
                </th>
                <th className="text-left p-4 font-medium text-sm text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => handleSort('seller')}>
                  Seller {getSortIcon('seller')}
                </th>
                <th className="text-left p-4 font-medium text-sm text-gray-700 dark:text-gray-300">Customer</th>
                <th className="text-left p-4 font-medium text-sm text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => handleSort('final_customer_price')}>
                  Amount {getSortIcon('final_customer_price')}
                </th>
                <th className="text-left p-4 font-medium text-sm text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => handleSort('status')}>
                  Status {getSortIcon('status')}
                </th>
                <th className="text-left p-4 font-medium text-sm text-gray-700 dark:text-gray-300">Payment</th>
                <th className="text-left p-4 font-medium text-sm text-gray-700 dark:text-gray-300">Delivery</th>
                <th className="text-left p-4 font-medium text-sm text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => handleSort('created_at')}>
                  Date {getSortIcon('created_at')}
                </th>
                <th className="text-left p-4 font-medium text-sm text-gray-700 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => (
                <tr key={order.id} className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="p-4">
                    <div className="font-medium text-sm text-gray-900 dark:text-white">{order.order_number || 'N/A'}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                      {order.id.substring(0, 8)}...
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                      <span className="text-sm truncate max-w-[120px] text-gray-700 dark:text-gray-300">
                        {order.seller?.full_name || order.seller?.email || 'N/A'}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    {order.shipping_address?.name && (
                      <div className="text-sm text-gray-700 dark:text-gray-300">{order.shipping_address.name}</div>
                    )}
                    {order.shipping_address?.phone && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                        <Phone className="w-3 h-3" />
                        {order.shipping_address.phone}
                      </div>
                    )}
                    {order.shipping_city && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" />
                        {order.shipping_city}
                      </div>
                    )}
                  </td>
                  <td className="p-4 font-medium text-gray-900 dark:text-white">
                    {formatCurrency(order.final_customer_price)}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(order.status)}
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                        className="text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 dark:text-white"
                        disabled={loading}
                      >
                        {ORDER_STATUSES.map(status => (
                          <option key={status} value={status}>
                            {status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="space-y-1">
                      <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 dark:text-gray-300 rounded">
                        {order.payment_method || 'N/A'}
                      </span>
                      <select
                        value={order.payment_status || 'pending'}
                        onChange={(e) => handlePaymentUpdate(order.id, e.target.value)}
                        className="text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 w-full bg-white dark:bg-gray-700 dark:text-white"
                        disabled={loading}
                      >
                        {PAYMENT_STATUSES.map(status => (
                          <option key={status} value={status}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm text-gray-700 dark:text-gray-300">{order.delivery_company?.name || 'Unassigned'}</div>
                    {order.delivery_tracking_number && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Track: {order.delivery_tracking_number}
                      </div>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="text-sm text-gray-700 dark:text-gray-300">{formatDate(order.created_at)}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(order.created_at).toLocaleTimeString()}
                    </div>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No orders found matching your filters.</p>
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setPaymentFilter('all');
                setDateRange({ start: '', end: '' });
              }}
              className="mt-4 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
            >
              Clear all filters
            </button>
          </div>
        )}

        {filteredOrders.length > 0 && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400 flex justify-between items-center">
            <span>Showing {filteredOrders.length} of {orders.length} orders</span>
            {filteredOrders.length < orders.length && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setPaymentFilter('all');
                  setDateRange({ start: '', end: '' });
                }}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Order Details</h3>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg dark:text-gray-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Order Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Order Number</p>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedOrder.order_number || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Order ID</p>
                  <p className="text-sm font-mono text-gray-700 dark:text-gray-300">{selectedOrder.id}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Created At</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{formatDateTime(selectedOrder.created_at)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Last Updated</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{formatDateTime(selectedOrder.updated_at)}</p>
                </div>
              </div>

              {/* Amount */}
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Order Amount</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                  {formatCurrency(selectedOrder.final_customer_price)}
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 text-sm">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Product Price</p>
                    <p className="text-gray-700 dark:text-gray-300">{formatCurrency(selectedOrder.product_price || 0)}</p>
                  </div>
                  {(selectedOrder.dropshipper_markup > 0 || selectedOrder.b2c_markup > 0) && (
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Markup</p>
                      <p className="text-gray-700 dark:text-gray-300">{formatCurrency((selectedOrder.dropshipper_markup || 0) + (selectedOrder.b2c_markup || 0))}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Delivery Fee</p>
                    <p className="text-gray-700 dark:text-gray-300">{formatCurrency(selectedOrder.shipping_fee || 0)}</p>
                    {computedDeliveryFee && Math.abs(computedDeliveryFee.fee - (selectedOrder.shipping_fee || 0)) > 0.01 && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                        Rule says {formatCurrency(computedDeliveryFee.fee)} ({computedDeliveryFee.rule.carrier || 'carrier'})
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Dealtock Commission</p>
                    <p className="text-gray-700 dark:text-gray-300">{formatCurrency(selectedOrder.financials?.dealtock_commission || 0)}</p>
                  </div>
                  {selectedOrder.financials?.dropshipper_commission > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Dropshipper Commission</p>
                      <p className="text-gray-700 dark:text-gray-300">{formatCurrency(selectedOrder.financials.dropshipper_commission)}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Seller Net</p>
                    <p className="text-gray-700 dark:text-gray-300">{formatCurrency(selectedOrder.financials?.seller_net || 0)}</p>
                  </div>
                </div>
                {(() => {
                  const accounted = (selectedOrder.product_price || 0)
                    + (selectedOrder.dropshipper_markup || 0)
                    + (selectedOrder.b2c_markup || 0)
                    + (selectedOrder.shipping_fee || 0);
                  const gap = (selectedOrder.final_customer_price || 0) - accounted;
                  return Math.abs(gap) > 0.01 ? (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                      ⚠️ {formatCurrency(gap)} of the order amount isn't explained by product price + markup + delivery fee.
                    </p>
                  ) : null;
                })()}
              </div>

              {/* Parties */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Seller Information</p>
                  <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded space-y-2">
                    <p className="font-medium text-gray-900 dark:text-white">{selectedOrder.seller?.full_name || 'N/A'}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{selectedOrder.seller?.email || 'N/A'}</p>
                    {selectedOrder.seller?.phone && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">📞 {selectedOrder.seller.phone}</p>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Customer Information</p>
                  <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded space-y-2">
                    <p className="font-medium text-gray-900 dark:text-white">{selectedOrder.shipping_address?.name || 'N/A'}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{selectedOrder.customer_email || 'N/A'}</p>
                    {selectedOrder.shipping_address?.phone && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">📞 {selectedOrder.shipping_address.phone}</p>
                    )}
                    {selectedOrder.shipping_address?.address && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">📍 {selectedOrder.shipping_address.address}</p>
                    )}
                    <p className="text-sm text-gray-600 dark:text-gray-400">🏙️ {selectedOrder.shipping_city || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Delivery Info */}
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Delivery Information</p>
                <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Company</p>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedOrder.delivery_company?.name || 'Not assigned'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Tracking Number</p>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedOrder.delivery_tracking_number || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Delivery Status</p>
                    <p className="font-medium capitalize text-gray-900 dark:text-white">{selectedOrder.status?.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">COD Collection</p>
                    <p className="font-medium capitalize text-gray-900 dark:text-white">{selectedOrder.cod_collection_status || 'pending'}</p>
                  </div>
                </div>
              </div>

              {/* Payment Info */}
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Payment Information</p>
                <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Method</p>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedOrder.payment_method || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
                    <p className="font-medium capitalize text-gray-900 dark:text-white">{selectedOrder.payment_status || 'pending'}</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 flex justify-end gap-3">
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderOversightSection;