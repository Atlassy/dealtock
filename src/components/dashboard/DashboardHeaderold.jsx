import React from 'react';
import { motion } from 'framer-motion';
import { Package, RefreshCw } from 'lucide-react';

const DashboardHeader = ({ 
  userEmail = '',
  userName = '',
  onRefresh, 
  productsLoading = false, 
  onAddProduct 
}) => {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 border-b border-white/10"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          {/* Left Side: Welcome Message */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                Welcome back, {userName || userEmail?.split('@')[0] || 'User'}
              </h2>
              {userEmail && (
                <p className="text-sm text-gray-300">
                  {userEmail}
                </p>
              )}
            </div>
          </div>

          {/* Right Side: Action Buttons */}
          <div className="flex items-center gap-3">
            {/* Refresh Button */}
            {onRefresh && (
              <button
                className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg hover:bg-white/20 transition-all flex items-center gap-2 text-white"
                onClick={onRefresh}
                disabled={productsLoading}
              >
                <RefreshCw className={`w-4 h-4 ${productsLoading ? 'animate-spin' : ''}`} />
                <span>
                  {productsLoading ? 'Refreshing...' : 'Refresh'}
                </span>
              </button>
            )}

            {/* Add Product Button */}
            {onAddProduct && (
              <button
                className="px-6 py-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg font-medium text-white hover:from-purple-600 hover:to-blue-600 transition-all flex items-center gap-2"
                onClick={onAddProduct}
              >
                <Package className="w-4 h-4" />
                <span>+ Add Product</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default DashboardHeader;