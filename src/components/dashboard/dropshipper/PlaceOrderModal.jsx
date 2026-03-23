// src/components/dashboard/dropshipper/PlaceOrderModal.jsx
import { useState, useEffect } from 'react';
import { 
  X, Package, User, MapPin, Phone, TrendingUp, Percent, DollarSign, Truck, Shield, ChevronRight, Info, AlertCircle
} from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';
import { useToast } from '../../ui/use-toast';

const PlaceOrderModal = ({ isOpen, onClose, product, dropshipperId, onSuccess }) => {
  const { toast } = useToast();
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
    if (isOpen && product?.category_id && markupPercent > 0) {
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
      toast({
        title: "Error",
        description: "Failed to load customers",
        variant: "destructive",
      });
    }
  };

  const fetchCommissionRate = async () => {
    if (!product?.category_id) return;
    
    setLoadingCommission(true);
    try {
      const markupAmount = (product.purchase_price * markupPercent) / 100;
      
      const { data, error } = await supabase
        .rpc('calculate_commission', {
          p_seller_id: product.seller_id || product.user_id,
          p_category_id: product.category_id,
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
      toast({
        title: "Error",
        description: "Please select or add a customer",
        variant: "destructive",
      });
      return;
    }

    // Validate new customer form
    if (newCustomer && !formData.fullName) {
      toast({
        title: "Error",
        description: "Please fill in customer details",
        variant: "destructive",
      });
      return;
    }

    // ✅ Validate markup is positive (mandatory for B2B)
    if (markupPercent <= 0) {
      toast({
        title: "Error",
        description: "Please set a markup percentage greater than 0%",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // If new customer, create them first
      let customerId = selectedCustomer?.customer_id;
      
      if (newCustomer) {
        const { data: newUser, error: createError } = await supabase
          .from('profiles')
          .insert([{
            email: `${formData.phone}@temp.customer`,
            full_name: formData.fullName,
            phone: formData.phone,
            city: formData.city,
            address: formData.address,
            role: 'customer'
          }])
          .select()
          .single();

        if (createError) throw createError;
        customerId = newUser.id;
      }

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
          p_shipping_address: {
            fullName: formData.fullName,
            phone: formData.phone,
            address: formData.address,
            city: formData.city,
            notes: formData.notes
          },
          p_shipping_city: formData.city,
          p_shipping_fee: prices.shippingFee
        });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "✅ Order Placed Successfully",
          description: `Your markup: ${prices.markupAmount.toFixed(2)} MAD | Net profit: ${prices.netProfit.toFixed(2)} MAD`,
        });
        onSuccess();
        onClose();
      } else {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error placing order:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to place order",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-4 border-b border-amber-100 sticky top-0">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800">Place B2B Order</h2>
            <button onClick={onClose} className="p-1 hover:bg-amber-100 rounded-lg">
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-1">Set your markup to calculate earnings</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Product Details */}
          <div className="bg-slate-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">{product?.name}</h3>
            <p className="text-sm text-gray-600 mb-2">{product?.category}</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-gray-500">Base Price (Seller)</span>
                <p className="font-bold">{product?.purchase_price} MAD</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">Available</span>
                <p className="font-bold">{product?.quantity} units</p>
              </div>
            </div>
          </div>

          {/* Markup Slider - MANDATORY for B2B */}
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
            <div className="flex items-center gap-2 mb-2">
              <Percent className="w-5 h-5 text-amber-600" />
              <h3 className="font-semibold text-gray-800">Your Markup <span className="text-red-500">*</span></h3>
              {markupPercent <= 0 && (
                <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Required
                </span>
              )}
            </div>
            
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Markup percentage:</span>
                <span className="text-lg font-bold text-amber-700">{markupPercent}%</span>
              </div>
              <input
                type="range"
                min="1"  // Minimum 1% (mandatory)
                max="100"
                value={markupPercent}
                onChange={(e) => setMarkupPercent(parseInt(e.target.value))}
                className="w-full accent-amber-600"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
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
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-600 mx-auto"></div>
                <p className="text-xs text-gray-500 mt-2">Calculating commission...</p>
              </div>
            ) : (
              <div className="bg-white p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Your Markup Amount:</span>
                  <span className="font-bold text-green-600">+{prices.markupAmount.toFixed(2)} MAD</span>
                </div>
                <div className="flex justify-between text-sm text-orange-600 border-t pt-2">
                  <span>Dealtock Fee ({prices.commissionRate}%):</span>
                  <span className="font-bold">-{prices.commissionAmount.toFixed(2)} MAD</span>
                </div>
                <div className="flex justify-between font-bold text-base bg-green-50 p-2 rounded">
                  <span>Your Net Profit:</span>
                  <span className="text-green-700">{prices.netProfit.toFixed(2)} MAD</span>
                </div>
                <div className="border-t pt-2 mt-2">
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
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">Customer Information</h3>
            {/* ... customer form fields ... */}
          </div>

          {/* Submit Button */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || loadingCommission || markupPercent <= 0}
            className="w-full bg-gradient-to-r from-amber-600 to-orange-600 text-white py-3 rounded-lg font-medium hover:from-amber-700 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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