// src/components/dashboard/admin/modals/ApiKeysModal.jsx
import React, { useState, useEffect } from "react";
import { X, Key, Copy, RefreshCw, Globe, CheckCircle, Map, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "../../../../lib/supabaseClient";
import StatusMappingTab from './StatusMappingTab';

const ApiKeysModal = ({ isOpen, onClose, company, initialTab = 'api' }) => {
  const [showApiKey, setShowApiKey] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [unknownStatuses, setUnknownStatuses] = useState([]);
  const [loadingUnknown, setLoadingUnknown] = useState(false);

  // Update active tab when initialTab prop changes
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Fetch unknown statuses for this company
  useEffect(() => {
    if (isOpen && company && activeTab === 'mappings') {
      fetchUnknownStatuses();
    }
  }, [isOpen, company, activeTab]);

  const fetchUnknownStatuses = async () => {
    try {
      setLoadingUnknown(true);
      const { data, error } = await supabase
        .from('delivery_unknown_statuses')
        .select('*')
        .eq('delivery_company_id', company.id)
        .eq('resolved', false)
        .order('received_at', { ascending: false });

      if (error) throw error;
      setUnknownStatuses(data || []);
    } catch (error) {
      console.error('Error fetching unknown statuses:', error);
    } finally {
      setLoadingUnknown(false);
    }
  };

  if (!isOpen || !company) return null;

  const handleCopyApiKey = () => {
    navigator.clipboard.writeText(company.api_key || '');
    setCopied(true);
    toast.success('API key copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyWebhookUrl = () => {
    const webhookUrl = `${window.location.origin}/api/webhooks/delivery/${company.id}`;
    navigator.clipboard.writeText(webhookUrl);
    toast.success('Webhook URL copied to clipboard');
  };

  const handleRegenerateApiKey = async () => {
    if (!window.confirm('Are you sure you want to regenerate the API key? This will break existing integrations.')) {
      return;
    }

    try {
      setRegenerating(true);
      const newApiKey = `dc_${Math.random().toString(36).substr(2, 24)}_${Date.now().toString(36)}`;

      const { error } = await supabase
        .from('delivery_companies')
        .update({
          api_key: newApiKey,
          updated_at: new Date().toISOString()
        })
        .eq('id', company.id);

      if (error) throw error;

      toast.success('API key regenerated successfully');
      // Update the company object in parent component
      company.api_key = newApiKey;
    } catch (error) {
      console.error('Error regenerating API key:', error);
      toast.error('Failed to regenerate API key');
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Key className="w-5 h-5" />
                {company.name} Configuration
              </h3>
              <p className="text-gray-600 text-sm mt-1">Manage API keys and status mappings</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mt-4 border-b">
            <button
              className={`pb-2 px-1 font-medium text-sm ${
                activeTab === 'api'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('api')}
            >
              <Key className="w-4 h-4 inline mr-1" />
              API Credentials
            </button>
            <button
              className={`pb-2 px-1 font-medium text-sm ${
                activeTab === 'mappings'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('mappings')}
            >
              <Map className="w-4 h-4 inline mr-1" />
              Status Mappings
              {unknownStatuses.length > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-red-100 text-red-800 rounded-full">
                  {unknownStatuses.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 180px)' }}>
          {activeTab === 'api' ? (
            /* API Credentials Tab */
            <div className="space-y-6">
              {/* API Key Section */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <Key className="w-4 h-4" />
                    API Key
                  </h4>
                  <button
                    onClick={handleRegenerateApiKey}
                    disabled={regenerating}
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3 h-3 ${regenerating ? 'animate-spin' : ''}`} />
                    {regenerating ? 'Regenerating...' : 'Regenerate'}
                  </button>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input
                      type={showApiKey ? "text" : "password"}
                      readOnly
                      value={company.api_key || 'No API key configured'}
                      className="w-full px-3 py-2 bg-white border rounded-lg font-mono text-sm pr-10"
                    />
                    {company.api_key && (
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 text-xs"
                      >
                        {showApiKey ? 'Hide' : 'Show'}
                      </button>
                    )}
                  </div>
                  {company.api_key && (
                    <button
                      onClick={handleCopyApiKey}
                      className="px-3 py-2 border bg-white rounded-lg hover:bg-gray-50 flex items-center gap-1 text-sm"
                    >
                      {copied ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy
                        </>
                      )}
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Keep this key secret. It provides full access to the delivery API.
                </p>
              </div>

              {/* Webhook URL Section */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium flex items-center gap-2 mb-3">
                  <Globe className="w-4 h-4" />
                  Webhook URL
                </h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}/api/webhooks/delivery/${company.id}`}
                    className="flex-1 px-3 py-2 bg-white border rounded-lg text-sm font-mono"
                  />
                  <button
                    onClick={handleCopyWebhookUrl}
                    className="px-3 py-2 border bg-white rounded-lg hover:bg-gray-50 flex items-center gap-1 text-sm"
                  >
                    <Copy className="w-4 h-4" />
                    Copy
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Configure this URL in your delivery company's system to receive status updates.
                </p>
              </div>

              {/* API Documentation */}
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">API Endpoints</h4>
                <div className="space-y-3">
                  <div className="bg-blue-50 p-3 rounded border border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Update Order Status</span>
                      <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded">POST</span>
                    </div>
                    <code className="text-xs bg-white p-2 rounded block">
                      {window.location.origin}/api/webhooks/delivery/{company.id}
                    </code>
                    <p className="text-xs text-gray-600 mt-2">
                      Headers: <code className="bg-blue-100 px-1">X-API-Key: {company.api_key?.substring(0, 8)}...</code>
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Body: <code className="bg-blue-100 px-1">{'{ orderId, status, trackingCode, codAmount }'}</code>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Status Mappings Tab */
            <StatusMappingTab 
              companyId={company.id}
              companyName={company.name}
              unknownStatuses={unknownStatuses}
              onMappingAdded={() => {
                fetchUnknownStatuses();
                toast.success('Status mapping added');
              }}
            />
          )}
        </div>

        <div className="p-6 border-t">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApiKeysModal;