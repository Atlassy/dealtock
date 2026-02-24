// src/components/dashboard/dropshipper/CustomerList.jsx
import { useState, useEffect } from 'react';
import { Users, Phone, MapPin, Package, Plus, Search, Mail } from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';
import { useToast } from '../../ui/use-toast';

const CustomerList = ({ dropshipperId, onAddCustomer }) => {
  const { toast } = useToast();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  useEffect(() => {
    if (dropshipperId) {
      fetchCustomers();
    }
  }, [dropshipperId]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      
      // Get unique customers from orders
      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          customer_id,
          customer:customer_id (
            id,
            full_name,
            email,
            phone,
            city,
            address,
            created_at
          )
        `)
        .eq('dropshipper_id', dropshipperId)
        .not('customer_id', 'is', null)
        .order('ordered_at', { ascending: false });

      if (error) throw error;

      // Deduplicate customers
      const customerMap = new Map();
      orders?.forEach(order => {
        if (order.customer && !customerMap.has(order.customer.id)) {
          customerMap.set(order.customer.id, {
            ...order.customer,
            totalOrders: 1,
            lastOrder: order.ordered_at
          });
        } else if (order.customer) {
          const existing = customerMap.get(order.customer.id);
          existing.totalOrders += 1;
          if (new Date(order.ordered_at) > new Date(existing.lastOrder)) {
            existing.lastOrder = order.ordered_at;
          }
        }
      });

      setCustomers(Array.from(customerMap.values()));
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast({
        title: "Error",
        description: "Failed to load customers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone?.includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Add Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Your Customers</h2>
        <button
          onClick={onAddCustomer}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Customer
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search customers by name, email or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Customers List */}
      {filteredCustomers.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No customers yet</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm ? 'No customers match your search' : 'Start adding customers to place orders for them'}
          </p>
          {!searchTerm && (
            <button
              onClick={onAddCustomer}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Customer
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCustomers.map((customer) => (
            <div
              key={customer.id}
              className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedCustomer(customer)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">{customer.full_name || 'Unnamed'}</h3>
                  <div className="space-y-2 mt-2">
                    {customer.email && (
                      <p className="text-sm text-gray-600 flex items-center">
                        <Mail className="w-4 h-4 mr-2 text-gray-400" />
                        {customer.email}
                      </p>
                    )}
                    {customer.phone && (
                      <p className="text-sm text-gray-600 flex items-center">
                        <Phone className="w-4 h-4 mr-2 text-gray-400" />
                        {customer.phone}
                      </p>
                    )}
                    {customer.city && (
                      <p className="text-sm text-gray-600 flex items-center">
                        <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                        {customer.city}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    <Package className="w-4 h-4 mr-1" />
                    {customer.totalOrders} {customer.totalOrders === 1 ? 'order' : 'orders'}
                  </span>
                </div>
              </div>
              {customer.lastOrder && (
                <p className="text-xs text-gray-400 mt-4">
                  Last order: {new Date(customer.lastOrder).toLocaleDateString()}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Customer Details Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6">
            <h3 className="text-xl font-bold mb-4">Customer Details</h3>
            
            <div className="space-y-3">
              <p><span className="font-medium">Name:</span> {selectedCustomer.full_name || 'N/A'}</p>
              <p><span className="font-medium">Email:</span> {selectedCustomer.email || 'N/A'}</p>
              <p><span className="font-medium">Phone:</span> {selectedCustomer.phone || 'N/A'}</p>
              <p><span className="font-medium">City:</span> {selectedCustomer.city || 'N/A'}</p>
              <p><span className="font-medium">Address:</span> {selectedCustomer.address || 'N/A'}</p>
              <p><span className="font-medium">Total Orders:</span> {selectedCustomer.totalOrders}</p>
              {selectedCustomer.lastOrder && (
                <p><span className="font-medium">Last Order:</span> {new Date(selectedCustomer.lastOrder).toLocaleDateString()}</p>
              )}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setSelectedCustomer(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setSelectedCustomer(null);
                  // You can add order placement for this customer here
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Place Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerList;