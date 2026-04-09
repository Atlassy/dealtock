// src/components/dashboard/dropshipper/DropshipperCustomersPage.jsx
import { useState, useEffect } from 'react';
import { Users, Phone, MapPin, Package, Plus, Search, Mail } from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';
import { toast } from 'sonner';

const DropshipperCustomersPage = ({ dropshipperId }) => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    fullName: '',
    email: '',
    phone: '',
    city: '',
    address: ''
  });

  useEffect(() => {
    if (dropshipperId) {
      fetchCustomers();
    }
  }, [dropshipperId]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      
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
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    
    if (!newCustomer.fullName || !newCustomer.phone) {
      toast.error('Name and phone are required');
      return;
    }

    try {
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', newCustomer.email)
        .single();

      let customerId = existingUser?.id;

      if (!customerId) {
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert([{
            email: newCustomer.email || `${newCustomer.phone}@temp.customer`,
            full_name: newCustomer.fullName,
            phone: newCustomer.phone,
            city: newCustomer.city,
            address: newCustomer.address,
            role: 'customer'
          }])
          .select()
          .single();

        if (createError) throw createError;
        customerId = newProfile.id;
      }

      toast.success('Customer added successfully');
      setShowAddCustomer(false);
      setNewCustomer({
        fullName: '',
        email: '',
        phone: '',
        city: '',
        address: ''
      });
      fetchCustomers();
    } catch (error) {
      console.error('Error adding customer:', error);
      toast.error(error.message || 'Failed to add customer');
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Customers</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your customers and their orders</p>
        </div>
        <button
          onClick={() => setShowAddCustomer(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Customer
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search customers by name, email or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Customers Grid */}
      {filteredCustomers.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No customers yet</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm ? 'No customers match your search' : 'Start adding customers to place orders for them'}
          </p>
          {!searchTerm && (
            <button
              onClick={() => setShowAddCustomer(true)}
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
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition cursor-pointer"
              onClick={() => setSelectedCustomer(customer)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{customer.full_name || 'Unnamed'}</h3>
                  <div className="space-y-1 mt-2">
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
                <p className="text-xs text-gray-400 mt-3">
                  Last order: {new Date(customer.lastOrder).toLocaleDateString()}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Customer Modal */}
      {showAddCustomer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b">
              <h3 className="text-xl font-bold">Add New Customer</h3>
            </div>
            <form onSubmit={handleAddCustomer} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newCustomer.fullName}
                  onChange={(e) => setNewCustomer({...newCustomer, fullName: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="+212 6XX XXX XXX"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email Address</label>
                <input
                  type="email"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="customer@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">City</label>
                <input
                  type="text"
                  value={newCustomer.city}
                  onChange={(e) => setNewCustomer({...newCustomer, city: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Casablanca"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Address</label>
                <textarea
                  value={newCustomer.address}
                  onChange={(e) => setNewCustomer({...newCustomer, address: e.target.value})}
                  rows="2"
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="123 Main St, Apt 4B"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddCustomer(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Details Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full">
            <div className="p-6 border-b">
              <h3 className="text-xl font-bold">Customer Details</h3>
            </div>
            <div className="p-6 space-y-3">
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
            <div className="p-6 border-t flex justify-end gap-3">
              <button
                onClick={() => setSelectedCustomer(null)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setSelectedCustomer(null);
                  // Navigate to marketplace with customer pre-selected
                  window.location.href = '/marketplace?customer=' + selectedCustomer.id;
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

export default DropshipperCustomersPage;