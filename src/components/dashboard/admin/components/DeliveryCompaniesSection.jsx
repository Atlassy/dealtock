// src/components/dashboard/admin/components/DeliveryCompaniesSection.jsx
import React, { useState } from "react";
import { 
  Truck, 
  Plus, 
  Edit, 
  Trash2, 
  Download, 
  Search,
  RefreshCw,
  Key,
  Mail,
  Phone,
  MapPin,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "../../../../lib/supabaseClient";
import { useAuth } from "../../../../contexts/SupabaseAuthContext";
import DeliveryCompanyModal from '../modals/DeliveryCompanyModal';
import ApiKeysModal from '../modals/ApiKeysModal';

const DeliveryCompaniesSection = ({ companies: initialCompanies, onRefresh, onExport }) => {
  const { user } = useAuth();
  const [companies, setCompanies] = useState(initialCompanies);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [viewingApiKeys, setViewingApiKeys] = useState(null);

  // Filter companies
  const filteredCompanies = companies.filter(company => {
    const matchesSearch = searchTerm === '' || 
      company.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.contact_email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || company.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: companies.length,
    active: companies.filter(c => c.status === 'active').length,
    inactive: companies.filter(c => c.status === 'inactive').length,
    suspended: companies.filter(c => c.status === 'suspended').length,
    escrowEnabled: companies.filter(c => c.escrow_enabled).length
  };

  const handleSaveCompany = async (formData) => {
    try {
      setLoading(true);
      
      if (editingCompany) {
        const { error } = await supabase
          .from('delivery_companies')
          .update({
            ...formData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingCompany.id);

        if (error) throw error;
        toast.success('Company updated successfully');
      } else {
        const { error } = await supabase
          .from('delivery_companies')
          .insert([{
            ...formData,
            created_by: user.id
          }]);

        if (error) throw error;
        toast.success('Company added successfully');
      }

      setShowAddModal(false);
      setEditingCompany(null);
      onRefresh();
    } catch (error) {
      console.error('Error saving company:', error);
      toast.error('Failed to save company');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCompany = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) return;

    try {
      const { error } = await supabase
        .from('delivery_companies')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Company deleted');
      onRefresh();
    } catch (error) {
      console.error('Error deleting company:', error);
      toast.error('Failed to delete company');
    }
  };

  const handleToggleStatus = async (company) => {
    const newStatus = company.status === 'active' ? 'inactive' : 'active';
    
    try {
      const { error } = await supabase
        .from('delivery_companies')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', company.id);

      if (error) throw error;

      toast.success(`${company.name} ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
      onRefresh();
    } catch (error) {
      console.error('Error toggling status:', error);
      toast.error('Failed to update status');
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'active':
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Active</span>;
      case 'inactive':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Inactive</span>;
      case 'suspended':
        return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs flex items-center gap-1"><XCircle className="w-3 h-3" /> Suspended</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap gap-4 justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Truck className="w-6 h-6" />
            Delivery Partners
          </h2>
          <p className="text-gray-600 text-sm mt-1">
            Manage Moroccan delivery companies and their configurations
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onRefresh}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2 text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={onExport}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2 text-sm"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={() => {
              setEditingCompany(null);
              setShowAddModal(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Partner
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-600">Total Partners</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-600">Active</p>
          <p className="text-2xl font-bold text-green-600">{stats.active}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-600">Inactive</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.inactive}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-600">Escrow Enabled</p>
          <p className="text-2xl font-bold text-blue-600">{stats.escrowEnabled}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-600">Suspended</p>
          <p className="text-2xl font-bold text-red-600">{stats.suspended}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-lg w-full text-sm"
            />
          </div>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border rounded-lg min-w-[150px] text-sm"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {/* Companies Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-4 font-medium text-sm">Company</th>
                <th className="text-left p-4 font-medium text-sm">Contact</th>
                <th className="text-left p-4 font-medium text-sm">Commission</th>
                <th className="text-left p-4 font-medium text-sm">Escrow</th>
                <th className="text-left p-4 font-medium text-sm">Status</th>
                <th className="text-left p-4 font-medium text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCompanies.map(company => (
                <tr key={company.id} className="border-t hover:bg-gray-50">
                  <td className="p-4">
                    <div className="font-medium text-sm">{company.name}</div>
                    {company.address && (
                      <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" />
                        {company.address}
                      </div>
                    )}
                  </td>
                  <td className="p-4">
                    {company.contact_email && (
                      <div className="text-xs flex items-center gap-1">
                        <Mail className="w-3 h-3 text-gray-400" />
                        {company.contact_email}
                      </div>
                    )}
                    {company.contact_phone && (
                      <div className="text-xs flex items-center gap-1 mt-1">
                        <Phone className="w-3 h-3 text-gray-400" />
                        {company.contact_phone}
                      </div>
                    )}
                  </td>
                  <td className="p-4 text-sm font-medium">{company.commission_rate}%</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      company.escrow_enabled 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {company.escrow_enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => handleToggleStatus(company)}
                      className="hover:opacity-80 transition-opacity"
                    >
                      {getStatusBadge(company.status)}
                    </button>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingCompany(company);
                          setShowAddModal(true);
                        }}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setViewingApiKeys(company)}
                        className="p-1 text-purple-600 hover:bg-purple-50 rounded"
                        title="API Keys"
                      >
                        <Key className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCompany(company.id, company.name)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredCompanies.length === 0 && (
          <div className="text-center py-12">
            <Truck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No delivery companies found.</p>
            <button
              onClick={() => {
                setEditingCompany(null);
                setShowAddModal(true);
              }}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              Add Your First Partner
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      <DeliveryCompanyModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingCompany(null);
        }}
        company={editingCompany}
        onSave={handleSaveCompany}
        loading={loading}
      />

      <ApiKeysModal
        isOpen={!!viewingApiKeys}
        onClose={() => setViewingApiKeys(null)}
        company={viewingApiKeys}
      />
    </div>
  );
};

export default DeliveryCompaniesSection;