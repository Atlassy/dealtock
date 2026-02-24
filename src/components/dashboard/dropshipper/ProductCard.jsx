// components/dropshipper/ProductCard.jsx
import { useState } from 'react';
import { MapPin, Package, TrendingUp, Truck } from 'lucide-react';
import { calculatePotentialProfit } from '../../utils/pricing';

const ProductCard = ({ product, onPlaceOrder }) => {
  const [showCalculator, setShowCalculator] = useState(false);
  const [markupPercent, setMarkupPercent] = useState(20); // Default 20%
  
  const basePrice = product.purchase_price;
  const markupAmount = (basePrice * markupPercent) / 100;
  const customerPrice = basePrice + markupAmount;
  const profit = markupAmount;

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      {/* Product Image */}
      <div className="relative h-48 bg-gray-100">
        {product.image_url ? (
          <img 
            src={product.image_url} 
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <Package className="w-12 h-12" />
          </div>
        )}
        {product.condition && (
          <span className="absolute top-2 right-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
            {product.condition}
          </span>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-1">{product.name}</h3>
        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{product.description}</p>

        {/* Seller & Location */}
        <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
          <div className="flex items-center">
            <MapPin className="w-4 h-4 mr-1" />
            {product.location}
          </div>
          <div className="flex items-center">
            <Star className="w-4 h-4 mr-1 text-yellow-400" />
            {product.seller_rating?.toFixed(1) || 'New'}
          </div>
        </div>

        {/* Pricing */}
        <div className="border-t pt-3 mt-2">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Base Price:</span>
            <span className="font-medium">{basePrice} MAD</span>
          </div>

          {showCalculator ? (
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Your Markup (%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={markupPercent}
                  onChange={(e) => setMarkupPercent(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-sm">
                  <span>{markupPercent}%</span>
                  <span className="text-green-600">+{markupAmount} MAD</span>
                </div>
              </div>

              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex justify-between text-sm mb-1">
                  <span>Customer pays:</span>
                  <span className="font-bold">{customerPrice} MAD</span>
                </div>
                <div className="flex justify-between text-sm text-green-600">
                  <span>Your profit:</span>
                  <span className="font-bold">{profit} MAD</span>
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => setShowCalculator(false)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => onPlaceOrder(product)}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                >
                  Place Order
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowCalculator(true)}
              className="w-full flex items-center justify-center space-x-2 bg-gray-50 hover:bg-gray-100 text-gray-700 py-2 rounded-lg transition-colors"
            >
              <TrendingUp className="w-4 h-4" />
              <span>Calculate Your Profit</span>
            </button>
          )}
        </div>

        {/* Stock & Delivery */}
        <div className="flex items-center justify-between text-xs text-gray-500 mt-3">
          <span className="flex items-center">
            <Package className="w-3 h-3 mr-1" />
            Stock: {product.quantity}
          </span>
          <span className="flex items-center">
            <Truck className="w-3 h-3 mr-1" />
            {product.estimated_delivery_days || 2}-4 days
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;