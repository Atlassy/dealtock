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
import { useTranslation } from 'react-i18next';
import OrderConfirmation from './components/OrderConfirmation';

const CartPage = () => {
  const { t } = useTranslation();
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
      toast.error(t('cart.cartEmptyToast'));
      return;
    }

    sessionStorage.setItem('checkoutCart', JSON.stringify(cartItems));
    setShowCheckoutForm(true);
  };

  const handleContinueShopping = () => {
    navigate('/marketplace');
  };

  const handleClearCart = async () => {
    if (!window.confirm(t('cart.confirmClearCart'))) return;

    await clearCart();
    toast.success(t('cart.cartCleared'));
  };

  const manualRefresh = async () => {
    toast.info(t('cart.refreshing'));
    await loadCart();
    toast.success(t('cart.cartUpdatedToast'));
  };

  // -----------------------------
  // LOADING
  // -----------------------------
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin h-10 w-10 border-b-2 border-blue-600 dark:border-blue-400 rounded-full"></div>
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
          <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingCart className="w-12 h-12 text-gray-400 dark:text-gray-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('cart.emptyTitle')}</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-6">{t('cart.emptyBody')}</p>
          <Link
            to="/marketplace"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('cart.continueShopping')}
          </Link>
          {user && profile?.role && profile.role !== 'customer' && (
            <p className="text-sm text-green-600 dark:text-green-400 mt-4">
              {t('cart.loggedInAs', { role: profile.role })}
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
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 border border-green-200 dark:border-green-800 rounded-lg p-4 shadow-xl max-w-md">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center">
                  <Gift className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-green-800 dark:text-green-300 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  {t('cart.businessPricingApplied')}
                </h4>
                <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                  {t('cart.cartUpdatedWithPricing', { role: profile?.role || 'business' })}
                </p>
                <p className="text-xs font-semibold text-green-800 dark:text-green-300 mt-2">
                  {t('cart.youSaved', { amount: formatPrice(totalSavings) })}
                </p>
              </div>
              <button onClick={() => setShowPriceUpdateNotification(false)} className="flex-shrink-0 text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 transition">
                <AlertCircle className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <ShoppingCart className="w-6 h-6" />
              {t('cart.title')} ({cartItems.length} {t('cart.item', { count: cartItems.length })})
            </h1>
            {user && profile?.role && profile.role !== 'customer' && (
              <p className="text-sm text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {t('cart.pricingApplied', { role: profile.role.charAt(0).toUpperCase() + profile.role.slice(1) })}
              </p>
            )}
            {!user && (
              <p className="text-sm text-blue-600 dark:text-blue-400 mt-1 flex items-center gap-1">
                <ShoppingBag className="w-3 h-3" />
                {t('cart.guestCheckout')}
              </p>
            )}
            {user && profile?.role === 'customer' && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {t('cart.regularPricing')}
              </p>
            )}
          </div>
          <button onClick={manualRefresh} className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 inline-flex items-center gap-1">
            <RefreshCw className="w-4 h-4" />
            {t('cart.refresh')}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item, index) => {
              const hasPriceDrop = (item.originalB2CPrice || item.originalPrice) > item.price;
              const originalPriceValue = item.originalB2CPrice || item.originalPrice || item.price;
              
              return (
                <div key={`${item.id}-${index}`} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition">
                  <div className="flex gap-4">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingCart className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">{item.name}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{item.category || t('cart.uncategorized')}</p>
                          <div className="mt-1">
                            {hasPriceDrop ? (
                              <div className="flex items-center gap-2">
                                <span className="text-lg font-bold text-green-600 dark:text-green-400">{formatPrice(item.price)}</span>
                                <span className="text-sm text-gray-400 dark:text-gray-500 line-through">{formatPrice(originalPriceValue)}</span>
                              </div>
                            ) : (
                              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{formatPrice(item.price)}</span>
                            )}
                          </div>
                        </div>
                        <button onClick={() => removeItem(item.id)} className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-10 h-10 flex items-center justify-center border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100"
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                          </button>
                          <span className="w-10 text-center text-sm font-medium text-gray-900 dark:text-gray-100">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-10 h-10 flex items-center justify-center border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100"
                            disabled={item.quantity >= (item.stock || 99)}
                          >
                            <Plus className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                          </button>
                          {item.stock && (
                            <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">{item.stock} {t('cart.available')}</span>
                          )}
                        </div>
                        <p className="font-semibold text-gray-900 dark:text-white">{formatPrice(item.price * item.quantity)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <button
              onClick={handleClearCart}
              className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              {t('cart.clearCart')}
            </button>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 lg:sticky lg:top-24">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t('cart.orderSummary')}</h2>
              <div className="space-y-3 text-gray-700 dark:text-gray-300">
                <div className="flex justify-between text-sm">
                  <span>{t('cart.subtotal', { count: cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0) })}</span>
                  <span className="font-medium text-gray-900 dark:text-white">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>{t('cart.shipping')}</span>
                  <span>{formatPrice(shipping)}</span>
                </div>
                {hasSavings && (
                  <div className="flex justify-between text-sm bg-green-50 dark:bg-green-900/30 p-2 rounded-lg">
                    <span className="text-green-700 dark:text-green-400">{t('cart.businessDiscount')}</span>
                    <span className="text-green-700 dark:text-green-400">-{formatPrice(originalSubtotal - subtotal)}</span>
                  </div>
                )}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
                  <div className="flex justify-between font-bold text-gray-900 dark:text-white">
                    <span>{t('cart.total')}</span>
                    <span className="text-lg text-blue-600 dark:text-blue-400">{formatPrice(total)}</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('cart.cashOnDelivery')}</p>
                </div>
              </div>
              <div className="mt-6 space-y-3">
                <button
                  onClick={handleCheckout}
                  className="w-full py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-4 h-4" />
                  {t('cart.proceedToCheckout')}
                </button>

                {/* Continue Shopping Button */}
                <button
                  onClick={handleContinueShopping}
                  className="w-full py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition flex items-center justify-center gap-2 border border-gray-300 dark:border-gray-600"
                >
                  <ShoppingBag className="w-4 h-4" />
                  {t('cart.continueShopping')}
                </button>
              </div>
              <div className="mt-4 text-center text-xs text-gray-400 dark:text-gray-500">
                <p>{t('cart.savedSecurely')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showCheckoutForm && (
        <OrderConfirmation
          cartItems={cartItems}
          onClose={() => setShowCheckoutForm(false)}
          onSubmitSuccess={async (placedOrders) => {
            await clearCart();
            const numbers = (placedOrders || []).map(o => o.order_number).filter(Boolean);
            if (numbers.length > 0) {
              toast.success(
                numbers.length === 1
                  ? t('cart.orderPlacedSingle', { number: numbers[0] })
                  : t('cart.orderPlacedMultiple', { numbers: numbers.join(', ') }),
                { duration: 10000 }
              );
            } else {
              toast.success(t('cart.orderPlaced'));
            }
          }}
        />
      )}
    </>
  );
};

export default CartPage;