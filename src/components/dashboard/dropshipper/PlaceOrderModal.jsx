// src/components/dashboard/dropshipper/PlaceOrderModal.jsx
import { useState, useEffect } from 'react';
import { 
  X, Package, User, MapPin, Phone, TrendingUp, Percent, DollarSign, Truck, Shield, ChevronRight, Info, AlertCircle
} from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';
import { toast } from 'sonner';

const PlaceOrderModal = ({ isOpen, onClose, product, dropshipperId, onSuccess }) => {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [newCustomer, setNewCustomer] = useState(false);
  const [markupPercent, setMarkupPercent] = useState(20); // Default markup
  const [loading, setLoading] = useState(false);
  const [commissionRate, setCommissionRate] = useState(0);
  const [loadingCommission, setLoadingCommission] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    city: '',
    address: '',
    notes: ''
  });

  // Moroccan cities list
  const moroccanCities = [
    'Casablanca', 'Rabat', 'Fès', 'Marrakech', 'Tanger', 'Agadir', 
    'Meknès', 'Oujda', 'Kénitra', 'Tétouan', 'Safi', 'El Jadida',
    'Beni Mellal', 'Nador', 'Taza', 'Settat', 'Mohammedia', 'Khouribga'
  ];

  useEffect(() => {
    if (isOpen && dropshipperId) {
      fetchCustomers();
    }
  }, [isOpen, dropshipperId]);

  useEffect(() => {
    if (isOpen && product?.id && markupPercent > 0) {
      fetchCommissionRate();
    }
  }, [markupPercent, isOpen]);

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
      toast.error("Failed to load customers");
    }
  };

  const fetchCommissionRate = async () => {
    if (!product?.id) return;

    setLoadingCommission(true);
    try {
      const markupAmount = (product.purchase_price * markupPercent) / 100;

      const { data, error } = await supabase
        .rpc('calculate_commission', {
          p_seller_id: product.seller_id || product.user_id,
          p_product_id: product.id,
          p_amount: markupAmount,
          p_for_role: 'dropshipper'
        });

      if (error) throw error;
      setCommissionRate(parseFloat(data) || 5);
    } catch (error) {
      console.error('Error fetching commission:', error);
      setCommissionRate(5);
    } finally {
      setLoadingCommission(false);
    }
  };

  // Calculate all prices
  const calculatePrices = () => {
    const basePrice = product?.purchase_price || 0;
    const markupAmount = (basePrice * markupPercent) / 100;
    const commissionAmount = (markupAmount * commissionRate) / 100;
    const netProfit = markupAmount - commissionAmount;
    const subtotal = basePrice + markupAmount;
    const shippingFee = 30; // Default shipping fee
    const total = subtotal + shippingFee;

    return {
      basePrice,
      markupPercent,
      markupAmount,
      commissionRate,
      commissionAmount,
      netProfit,
      subtotal,
      shippingFee,
      total
    };
  };

  const prices = calculatePrices();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate customer selection
    if (!selectedCustomer && !newCustomer) {
      toast.error("Please select or add a customer");
      return;
    }

    // Validate new customer form
    if (newCustomer && !formData.fullName) {
      toast.error("Please fill in customer details");
      return;
    }

    // ✅ Validate markup is positive (mandatory for B2B)
    if (markupPercent <= 0) {
      toast.error("Please set a markup percentage greater than 0%");
      return;
    }

    setLoading(true);
    try {
      // If new customer, create them first
      let customerId = selectedCustomer?.customer_id;
      
      if (newCustomer) {
        const { data: newCustomerId, error: createError } = await supabase
          .rpc('create_dropshipper_customer', {
            p_full_name: formData.fullName,
            p_phone: formData.phone,
            p_city: formData.city,
            p_address: formData.address
          });

        if (createError) throw createError;
        customerId = newCustomerId;
      }

      // Use the new-customer form when creating one, otherwise the
      // already-selected existing customer's saved info.
      const shippingInfo = newCustomer
        ? { fullName: formData.fullName, phone: formData.phone, address: formData.address, city: formData.city, notes: formData.notes }
        : { fullName: selectedCustomer?.full_name, phone: selectedCustomer?.phone, address: selectedCustomer?.address, city: selectedCustomer?.city, notes: formData.notes };

      // Place order with ALL commission details
      const { data, error } = await supabase
        .rpc('place_dropshipper_order_v2', {
          p_product_id: product.id,
          p_quantity: 1,
          p_dropshipper_id: dropshipperId,
          p_customer_id: customerId,
          p_markup: prices.markupAmount,           // ✅ Store the markup
          p_commission_rate: prices.commissionRate, // ✅ Store commission rate
          p_commission_amount: prices.commissionAmount, // ✅ Store commission amount
          p_net_profit: prices.netProfit,           // ✅ Store net profit
          p_shipping_address: shippingInfo,
          p_shipping_city: shippingInfo.city,
          p_shipping_fee: prices.shippingFee
        });

      if (error) throw error;

      if (data.success) {
        toast.success(`Order placed! Your markup: ${prices.markupAmount.toFixed(2)} MAD | Net profit: ${prices.netProfit.toFixed(2)} MAD`);
        onSuccess();
        onClose();
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      console.error('Error placing order:', error);
      toast.error(error.message || "Failed to place order");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-50 to-kraft-50 dark:from-amber-900/30 dark:to-kraft-900/30 px-6 py-4 border-b border-amber-100 dark:border-amber-800/50 sticky top-0">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Place B2B Order</h2>
            <button onClick={onClose} className="p-1 hover:bg-amber-100 dark:hover:bg-amber-900/40 rounded-lg">
              <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Set your markup to calculate earnings</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Product Details */}
          <div className="bg-slate-50 dark:bg-gray-900 p-4 rounded-lg">
            <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">{product?.name}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{product?.category}</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-gray-500 dark:text-gray-400">Base Price (Seller)</span>
                <p className="font-bold text-gray-900 dark:text-white">{product?.purchase_price} MAD</p>
              </div>
              <div>
                <span className="text-xs text-gray-500 dark:text-gray-400">Available</span>
                <p className="font-bold text-gray-900 dark:text-white">{product?.quantity} units</p>
              </div>
            </div>
          </div>

          {/* Markup Slider - MANDATORY for B2B */}
          <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800/50">
            <div className="flex items-center gap-2 mb-2">
              <Percent className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <h3 className="font-semibold text-gray-800 dark:text-white">Your Markup <span className="text-red-500 dark:text-red-400">*</span></h3>
              {markupPercent <= 0 && (
                <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 px-2 py-1 rounded-full flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Required
                </span>
              )}
            </div>

            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-300">Markup percentage:</span>
                <span className="text-lg font-bold text-amber-700 dark:text-amber-400">{markupPercent}%</span>
              </div>
              <input
                type="range"
                min="1"  // Minimum 1% (mandatory)
                max="100"
                value={markupPercent}
                onChange={(e) => setMarkupPercent(parseInt(e.target.value))}
                className="w-full accent-amber-600"
              />
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>1%</span>
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Price Breakdown */}
            {loadingCommission ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-600 dark:border-amber-400 mx-auto"></div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Calculating commission...</p>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm text-gray-900 dark:text-gray-100">
                  <span>Your Markup Amount:</span>
                  <span className="font-bold text-green-600 dark:text-green-400">+{prices.markupAmount.toFixed(2)} MAD</span>
                </div>
                <div className="flex justify-between text-sm text-kraft-600 dark:text-kraft-400 border-t border-gray-200 dark:border-gray-700 pt-2">
                  <span>Dealtock Fee ({prices.commissionRate}%):</span>
                  <span className="font-bold">-{prices.commissionAmount.toFixed(2)} MAD</span>
                </div>
                <div className="flex justify-between font-bold text-base bg-green-50 dark:bg-green-900/20 text-gray-900 dark:text-white p-2 rounded">
                  <span>Your Net Profit:</span>
                  <span className="text-green-700 dark:text-green-400">{prices.netProfit.toFixed(2)} MAD</span>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2 text-gray-900 dark:text-gray-100">
                  <div className="flex justify-between text-sm">
                    <span>Customer Price:</span>
                    <span>{prices.subtotal.toFixed(2)} MAD</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>+ Shipping:</span>
                    <span>{prices.shippingFee.toFixed(2)} MAD</span>
                  </div>
                  <div className="flex justify-between font-bold text-base mt-2">
                    <span>Total:</span>
                    <span>{prices.total.toFixed(2)} MAD</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Customer Information */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="font-semibold mb-3 text-gray-900 dark:text-white flex items-center gap-2">
              <User className="w-4 h-4" />
              Customer Information <span className="text-red-500 dark:text-red-400">*</span>
            </h3>

            {!newCustomer ? (
              <>
                {customers.length > 0 && (
                  <div className="mb-3 max-h-40 overflow-y-auto space-y-1.5">
                    {customers.map((c) => (
                      <button
                        key={c.customer_id}
                        type="button"
                        onClick={() => setSelectedCustomer(c)}
                        className={`w-full text-left px-3 py-2 rounded-lg border text-sm transition ${
                          selectedCustomer?.customer_id === c.customer_id
                            ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-500'
                            : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        <span className="font-medium text-gray-900 dark:text-white">{c.full_name}</span>
                        <span className="text-gray-500 dark:text-gray-400 ml-2">{c.phone} · {c.city}</span>
                      </button>
                    ))}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => { setNewCustomer(true); setSelectedCustomer(null); }}
                  className="text-sm text-amber-700 dark:text-amber-400 font-medium hover:underline"
                >
                  + Add a new customer
                </button>
              </>
            ) : (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setNewCustomer(false)}
                  className="text-sm text-gray-500 dark:text-gray-400 hover:underline"
                >
                  ← Back to customer list
                </button>
                <input
                  type="text"
                  placeholder="Full name *"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  />
                  <select
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  >
                    <option value="">City</option>
                    {moroccanCities.map((city) => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>
                <input
                  type="text"
                  placeholder="Address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
                <input
                  type="text"
                  placeholder="Delivery notes (optional)"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || loadingCommission || markupPercent <= 0}
            className="w-full bg-gradient-to-r from-amber-600 to-kraft-600 text-white py-3 rounded-lg font-medium hover:from-amber-700 hover:to-kraft-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                Processing...
              </>
            ) : (
              <>
                Place B2B Order
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlaceOrderModal;