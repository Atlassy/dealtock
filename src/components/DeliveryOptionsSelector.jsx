// src/components/dashboard/admin/modals/DeliveryCompanyModal.jsx
import React, { useState, useEffect } from "react";
import { X, Save, Globe, Mail, Phone } from "lucide-react";

const DeliveryCompanyModal = ({ isOpen, onClose, company, onSave, loading }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    service_type: 'standard',
    base_fee_multiplier: '1.0',
    cod_fee: '10',
    is_active: true,
    supports_pickup: true,
    supports_tracking: false,
    escrow_enabled: true,
    base_url: ''
  });

  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name || '',
        email: company.email || '',
        phone: company.phone || '',
        service_type: company.service_type || 'standard',
        base_fee_multiplier: company.base_fee_multiplier?.toString() ?? '1.0',
        cod_fee: company.cod_fee?.toString() ?? '10',
        is_active: company.is_active ?? true,
        supports_pickup: company.supports_pickup ?? true,
        supports_tracking: company.supports_tracking ?? false,
        escrow_enabled: company.escrow_enabled ?? true,
        base_url: company.base_url || ''
      });
    } else {
      // Reset for new company
      setFormData({
        name: '',
        email: '',
        phone: '',
        service_type: 'standard',
        base_fee_multiplier: '1.0',
        cod_fee: '10',
        is_active: true,
        supports_pickup: true,
        supports_tracking: false,
        escrow_enabled: true,
        base_url: ''
      });
    }
  }, [company]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            {company ? 'Edit Delivery Partner' : 'Add New Delivery Partner'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg dark:text-gray-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Company Name */}
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Company Name <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Sendit Morocco"
                required
              />
            </div>

            {/* Service Type */}
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Service Type</label>
              <select
                name="service_type"
                value={formData.service_type}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
              >
                <option value="standard">Standard Delivery</option>
                <option value="express">Express Delivery</option>
                <option value="economy">Economy Delivery</option>
                <option value="same_day">Same Day Delivery</option>
              </select>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Email <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
                  placeholder="contact@company.com"
                  required
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Phone</label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
                  placeholder="+212 6XX XXX XXX"
                />
              </div>
            </div>

            {/* Base URL */}
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">API Base URL</label>
              <div className="relative">
                <Globe className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                <input
                  type="url"
                  name="base_url"
                  value={formData.base_url}
                  onChange={handleChange}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
                  placeholder="https://api.company.com/v1"
                />
              </div>
            </div>

            {/* Base Fee Multiplier */}
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Base Fee Multiplier</label>
              <input
                type="number"
                step="0.01"
                min="0"
                name="base_fee_multiplier"
                value={formData.base_fee_multiplier}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
                placeholder="1.0"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Multiplies the base delivery fee for this carrier (1.0 = no change)
              </p>
            </div>

            {/* COD Fee */}
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">COD Fee (MAD)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                name="cod_fee"
                value={formData.cod_fee}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
                placeholder="10"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Additional fee charged to the customer for Cash on Delivery orders. Use 0 if this partner does not charge extra for COD.
              </p>
            </div>

            {/* Supported Features */}
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Supported Features</label>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="supports_pickup"
                    checked={formData.supports_pickup}
                    onChange={handleChange}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Pickup</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="supports_tracking"
                    checked={formData.supports_tracking}
                    onChange={handleChange}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Tracking</span>
                </label>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Cash on Delivery is a mandatory acceptance criterion for all Dealtock delivery partners and is not configurable here.
              </p>
            </div>

            {/* Active */}
            <div className="col-span-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  className="rounded text-blue-600"
                />
                <span className="text-sm font-medium text-gray-900 dark:text-white">Active</span>
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-6">
                Inactive partners are excluded from delivery selection and cannot authenticate webhook calls.
              </p>
            </div>

            {/* Escrow Enabled */}
            <div className="col-span-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="escrow_enabled"
                  checked={formData.escrow_enabled}
                  onChange={handleChange}
                  className="rounded text-blue-600"
                />
                <span className="text-sm font-medium text-gray-900 dark:text-white">Enable Escrow for COD orders</span>
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-6">
                When enabled, funds from COD orders will be held in escrow for 3 days
              </p>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Saving...' : (company ? 'Update Partner' : 'Add Partner')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DeliveryCompanyModal;