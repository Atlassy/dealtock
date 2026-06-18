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
    escrow_enabled: true,
    service_type: 'standard',
    // API fields
    base_url: '',
    api_key: '',
    api_secret: '',
    auth_endpoint: '/auth/login',
    create_endpoint: '/package',
    tracking_endpoint: '/package/{trackingID}',
    auth_type: 'apiKey_secretKey',
    supports_pickup: true,
    supports_tracking: true,
    supports_cod: true,
    supports_webhook: false
  });

  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name || '',
        contact_email: company.email || company.contact_email || '',
        contact_phone: company.phone || company.contact_phone || '',
        address: company.address || '',
        commission_rate: company.commission_rate?.toString() || '10.00',
        status: company.status || 'active',
        escrow_enabled: company.escrow_enabled ?? true,
        service_type: company.service_type || 'standard',
        // API fields
        base_url: company.base_url || '',
        api_key: company.api_key || '',
        api_secret: company.api_secret || '',
        auth_endpoint: company.auth_endpoint || '/auth/login',
        create_endpoint: company.create_endpoint || '/package',
        tracking_endpoint: company.tracking_endpoint || '/package/{trackingID}',
        auth_type: company.auth_type || 'apiKey_secretKey',
        supports_pickup: company.supports_pickup ?? true,
        supports_tracking: company.supports_tracking ?? true,
        supports_cod: company.supports_cod ?? true,
        supports_webhook: company.supports_webhook ?? false
      });
    } else {
      // Reset for new company
      setFormData({
        name: '',
        contact_email: '',
        contact_phone: '',
        address: '',
        commission_rate: '10.00',
        status: 'active',
        escrow_enabled: true,
        service_type: 'standard',
        base_url: '',
        api_key: '',
        api_secret: '',
        auth_endpoint: '/auth/login',
        create_endpoint: '/package',
        tracking_endpoint: '/package/{trackingID}',
        auth_type: 'apiKey_secretKey',
        supports_pickup: true,
        supports_tracking: true,
        supports_cod: true,
        supports_webhook: false
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

            {/* Contact Email */}
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Contact Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                <input
                  type="email"
                  name="contact_email"
                  value={formData.contact_email}
                  onChange={handleChange}
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
                  name="contact_phone"
                  value={formData.contact_phone}
                  onChange={handleChange}
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
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
                  rows="2"
                  placeholder="123 Main St, Casablanca, Morocco"
                />
              </div>
            </div>

            {/* API Configuration Section */}
            <div className="col-span-2 border-t border-gray-200 dark:border-gray-700 pt-4 mt-2">
              <h4 className="font-medium mb-3 flex items-center gap-2 text-gray-900 dark:text-white">
                <Key className="w-4 h-4" />
                API Configuration
              </h4>
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

            {/* API Key & Secret */}
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">API Key</label>
              <input
                type="text"
                name="api_key"
                value={formData.api_key}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg font-mono"
                placeholder="your-api-key"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">API Secret</label>
              <input
                type="text"
                name="api_secret"
                value={formData.api_secret}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg font-mono"
                placeholder="your-api-secret"
              />
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
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="supports_cod"
                    checked={formData.supports_cod}
                    onChange={handleChange}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Cash on Delivery</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="supports_webhook"
                    checked={formData.supports_webhook}
                    onChange={handleChange}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Webhook</span>
                </label>
              </div>
            </div>

            {/* Advanced API Configuration */}
            <div className="col-span-2">
              <details className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg p-3">
                <summary className="cursor-pointer text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium">
                  Advanced API Configuration
                </summary>
                <div className="mt-3 space-y-3">
                  <div>
                    <label className="block text-xs mb-1 text-gray-600 dark:text-gray-400">Auth Endpoint</label>
                    <input
                      type="text"
                      name="auth_endpoint"
                      value={formData.auth_endpoint}
                      onChange={handleChange}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs mb-1 text-gray-600 dark:text-gray-400">Create Endpoint</label>
                    <input
                      type="text"
                      name="create_endpoint"
                      value={formData.create_endpoint}
                      onChange={handleChange}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs mb-1 text-gray-600 dark:text-gray-400">Tracking Endpoint</label>
                    <input
                      type="text"
                      name="tracking_endpoint"
                      value={formData.tracking_endpoint}
                      onChange={handleChange}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm"
                      placeholder="/package/{trackingID}"
                    />
                  </div>
                  <div>
                    <label className="block text-xs mb-1 text-gray-600 dark:text-gray-400">Auth Type</label>
                    <select
                      name="auth_type"
                      value={formData.auth_type}
                      onChange={handleChange}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm"
                    >
                      <option value="apiKey_secretKey">API Key + Secret</option>
                      <option value="bearer_token">Bearer Token Only</option>
                      <option value="oauth2">OAuth2</option>
                    </select>
                  </div>
                </div>
              </details>
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
                  name="commission_rate"
                  value={formData.commission_rate}
                  onChange={handleChange}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
                />
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
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