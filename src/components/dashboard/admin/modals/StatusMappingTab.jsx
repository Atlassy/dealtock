// src/components/dashboard/admin/modals/StatusMappingTab.jsx
import React, { useState, useEffect } from "react";
import { Map, Plus, Trash2, AlertCircle, CheckCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "../../../../lib/supabaseClient";

// Your internal order statuses
const INTERNAL_STATUSES = [
  'ordered', 'approved', 'processing', 'ready_for_pickup',
  'picked_up', 'in_transit', 'delivered',
  'cancelled', 'returned', 'failed', 'refunded'
];

const StatusMappingTab = ({ companyId, companyName, unknownStatuses, onMappingAdded }) => {
  const [mappings, setMappings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newMapping, setNewMapping] = useState({
    delivery_company_status: '',
    internal_status: 'in_transit'
  });

  // Fetch existing mappings
  useEffect(() => {
    fetchMappings();
  }, [companyId]);

  const fetchMappings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('delivery_status_mappings')
        .select('*')
        .eq('delivery_company_id', companyId)
        .order('created_at');

      if (error) throw error;
      setMappings(data || []);
    } catch (error) {
      console.error('Error fetching mappings:', error);
      toast.error('Failed to load status mappings');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMapping = async () => {
    if (!newMapping.delivery_company_status.trim()) {
      toast.error('Please enter a delivery company status');
      return;
    }

    try {
      const { error } = await supabase
        .from('delivery_status_mappings')
        .insert({
          delivery_company_id: companyId,
          delivery_company_status: newMapping.delivery_company_status.trim(),
          internal_status: newMapping.internal_status,
          is_active: true
        });

      if (error) {
        if (error.code === '23505') { // Unique violation
          toast.error('This status mapping already exists');
        } else {
          throw error;
        }
        return;
      }

      toast.success('Status mapping added');
      setNewMapping({ delivery_company_status: '', internal_status: 'in_transit' });
      fetchMappings();
      
      // If this was an unknown status, mark it as resolved
      if (unknownStatuses.some(u => u.received_status === newMapping.delivery_company_status.trim())) {
        await supabase
          .from('delivery_unknown_statuses')
          .update({ resolved: true })
          .eq('delivery_company_id', companyId)
          .eq('received_status', newMapping.delivery_company_status.trim());
      }
      
      onMappingAdded();
    } catch (error) {
      console.error('Error adding mapping:', error);
      toast.error('Failed to add status mapping');
    }
  };

  const handleDeleteMapping = async (mappingId) => {
    if (!window.confirm('Are you sure you want to delete this mapping?')) return;

    try {
      const { error } = await supabase
        .from('delivery_status_mappings')
        .delete()
        .eq('id', mappingId);

      if (error) throw error;

      toast.success('Mapping deleted');
      fetchMappings();
    } catch (error) {
      console.error('Error deleting mapping:', error);
      toast.error('Failed to delete mapping');
    }
  };

  const handleUseUnknownStatus = (status) => {
    setNewMapping({
      ...newMapping,
      delivery_company_status: status
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-gray-400 dark:text-gray-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Unknown Statuses Alert */}
      {unknownStatuses.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-800 dark:text-yellow-400">Unknown Statuses Received</h4>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                {companyName} has sent statuses that don't have mappings yet:
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {unknownStatuses.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleUseUnknownStatus(item.received_status)}
                    className="px-3 py-1 bg-white dark:bg-gray-800 border border-yellow-300 dark:border-yellow-700 rounded-full text-sm hover:bg-yellow-50 dark:hover:bg-yellow-900/30 dark:text-gray-200 flex items-center gap-2"
                  >
                    <span className="font-mono">"{item.received_status}"</span>
                    <Plus className="w-3 h-3" />
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(item.received_at).toLocaleDateString()}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add New Mapping */}
      <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
        <h4 className="font-medium mb-3 flex items-center gap-2 text-gray-900 dark:text-white">
          <Plus className="w-4 h-4" />
          Add New Status Mapping
        </h4>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Delivery company status (e.g., 'ramasse', 'en_cours')"
            value={newMapping.delivery_company_status}
            onChange={(e) => setNewMapping({ ...newMapping, delivery_company_status: e.target.value })}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm"
          />
          <select
            value={newMapping.internal_status}
            onChange={(e) => setNewMapping({ ...newMapping, internal_status: e.target.value })}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm min-w-[150px]"
          >
            {INTERNAL_STATUSES.map(status => (
              <option key={status} value={status}>
                {status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
              </option>
            ))}
          </select>
          <button
            onClick={handleAddMapping}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            Add Mapping
          </button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Map their API status to your internal status. Example: "ramasse" → "picked_up"
        </p>
      </div>

      {/* Existing Mappings */}
      <div>
        <h4 className="font-medium mb-3 text-gray-900 dark:text-white">Current Mappings</h4>
        {mappings.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <Map className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">No status mappings configured yet</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              Add mappings above to translate {companyName}'s statuses
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {mappings.map((mapping) => (
              <div
                key={mapping.id}
                className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-blue-100 dark:bg-blue-900/30 px-3 py-1 rounded">
                    <code className="text-sm text-blue-800 dark:text-blue-400">"{mapping.delivery_company_status}"</code>
                  </div>
                  <span className="text-gray-400 dark:text-gray-500">→</span>
                  <div className="bg-green-100 dark:bg-green-900/30 px-3 py-1 rounded">
                    <span className="text-sm text-green-800 dark:text-green-400 font-medium">
                      {mapping.internal_status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteMapping(mapping.id)}
                  className="p-1 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                  title="Delete mapping"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Reference */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <h4 className="font-medium mb-3 text-gray-900 dark:text-white">Your Internal Statuses</h4>
        <div className="grid grid-cols-2 gap-2">
          {INTERNAL_STATUSES.map(status => (
            <div key={status} className="text-sm">
              <span className="font-mono bg-gray-100 dark:bg-gray-700 dark:text-gray-200 px-2 py-1 rounded text-xs">
                {status}
              </span>
              <span className="text-gray-500 dark:text-gray-400 ml-2 text-xs">
                {status === 'ordered' && 'Order created'}
                {status === 'approved' && 'Seller approved'}
                {status === 'processing' && 'Being processed'}
                {status === 'ready_for_pickup' && 'Ready for pickup'}
                {status === 'picked_up' && 'Picked up by delivery'}
                {status === 'in_transit' && 'In transit to customer'}
                {status === 'delivered' && 'Delivered'}
                {status === 'cancelled' && 'Cancelled'}
                {status === 'returned' && 'Returned'}
                {status === 'failed' && 'Delivery failed'}
                {status === 'refunded' && 'Refunded'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StatusMappingTab;