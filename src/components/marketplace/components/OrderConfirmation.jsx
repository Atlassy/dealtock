// src/components/marketplace/components/OrderConfirmation.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/SupabaseAuthContext';
import { supabase } from '../../../lib/supabaseClient';
import { toast } from 'sonner';
import { 
  CheckCircle, X, Package, MapPin, User, Phone, 
  Truck, CreditCard, AlertCircle, Loader2, Info, 
  TrendingUp, Percent, ShoppingBag
} from 'lucide-react';

// ✅ Generate UNIQUE order number for EACH product (max 20 chars)
const generateOrderNumber = (index) => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${timestamp}${random}${index}`;
};

export default function OrderConfirmation({ cartItems, onClose, onSubmitSuccess }) {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [deliveryCompanies, setDeliveryCompanies] = useState([]);
  const [selectedDeliveryCompany, setSelectedDeliveryCompany] = useState(null);
  const [dropshipperMarkupPercentage, setDropshipperMarkupPercentage] = useState(0);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    deliveryInstructions: ''
  });

  const isDropshipper = profile?.role === 'dropshipper';
  const isGuest = !user;

  // Load delivery companies
  useEffect(() => {
    fetchDeliveryCompanies();
  }, []);

  // Pre-fill form for authenticated users
  useEffect(() => {
    if (user && profile) {
      setFormData(prev => ({
        ...prev,
        fullName: profile.full_name || '',
        email: user.email || '',
        phone: profile.phone || '',
        address: profile.address || '',
        city: profile.city || '',
        postalCode: profile.postal_code || ''
      }));
    }
  }, [user, profile]);

  const fetchDeliveryCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('delivery_companies')
        .select('*')
        .eq('is_active', true);
      
      if (error) throw error;
      setDeliveryCompanies(data || []);
      if (data && data.length > 0) {
        setSelectedDeliveryCompany(data[0]);
      }
    } catch (error) {
      console.error('Error fetching delivery companies:', error);
      toast.error('Failed to load delivery options');
    }
  };

  const formatPrice = (price) => {
    if (!price && price !== 0) return '0 MAD';
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const calculateBaseSubtotal = () => {
    if (!cartItems || cartItems.length === 0) return 0;
    return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  // ✅ FIXED: Calculate markup per item individually
  const calculateMarkupPerItem = (item) => {
    if (!isDropshipper) return 0;
    const itemTotal = item.price * item.quantity;
    return (itemTotal * dropshipperMarkupPercentage) / 100;
  };

  // Total markup amount (for display)
  const calculateTotalMarkupAmount = () => {
    if (!isDropshipper) return 0;
    return cartItems.reduce((sum, item) => sum + calculateMarkupPerItem(item), 0);
  };

  const calculateSubtotal = () => {
    return calculateBaseSubtotal() + calculateTotalMarkupAmount();
  };

  const calculateShipping = () => {
    return selectedDeliveryCompany?.base_fee || 30;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateShipping();
  };

  const handleMarkupChange = (e) => {
    const percentage = parseFloat(e.target.value) || 0;
    setDropshipperMarkupPercentage(percentage);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    
    if (!formData.fullName || !formData.email || !formData.phone || !formData.address || !formData.city) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!selectedDeliveryCompany) {
      toast.error('Please select a delivery company');
      return;
    }

    setLoading(true);

    try {
      const shippingFee = calculateShipping();
      
      console.log('=== ORDER DEBUG ===');
      console.log('Is dropshipper:', isDropshipper);
      console.log('Markup percentage:', dropshipperMarkupPercentage);
      console.log('Cart items:', cartItems.length);
      console.log('==================');

      const orders = [];
      const errors = [];

      for (let i = 0; i < cartItems.length; i++) {
        const item = cartItems[i];
        
        // Generate UNIQUE order number for EACH product
        const orderNumber = generateOrderNumber(i);
        
        // Get seller_id from product if not already in cart
        let sellerId = item.seller_id;
        
        if (!sellerId) {
          const { data: product, error: productError } = await supabase
            .from('products')
            .select('user_id')
            .eq('id', item.id)
            .single();
          
          if (productError) {
            console.error('Error fetching seller:', productError);
            errors.push({ item, error: productError });
            continue;
          }
          
          sellerId = product.user_id;
        }

        // ✅ FIXED: Calculate per-item values correctly
        const itemSubtotal = item.price * item.quantity;
        const itemMarkup = calculateMarkupPerItem(item);
        const itemShipping = shippingFee / cartItems.length;
        const itemFinalPrice = itemSubtotal + itemMarkup + itemShipping;

        console.log(`Item ${i + 1}: ${item.name} - Subtotal: ${itemSubtotal}, Markup: ${itemMarkup}, Final: ${itemFinalPrice}`);

        // Prepare order data
        const orderData = {
          product_id: item.id,
          seller_id: sellerId,
          status: 'ordered',
          product_price: item.price,
          ordered_quantity: item.quantity,
          payment_method: 'COD',
          payment_status: 'pending',
          order_number: orderNumber,
          customer_email: formData.email,
          shipping_city: formData.city,
          shipping_fee: itemShipping,
          final_customer_price: itemFinalPrice,
          order_type: isGuest ? 'b2c' : (isDropshipper ? 'b2b' : 'b2c'),
          delivery_company_id: selectedDeliveryCompany.id,
          shipping_address: {
            name: formData.fullName,
            phone: formData.phone,
            address: formData.address,
            city: formData.city,
            postal_code: formData.postalCode,
            instructions: formData.deliveryInstructions
          }
        };

        // Add dropshipper fields if applicable
        if (isDropshipper && user) {
          orderData.dropshipper_id = user.id;
          orderData.dropshipper_markup = itemMarkup;
          orderData.dropshipper_commission_rate = dropshipperMarkupPercentage;
          orderData.dropshipper_commission_amount = itemMarkup;
        }

        // Add customer_id if logged in
        if (user) {
          orderData.customer_id = user.id;
        }

        console.log(`Inserting order ${i + 1}/${cartItems.length} for:`, item.name, orderNumber);

        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert([orderData])
          .select()
          .single();

        if (orderError) {
          console.error('Order error for item:', item.name, orderError);
          errors.push({ item, error: orderError });
          continue;
        }

        orders.push(order);
      }

      if (errors.length > 0) {
        console.error('Some orders failed:', errors);
        toast.error(`${errors.length} item(s) failed to order.`);
      }

      if (orders.length === 0) {
        throw new Error('No orders were created');
      }

      // Clear cart after successful orders
      localStorage.removeItem('cart');
      localStorage.removeItem('cart_guest');
      sessionStorage.removeItem('checkoutCart');
      
      toast.success(`${orders.length} order(s) placed successfully!`);
      
      if (onSubmitSuccess) {
        onSubmitSuccess(orders);
      }
      
      if (onClose) onClose();
      
      // Redirect based on user role
      if (isDropshipper) {
        navigate('/dropshipper/orders');
      } else {
        navigate('/marketplace');
      }
      
    } catch (error) {
      console.error('Error placing order:', error);
      toast.error('Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6 text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No Items in Cart
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Please add items to your cart before checking out.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  const baseSubtotal = calculateBaseSubtotal();
  const totalMarkupAmount = calculateTotalMarkupAmount();
  const finalSubtotal = calculateSubtotal();
  const shippingFee = calculateShipping();
  const totalAmount = calculateTotal();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 z-10"
        >
          <X className="h-5 w-5" />
        </button>
        
        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Complete Your Order
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
              Please provide your details to complete the purchase
            </p>
            
            {isGuest && (
              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 rounded-lg flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  You're ordering as a guest. You can create an account after checkout to track your orders.
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Customer Form */}
            <div>
              <form className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Personal Information
                  </h3>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Shipping Address
                  </h3>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Address *
                      </label>
                      <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        rows="2"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          City *
                        </label>
                        <input
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Postal Code
                        </label>
                        <input
                          type="text"
                          name="postalCode"
                          value={formData.postalCode}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Delivery Instructions
                      </label>
                      <textarea
                        name="deliveryInstructions"
                        value={formData.deliveryInstructions}
                        onChange={handleInputChange}
                        rows="2"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Truck className="w-4 h-4" />
                    Delivery Company
                  </h3>
                  
                  <div className="space-y-2">
                    {deliveryCompanies.map((company) => (
                      <label
                        key={company.id}
                        className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition ${
                          selectedDeliveryCompany?.id === company.id
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="deliveryCompany"
                            value={company.id}
                            checked={selectedDeliveryCompany?.id === company.id}
                            onChange={() => setSelectedDeliveryCompany(company)}
                            className="w-4 h-4 text-blue-600"
                          />
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{company.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {company.service_type} delivery
                            </p>
                          </div>
                        </div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {formatPrice(company.base_fee)}
                        </p>
                      </label>
                    ))}
                  </div>
                </div>
              </form>
            </div>

            {/* Right Column - Order Summary */}
            <div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 sticky top-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Order Summary
                </h3>
                
                <div className="space-y-3 max-h-48 overflow-y-auto mb-4">
                  {cartItems.map((item, index) => {
                    const itemMarkup = calculateMarkupPerItem(item);
                    const itemTotal = item.price * item.quantity;
                    return (
                      <div key={index} className="flex gap-3 pb-3 border-b border-gray-200 dark:border-gray-600">
                        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded-lg flex-shrink-0 overflow-hidden">
                          {item.image_url ? (
                            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{item.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Qty: {item.quantity}</p>
                          <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                            {formatPrice(itemTotal)}
                          </p>
                          {isDropshipper && itemMarkup > 0 && (
                            <p className="text-xs text-purple-600">
                              +{formatPrice(itemMarkup)} markup ({dropshipperMarkupPercentage}%)
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {isDropshipper && (
                  <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-medium text-purple-800 dark:text-purple-300">
                        Your Markup Percentage
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <input
                          type="number"
                          value={dropshipperMarkupPercentage}
                          onChange={handleMarkupChange}
                          min="0"
                          max="100"
                          step="1"
                          className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800"
                          placeholder="Markup %"
                        />
                      </div>
                      <div className="text-sm text-purple-700 dark:text-purple-300">
                        = {formatPrice(totalMarkupAmount)}
                      </div>
                    </div>
                    <p className="text-xs text-purple-600 dark:text-purple-400 mt-2">
                      Add your profit margin to each item
                    </p>
                  </div>
                )}
                
                <div className="space-y-2 pt-3 border-t border-gray-200 dark:border-gray-600">
                  <div className="flex justify-between text-sm">
                    <span>Base Subtotal:</span>
                    <span>{formatPrice(baseSubtotal)}</span>
                  </div>
                  
                  {isDropshipper && totalMarkupAmount > 0 && (
                    <div className="flex justify-between text-sm text-purple-600">
                      <span>Your Markup ({dropshipperMarkupPercentage}%):</span>
                      <span>+{formatPrice(totalMarkupAmount)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>{formatPrice(finalSubtotal)}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span>Delivery Fee:</span>
                    <span>{formatPrice(shippingFee)}</span>
                  </div>
                  
                  <div className="flex justify-between text-lg font-bold pt-2 border-t">
                    <span>Total:</span>
                    <span className="text-blue-600">{formatPrice(totalAmount)}</span>
                  </div>
                </div>
                
                <button
                  onClick={handleSubmitOrder}
                  disabled={loading}
                  className="w-full mt-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Placing Order...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Place Order
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}