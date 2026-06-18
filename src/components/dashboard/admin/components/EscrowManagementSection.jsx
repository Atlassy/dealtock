// src/components/dashboard/admin/components/EscrowManagementSection.jsx
import React, { useState, useEffect } from "react";
import { 
  Shield, 
  DollarSign, 
  CheckCircle, 
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
  Download,
  Eye,
  Clock,
  Calendar,
  User,
  Truck,
  Package,
  X
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "../../../../lib/supabaseClient";

// Helper functions
const formatCurrency = (amount, currency = 'MAD') => {
  return new Intl.NumberFormat('fr-MA', { style: 'currency', currency }).format(amount || 0);
};

const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('fr-MA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const formatDateTime = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleString('fr-MA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const downloadCSV = (data, filename) => {
  if (!data || data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(','),
    ...data.map(row => headers.map(header => JSON.stringify(row[header] || '')).join(','))
  ].join('\n');
  
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
};

const EscrowManagementSection = ({ escrows: initialEscrows, onRefresh, onBulkRelease, onExport }) => {
  const [escrows, setEscrows] = useState(initialEscrows || []);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedEscrows, setSelectedEscrows] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [releasingIds, setReleasingIds] = useState(new Set());
  const [selectedEscrow, setSelectedEscrow] = useState(null);

  // Update escrows when prop changes
  useEffect(() => {
    setEscrows(initialEscrows || []);
  }, [initialEscrows]);

  // Calculate days held
  const getDaysHeld = (heldAt) => {
    if (!heldAt) return 0;
    const held = new Date(heldAt);
    const now = new Date();
    return Math.floor((now - held) / (1000 * 60 * 60 * 24));
  };

  // Calculate escrow statistics
  const stats = {
    total: escrows.length,
    pending: escrows.filter(e => !e.released_at).length,
    released: escrows.filter(e => e.released_at).length,
    totalAmount: escrows.reduce((sum, e) => sum + (e.amount_held || 0), 0),
    pendingAmount: escrows.filter(e => !e.released_at).reduce((sum, e) => sum + (e.amount_held || 0), 0),
    releasedAmount: escrows.filter(e => e.released_at).reduce((sum, e) => sum + (e.amount_held || 0), 0)
  };

  // Filter escrows based on search and status
  const filteredEscrows = escrows
    .filter(escrow => {
      // Status filter
      if (statusFilter === 'pending') return !escrow.released_at;
      if (statusFilter === 'released') return escrow.released_at;
      return true; // 'all'
    })
    .filter(escrow => {
      // Search filter
      if (!searchTerm) return true;
      
      const orderNumber = escrow.orders?.order_number?.toLowerCase() || '';
      const companyName = escrow.delivery_companies?.name?.toLowerCase() || '';
      const searchLower = searchTerm.toLowerCase();
      
      return orderNumber.includes(searchLower) || companyName.includes(searchLower);
    });

  // Get status color and text
  const getEscrowStatus = (escrow) => {
    if (escrow.released_at) {
      return {
        label: 'Released',
        color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
        icon: CheckCircle
      };
    }
    
    return {
      label: 'Pending',
      color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      icon: AlertCircle
    };
  };

  // Handle individual release
  const handleReleaseEscrow = async (escrowId) => {
    const escrow = escrows.find(e => e.id === escrowId);
    if (!escrow) return;

    if (!window.confirm(`Release escrow for order ${escrow.orders?.order_number || escrow.order_id}?`)) {
      return;
    }

    try {
      setReleasingIds(prev => new Set([...prev, escrowId]));

      const { error } = await supabase
        .from('escrow_holdings')
        .update({ 
          released_at: new Date().toISOString(),
          release_reason: 'admin_release'
        })
        .eq('id', escrowId)
        .is('released_at', null);

      if (error) throw error;

      toast.success('Escrow released successfully');
      onRefresh();
    } catch (error) {
      console.error('Error releasing escrow:', error);
      toast.error('Failed to release escrow');
    } finally {
      setReleasingIds(prev => {
        const next = new Set(prev);
        next.delete(escrowId);
        return next;
      });
    }
  };

  // Handle bulk release
  const handleBulkRelease = async () => {
    if (selectedEscrows.length === 0) {
      toast.warning('No escrows selected');
      return;
    }

    const selectedAmount = escrows
      .filter(e => selectedEscrows.includes(e.id))
      .reduce((sum, e) => sum + (e.amount_held || 0), 0);

    if (!window.confirm(`Release ${selectedEscrows.length} escrow(s) totaling ${formatCurrency(selectedAmount)}?`)) {
      return;
    }

    try {
      // Call the parent's bulk release function
      if (onBulkRelease) {
        await onBulkRelease(selectedEscrows);
      } else {
        // Fallback direct update if parent function not provided
        const { error } = await supabase
          .from('escrow_holdings')
          .update({ 
            released_at: new Date().toISOString(),
            release_reason: 'bulk_admin_release'
          })
          .in('id', selectedEscrows)
          .is('released_at', null);

        if (error) throw error;
        toast.success(`${selectedEscrows.length} escrow(s) released`);
        onRefresh();
      }
      
      setSelectedEscrows([]);
      setSelectAll(false);
    } catch (error) {
      console.error('Bulk release error:', error);
      toast.error('Failed to release some escrows');
    }
  };

  // Selection handlers
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedEscrows([]);
    } else {
      const pendingEscrows = filteredEscrows
        .filter(e => !e.released_at)
        .map(e => e.id);
      setSelectedEscrows(pendingEscrows);
    }
    setSelectAll(!selectAll);
  };

  const handleSelectEscrow = (escrowId) => {
    setSelectedEscrows(prev => {
      if (prev.includes(escrowId)) {
        return prev.filter(id => id !== escrowId);
      } else {
        return [...prev, escrowId];
      }
    });
    setSelectAll(false);
  };

  // Export data
  const handleExport = () => {
    const exportData = filteredEscrows.map(e => ({
      'Order Number': e.orders?.order_number || 'N/A',
      'Order ID': e.order_id,
      'Delivery Company': e.delivery_companies?.name || 'N/A',
      'Amount': e.amount_held,
      'Currency': e.currency || 'MAD',
      'Status': e.released_at ? 'Released' : 'Pending',
      'Held Date': formatDate(e.held_at),
      'Released Date': e.released_at ? formatDate(e.released_at) : '',
      'Days Held': getDaysHeld(e.held_at)
    }));
    
    downloadCSV(exportData, 'escrows');
    toast.success('Escrow data exported');
  };

  const pendingCount = filteredEscrows.filter(e => !e.released_at).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap gap-4 justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Shield className="w-6 h-6" />
            Escrow Management
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            Manage COD funds held for delivery partners
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-200 flex items-center gap-2 text-sm"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={onRefresh}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-200 flex items-center gap-2 text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          {selectedEscrows.length > 0 && (
            <button
              onClick={handleBulkRelease}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm"
            >
              <CheckCircle className="w-4 h-4" />
              Release Selected ({selectedEscrows.length})
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Escrows</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{formatCurrency(stats.totalAmount)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">Pending Release</p>
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pending}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{formatCurrency(stats.pendingAmount)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">Released</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.released}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{formatCurrency(stats.releasedAmount)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Value</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(stats.totalAmount)}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">All escrows combined</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search by order number or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg w-full text-sm"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400 dark:text-gray-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg min-w-[150px] text-sm"
          >
            <option value="pending">Pending Only</option>
            <option value="released">Released</option>
            <option value="all">All Escrows</option>
          </select>
        </div>
      </div>

      {/* Escrows Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-4 w-10">
                  <input
                    type="checkbox"
                    checked={selectAll && pendingCount > 0}
                    onChange={handleSelectAll}
                    disabled={pendingCount === 0}
                    className="rounded"
                  />
                </th>
                <th className="text-left p-4 font-medium text-sm">Order Details</th>
                <th className="text-left p-4 font-medium text-sm">Delivery Partner</th>
                <th className="text-left p-4 font-medium text-sm">Amount</th>
                <th className="text-left p-4 font-medium text-sm">Status</th>
                <th className="text-left p-4 font-medium text-sm">Held Since</th>
                <th className="text-left p-4 font-medium text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEscrows.map(escrow => {
                const status = getEscrowStatus(escrow);
                const StatusIcon = status.icon;
                const daysHeld = getDaysHeld(escrow.held_at);
                const isReleasing = releasingIds.has(escrow.id);
                
                return (
                  <tr key={escrow.id} className="border-t hover:bg-gray-50">
                    <td className="p-4">
                      {!escrow.released_at && (
                        <input
                          type="checkbox"
                          checked={selectedEscrows.includes(escrow.id)}
                          onChange={() => handleSelectEscrow(escrow.id)}
                          className="rounded"
                        />
                      )}
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-sm">
                        {escrow.orders?.order_number || 'N/A'}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        <Package className="w-3 h-3" />
                        ID: {escrow.order_id?.substring(0, 8)}...
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        <Truck className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">
                          {escrow.delivery_companies?.name || 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-green-700">
                        {formatCurrency(escrow.amount_held, escrow.currency)}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1 ${status.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {status.label}
                        </span>
                        {!escrow.released_at && (
                          <div className="text-xs text-gray-500">
                            <Clock className="w-3 h-3 inline mr-1" />
                            {daysHeld} day{daysHeld !== 1 ? 's' : ''} held
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          {formatDate(escrow.held_at)}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedEscrow(escrow)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {!escrow.released_at && (
                          <button
                            onClick={() => handleReleaseEscrow(escrow.id)}
                            disabled={isReleasing}
                            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs font-medium disabled:opacity-50"
                          >
                            {isReleasing ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                              'Release'
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredEscrows.length === 0 && (
          <div className="text-center py-12">
            <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No escrows found matching your filters.</p>
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('pending');
              }}
              className="mt-4 text-sm text-blue-600 hover:text-blue-800"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Escrow Details Modal */}
      {selectedEscrow && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-lg">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold">Escrow Details</h3>
              <button 
                onClick={() => setSelectedEscrow(null)} 
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Order Number</p>
                  <p className="font-medium">{selectedEscrow.orders?.order_number || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Order ID</p>
                  <p className="text-sm font-mono">{selectedEscrow.order_id}</p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Amount Held</p>
                <p className="text-2xl font-bold text-green-700">
                  {formatCurrency(selectedEscrow.amount_held, selectedEscrow.currency)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Delivery Company</p>
                  <p className="font-medium">{selectedEscrow.delivery_companies?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Days Held</p>
                  <p className="font-medium">{getDaysHeld(selectedEscrow.held_at)} days</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-500">Held Since</p>
                <p className="font-medium">{formatDateTime(selectedEscrow.held_at)}</p>
              </div>

              {selectedEscrow.released_at && (
                <div>
                  <p className="text-xs text-gray-500">Released At</p>
                  <p className="font-medium">{formatDateTime(selectedEscrow.released_at)}</p>
                </div>
              )}

              <div className="border-t pt-4 flex justify-end gap-3">
                <button
                  onClick={() => setSelectedEscrow(null)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
                {!selectedEscrow.released_at && (
                  <button
                    onClick={() => {
                      handleReleaseEscrow(selectedEscrow.id);
                      setSelectedEscrow(null);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Release Escrow
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EscrowManagementSection;