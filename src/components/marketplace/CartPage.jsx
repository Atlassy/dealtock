// src/components/marketplace/CartPage.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShoppingCart, Trash2, Plus, Minus, ArrowLeft, 
  AlertCircle, RefreshCw, ShoppingBag, TrendingUp, Gift,
  CreditCard
} from 'lucide-react';
import { useAuth } from '../../contexts/SupabaseAuthContext';
import { useCart } from '../../hooks/useCart';
import { toast } from 'sonner';
import OrderConfirmation from './components/OrderConfirmation';

const CartPage = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const { 
    cartItems, 
    loading, 
    updateQuantity, 
    removeItem, 
    clearCart,
    loadCart
  } = useCart();

  const [showCheckoutForm, setShowCheckoutForm] = useState(false);
  const [showPriceUpdateNotification, setShowPriceUpdateNotification] = useState(false);
  const [totalSavings, setTotalSavings] = useState(0);
  const focusTimeoutRef = useRef(null);

  // -----------------------------
  // CALCULATE SAVINGS
  // -----------------------------
  const calculateSavings = useCallback(() => {
    return cartItems.reduce((sum, item) => {
      const original = item.originalB2CPrice || item.originalPrice || item.price;
      if (original > item.price) {
        return sum + ((original - item.price) * item.quantity);
      }
      return sum;
    }, 0);
  }, [cartItems]);

  // -----------------------------
  // INITIAL LOAD
  // -----------------------------
  useEffect(() => {
    console.log('CartPage: Initial load');
    loadCart();
  }, [loadCart]);

  // -----------------------------
  // SAVINGS NOTIFICATION
  // -----------------------------
  useEffect(() => {
    const savings = calculateSavings();

    if (savings > 0 && user && profile?.role !== 'customer') {
      setTotalSavings(savings);
      setShowPriceUpdateNotification(true);

      const timer = setTimeout(() => {
        setShowPriceUpdateNotification(false);
      }, 6000);

      return () => clearTimeout(timer);
    }
  }, [cartItems, user, profile, calculateSavings]);

  // -----------------------------
  // REFRESH ON WINDOW FOCUS
  // -----------------------------
  useEffect(() => {
    const handleFocus = () => {
      if (focusTimeoutRef.current) clearTimeout(focusTimeoutRef.current);

      focusTimeoutRef.current = setTimeout(() => {
        console.log('🔄 Page focused → reload cart');
        loadCart();
      }, 400);
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
      if (focusTimeoutRef.current) clearTimeout(focusTimeoutRef.current);
    };
  }, [loadCart]);

  // -----------------------------
  // HELPERS
  // -----------------------------
  const formatPrice = (price) =>
    new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD',
      minimumFractionDigits: 0
    }).format(price || 0);

  const subtotal = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const originalSubtotal = cartItems.reduce((s, i) => {
    const p = i.originalB2CPrice || i.originalPrice || i.price;
    return s + p * i.quantity;
  }, 0);

  const shipping = cartItems.length ? 30 : 0;
  const total = subtotal + shipping;
  const hasSavings = originalSubtotal > subtotal;

  // -----------------------------
  // ACTIONS
  // -----------------------------
  const handleCheckout = () => {
    if (!cartItems.length) {
      toast.error('Your cart is empty');
      return;
    }

    sessionStorage.setItem('checkoutCart', JSON.stringify(cartItems));
    setShowCheckoutForm(true);
  };

  const handleContinueShopping = () => {
    navigate('/marketplace');
  };

  const handleClearCart = async () => {
    if (!window.confirm('Are you sure you want to clear your cart? This action cannot be undone.')) return;

    await clearCart();
    toast.success('Cart cleared');
  };

  const manualRefresh = async () => {
    toast.info('Refreshing...');
    await loadCart();
    toast.success('Cart updated');
  };

  // -----------------------------
  // LOADING
  // -----------------------------
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin h-10 w-10 border-b-2 border-blue-600 rounded-full"></div>
      </div>
    );
  }

  // -----------------------------
  // EMPTY CART
  // -----------------------------
  if (!cartItems.length) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingCart className="w-12 h-12 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Your Cart is Empty</h1>
          <p className="text-gray-500 mb-6">Looks like you haven't added any items to your cart yet.</p>
          <Link 
            to="/marketplace" 
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Continue Shopping
          </Link>
          {user && profile?.role && profile.role !== 'customer' && (
            <p className="text-sm text-green-600 mt-4">
              You're logged in as {profile.role}. Your cart will use B2B pricing when you add items.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Savings Notification */}
      {showPriceUpdateNotification && totalSavings > 0 && (
        <div className="fixed top-20 right-4 z-50 animate-slide-down">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 shadow-xl max-w-md">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Gift className="w-5 h-5 text-green-600" />
                </div>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-green-800 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Business Pricing Applied!
                </h4>
                <p className="text-sm text-green-700 mt-1">
                  Your cart has been updated with {profile?.role || 'business'} pricing.
                </p>
                <p className="text-xs font-semibold text-green-800 mt-2">
                  You saved {formatPrice(totalSavings)} on your current items
                </p>
              </div>
              <button onClick={() => setShowPriceUpdateNotification(false)} className="flex-shrink-0 text-green-600 hover:text-green-800 transition">
                <AlertCircle className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <ShoppingCart className="w-6 h-6" />
              Shopping Cart ({cartItems.length} {cartItems.length === 1 ? 'item' : 'items'})
            </h1>
            {user && profile?.role && profile.role !== 'customer' && (
              <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)} pricing applied
              </p>
            )}
            {!user && (
              <p className="text-sm text-blue-600 mt-1 flex items-center gap-1">
                <ShoppingBag className="w-3 h-3" />
                Guest checkout - Login for business pricing
              </p>
            )}
            {user && profile?.role === 'customer' && (
              <p className="text-sm text-gray-500 mt-1">
                Regular customer pricing
              </p>
            )}
          </div>
          <button onClick={manualRefresh} className="text-sm text-gray-500 hover:text-gray-700 inline-flex items-center gap-1">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item, index) => {
              const hasPriceDrop = (item.originalB2CPrice || item.originalPrice) > item.price;
              const originalPriceValue = item.originalB2CPrice || item.originalPrice || item.price;
              
              return (
                <div key={`${item.id}-${index}`} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition">
                  <div className="flex gap-4">
                    <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingCart className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">{item.name}</h3>
                          <p className="text-sm text-gray-500">{item.category || 'Uncategorized'}</p>
                          <div className="mt-1">
                            {hasPriceDrop ? (
                              <div className="flex items-center gap-2">
                                <span className="text-lg font-bold text-green-600">{formatPrice(item.price)}</span>
                                <span className="text-sm text-gray-400 line-through">{formatPrice(originalPriceValue)}</span>
                              </div>
                            ) : (
                              <span className="text-lg font-bold text-blue-600">{formatPrice(item.price)}</span>
                            )}
                          </div>
                        </div>
                        <button onClick={() => removeItem(item.id)} className="p-2 text-gray-400 hover:text-red-500 transition">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity - 1)} 
                            className="p-1 border border-gray-300 rounded-lg hover:bg-gray-50" 
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-10 text-center text-sm">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity + 1)} 
                            className="p-1 border border-gray-300 rounded-lg hover:bg-gray-50"
                            disabled={item.quantity >= (item.stock || 99)}
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          {item.stock && (
                            <span className="text-xs text-gray-400 ml-2">{item.stock} available</span>
                          )}
                        </div>
                        <p className="font-semibold text-gray-900">{formatPrice(item.price * item.quantity)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <button 
              onClick={handleClearCart} 
              className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Clear Cart
            </button>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-24">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h2>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Subtotal ({cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0)} items)</span>
                  <span className="font-medium">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Shipping</span>
                  <span>{formatPrice(shipping)}</span>
                </div>
                {hasSavings && (
                  <div className="flex justify-between text-sm bg-green-50 p-2 rounded-lg">
                    <span className="text-green-700">Business Discount</span>
                    <span className="text-green-700">-{formatPrice(originalSubtotal - subtotal)}</span>
                  </div>
                )}
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span className="text-lg text-blue-600">{formatPrice(total)}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Cash on delivery</p>
                </div>
              </div>
              <div className="mt-6 space-y-3">
                <button
                  onClick={handleCheckout}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-4 h-4" />
                  Proceed to Checkout
                </button>
                
                {/* Continue Shopping Button */}
                <button
                  onClick={handleContinueShopping}
                  className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition flex items-center justify-center gap-2 border border-gray-300"
                >
                  <ShoppingBag className="w-4 h-4" />
                  Continue Shopping
                </button>
              </div>
              <div className="mt-4 text-center text-xs text-gray-400">
                <p>Your cart is saved securely to your account</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showCheckoutForm && (
        <OrderConfirmation
          cartItems={cartItems}
          onClose={() => setShowCheckoutForm(false)}
          onSubmitSuccess={async () => {
            await clearCart();
            toast.success('Order placed!');
          }}
        />
      )}
    </>
  );
};

export default CartPage;