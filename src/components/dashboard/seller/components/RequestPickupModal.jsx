// src/components/dashboard/seller/components/RequestPickupModal.jsx
import React, { useState } from 'react';
import { 
  X, 
  Package, 
  Scale, 
  Ruler, 
  FileText, 
  DollarSign,
  AlertCircle 
} from 'lucide-react';
import { toast } from 'sonner';

const RequestPickupModal = ({ order, company, onConfirm, onClose }) => {
  const [packageDetails, setPackageDetails] = useState({
    weight: 1.0,
    dimensions: { length: 20, width: 15, height: 10 },
    description: '',
    deliveryFee: 0,
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (!packageDetails.weight || packageDetails.weight <= 0) {
      newErrors.weight = 'Weight must be greater than 0';
    }
    
    if (!packageDetails.dimensions.length || packageDetails.dimensions.length <= 0) {
      newErrors.length = 'Length must be greater than 0';
    }
    
    if (!packageDetails.dimensions.width || packageDetails.dimensions.width <= 0) {
      newErrors.width = 'Width must be greater than 0';
    }
    
    if (!packageDetails.dimensions.height || packageDetails.dimensions.height <= 0) {
      newErrors.height = 'Height must be greater than 0';
    }
    
    if (!packageDetails.description?.trim()) {
      newErrors.description = 'Description is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fill in all required fields correctly');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delivery-integration`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            orderId: order.id,
            companyId: company.id,
            action: 'create',
            data: packageDetails
          })
        }
      );

      const result = await response.json();
      
      if (!response.ok) throw new Error(result.error);
      
      if (result.success) {
        toast.success(`Pickup requested successfully! Tracking: ${result.trackingId}`);
        onConfirm(result.trackingId);
        onClose();
      }
    } catch (error) {
      console.error('Error requesting pickup:', error);
      toast.error(error.message || 'Failed to request pickup');
    } finally {
      setLoading(false);
    }
  };

  const handleDimensionChange = (dimension, value) => {
    setPackageDetails({
      ...packageDetails,
      dimensions: {
        ...packageDetails.dimensions,
        [dimension]: parseInt(value) || 0
      }
    });
    // Clear error for this dimension
    if (errors[dimension]) {
      setErrors({ ...errors, [dimension]: null });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-4 border-b border-amber-100 sticky top-0 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Package className="w-5 h-5 text-amber-600" />
              Request Pickup
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Order #{order.order_number || order.id.substring(0, 8)} with {company.name}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-amber-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Package Weight */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
              <Scale className="w-4 h-4" />
              Package Weight (kg) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              value={packageDetails.weight}
              onChange={(e) => {
                setPackageDetails({...packageDetails, weight: parseFloat(e.target.value)});
                if (errors.weight) setErrors({...errors, weight: null});
              }}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 ${
                errors.weight ? 'border-red-500 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="1.0"
            />
            {errors.weight && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.weight}
              </p>
            )}
          </div>

          {/* Package Dimensions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
              <Ruler className="w-4 h-4" />
              Package Dimensions (cm) <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <input
                  type="number"
                  placeholder="Length"
                  value={packageDetails.dimensions.length}
                  onChange={(e) => handleDimensionChange('length', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 ${
                    errors.length ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                />
              </div>
              <div>
                <input
                  type="number"
                  placeholder="Width"
                  value={packageDetails.dimensions.width}
                  onChange={(e) => handleDimensionChange('width', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 ${
                    errors.width ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                />
              </div>
              <div>
                <input
                  type="number"
                  placeholder="Height"
                  value={packageDetails.dimensions.height}
                  onChange={(e) => handleDimensionChange('height', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 ${
                    errors.height ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                />
              </div>
            </div>
            {(errors.length || errors.width || errors.height) && (
              <p className="text-xs text-red-500 mt-1">
                All dimensions must be greater than 0
              </p>
            )}
          </div>

          {/* Package Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
              <FileText className="w-4 h-4" />
              Package Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={packageDetails.description}
              onChange={(e) => {
                setPackageDetails({...packageDetails, description: e.target.value});
                if (errors.description) setErrors({...errors, description: null});
              }}
              rows="3"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 ${
                errors.description ? 'border-red-500 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Brief description of the package contents..."
            />
            {errors.description && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.description}
              </p>
            )}
          </div>

          {/* Delivery Fee (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
              <DollarSign className="w-4 h-4" />
              Delivery Fee (MAD)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={packageDetails.deliveryFee}
              onChange={(e) => setPackageDetails({
                ...packageDetails, 
                deliveryFee: parseFloat(e.target.value) || 0
              })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              placeholder="0.00"
            />
            <p className="text-xs text-gray-500 mt-1">
              Leave empty if delivery fee is calculated by {company.name}
            </p>
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional Notes
            </label>
            <input
              type="text"
              value={packageDetails.notes}
              onChange={(e) => setPackageDetails({...packageDetails, notes: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              placeholder="Gate code, special instructions, etc."
            />
          </div>

          {/* Order Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-sm mb-2">Order Summary</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Customer:</span>
                <span className="font-medium">{order.customer_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">City:</span>
                <span className="font-medium">{order.shipping_city}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Address:</span>
                <span className="font-medium truncate max-w-[200px]">
                  {order.customer_address}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg hover:from-amber-700 hover:to-orange-700 transition font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Processing...
                </>
              ) : (
                'Request Pickup'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RequestPickupModal;