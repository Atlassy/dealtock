// src/components/dashboard/dropshipper/PlaceOrderModal.jsx
import { useState, useEffect } from 'react';
import { X, User, MapPin, Package, CreditCard } from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient'; // Fixed path
import { useToast } from '../../ui/use-toast'; // Using your local toast instead of react-hot-toast


const PlaceOrderModal = ({ isOpen, onClose, product, dropshipperId, onSuccess }) => {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [newCustomer, setNewCustomer] = useState(false);
  const [markup, setMarkup] = useState(20);
  const [loading, setLoading] = useState(false);
  const [shippingAddress, setShippingAddress] = useState({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    notes: ''
  });

  useEffect(() => {
    if (isOpen && dropshipperId) {
      fetchCustomers();
    }
  }, [isOpen, dropshipperId]);

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_dropshipper_customers', { 
          p_dropshipper_id: dropshipperId 
        });

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const calculatePrices = () => {
    const basePrice = product.purchase_price;
    const markupAmount = (basePrice * markup) / 100;
    const subtotal = basePrice + markupAmount;
    
    // Get shipping fee (you'll need to implement this)
    const shippingFee = 25; // Placeholder
    const total = subtotal + shippingFee;

    return {
      basePrice,
      markupAmount,
      subtotal,
      shippingFee,
      total,
      profit: markupAmount
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedCustomer && !newCustomer) {
      toast.error('Please select or add a customer');
      return;
    }

    setLoading(true);
    try {
      const prices = calculatePrices();
      
      // If new customer, create them first
      let customerId = selectedCustomer?.customer_id;
      
      if (newCustomer) {
        const { data: newUser, error: createError } = await supabase
          .from('profiles')
          .insert([{
            email: `${shippingAddress.phone}@temp.customer`, // Temporary email
            full_name: shippingAddress.fullName,
            phone: shippingAddress.phone,
            city: shippingAddress.city,
            address: shippingAddress.address,
            role: 'customer'
          }])
          .select()
          .single();

        if (createError) throw createError;
        customerId = newUser.id;
      }

      // Place order
      const { data, error } = await supabase
        .rpc('place_dropshipper_order', {
          p_product_id: product.id,
          p_quantity: 1,
          p_dropshipper_id: dropshipperId,
          p_customer_id: customerId,
          p_markup: prices.markupAmount,
          p_shipping_address: shippingAddress,
          p_shipping_city: shippingAddress.city || product.location
        });

      if (error) throw error;

      if (data.success) {
        toast.success(`Order placed! Your profit: ${prices.profit} MAD`);
        onSuccess();
        onClose();
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      console.error('Error placing order:', error);
      toast.error('Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const prices = calculatePrices();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold">Place Order for Customer</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Product Summary */}
          <div className="bg-gray-50 p-4 rounded-lg flex space-x-4">
            <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
              {product.image_url ? (
                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover rounded-lg" />
              ) : (
                <Package className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <div>
              <h3 className="font-semibold">{product.name}</h3>
              <p className="text-sm text-gray-600">Seller: {product.seller_name}</p>
              <p className="text-sm text-gray-600">Location: {product.location}</p>
            </div>
          </div>

          {/* Customer Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Customer
            </label>
            <div className="space-y-2">
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                onChange={(e) => {
                  if (e.target.value === 'new') {
                    setNewCustomer(true);
                    setSelectedCustomer(null);
                  } else {
                    const customer = customers.find(c => c.customer_id === e.target.value);
                    setSelectedCustomer(customer);
                    setNewCustomer(false);
                    if (customer) {
                      setShippingAddress({
                        fullName: customer.customer_name || '',
                        phone: customer.customer_phone || '',
                        address: '',
                        city: customer.customer_city || '',
                        notes: ''
                      });
                    }
                  }
                }}
              >
                <option value="">Select a customer</option>
                {customers.map(customer => (
                  <option key={customer.customer_id} value={customer.customer_id}>
                    {customer.customer_name} - {customer.customer_city} ({customer.total_orders} orders)
                  </option>
                ))}
                <option value="new">+ Add New Customer</option>
              </select>
            </div>
          </div>

          {/* New Customer Form */}
          {newCustomer && (
            <div className="space-y-4 border-t pt-4">
              <h4 className="font-medium">Customer Details</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={shippingAddress.fullName}
                    onChange={(e) => setShippingAddress({...shippingAddress, fullName: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Phone *</label>
                  <input
                    type="tel"
                    required
                    value={shippingAddress.phone}
                    onChange={(e) => setShippingAddress({...shippingAddress, phone: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm text-gray-600 mb-1">Address *</label>
                  <input
                    type="text"
                    required
                    value={shippingAddress.address}
                    onChange={(e) => setShippingAddress({...shippingAddress, address: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={shippingAddress.city}
                    onChange={(e) => setShippingAddress({...shippingAddress, city: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Delivery Notes</label>
                  <input
                    type="text"
                    value={shippingAddress.notes}
                    onChange={(e) => setShippingAddress({...shippingAddress, notes: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Gate code, landmarks..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* Markup Calculator */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-4">Set Your Markup</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-2">
                  Markup Percentage: {markup}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={markup}
                  onChange={(e) => setMarkup(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Price Breakdown */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Base Price:</span>
                  <span>{prices.basePrice} MAD</span>
                </div>
                <div className="flex justify-between text-sm text-green-600">
                  <span>Your Markup ({markup}%):</span>
                  <span>+{prices.markupAmount} MAD</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>{prices.subtotal} MAD</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Shipping Fee:</span>
                  <span>{prices.shippingFee} MAD</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-bold">
                  <span>Customer Total:</span>
                  <span>{prices.total} MAD</span>
                </div>
                <div className="flex justify-between text-green-600 font-bold">
                  <span>Your Profit:</span>
                  <span>{prices.profit} MAD</span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Placing Order...' : 'Place Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PlaceOrderModal;