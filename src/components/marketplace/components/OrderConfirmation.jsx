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

// ============================================
// DELIVERY FEE CALCULATION HELPERS
// ============================================

// Helper to check if city is in zone
const isCityInZone = (city, zone) => {
  const zoneMappings = {
    'rabat-sale-kenitra': ['rabat', 'sale', 'temara', 'kenitra', 'skhirat', 'tiflet'],
    'casablanca-settat': ['casablanca', 'mohammedia', 'settat', 'berrechid', 'bouskoura', 'nouaceur', 'mediouna'],
    'marrakech-safi': ['marrakech', 'safi', 'essaouira', 'chichaoua', 'yelmane', 'ben guerir'],
    'tanger-tetouan': ['tanger', 'tetouan', 'chefchaouen', 'larache', 'asilah', 'martil', 'fnideq'],
    'fes-meknes': ['fes', 'meknes', 'taza', 'sefrou', 'boulemane', 'el hajeb', 'ifrane'],
    'agadir': ['agadir', 'inzegan', 'ait melloul', 'tiznit', 'taroudant', 'ouarzazate'],
    'oriental': ['oujda', 'nador', 'berkan', 'taourirt', 'jerada', 'saidia'],
    'beni-mellal': ['beni mellal', 'khouribga', 'khenifra', 'azilal', 'fquih ben salah']
  };
  
  const normalizedCity = city?.toLowerCase().trim() || '';
  const normalizedZone = zone?.toLowerCase().trim() || '';
  const citiesInZone = zoneMappings[normalizedZone] || [];
  return citiesInZone.some(c => normalizedCity.includes(c) || c.includes(normalizedCity));
};

// IMPROVED: Find the best matching rule based on city, weight, and priority
const findBestMatchingRule = (rules, toCity, weight) => {
  const normalizedTo = toCity?.toLowerCase().trim() || '';
  
  if (!rules || rules.length === 0) return null;
  
  // First, filter to only rules that match the city exactly
  const exactCityMatches = rules.filter(rule => 
    rule.to_city && rule.to_city.toLowerCase() === normalizedTo
  );
  
  // If we have exact city matches, pick the one with HIGHEST PRIORITY
  if (exactCityMatches.length > 0) {
    // Sort by priority (higher is better), then by base_fee (lower is better for customer)
    exactCityMatches.sort((a, b) => {
      // First compare by priority (higher number = higher priority)
      if (a.priority !== b.priority) {
        return (b.priority || 0) - (a.priority || 0);
      }
      // If same priority, lower fee is better for customer
      return (a.base_fee || 0) - (b.base_fee || 0);
    });
    
    console.log(`✅ Found ${exactCityMatches.length} exact matches for ${toCity}, selected: ${exactCityMatches[0].base_fee} MAD (priority ${exactCityMatches[0].priority})`);
    return exactCityMatches[0];
  }
  
  // If no exact match, check zone matches
  const zoneMatches = rules.filter(rule => 
    rule.zone_to && isCityInZone(normalizedTo, rule.zone_to)
  );
  
  if (zoneMatches.length > 0) {
    zoneMatches.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    console.log(`🌍 Found ${zoneMatches.length} zone matches for ${toCity}, selected: ${zoneMatches[0].base_fee} MAD`);
    return zoneMatches[0];
  }
  
  // Finally, check fallback rules (no city specified)
  const fallbackRules = rules.filter(rule => 
    !rule.to_city && !rule.zone_to
  );
  
  if (fallbackRules.length > 0) {
    fallbackRules.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    console.log(`🔄 Using fallback rule: ${fallbackRules[0].base_fee} MAD`);
    return fallbackRules[0];
  }
  
  console.log(`⚠️ No matching rule found for ${toCity}`);
  return null;
};

// Calculate delivery fee based on rules table
const calculateDeliveryFeeFromRules = async (deliveryCompanyId, toCity, weight = 1) => {
  try {
    // Build query for delivery_fee_rules table
    let query = supabase
      .from('delivery_fee_rules')
      .select('*')
      .eq('is_active', true);

    // Filter by delivery company if specified
    if (deliveryCompanyId) {
      query = query.eq('delivery_company_id', deliveryCompanyId);
    }

    const { data: rules, error } = await query;

    if (error) {
      console.error('Error fetching delivery rules:', error);
      return 30;
    }

    if (!rules || rules.length === 0) {
      console.log('No delivery rules found');
      return 30;
    }

    // Find best matching rule using improved function
    const bestRule = findBestMatchingRule(rules, toCity, weight);

    if (bestRule) {
      let fee = parseFloat(bestRule.base_fee) || 0;
      
      // Add per-kg fee for weight above minimum
      if (bestRule.per_kg_fee && weight > (bestRule.weight_min || 0)) {
        const extraKg = weight - (bestRule.weight_min || 0);
        fee += extraKg * parseFloat(bestRule.per_kg_fee);
      }
      
      return fee;
    }

    // No matching rule found - default fallback
    console.log(`No matching delivery rule for city: ${toCity}`);
    return 30;
    
  } catch (error) {
    console.error('Error calculating delivery fee:', error);
    return 30;
  }
};

