// src/components/marketplace/components/ProductDetailModal.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, MapPin, Package, Truck, AlertCircle, ChevronRight, User, Phone, Home, DollarSign, ShoppingBag, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { useAuth } from '../../../contexts/SupabaseAuthContext';
import { useDeliveryOptions } from '../../../hooks/useDeliveryOptions';
import { marketplaceQueries } from '../../../lib/marketplaceQueries';
import OrderConfirmation from './OrderConfirmation';

export default function ProductDetailModal({ 
  isOpen, 
  onClose, 
  product, 
  dropshipperId,
  onOrderSuccess 
}) {
  const { user } = useAuth();
  
  // State management
  const [quantity, setQuantity] = useState(1);
  const [shippingCity, setShippingCity] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [markup, setMarkup] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  const { options, loading: deliveryLoading, calculateOptions } = useDeliveryOptions();
  
  // Refs for debouncing
  const timeoutRef = useRef(null);
  const previousCity = useRef('');

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Calculate shipping when city changes with debounce
  useEffect(() => {
    if (shippingCity === previousCity.current || shippingCity.length < 3) {
      return;
    }
    
    previousCity.current = shippingCity;
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    if (shippingCity.length >= 3 && product?.id) {
      timeoutRef.current = setTimeout(() => {
        calculateOptions(product.id, shippingCity, product.weight_kg || 1);
      }, 500);
    }
  }, [shippingCity, product?.id, product?.weight_kg, calculateOptions]);

  // Format price safely
  const formatPrice = (price) => {
    if (price === undefined || price === null || isNaN(price)) return '0.00';
    return Number(price).toFixed(2);
  };

  // Get product price from sale_price
  const getProductPrice = () => {
    return Number(product?.sale_price) || 0;
  };

  // Calculate totals
  const calculateTotals = () => {
    const productPrice = getProductPrice();
    const productTotal = productPrice * quantity;
    const shippingTotal = Number(selectedDelivery?.calculatedFee) || 0;
    const markupTotal = Number(markup) * quantity;
    const finalTotal = productTotal + shippingTotal + markupTotal;

    return {
      productTotal,
      shippingTotal,
      markupTotal,
      finalTotal,
      productPrice
    };
  };

  // Validate form
  const validateForm = () => {
    const errors = {};
    
    if (!customerName.trim()) errors.customerName = 'Name is required';
    if (!customerPhone.trim()) errors.customerPhone = 'Phone is required';
    if (!shippingCity.trim()) errors.shippingCity = 'City is required';
    if (!customerAddress.trim()) errors.customerAddress = 'Address is required';
    if (!selectedDelivery) errors.delivery = 'Please select a delivery option';
    if (quantity < 1) errors.quantity = 'Quantity must be at least 1';
    if (quantity > (product?.quantity || 0)) errors.quantity = 'Not enough stock';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle order submission
  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const totals = calculateTotals();
      
      const orderData = {
        productId: product.id,
        sellerId: product.user_id,
        dropshipperId: dropshipperId,
        deliveryCompanyId: selectedDelivery.id,
        productPrice: getProductPrice(),
        dropshipperMarkup: Number(markup) * quantity,
        finalPrice: totals.finalTotal,
        shippingFee: totals.shippingTotal,
        shippingCity: shippingCity,
        quantity: quantity,
        weight: product.weight_kg || 1,
        serviceType: selectedDelivery.service_type || 'standard',
        customerId: null,
        shippingAddress: {
          name: customerName,
          phone: customerPhone,
          address: customerAddress,
          city: shippingCity
        },
        notes: '',
        product: product
      };

      const order = await marketplaceQueries.createOrder(orderData);
      
      setCreatedOrder(order);
      setShowConfirmation(true);
      onOrderSuccess();

    } catch (err) {
      console.error('Order error:', err);
      setError(err.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !product) return null;

  const totals = calculateTotals();
  const productPrice = getProductPrice();

  return (
    <>
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <ShoppingBag className="w-6 h-6 text-white" />
              <h2 className="text-xl font-semibold text-white">Complete Your Order</h2>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-blue-500 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-white" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Product & Customer Info */}
              <div className="lg:col-span-2 space-y-6">
                {/* Product Summary Card - FIXED: Now shows product price clearly */}
                <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 p-5">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Package className="w-5 h-5 text-blue-600" />
                    Product Details
                  </h3>
                  <div className="flex gap-4">
                    <div className="w-24 h-24 bg-gray-100 rounded-xl flex-shrink-0 overflow-hidden border border-gray-200">
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-full h-full p-5 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 line-clamp-1">{product.name}</h4>
                      <p className="text-sm text-gray-500 mt-1">{product.category || 'Uncategorized'}</p>
                      
                      {/* Price Display - FIXED: Now prominently shown */}
                      <div className="mt-3 flex items-center gap-4">
                        <div className="bg-blue-50 px-3 py-1.5 rounded-lg">
                          <p className="text-xs text-blue-600 font-medium">Unit Price</p>
                          <p className="text-xl font-bold text-blue-700">{formatPrice(productPrice)} MAD</p>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className="text-center">
                            <p className="text-xs text-gray-500">Available</p>
                            <p className="font-semibold text-gray-700">{product.quantity} units</p>
                          </div>
                          {product.weight_kg > 0 && (
                            <div className="text-center border-l border-gray-200 pl-3">
                              <p className="text-xs text-gray-500">Weight</p>
                              <p className="font-semibold text-gray-700">{product.weight_kg} kg</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Customer Information Card */}
                <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 p-5">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-600" />
                    Delivery Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          className={`w-full pl-10 pr-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
                            formErrors.customerName ? 'border-red-300 bg-red-50' : 'border-gray-300'
                          }`}
                          placeholder="John Doe"
                        />
                      </div>
                      {formErrors.customerName && (
                        <p className="text-xs text-red-500 mt-1">{formErrors.customerName}</p>
                      )}
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="tel"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          className={`w-full pl-10 pr-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
                            formErrors.customerPhone ? 'border-red-300 bg-red-50' : 'border-gray-300'
                          }`}
                          placeholder="06 XX XX XX XX"
                        />
                      </div>
                      {formErrors.customerPhone && (
                        <p className="text-xs text-red-500 mt-1">{formErrors.customerPhone}</p>
                      )}
                    </div>

                    {/* City */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        City <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={shippingCity}
                          onChange={(e) => setShippingCity(e.target.value)}
                          className={`w-full pl-10 pr-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
                            formErrors.shippingCity ? 'border-red-300 bg-red-50' : 'border-gray-300'
                          }`}
                          placeholder="Casablanca, Rabat, etc."
                          list="moroccan-cities"
                        />
                        <datalist id="moroccan-cities">
                          <option value="Casablanca" />
                          <option value="Rabat" />
                          <option value="Marrakech" />
                          <option value="Fes" />
                          <option value="Tangier" />
                          <option value="Agadir" />
                          <option value="Meknes" />
                          <option value="Oujda" />
                          <option value="Kenitra" />
                          <option value="Tetouan" />
                        </datalist>
                      </div>
                      {formErrors.shippingCity && (
                        <p className="text-xs text-red-500 mt-1">{formErrors.shippingCity}</p>
                      )}
                    </div>

                    {/* Address */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Address <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Home className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                        <textarea
                          value={customerAddress}
                          onChange={(e) => setCustomerAddress(e.target.value)}
                          rows="2"
                          className={`w-full pl-10 pr-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
                            formErrors.customerAddress ? 'border-red-300 bg-red-50' : 'border-gray-300'
                          }`}
                          placeholder="Street, building number, apartment, etc."
                        />
                      </div>
                      {formErrors.customerAddress && (
                        <p className="text-xs text-red-500 mt-1">{formErrors.customerAddress}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quantity & Markup Card */}
                <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 p-5">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-blue-600" />
                    Order Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quantity
                      </label>
                      <div className="flex items-center">
                        <button
                          type="button"
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          className="px-3 py-2 border border-gray-300 rounded-l-lg hover:bg-gray-100 transition"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="1"
                          max={product.quantity}
                          value={quantity}
                          onChange={(e) => setQuantity(Math.min(product.quantity, Math.max(1, parseInt(e.target.value) || 1)))}
                          className="w-20 text-center py-2 border-t border-b border-gray-300 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setQuantity(Math.min(product.quantity, quantity + 1))}
                          className="px-3 py-2 border border-gray-300 rounded-r-lg hover:bg-gray-100 transition"
                        >
                          +
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{product.quantity} available</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Your Markup (MAD)
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={markup}
                          onChange={(e) => setMarkup(parseFloat(e.target.value) || 0)}
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0.00"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Total markup: {(markup * quantity).toFixed(2)} MAD</p>
                    </div>
                  </div>
                  
                  {/* Subtotal display */}
                  <div className="mt-4 pt-3 border-t border-gray-200">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Subtotal ({quantity} × {formatPrice(productPrice)} MAD)</span>
                      <span className="font-semibold text-gray-900">{formatPrice(productPrice * quantity)} MAD</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Delivery & Summary */}
              <div className="lg:col-span-1 space-y-6">
                {/* Delivery Options Card */}
                <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 p-5">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Truck className="w-5 h-5 text-blue-600" />
                    Delivery Options
                  </h3>
                  
                  {deliveryLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto"></div>
                      <p className="text-sm text-gray-500 mt-2">Calculating shipping...</p>
                    </div>
                  ) : options.length === 0 ? (
                    shippingCity.length >= 3 ? (
                      <div className="text-center py-6 bg-yellow-50 rounded-lg">
                        <Truck className="w-10 h-10 text-yellow-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">No delivery options for</p>
                        <p className="font-medium text-gray-800">{shippingCity}</p>
                      </div>
                    ) : (
                      <div className="text-center py-6 bg-gray-50 rounded-lg">
                        <MapPin className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Enter a city to see delivery options</p>
                      </div>
                    )
                  ) : (
                    <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                      {options.map((company) => (
                        <div
                          key={company.id}
                          onClick={() => setSelectedDelivery(company)}
                          className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                            selectedDelivery?.id === company.id
                              ? 'border-blue-500 bg-blue-50 shadow-md'
                              : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-semibold text-gray-900">{company.name}</p>
                              <span className={`inline-block px-2 py-0.5 text-xs rounded-full mt-1 ${
                                company.service_type === 'express' ? 'bg-purple-100 text-purple-700' :
                                company.service_type === 'economy' ? 'bg-green-100 text-green-700' :
                                'bg-blue-100 text-blue-700'
                              }`}>
                                {company.service_type}
                              </span>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-lg text-blue-600">
                                {formatPrice(company.calculatedFee)} MAD
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {company.estimatedDays} days
                            </span>
                            {company.escrow_enabled && (
                              <span className="flex items-center gap-1 text-green-600">
                                <CheckCircle className="w-3 h-3" />
                                Escrow protected
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {formErrors.delivery && (
                    <p className="text-xs text-red-500 mt-2">{formErrors.delivery}</p>
                  )}
                </div>

                {/* Order Summary Card - FIXED: Now shows product price breakdown */}
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-5 text-white">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5" />
                    Order Summary
                  </h3>
                  
                  <div className="space-y-3 text-sm">
                    {/* Product price line - FIXED: Now clearly shown */}
                    <div className="flex justify-between items-center">
                      <span className="text-blue-100">Product ({quantity}x {formatPrice(productPrice)} MAD)</span>
                      <span className="font-medium">{formatPrice(totals.productTotal)} MAD</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-blue-100">Delivery</span>
                      <span className="font-medium">{formatPrice(totals.shippingTotal)} MAD</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-blue-100">Your Markup</span>
                      <span className="font-medium text-yellow-300">+{formatPrice(totals.markupTotal)} MAD</span>
                    </div>
                    
                    <div className="border-t border-blue-400 my-2 pt-2">
                      <div className="flex justify-between items-center text-base font-bold">
                        <span>Total</span>
                        <span className="text-xl">{formatPrice(totals.finalTotal)} MAD</span>
                      </div>
                      <p className="text-xs text-blue-200 mt-1">Cash on delivery</p>
                    </div>
                  </div>

                  <button
                    onClick={handleSubmitOrder}
                    disabled={loading || !selectedDelivery}
                    className="w-full mt-4 bg-white text-blue-600 py-3 px-4 rounded-lg font-semibold hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        Place Order
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>

                {/* Trust Badges */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center justify-around text-xs text-gray-600">
                    <div className="text-center">
                      <CheckCircle className="w-5 h-5 text-green-500 mx-auto mb-1" />
                      <span>Secure Payment</span>
                    </div>
                    <div className="text-center">
                      <Truck className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                      <span>Tracked Delivery</span>
                    </div>
                    <div className="text-center">
                      <Clock className="w-5 h-5 text-orange-500 mx-auto mb-1" />
                      <span>3-Day Hold</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Order Confirmation */}
      {showConfirmation && (
        <OrderConfirmation
          order={createdOrder}
          onClose={() => {
            setShowConfirmation(false);
            onClose();
          }}
        />
      )}
    </>
  );
}