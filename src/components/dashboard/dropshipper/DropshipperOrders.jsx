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
        color: 'bg-yellow-100 text-yellow-800', 
        icon: Clock, 
        label: 'Pending' 
      },
      'approved': { 
        color: 'bg-blue-100 text-blue-800', 
        icon: CheckCircle, 
        label: 'Approved' 
      },
      'pickup_requested': { 
        color: 'bg-purple-100 text-purple-800', 
        icon: Truck, 
        label: 'Pickup Requested' 
      },
      'ready_for_pickup': { 
        color: 'bg-indigo-100 text-indigo-800', 
        icon: Package, 
        label: 'Ready for Pickup' 
      },
      'with_delivery_partner': { 
        color: 'bg-purple-100 text-purple-800', 
        icon: Truck, 
        label: 'With Courier' 
      },
      'in_transit': { 
        color: 'bg-blue-100 text-blue-800', 
        icon: Truck, 
        label: 'In Transit' 
      },
      'out_for_delivery': { 
        color: 'bg-indigo-100 text-indigo-800', 
        icon: Truck, 
        label: 'Out for Delivery' 
      },
      'delivered': { 
        color: 'bg-green-100 text-green-800', 
        icon: CheckCircle, 
        label: 'Delivered' 
      },
      'cancelled': { 
        color: 'bg-red-100 text-red-800', 
        icon: AlertCircle, 
        label: 'Cancelled' 
      }
    };
    
    const badge = badges[status] || badges.ordered;
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading your orders...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Filter */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">My Orders</h2>
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Orders</option>
            <option value="ordered">Pending</option>
            <option value="approved">Approved</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button
            onClick={fetchOrders}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No orders yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Browse the marketplace and place your first order!
          </p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No orders with status: {statusFilter}</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredOrders.map((order) => (
            <div key={order.id} className="bg-white rounded-lg shadow p-6 hover:shadow-md transition">
              {/* Order Header */}
              <div className="flex flex-wrap justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-mono text-sm text-gray-500">
                      #{order.order_number || order.id.substring(0, 8)}
                    </span>
                    {getStatusBadge(order.status)}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatDate(order.ordered_at || order.created_at)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-600">
                    {formatCurrency(order.final_customer_price)}
                  </p>
                  <p className="text-xs text-gray-500">Total amount</p>
                </div>
              </div>

              {/* Product Info */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg mb-4">
                <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                  {order.products?.image_url ? (
                    <img 
                      src={order.products.image_url} 
                      alt={order.products.name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package className="w-full h-full p-3 text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{order.products?.name}</p>
                  <p className="text-sm text-gray-500">SKU: {order.products?.sku || 'N/A'}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
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
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Your Markup</p>
                  <p className="text-lg font-bold text-green-600">
                    +{formatCurrency(order.dropshipper_markup)}
                  </p>
                </div>
                <div className="bg-kraft-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Dealtock Fee</p>
                  <p className="text-lg font-bold text-kraft-600">
                    -{formatCurrency(order.dropshipper_commission_amount)}
                  </p>
                  <p className="text-xs text-gray-500">
                    ({order.dropshipper_commission_rate}%)
                  </p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Your Net Profit</p>
                  <p className="text-lg font-bold text-green-700">
                    {formatCurrency(order.dropshipper_net_earnings)}
                  </p>
                </div>
              </div>

              {/* Customer Info */}
              <div className="border-t pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-gray-700 mb-2 flex items-center gap-1">
                      <User className="w-4 h-4" />
                      Customer
                    </p>
                    <p className="text-gray-900">{order.customer?.full_name || 'N/A'}</p>
                    <p className="text-gray-500 text-xs flex items-center gap-1 mt-1">
                      <Phone className="w-3 h-3" />
                      {order.customer?.phone || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700 mb-2 flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      Delivery
                    </p>
                    <p className="text-gray-600 text-sm">
                      {order.shipping_address?.address || 'N/A'}
                    </p>
                    <p className="text-gray-500 text-xs mt-1">
                      {order.shipping_city}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="border-t pt-4 mt-2">
                <button
                  onClick={() => setSelectedOrder(order)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium transition flex items-center justify-center gap-2"
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
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
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
                  <p className="font-mono font-medium">{selectedOrder.order_number || selectedOrder.id}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Status</p>
                  <div className="mt-1">{getStatusBadge(selectedOrder.status)}</div>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Order Date</p>
                  <p className="text-sm">{formatDate(selectedOrder.ordered_at || selectedOrder.created_at)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total Amount</p>
                  <p className="text-lg font-bold text-green-600">
                    {formatCurrency(selectedOrder.final_customer_price)}
                  </p>
                </div>
              </div>

              {/* Product Details */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-3">Product</h4>
                <div className="flex gap-4">
                  <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden">
                    {selectedOrder.products?.image_url ? (
                      <img src={selectedOrder.products.image_url} alt={selectedOrder.products.name} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-full h-full p-3 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{selectedOrder.products?.name}</p>
                    <p className="text-sm text-gray-600">SKU: {selectedOrder.products?.sku || 'N/A'}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Base Price: {formatCurrency(selectedOrder.product_price)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Financial Breakdown */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-3">Financial Summary</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Base Price:</span>
                    <span>{formatCurrency(selectedOrder.product_price)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Your Markup:</span>
                    <span>+{formatCurrency(selectedOrder.dropshipper_markup)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-kraft-600">
                    <span>Dealtock Fee ({selectedOrder.dropshipper_commission_rate}%):</span>
                    <span>-{formatCurrency(selectedOrder.dropshipper_commission_amount)}</span>
                  </div>
                  <div className="border-t pt-2 mt-2 flex justify-between font-bold">
                    <span>Your Net Profit:</span>
                    <span className="text-green-700">{formatCurrency(selectedOrder.dropshipper_net_earnings)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600 pt-2 border-t">
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
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-3">Customer Information</h4>
                <div className="space-y-2">
                  <p><span className="text-gray-500">Name:</span> {selectedOrder.customer?.full_name || 'N/A'}</p>
                  <p><span className="text-gray-500">Phone:</span> {selectedOrder.customer?.phone || 'N/A'}</p>
                  <p><span className="text-gray-500">Email:</span> {selectedOrder.customer?.email || 'N/A'}</p>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-3">Shipping Address</h4>
                <p className="text-gray-900">{selectedOrder.shipping_address?.address || 'N/A'}</p>
                <p className="text-gray-600">{selectedOrder.shipping_city}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DropshipperOrders;