// DEBUG: Function to see what rules exist for a city
const debugDeliveryRules = async (city) => {
  console.log(`🔍 === DEBUGGING DELIVERY FOR "${city}" ===`);
  
  const { data: allRules, error } = await supabase
    .from('delivery_fee_rules')
    .select('*')
    .eq('is_active', true);
  
  if (error) {
    console.error('Error fetching rules:', error);
    return;
  }
  
  // Find exact matches for this city
  const exactMatches = allRules.filter(r => 
    r.to_city && r.to_city.toLowerCase() === city.toLowerCase()
  );
  
  console.log(`📋 Exact matches for "${city}": ${exactMatches.length}`);
  exactMatches.forEach(rule => {
    console.log(`   - Fee: ${rule.base_fee} MAD, Priority: ${rule.priority}, per_kg: ${rule.per_kg_fee || 0}`);
  });
  
  // Sort by priority to see best
  const sorted = [...exactMatches].sort((a, b) => (b.priority || 0) - (a.priority || 0));
  
  if (sorted.length > 0) {
    console.log(`🏆 BEST RULE: Fee ${sorted[0].base_fee} MAD (Priority ${sorted[0].priority})`);
  } else {
    console.log(`⚠️ No exact match found for "${city}"`);
    
    // Check zone matches
    const zoneMatches = allRules.filter(r => 
      r.zone_to && isCityInZone(city, r.zone_to)
    );
    console.log(`🌍 Zone matches: ${zoneMatches.length}`);
    zoneMatches.forEach(rule => {
      console.log(`   - Zone: ${rule.zone_to}, Fee: ${rule.base_fee} MAD`);
    });
  }
  
  // Check fallback rules
  const fallbacks = allRules.filter(r => !r.to_city && !r.zone_to);
  console.log(`🔄 Fallback rules: ${fallbacks.length}`);
  fallbacks.forEach(rule => {
    console.log(`   - Fee: ${rule.base_fee} MAD, Priority: ${rule.priority || 0}`);
  });
};

