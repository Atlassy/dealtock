// src/components/dashboard/seller/SellerOrders.jsx (Cleaned version - Olivraison removed)
import React, { useState, useEffect } from 'react';
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
  ExternalLink,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';
import { toast } from 'sonner';

const SellerOrders = ({ sellerId }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    if (sellerId) {
      fetchOrders();
    }
  }, [sellerId]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          products!inner (
            id,
            name,
            image_url,
            location,
            purchase_price
          ),
          dropshipper:profiles!dropshipper_id (
            full_name,
            email,
            phone
          ),
          delivery_company:delivery_companies (
            id,
            name,
            phone,
            supports_tracking
          )
        `)
        .eq('products.user_id', sellerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
      
    } catch (error) {
      console.error('Error fetching seller orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveOrder = async (orderId) => {
    setProcessingId(orderId);
    try {
      const { data, error } = await supabase.rpc('seller_approve_order', {
        p_order_id: orderId,
        p_seller_id: sellerId  // Fixed: using sellerId prop instead of user.id
      });
      
      if (error) {
        console.error('RPC Error Details:', error);
        toast.error(error.message || 'Failed to approve order');
        return;
      }
      
      if (data && data.success) {
        toast.success('Order approved successfully');
        fetchOrders(); // Refresh orders
      } else {
        toast.error(data?.error || 'Failed to approve order');
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      toast.error('An unexpected error occurred');
    } finally {
      setProcessingId(null);
    }
  };


const handleMarkReady = async (orderId) => {
  setProcessingId(orderId);
  try {
    console.log('📤 Calling seller_mark_ready with:', { orderId, sellerId });
    
    const { data, error } = await supabase.rpc('seller_mark_ready', {
      p_order_id: orderId,
      p_seller_id: sellerId
    });
    
    console.log('📥 Response:', { data, error });
    
    if (error) {
      console.error('❌ RPC Error:', error);
      toast.error(error.message || 'Failed to mark order as ready');
      return;
    }
    
    if (data && data.success) {
      toast.success('✅ Order marked as ready for pickup');
      fetchOrders(); // Refresh orders
    } else {
      console.error('❌ Function returned error:', data);
      
      // Show user-friendly message based on error code
      const errorMessages = {
        'ORDER_NOT_FOUND': 'Order not found or access denied',
        'INVALID_STATUS': data.error || 'Order cannot be marked ready at this stage',
        'UPDATE_FAILED': 'Failed to update order status'
      };
      
      toast.error(errorMessages[data.code] || data.error || 'Failed to mark order as ready');
    }
  } catch (err) {
    console.error('❌ Unexpected error:', err);
    toast.error('An unexpected error occurred');
  } finally {
    setProcessingId(null);
  }
};
  const getStatusBadge = (status) => {
    const badges = {
      'ordered': { 
        color: 'bg-yellow-100 text-yellow-800', 
        icon: Clock, 
        label: 'Pending Approval'
      },
      'approved': { 
        color: 'bg-blue-100 text-blue-800', 
        icon: CheckCircle, 
        label: 'Approved'
      },
      'ready': { 
        color: 'bg-green-100 text-green-800', 
        icon: Package, 
        label: 'Ready for Pickup'
      },
      'ready_for_pickup': { 
        color: 'bg-green-100 text-green-800', 
        icon: Package, 
        label: 'Ready for Pickup'
      },
      'picked_up': { 
        color: 'bg-indigo-100 text-indigo-800', 
        icon: Truck, 
        label: 'Picked Up'
      },
      'with_delivery_partner': { 
        color: 'bg-indigo-100 text-indigo-800', 
        icon: Truck, 
        label: 'With Delivery Partner'
      },
      'in_transit': { 
        color: 'bg-indigo-100 text-indigo-800', 
        icon: Truck, 
        label: 'In Transit'
      },
      'out_for_delivery': { 
        color: 'bg-blue-100 text-blue-800', 
        icon: Truck, 
        label: 'Out for Delivery'
      },
      'delivered': { 
        color: 'bg-green-100 text-green-800', 
        icon: CheckCircle, 
        label: 'Delivered'
      },
      'cancelled': { 
        color: 'bg-gray-100 text-gray-800', 
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

  const renderActionButtons = (order) => {
    const isProcessing = processingId === order.id;

    return (
      <div className="flex gap-2 border-t pt-3">
        {order.status === 'ordered' && (
          <button
            onClick={() => handleApproveOrder(order.id)}
            disabled={isProcessing}
            className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4" />
            )}
            Approve Order
          </button>
        )}
        
        {order.status === 'approved' && (
          <button
            onClick={() => handleMarkReady(order.id)}
            disabled={isProcessing}
            className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Package className="w-4 h-4" />
            )}
            Mark Ready for Pickup
          </button>
        )}
        
        {/* Tracking link for orders with delivery partner */}
        {order.delivery_tracking_number && (
          <a
            href={`https://partners.olivraison.com/tracking/${order.delivery_tracking_number}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium transition flex items-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            Track
          </a>
        )}
        
        <button
          onClick={() => setSelectedOrder(order)}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium transition"
        >
          <Eye className="w-4 h-4" />
        </button>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading orders...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Orders to Fulfill</h2>
        <button
          onClick={fetchOrders}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>
      
      {orders.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No orders yet</p>
          <p className="text-sm text-gray-400 mt-1">
            When dropshippers order your products, they'll appear here
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition">
              {/* Order Header */}
              <div className="flex flex-wrap gap-4 justify-between items-start mb-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-gray-500">Order #{order.order_number || order.id.substring(0, 8)}</span>
                    {getStatusBadge(order.status)}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(order.created_at).toLocaleDateString()} at {new Date(order.created_at).toLocaleTimeString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg text-green-600">{order.final_customer_price?.toFixed(2)} MAD</p>
                  <p className="text-xs text-gray-500">Total amount</p>
                </div>
              </div>

              {/* Product Info */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg mb-3">
                <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                  {order.products?.image_url ? (
                    <img src={order.products.image_url} alt={order.products.name} className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-full h-full p-2 text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{order.products?.name}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                    <span>Quantity: {order.ordered_quantity || 1}</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {order.products?.location || 'Location not set'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Customer & Delivery Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <div className="text-sm">
                  <p className="font-medium text-gray-700 mb-1 flex items-center gap-1">
                    <User className="w-4 h-4" />
                    Customer
                  </p>
                  <p className="text-gray-600">{order.shipping_address?.name || order.dropshipper?.full_name || 'N/A'}</p>
                  <p className="text-gray-500 text-xs flex items-center gap-1 mt-1">
                    <Phone className="w-3 h-3" />
                    {order.shipping_address?.phone || order.dropshipper?.phone || 'N/A'}
                  </p>
                </div>
                <div className="text-sm">
                  <p className="font-medium text-gray-700 mb-1 flex items-center gap-1">
                    <Truck className="w-4 h-4" />
                    Delivery
                  </p>
                  <p className="text-gray-600">{order.delivery_company?.name || 'Not assigned'}</p>
                  <p className="text-gray-500 text-xs mt-1">
                    To: {order.shipping_address?.city || order.city || 'N/A'}
                  </p>
                  {order.delivery_tracking_number && (
                    <p className="text-xs text-blue-600 mt-1">
                      Tracking: {order.delivery_tracking_number}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              {renderActionButtons(order)}
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
              {/* Order Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Order Number</p>
                  <p className="font-medium">{selectedOrder.order_number || selectedOrder.id.substring(0, 8)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Order Date</p>
                  <p className="font-medium">{new Date(selectedOrder.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <div className="mt-1">{getStatusBadge(selectedOrder.status)}</div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Payment Method</p>
                  <p className="font-medium">{selectedOrder.payment_method || 'COD'}</p>
                </div>
              </div>

              {/* Customer Information */}
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Customer Information
                </h4>
                <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded-lg">
                  <div>
                    <p className="text-xs text-gray-500">Name</p>
                    <p className="text-sm font-medium">{selectedOrder.shipping_address?.name || selectedOrder.dropshipper?.full_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="text-sm font-medium">{selectedOrder.shipping_address?.phone || selectedOrder.dropshipper?.phone || 'N/A'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500">Address</p>
                    <p className="text-sm font-medium">{selectedOrder.shipping_address?.address || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">City</p>
                    <p className="text-sm font-medium">{selectedOrder.shipping_address?.city || selectedOrder.city || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Product Information */}
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Product Information
                </h4>
                <div className="bg-gray-50 p-3 rounded-lg flex gap-3">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                    {selectedOrder.products?.image_url ? (
                      <img src={selectedOrder.products.image_url} alt={selectedOrder.products.name} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-full h-full p-3 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{selectedOrder.products?.name}</p>
                    <div className="grid grid-cols-3 gap-2 mt-2 text-sm">
                      <div>
                        <p className="text-xs text-gray-500">Quantity</p>
                        <p className="font-medium">{selectedOrder.ordered_quantity || 1}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Unit Price</p>
                        <p className="font-medium">{selectedOrder.product_price?.toFixed(2)} MAD</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Total</p>
                        <p className="font-medium text-green-600">{selectedOrder.final_customer_price?.toFixed(2)} MAD</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Delivery Information */}
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Truck className="w-4 h-4" />
                  Delivery Information
                </h4>
                <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded-lg">
                  <div>
                    <p className="text-xs text-gray-500">Delivery Company</p>
                    <p className="text-sm font-medium">{selectedOrder.delivery_company?.name || 'Not assigned'}</p>
                  </div>
                  {selectedOrder.delivery_tracking_number && (
                    <>
                      <div>
                        <p className="text-xs text-gray-500">Tracking Number</p>
                        <p className="text-sm font-medium">{selectedOrder.delivery_tracking_number}</p>
                      </div>
                      <div className="col-span-2">
                        <a
                          href={`https://partners.olivraison.com/tracking/${selectedOrder.delivery_tracking_number}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Track Package
                        </a>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Order Timeline */}
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Order Timeline</h4>
                <div className="space-y-2">
                  <div className="flex gap-2 text-sm">
                    <span className="text-gray-500 w-24">Created:</span>
                    <span>{new Date(selectedOrder.created_at).toLocaleString()}</span>
                  </div>
                  {selectedOrder.approved_at && (
                    <div className="flex gap-2 text-sm">
                      <span className="text-gray-500 w-24">Approved:</span>
                      <span>{new Date(selectedOrder.approved_at).toLocaleString()}</span>
                    </div>
                  )}
                  {selectedOrder.ready_at && (
                    <div className="flex gap-2 text-sm">
                      <span className="text-gray-500 w-24">Ready:</span>
                      <span>{new Date(selectedOrder.ready_at).toLocaleString()}</span>
                    </div>
                  )}
                  {selectedOrder.delivered_at && (
                    <div className="flex gap-2 text-sm">
                      <span className="text-gray-500 w-24">Delivered:</span>
                      <span>{new Date(selectedOrder.delivered_at).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerOrders;