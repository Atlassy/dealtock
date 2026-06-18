// src/components/dashboard/admin/modals/DeliveryCompanyModal.jsx
import React, { useState, useEffect } from "react";
import { X, Save, Key, Globe, Mail, Phone, MapPin, Percent } from "lucide-react";

const DeliveryCompanyModal = ({ isOpen, onClose, company, onSave, loading }) => {
  const [formData, setFormData] = useState({
    name: '',
    contact_email: '',
    contact_phone: '',
    address: '',
    commission_rate: '10.00',
    status: 'active',
    api_key: '',
    base_url: '',
    escrow_enabled: true,
    service_type: 'standard'
  });

  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name || '',
        contact_email: company.contact_email || '',
        contact_phone: company.contact_phone || '',
        address: company.address || '',
        commission_rate: company.commission_rate?.toString() || '10.00',
        status: company.status || 'active',
        api_key: company.api_key || generateApiKey(),
        base_url: company.base_url || '',
        escrow_enabled: company.escrow_enabled ?? true,
        service_type: company.service_type || 'standard'
      });
    } else {
      setFormData({
        name: '',
        contact_email: '',
        contact_phone: '',
        address: '',
        commission_rate: '10.00',
        status: 'active',
        api_key: generateApiKey(),
        base_url: '',
        escrow_enabled: true,
        service_type: 'standard'
      });
    }
  }, [company]);

  const generateApiKey = () => {
    return `dc_${Math.random().toString(36).substr(2, 24)}_${Date.now().toString(36)}`;
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
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Sendit Morocco"
              />
            </div>

            {/* Service Type */}
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Service Type</label>
              <select
                value={formData.service_type}
                onChange={(e) => setFormData({...formData, service_type: e.target.value})}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
              >
                <option value="standard">Standard Delivery</option>
                <option value="express">Express Delivery</option>
                <option value="economy">Economy Delivery</option>
                <option value="same_day">Same Day Delivery</option>
              </select>
            </div>

            {/* Contact Email */}
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Contact Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                <input
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({...formData, contact_email: e.target.value})}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
                  placeholder="contact@company.com"
                />
              </div>
            </div>

            {/* Contact Phone */}
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Contact Phone</label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                <input
                  type="tel"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({...formData, contact_phone: e.target.value})}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
                  placeholder="+212 6XX XXX XXX"
                />
              </div>
            </div>

            {/* Address */}
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Address</label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3 top-3 text-gray-400 dark:text-gray-500" />
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
                  rows="2"
                  placeholder="123 Main St, Casablanca, Morocco"
                />
              </div>
            </div>

            {/* API Configuration */}
            <div className="col-span-2 border-t border-gray-200 dark:border-gray-700 pt-4 mt-2">
              <h4 className="font-medium mb-3 flex items-center gap-2 text-gray-900 dark:text-white">
                <Key className="w-4 h-4" />
                API Configuration
              </h4>
            </div>

            {/* API Base URL */}
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">API Base URL</label>
              <div className="relative">
                <Globe className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                <input
                  type="url"
                  value={formData.base_url}
                  onChange={(e) => setFormData({...formData, base_url: e.target.value})}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
                  placeholder="https://api.company.com/v1"
                />
              </div>
            </div>

            {/* API Key */}
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">API Key</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Key className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                  <input
                    type="text"
                    value={formData.api_key}
                    onChange={(e) => setFormData({...formData, api_key: e.target.value})}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg font-mono text-sm"
                    placeholder="dc_xxxxxxxxxxxxxxxx"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({...formData, api_key: generateApiKey()})}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-200 text-sm"
                >
                  Regenerate
                </button>
              </div>
            </div>

            {/* Commission Rate */}
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Commission Rate (%)</label>
              <div className="relative">
                <Percent className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.commission_rate}
                  onChange={(e) => setFormData({...formData, commission_rate: e.target.value})}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
                />
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>

            {/* Escrow Enabled */}
            <div className="col-span-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.escrow_enabled}
                  onChange={(e) => setFormData({...formData, escrow_enabled: e.target.checked})}
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