// ============================================
// MAIN COMPONENT
// ============================================
export default function OrderConfirmation({ cartItems, onClose, onSubmitSuccess }) {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [deliveryCompanies, setDeliveryCompanies] = useState([]);
  const [selectedDeliveryCompany, setSelectedDeliveryCompany] = useState(null);
  const [dropshipperMarkupPercentage, setDropshipperMarkupPercentage] = useState(0);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [calculatingFee, setCalculatingFee] = useState(false);
  const [availableCities, setAvailableCities] = useState([]);
  const [loadingCities, setLoadingCities] = useState(true);
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

  // Fetch available cities from delivery_fee_rules
  useEffect(() => {
    const fetchAvailableCities = async () => {
      try {
        const { data, error } = await supabase
          .from('delivery_fee_rules')
          .select('to_city, zone_to')
          .eq('is_active', true);

        if (error) throw error;

        // Extract unique cities from to_city
        const citiesSet = new Set();
        
        data.forEach(rule => {
          if (rule.to_city && rule.to_city.trim()) {
            citiesSet.add(rule.to_city);
          }
        });

        const sortedCities = Array.from(citiesSet).sort();
        setAvailableCities(sortedCities);
        
        // Pre-fill city for authenticated users if their city is available
        if (profile?.city && sortedCities.includes(profile.city)) {
          setFormData(prev => ({ ...prev, city: profile.city }));
        }
        
        setLoadingCities(false);
      } catch (error) {
        console.error('Error fetching available cities:', error);
        setAvailableCities(['Casablanca', 'Rabat', 'Marrakech', 'Fes', 'Tanger', 'Agadir']);
        setLoadingCities(false);
      }
    };

    fetchAvailableCities();
  }, [profile]);

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
        postalCode: profile.postal_code || ''
      }));
    }
  }, [user, profile]);

  // Recalculate delivery fee when city or delivery company changes
  useEffect(() => {
    const calculateFee = async () => {
      if (!formData.city || formData.city.length < 2) {
        setDeliveryFee(0);
        return;
      }
      
      if (!selectedDeliveryCompany) {
        setDeliveryFee(30);
        return;
      }
      
      setCalculatingFee(true);
      
      // Debug: See what rules exist for this city
      await debugDeliveryRules(formData.city);
      
      // Calculate total weight from cart items (default 0.5kg per item if weight not specified)
      const totalWeight = cartItems.reduce((sum, item) => {
        const itemWeight = item.weight || 0.5;
        return sum + (itemWeight * item.quantity);
      }, 0);
      
      const fee = await calculateDeliveryFeeFromRules(
        selectedDeliveryCompany.id,
        formData.city,
        totalWeight
      );
      
      console.log(`💰 Final delivery fee for ${formData.city}: ${fee} MAD`);
      
      setDeliveryFee(fee);
      setCalculatingFee(false);
    };
    
    calculateFee();
  }, [formData.city, selectedDeliveryCompany, cartItems]);

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

  // Calculate markup per item individually
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
    return deliveryFee;
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

  const handleCityChange = (e) => {
    const city = e.target.value;
    setFormData(prev => ({ ...prev, city }));
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
      console.log('Delivery fee:', shippingFee);
      console.log('==================');

      const orders = [];
      const errors = [];

      for (let i = 0; i < cartItems.length; i++) {
        const item = cartItems[i];
        
        const orderNumber = generateOrderNumber(i);
        
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

        const itemSubtotal = item.price * item.quantity;
        const itemMarkup = calculateMarkupPerItem(item);
        const itemShipping = shippingFee / cartItems.length;
        const itemFinalPrice = itemSubtotal + itemMarkup + itemShipping;

        console.log(`Item ${i + 1}: ${item.name} - Subtotal: ${itemSubtotal}, Markup: ${itemMarkup}, Final: ${itemFinalPrice}`);

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

        if (isDropshipper && user) {
          orderData.dropshipper_id = user.id;
          orderData.dropshipper_markup = itemMarkup;
          orderData.dropshipper_commission_rate = dropshipperMarkupPercentage;
          orderData.dropshipper_commission_amount = itemMarkup;
        }

        if (user) {
          orderData.customer_id = user.id;
        }

        // Guests have no stable identity, so RLS can't let them read back
        // the row they just inserted (no policy grants that without opening
        // up reading ALL guest orders to ANY anonymous visitor, leaking
        // other customers' names/addresses/phones). Skip the .select() for
        // guests and use the locally-built orderData instead - logged-in
        // users can still read their own row back via orders_select_own.
        const insertQuery = supabase.from('orders').insert([orderData]);
        const { data: order, error: orderError } = user
          ? await insertQuery.select().single()
          : await insertQuery;

        if (orderError) {
          console.error('Order error for item:', item.name, orderError);
          errors.push({ item, error: orderError });
          continue;
        }

        orders.push(order || orderData);
      }

      if (errors.length > 0) {
        toast.error(`${errors.length} item(s) failed to order.`);
      }

      if (orders.length === 0) {
        throw new Error('No orders were created');
      }

      localStorage.removeItem('cart');
      localStorage.removeItem('cart_guest');
      sessionStorage.removeItem('checkoutCart');
      
      toast.success(`${orders.length} order(s) placed successfully!`);
      
      if (onSubmitSuccess) {
        onSubmitSuccess(orders);
      }
      
      if (onClose) onClose();
      
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
                        {loadingCities ? (
                          <div className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg bg-gray-100">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-sm text-gray-500">Loading cities...</span>
                          </div>
                        ) : (
                          <select
                            value={formData.city}
                            onChange={handleCityChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                            required
                          >
                            <option value="">Select your city</option>
                            {availableCities.map(city => (
                              <option key={city} value={city}>{city}</option>
                            ))}
                          </select>
                        )}
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
                        placeholder="e.g., Building name, floor number, landmark..."
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
                              {company.service_type || 'Standard'} delivery
                            </p>
                          </div>
                        </div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {calculatingFee ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            formatPrice(deliveryFee)
                          )}
                        </p>
                      </label>
                    ))}
                  </div>
                  
                  {formData.city && deliveryFee === 0 && !calculatingFee && (
                    <p className="text-xs text-yellow-600 mt-2 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Delivery fee will be calculated based on your selected city
                    </p>
                  )}
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
                    {calculatingFee ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <span>{formatPrice(shippingFee)}</span>
                    )}
                  </div>
                  
                  <div className="flex justify-between text-lg font-bold pt-2 border-t">
                    <span>Total:</span>
                    <span className="text-blue-600">{formatPrice(totalAmount)}</span>
                  </div>
                </div>
                
                <button
                  onClick={handleSubmitOrder}
                  disabled={loading || calculatingFee || !formData.city}
                  className="w-full mt-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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