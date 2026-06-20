// src/components/dashboard/dropshipper/DropshipperOrders.jsx
import { useState, useEffect } from 'react';
import { 
  Package, 
  Clock, 
  CheckCircle, 
  Truck,
  Eye,
  MapPin,
  User,
  Phone,
  DollarSign,
  RefreshCw,
  AlertCircle,
  Info
} from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';
import { toast } from 'sonner';

const DropshipperOrders = ({ dropshipperId, onUpdate }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (dropshipperId) {
      fetchOrders();
    }
  }, [dropshipperId]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      // Fixed query - removed non-existent columns
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          status,
          product_price,
          dropshipper_markup,
          dropshipper_commission_rate,
          dropshipper_commission_amount,
          dropshipper_net_earnings,
          final_customer_price,
          shipping_fee,
          shipping_city,
          shipping_address,
          ordered_at,
          created_at,
          product_id,
          products!inner (
            name,
            image_url,
            sku,
            location
          ),
          customer:customer_id (
            full_name,
            phone,
            email
          )
        `)
        .eq('dropshipper_id', dropshipperId)
        .order('ordered_at', { ascending: false });

      if (error) throw error;
      
      setOrders(data || []);
      
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      'ordered': {
        color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400',
        icon: Clock,
        label: 'Pending'
      },
      'approved': {
        color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400',
        icon: CheckCircle,
        label: 'Approved'
      },
      'ready': {
        color: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-400',
        icon: Package,
        label: 'Ready for Pickup'
      },
      'picked_up': {
        color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400',
        icon: Truck,
        label: 'Picked Up'
      },
      'in_transit': {
        color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400',
        icon: Truck,
        label: 'In Transit'
      },
      'out_for_delivery': {
        color: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-400',
        icon: Truck,
        label: 'Out for Delivery'
      },
      'delivered': {
        color: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400',
        icon: CheckCircle,
        label: 'Delivered'
      },
      'cancelled': {
        color: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400',
        icon: AlertCircle,
        label: 'Cancelled'
      },
      'returned': {
        color: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400',
        icon: AlertCircle,
        label: 'Returned'
      },
      'failed': {
        color: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400',
        icon: AlertCircle,
        label: 'Delivery Failed'
      },
      'refunded': {
        color: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300',
        icon: AlertCircle,
        label: 'Refunded'
      },
      'settled': {
        color: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400',
        icon: CheckCircle,
        label: 'Settled'
      }
    };

    const badge = badges[status] || {
      color: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300',
      icon: AlertCircle,
      label: status || 'Unknown'
    };
    const Icon = badge.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="w-3 h-3" />
        {badge.label}
      </span>
    );
  };

  const formatCurrency = (value) => {
    const num = Number(value) || 0;
    return `${num.toFixed(2)} MAD`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-MA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredOrders = statusFilter === 'all' 
    ? orders 
    : orders.filter(order => order.status === statusFilter);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading your orders...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Filter */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">My Orders</h2>
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Orders</option>
            <option value="ordered">Pending</option>
            <option value="approved">Approved</option>
            <option value="ready">Ready for Pickup</option>
            <option value="in_transit">In Transit</option>
            <option value="delivered">Delivered</option>
            <option value="returned">Returned</option>
            <option value="failed">Delivery Failed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button
            onClick={fetchOrders}
            className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
          <Package className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No orders yet</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Browse the marketplace and place your first order!
          </p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
          <Package className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No orders with status: {statusFilter}</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredOrders.map((order) => (
            <div key={order.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-md transition">
              {/* Order Header */}
              <div className="flex flex-wrap justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-mono text-sm text-gray-500 dark:text-gray-400">
                      #{order.order_number || order.id.substring(0, 8)}
                    </span>
                    {getStatusBadge(order.status)}
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {formatDate(order.ordered_at || order.created_at)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(order.final_customer_price)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Total amount</p>
                </div>
              </div>

              {/* Product Info */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg mb-4">
                <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                  {order.products?.image_url ? (
                    <img
                      src={order.products.image_url}
                      alt={order.products.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package className="w-full h-full p-3 text-gray-400 dark:text-gray-500" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">{order.products?.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">SKU: {order.products?.sku || 'N/A'}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-300">
                    <span>Qty: 1</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {order.products?.location || order.shipping_city}
                    </span>
                  </div>
                </div>
              </div>

              {/* Earnings Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Your Markup</p>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">
                    +{formatCurrency(order.dropshipper_markup)}
                  </p>
                </div>
                <div className="bg-kraft-50 dark:bg-kraft-900/20 p-3 rounded-lg">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Dealtock Fee</p>
                  <p className="text-lg font-bold text-kraft-600 dark:text-kraft-400">
                    -{formatCurrency(order.dropshipper_commission_amount)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    ({order.dropshipper_commission_rate}%)
                  </p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Your Net Profit</p>
                  <p className="text-lg font-bold text-green-700 dark:text-green-400">
                    {formatCurrency(order.dropshipper_net_earnings)}
                  </p>
                </div>
              </div>

              {/* Customer Info */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                      <User className="w-4 h-4" />
                      Customer
                    </p>
                    <p className="text-gray-900 dark:text-white">{order.customer?.full_name || 'N/A'}</p>
                    <p className="text-gray-500 dark:text-gray-400 text-xs flex items-center gap-1 mt-1">
                      <Phone className="w-3 h-3" />
                      {order.customer?.phone || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      Delivery
                    </p>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      {order.shipping_address?.address || 'N/A'}
                    </p>
                    <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                      {order.shipping_city}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-2">
                <button
                  onClick={() => setSelectedOrder(order)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium transition flex items-center justify-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  View Order Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setSelectedOrder(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Order Details</h3>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300"
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
                  <p className="font-mono font-medium text-gray-900 dark:text-white">{selectedOrder.order_number || selectedOrder.id}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
                  <div className="mt-1">{getStatusBadge(selectedOrder.status)}</div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Order Date</p>
                  <p className="text-sm text-gray-900 dark:text-white">{formatDate(selectedOrder.ordered_at || selectedOrder.created_at)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Total Amount</p>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(selectedOrder.final_customer_price)}
                  </p>
                </div>
              </div>

              {/* Product Details */}
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                <h4 className="font-semibold mb-3 text-gray-900 dark:text-white">Product</h4>
                <div className="flex gap-4">
                  <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
                    {selectedOrder.products?.image_url ? (
                      <img src={selectedOrder.products.image_url} alt={selectedOrder.products.name} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-full h-full p-3 text-gray-400 dark:text-gray-500" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedOrder.products?.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">SKU: {selectedOrder.products?.sku || 'N/A'}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      Base Price: {formatCurrency(selectedOrder.product_price)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Financial Breakdown */}
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                <h4 className="font-semibold mb-3 text-gray-900 dark:text-white">Financial Summary</h4>
                <div className="space-y-2 text-gray-900 dark:text-gray-100">
                  <div className="flex justify-between text-sm">
                    <span>Base Price:</span>
                    <span>{formatCurrency(selectedOrder.product_price)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                    <span>Your Markup:</span>
                    <span>+{formatCurrency(selectedOrder.dropshipper_markup)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-kraft-600 dark:text-kraft-400">
                    <span>Dealtock Fee ({selectedOrder.dropshipper_commission_rate}%):</span>
                    <span>-{formatCurrency(selectedOrder.dropshipper_commission_amount)}</span>
                  </div>
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2 flex justify-between font-bold">
                    <span>Your Net Profit:</span>
                    <span className="text-green-700 dark:text-green-400">{formatCurrency(selectedOrder.dropshipper_net_earnings)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span>Shipping Fee:</span>
                    <span>{formatCurrency(selectedOrder.shipping_fee)}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>Customer Total:</span>
                    <span>{formatCurrency(selectedOrder.final_customer_price)}</span>
                  </div>
                </div>
              </div>

              {/* Customer Information */}
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                <h4 className="font-semibold mb-3 text-gray-900 dark:text-white">Customer Information</h4>
                <div className="space-y-2 text-gray-900 dark:text-gray-100">
                  <p><span className="text-gray-500 dark:text-gray-400">Name:</span> {selectedOrder.customer?.full_name || 'N/A'}</p>
                  <p><span className="text-gray-500 dark:text-gray-400">Phone:</span> {selectedOrder.customer?.phone || 'N/A'}</p>
                  <p><span className="text-gray-500 dark:text-gray-400">Email:</span> {selectedOrder.customer?.email || 'N/A'}</p>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                <h4 className="font-semibold mb-3 text-gray-900 dark:text-white">Shipping Address</h4>
                <p className="text-gray-900 dark:text-white">{selectedOrder.shipping_address?.address || 'N/A'}</p>
                <p className="text-gray-600 dark:text-gray-300">{selectedOrder.shipping_city}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DropshipperOrders;