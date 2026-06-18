// src/components/dashboard/dropshipper/ProductCard.jsx
import { useState, useEffect } from 'react';
import { MapPin, Package, TrendingUp, Truck, Info, Percent } from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';

const ProductCard = ({ product, onPlaceOrder }) => {
  const [showCalculator, setShowCalculator] = useState(false);
  const [markupPercent, setMarkupPercent] = useState(20);
  const [commissionRate, setCommissionRate] = useState(0);
  const [loadingCommission, setLoadingCommission] = useState(false);
  const [error, setError] = useState(null);
  
  const basePrice = product.purchase_price || 0;
  const markupAmount = (basePrice * markupPercent) / 100;
  const customerPrice = basePrice + markupAmount;
  const commissionAmount = (markupAmount * commissionRate) / 100;
  const netProfit = markupAmount - commissionAmount;

  // Fetch commission rate whenever markup changes
  useEffect(() => {
    if (showCalculator && product.category_id) {
      fetchCommissionRate();
    }
  }, [markupPercent, showCalculator]);

  const fetchCommissionRate = async () => {
    if (!product.category_id) {
      setCommissionRate(5); // Default to 5% if no category
      return;
    }
    
    setLoadingCommission(true);
    setError(null);
    
    try {
      const markupAmount = (basePrice * markupPercent) / 100;
      
      const { data, error } = await supabase
        .rpc('calculate_commission', {
          p_seller_id: product.seller_id || product.user_id,
          p_category_id: product.category_id,
          p_product_id: product.id,
          p_amount: markupAmount,
          p_for_role: 'dropshipper'
        });

      if (error) throw error;
      
      // Ensure we have a valid number
      const rate = parseFloat(data) || 5;
      setCommissionRate(rate);
      
    } catch (error) {
      console.error('Error fetching commission:', error);
      setError('Could not load commission rate');
      setCommissionRate(5); // Default fallback
    } finally {
      setLoadingCommission(false);
    }
  };

  const getCommissionColor = () => {
    if (commissionRate <= 5) return 'text-green-600 dark:text-green-400';
    if (commissionRate <= 8) return 'text-yellow-600 dark:text-yellow-400';
    if (commissionRate <= 10) return 'text-kraft-600 dark:text-kraft-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      {/* Product Image */}
      <div className="relative h-48 bg-gray-100 dark:bg-gray-700">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
            <Package className="w-12 h-12" />
          </div>
        )}
        <div className="absolute top-2 right-2 flex gap-1">
          {product.condition && (
            <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 text-xs px-2 py-1 rounded">
              {product.condition}
            </span>
          )}
          {product.category && (
            <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400 text-xs px-2 py-1 rounded">
              {product.category}
            </span>
          )}
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-1 text-gray-900 dark:text-white">{product.name}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 line-clamp-2">{product.description}</p>

        {/* Seller & Location */}
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-3">
          <div className="flex items-center">
            <MapPin className="w-4 h-4 mr-1" />
            {product.location || 'N/A'}
          </div>
          <div className="flex items-center">
            <Percent className="w-4 h-4 mr-1 text-gray-400 dark:text-gray-500" />
            {product.seller_name || 'Seller'}
          </div>
        </div>

        {/* Base Price */}
        <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg mb-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Base Price:</span>
            <span className="font-bold text-lg text-gray-900 dark:text-white">{basePrice.toFixed(2)} MAD</span>
          </div>
        </div>

        {showCalculator ? (
          <div className="space-y-4">
            {/* Markup Slider */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Your Markup
                </label>
                <span className="text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 px-2 py-1 rounded">
                  {markupPercent}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={markupPercent}
                onChange={(e) => setMarkupPercent(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Commission & Profit Calculator */}
            {loadingCommission ? (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Calculating commission...</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-center">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Using default 5% rate</p>
              </div>
            ) : (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg space-y-3">
                <h4 className="font-semibold text-sm flex items-center gap-1 text-gray-900 dark:text-white">
                  <Info className="w-4 h-4" />
                  Profit Calculator
                </h4>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-900 dark:text-gray-100">
                    <span>Gross Markup:</span>
                    <span className="font-medium text-green-600 dark:text-green-400">
                      +{markupAmount.toFixed(2)} MAD
                    </span>
                  </div>

                  <div className="flex justify-between text-sm border-t border-blue-200 dark:border-blue-800 pt-2 text-gray-900 dark:text-gray-100">
                    <span className="flex items-center gap-1">
                      Dealtock Fee:
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getCommissionColor()} bg-white dark:bg-gray-800`}>
                        {commissionRate}%
                      </span>
                    </span>
                    <span className="font-medium text-kraft-600 dark:text-kraft-400">
                      -{commissionAmount.toFixed(2)} MAD
                    </span>
                  </div>

                  <div className="flex justify-between font-bold text-base border-t border-blue-200 dark:border-blue-800 pt-2 text-gray-900 dark:text-white">
                    <span>Your Net Profit:</span>
                    <span className="text-green-700 dark:text-green-400">
                      {netProfit.toFixed(2)} MAD
                    </span>
                  </div>

                  <div className="text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 p-2 rounded mt-2">
                    <div className="flex justify-between">
                      <span>Customer pays:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{customerPrice.toFixed(2)} MAD</span>
                    </div>
                    <div className="flex justify-between">
                      <span>+ Shipping:</span>
                      <span className="font-medium text-gray-900 dark:text-white">~25-35 MAD</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowCalculator(false)}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => onPlaceOrder({
                  ...product,
                  markup: markupPercent,
                  markupAmount: markupAmount,
                  commissionRate: commissionRate,
                  commissionAmount: commissionAmount,
                  netProfit: netProfit
                })}
                disabled={loadingCommission}
                className="flex-1 px-3 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg text-sm hover:from-blue-700 hover:to-blue-800 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loadingCommission ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Calculating...
                  </>
                ) : (
                  'Place Order'
                )}
              </button>
            </div>

            {/* Help Text */}
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              💡 Dealtock fee ({commissionRate}%) is deducted from your markup. Adjust your markup to maximize profit.
            </p>
          </div>
        ) : (
          <button
            onClick={() => setShowCalculator(true)}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition shadow-sm"
          >
            <TrendingUp className="w-4 h-4" />
            <span className="font-medium">Calculate Your Profit</span>
          </button>
        )}

        {/* Stock & Delivery Info */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
          <span className="flex items-center gap-1">
            <Package className="w-3 h-3" />
            Stock: {product.quantity || 0}
          </span>
          <span className="flex items-center gap-1">
            <Truck className="w-3 h-3" />
            Delivery: 2-4 days
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;