// src/components/marketplace/components/OrderConfirmation.jsx
import React from 'react';
import { CheckCircle, X } from 'lucide-react';

export default function OrderConfirmation({ order, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl max-w-md w-full p-6 relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>
        
        <div className="text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Order Placed Successfully!
          </h2>
          
          <p className="text-gray-600 mb-4">
            Your order has been created and will be processed soon.
          </p>
          
          {order && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm text-gray-500">Order Number</p>
              <p className="font-mono font-medium">{order.order_number}</p>
              
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-sm text-gray-500">Total Amount</p>
                <p className="text-xl font-bold text-primary">
                  {order.final_customer_price?.toFixed(2)} MAD
                </p>
              </div>
            </div>
          )}
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Continue Shopping
            </button>
            <button
              onClick={() => {
                onClose();
                // Navigate to orders page
                window.location.href = '/dashboard/dropshipper?tab=orders';
              }}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              View Orders
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}