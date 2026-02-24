// src/components/dashboard/dropshipper/DropshipperOrders.jsx
import { useState, useEffect } from 'react';
import { Package, Eye, Truck, Clock, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';
import { useToast } from '../../ui/use-toast';

const DropshipperOrders = ({ dropshipperId }) => {
  const { toast } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, delivered, cancelled

  useEffect(() => {
    if (dropshipperId) {
      fetchOrders();
    }
  }, [dropshipperId, filter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('orders')
        .select(`
          id,
          order_number,
          status,
          product_price,
          dropshipper_markup,
          final_customer_price,
          shipping_fee,
          shipping_city,
          ordered_at,
          delivered_at,
          cancelled_at,
          tracking_number,
          carrier_tracking_code,
          product_id,
          products!orders_product_id_fkey (
            name,
            image_url,
            sku
          ),
          customer:customer_id (
            full_name,
            phone,
            email
          )
        `)
        .eq('dropshipper_id', dropshipperId)
        .order('ordered_at', { ascending: false });

      // Apply filter
      if (filter === 'pending') {
        query = query.in('status', ['ordered', 'ready', 'picked', 'shipped', 'in_transit', 'out_for_delivery']);
      } else if (filter === 'delivered') {
        query = query.eq('status', 'delivered');
      } else if (filter === 'cancelled') {
        query = query.eq('status', 'cancelled');
      }

      const { data, error } = await query;

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Error",
        description: "Failed to load orders",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'ordered': { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      'ready': { color: 'bg-blue-100 text-blue-800', icon: Package },
      'picked': { color: 'bg-purple-100 text-purple-800', icon: Package },
      'shipped': { color: 'bg-indigo-100 text-indigo-800', icon: Truck },
      'in_transit': { color: 'bg-indigo-100 text-indigo-800', icon: Truck },
      'out_for_delivery': { color: 'bg-orange-100 text-orange-800', icon: Truck },
      'delivered': { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      'cancelled': { color: 'bg-red-100 text-red-800', icon: XCircle }
    };
    return statusConfig[status] || { color: 'bg-gray-100 text-gray-800', icon: Package };
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="flex space-x-2">
          {['all', 'pending', 'delivered', 'cancelled'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${
                filter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      {orders.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
          <p className="text-gray-500">
            {filter === 'all' 
              ? "You haven't placed any orders yet" 
              : `No ${filter} orders found`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const statusBadge = getStatusBadge(order.status);
            const StatusIcon = statusBadge.icon;
            const profit = Number(order.dropshipper_markup) || 0;

            return (
              <div key={order.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  {/* Left side - Order Info */}
                  <div className="flex space-x-4">
                    {/* Product Image */}
                    <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      {order.products?.image_url ? (
                        <img 
                          src={order.products.image_url} 
                          alt={order.products.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <Package className="w-8 h-8" />
                        </div>
                      )}
                    </div>

                    {/* Order Details */}
                    <div>
                      <h3 className="font-semibold text-lg">{order.products?.name}</h3>
                      <p className="text-sm text-gray-600">SKU: {order.products?.sku || 'N/A'}</p>
                      <p className="text-sm text-gray-600">Order #{order.order_number}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(order.ordered_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Right side - Status & Actions */}
                  <div className="mt-4 md:mt-0 flex flex-col items-end">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusBadge.color}`}>
                      <StatusIcon className="w-4 h-4 mr-1" />
                      {order.status.replace('_', ' ')}
                    </span>
                    
                    <div className="mt-2 text-right">
                      <p className="text-sm text-gray-600">
                        Total: <span className="font-bold">{Number(order.final_customer_price).toFixed(2)} MAD</span>
                      </p>
                      <p className="text-sm text-green-600">
                        Your profit: <span className="font-bold">{profit.toFixed(2)} MAD</span>
                      </p>
                    </div>

                    {order.tracking_number && (
                      <p className="text-xs text-gray-500 mt-2">
                        Tracking: {order.tracking_number}
                      </p>
                    )}
                  </div>
                </div>

                {/* Customer Info */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Customer:</span> {order.customer?.full_name || 'N/A'} 
                    {order.customer?.phone && ` • ${order.customer.phone}`}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Shipping to:</span> {order.shipping_city}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DropshipperOrders;