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
import { formatCurrency, formatDate, formatDateTime, downloadCSV, getStatusBadge } from '../utils/helpers';

const ORDER_STATUSES = [
  'ordered', 'ready', 'picked', 'shipped', 'in_transit', 
  'out_for_delivery', 'delivered', 'settled', 'returned', 'cancelled'
];

const PAYMENT_STATUSES = ['pending', 'collected', 'failed', 'refunded'];
const PAYMENT_METHODS = ['COD', 'card', 'bank_transfer', 'wallet'];

const OrderOversightSection = ({ orders: initialOrders, stats, onRefresh, onExport }) => {
  const [orders, setOrders] = useState(initialOrders || []);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });

  // Update orders when prop changes
  useEffect(() => {
    setOrders(initialOrders || []);
  }, [initialOrders]);

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
        const customerName = order.customer_name?.toLowerCase() || '';
        const customerPhone = order.customer_phone?.toLowerCase() || '';
        
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

  // Handle status update
  const handleStatusUpdate = async (orderId, newStatus) => {
    if (!window.confirm(`Update order status to ${newStatus}?`)) return;

    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;

      toast.success('Order status updated');
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
      'Customer Name': o.customer_name || 'N/A',
      'Customer Phone': o.customer_phone || 'N/A',
      'Customer Address': o.customer_address || 'N/A',
      'City': o.city || 'N/A',
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
      case 'settled':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'shipped':
      case 'in_transit':
      case 'out_for_delivery':
        return <Truck className="w-4 h-4 text-blue-500" />;
      case 'returned':
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap gap-4 justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Eye className="w-6 h-6" />
            Order Oversight
          </h2>
          <p className="text-gray-600 text-sm mt-1">
            Monitor and manage all platform orders
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2 text-sm"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={onRefresh}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2 text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-600">Total Orders</p>
          <p className="text-2xl font-bold">{orderStats.total}</p>
          <p className="text-xs text-gray-500 mt-1">{formatCurrency(orderStats.totalValue)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-600">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">
            {orderStats.byStatus.ordered + orderStats.byStatus.ready + orderStats.byStatus.picked}
          </p>
          <p className="text-xs text-gray-500 mt-1">Awaiting processing</p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-600">In Transit</p>
          <p className="text-2xl font-bold text-blue-600">
            {orderStats.byStatus.shipped + orderStats.byStatus.in_transit + orderStats.byStatus.out_for_delivery}
          </p>
          <p className="text-xs text-gray-500 mt-1">On the way</p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-600">Delivered</p>
          <p className="text-2xl font-bold text-green-600">
            {orderStats.byStatus.delivered + orderStats.byStatus.settled}
          </p>
          <p className="text-xs text-gray-500 mt-1">Completed orders</p>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-600">COD Orders</p>
          <p className="text-2xl font-bold">{orderStats.totalCOD}</p>
          <p className="text-xs text-gray-500 mt-1">{orderStats.totalCollected} collected</p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-600">Returns</p>
          <p className="text-2xl font-bold text-orange-600">{orderStats.byStatus.returned}</p>
          <p className="text-xs text-gray-500 mt-1">Awaiting processing</p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-600">Cancelled</p>
          <p className="text-2xl font-bold text-red-600">{orderStats.byStatus.cancelled}</p>
          <p className="text-xs text-gray-500 mt-1">Order cancelled</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border space-y-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by order #, seller, customer, phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border rounded-lg w-full text-sm"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border rounded-lg min-w-[150px] text-sm"
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
              className="px-3 py-2 border rounded-lg min-w-[150px] text-sm"
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
          <span className="text-sm text-gray-600">Date Range:</span>
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
            className="px-3 py-2 border rounded-lg text-sm"
          />
          <span>to</span>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
            className="px-3 py-2 border rounded-lg text-sm"
          />
          {(dateRange.start || dateRange.end) && (
            <button
              onClick={() => setDateRange({ start: '', end: '' })}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="text-left p-4 font-medium text-sm cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('order_number')}
                >
                  Order # {getSortIcon('order_number')}
                </th>
                <th 
                  className="text-left p-4 font-medium text-sm cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('seller')}
                >
                  Seller {getSortIcon('seller')}
                </th>
                <th className="text-left p-4 font-medium text-sm">Customer</th>
                <th 
                  className="text-left p-4 font-medium text-sm cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('final_customer_price')}
                >
                  Amount {getSortIcon('final_customer_price')}
                </th>
                <th 
                  className="text-left p-4 font-medium text-sm cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('status')}
                >
                  Status {getSortIcon('status')}
                </th>
                <th className="text-left p-4 font-medium text-sm">Payment</th>
                <th className="text-left p-4 font-medium text-sm">Delivery</th>
                <th 
                  className="text-left p-4 font-medium text-sm cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('created_at')}
                >
                  Date {getSortIcon('created_at')}
                </th>
                <th className="text-left p-4 font-medium text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => (
                <tr key={order.id} className="border-t hover:bg-gray-50">
                  <td className="p-4">
                    <div className="font-medium text-sm">{order.order_number || 'N/A'}</div>
                    <div className="text-xs text-gray-500 font-mono">
                      {order.id.substring(0, 8)}...
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3 text-gray-400" />
                      <span className="text-sm truncate max-w-[120px]">
                        {order.seller?.full_name || order.seller?.email || 'N/A'}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    {order.customer_name && (
                      <div className="text-sm">{order.customer_name}</div>
                    )}
                    {order.customer_phone && (
                      <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        <Phone className="w-3 h-3" />
                        {order.customer_phone}
                      </div>
                    )}
                    {order.city && (
                      <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" />
                        {order.city}
                      </div>
                    )}
                  </td>
                  <td className="p-4 font-medium">
                    {formatCurrency(order.final_customer_price)}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(order.status)}
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                        className="text-xs border rounded px-2 py-1 bg-white"
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
                      <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                        {order.payment_method || 'N/A'}
                      </span>
                      <select
                        value={order.payment_status || 'pending'}
                        onChange={(e) => handlePaymentUpdate(order.id, e.target.value)}
                        className="text-xs border rounded px-2 py-1 w-full"
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
                    <div className="text-sm">{order.delivery_company?.name || 'Unassigned'}</div>
                    {order.tracking_number && (
                      <div className="text-xs text-gray-500 mt-1">
                        Track: {order.tracking_number}
                      </div>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="text-sm">{formatDate(order.created_at)}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(order.created_at).toLocaleTimeString()}
                    </div>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded"
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
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No orders found matching your filters.</p>
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setPaymentFilter('all');
                setDateRange({ start: '', end: '' });
              }}
              className="mt-4 text-sm text-blue-600 hover:text-blue-800"
            >
              Clear all filters
            </button>
          </div>
        )}

        {filteredOrders.length > 0 && (
          <div className="p-4 border-t text-sm text-gray-500 flex justify-between items-center">
            <span>Showing {filteredOrders.length} of {orders.length} orders</span>
            {filteredOrders.length < orders.length && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setPaymentFilter('all');
                  setDateRange({ start: '', end: '' });
                }}
                className="text-blue-600 hover:text-blue-800"
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
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-auto">
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white">
              <h3 className="text-xl font-bold">Order Details</h3>
              <button 
                onClick={() => setSelectedOrder(null)} 
                className="p-2 hover:bg-gray-100 rounded-lg"
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
                  <p className="text-xs text-gray-500">Order Number</p>
                  <p className="font-medium">{selectedOrder.order_number || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Order ID</p>
                  <p className="text-sm font-mono">{selectedOrder.id}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Created At</p>
                  <p className="text-sm">{formatDateTime(selectedOrder.created_at)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Last Updated</p>
                  <p className="text-sm">{formatDateTime(selectedOrder.updated_at)}</p>
                </div>
              </div>

              {/* Amount */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Order Amount</p>
                <p className="text-2xl font-bold text-green-700">
                  {formatCurrency(selectedOrder.final_customer_price)}
                </p>
                <div className="grid grid-cols-3 gap-4 mt-2 text-sm">
                  <div>
                    <p className="text-xs text-gray-500">Subtotal</p>
                    <p>{formatCurrency(selectedOrder.subtotal || selectedOrder.final_customer_price)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Delivery Fee</p>
                    <p>{formatCurrency(selectedOrder.delivery_fee || 0)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Commission</p>
                    <p>{formatCurrency(selectedOrder.commission_amount || 0)}</p>
                  </div>
                </div>
              </div>

              {/* Parties */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-2">Seller Information</p>
                  <div className="bg-gray-50 p-3 rounded space-y-2">
                    <p className="font-medium">{selectedOrder.seller?.full_name || 'N/A'}</p>
                    <p className="text-sm text-gray-600">{selectedOrder.seller?.email || 'N/A'}</p>
                    {selectedOrder.seller?.phone && (
                      <p className="text-sm text-gray-600">📞 {selectedOrder.seller.phone}</p>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-2">Customer Information</p>
                  <div className="bg-gray-50 p-3 rounded space-y-2">
                    <p className="font-medium">{selectedOrder.customer_name || 'N/A'}</p>
                    {selectedOrder.customer_phone && (
                      <p className="text-sm text-gray-600">📞 {selectedOrder.customer_phone}</p>
                    )}
                    {selectedOrder.customer_address && (
                      <p className="text-sm text-gray-600">📍 {selectedOrder.customer_address}</p>
                    )}
                    <p className="text-sm text-gray-600">🏙️ {selectedOrder.city || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Delivery Info */}
              <div>
                <p className="text-xs text-gray-500 mb-2">Delivery Information</p>
                <div className="bg-gray-50 p-3 rounded grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Company</p>
                    <p className="font-medium">{selectedOrder.delivery_company?.name || 'Not assigned'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Tracking Number</p>
                    <p className="font-medium">{selectedOrder.tracking_number || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Delivery Status</p>
                    <p className="font-medium capitalize">{selectedOrder.status?.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">COD Collection</p>
                    <p className="font-medium capitalize">{selectedOrder.cod_collection_status || 'pending'}</p>
                  </div>
                </div>
              </div>

              {/* Payment Info */}
              <div>
                <p className="text-xs text-gray-500 mb-2">Payment Information</p>
                <div className="bg-gray-50 p-3 rounded grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Method</p>
                    <p className="font-medium">{selectedOrder.payment_method || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Status</p>
                    <p className="font-medium capitalize">{selectedOrder.payment_status || 'pending'}</p>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              {selectedOrder.order_status_history && (
                <div>
                  <p className="text-xs text-gray-500 mb-2">Status Timeline</p>
                  <div className="space-y-2">
                    {selectedOrder.order_status_history.slice(0, 5).map((history, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="capitalize">{history.status?.replace('_', ' ')}</span>
                        <span className="text-xs text-gray-500">
                          {formatDateTime(history.created_at)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="border-t pt-4 flex justify-end gap-3">
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    // You can add more actions here
                    toast.info('Additional actions coming soon');
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Update Order
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