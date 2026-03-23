// src/components/dashboard/admin/DeliveryCompaniesSection.jsx
import React, { useState } from "react";
import { 
  Truck, Plus, Edit, Trash2, Key, Map, 
  RefreshCw, Download, Search, Filter 
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "../../../../lib/supabaseClient";
import DeliveryCompanyModal from "../modals/DeliveryCompanyModal";
import ApiKeysModal from "../modals/ApiKeysModal";

const DeliveryCompaniesSection = ({ companies, onRefresh, onExport }) => {
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);
  const [apiModalInitialTab, setApiModalInitialTab] = useState('api');

  const filteredCompanies = companies.filter(company => {
    const matchesSearch = company.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         company.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || company.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAdd = () => {
    setSelectedCompany(null);
    setIsModalOpen(true);
  };

  const handleEdit = (company) => {
    setSelectedCompany(company);
    setIsModalOpen(true);
  };

  const handleDelete = async (companyId) => {
    if (!window.confirm('Are you sure you want to delete this delivery company?')) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('delivery_companies')
        .delete()
        .eq('id', companyId);

      if (error) throw error;

      toast.success('Delivery company deleted');
      onRefresh();
    } catch (error) {
      console.error('Error deleting company:', error);
      toast.error('Failed to delete company');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (formData) => {
    try {
      setLoading(true);
      
      if (selectedCompany) {
        // Update existing
        const { error } = await supabase
          .from('delivery_companies')
          .update({
            name: formData.name,
            email: formData.contact_email,
            phone: formData.contact_phone,
            address: formData.address,
            commission_rate: parseFloat(formData.commission_rate),
            status: formData.status,
            escrow_enabled: formData.escrow_enabled,
            service_type: formData.service_type,
            base_url: formData.base_url,
            api_key: formData.api_key,
            api_secret: formData.api_secret,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedCompany.id);

        if (error) throw error;
        toast.success('Delivery company updated');
      } else {
        // Create new
        const { error } = await supabase
          .from('delivery_companies')
          .insert({
            name: formData.name,
            email: formData.contact_email,
            phone: formData.contact_phone,
            address: formData.address,
            commission_rate: parseFloat(formData.commission_rate),
            status: formData.status,
            escrow_enabled: formData.escrow_enabled,
            service_type: formData.service_type,
            base_url: formData.base_url,
            api_key: formData.api_key,
            api_secret: formData.api_secret,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (error) throw error;
        toast.success('Delivery company added');
      }

      setIsModalOpen(false);
      onRefresh();
    } catch (error) {
      console.error('Error saving company:', error);
      toast.error('Failed to save company');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenApiModal = (company, tab = 'api') => {
    setSelectedCompany(company);
    setApiModalInitialTab(tab);
    setIsApiModalOpen(true);
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
            Manage your delivery company integrations
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleAdd}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Partner
          </button>
          <button
            onClick={onExport}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2 text-sm"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={onRefresh}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2 text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search companies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-lg w-full text-sm"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Companies Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-4 font-medium text-sm">Company</th>
                <th className="text-left p-4 font-medium text-sm">Contact</th>
                <th className="text-left p-4 font-medium text-sm">Service Type</th>
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
                    <div className="font-medium">{company.name}</div>
                    <div className="text-xs text-gray-500">{company.email}</div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm">{company.phone || 'N/A'}</div>
                    <div className="text-xs text-gray-500">{company.address || 'No address'}</div>
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                      {company.service_type || 'standard'}
                    </span>
                  </td>
                  <td className="p-4 font-medium">
                    {company.commission_rate || 10}%
                  </td>
                  <td className="p-4">
                    {company.escrow_enabled ? (
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                        Enabled
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
                        Disabled
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      company.status === 'active' 
                        ? 'bg-green-100 text-green-800'
                        : company.status === 'inactive'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {company.status || 'active'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {/* Edit button */}
                      <button
                        onClick={() => handleEdit(company)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        title="Edit Company"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      
                      {/* API Configuration button - opens API tab */}
                      <button
                        onClick={() => handleOpenApiModal(company, 'api')}
                        className="p-1 text-purple-600 hover:bg-purple-50 rounded"
                        title="API Configuration"
                      >
                        <Key className="w-4 h-4" />
                      </button>
                      
                      {/* Status Mappings button - opens Mappings tab */}
                      <button
                        onClick={() => handleOpenApiModal(company, 'mappings')}
                        className="p-1 text-green-600 hover:bg-green-50 rounded"
                        title="Status Mappings"
                      >
                        <Map className="w-4 h-4" />
                      </button>
                      
                      {/* Delete button */}
                      <button
                        onClick={() => handleDelete(company.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                        title="Delete Company"
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
            <p className="text-gray-500">No delivery companies found</p>
            <button
              onClick={handleAdd}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add your first delivery partner
            </button>
          </div>
        )}
      </div>

      {/* Delivery Company Modal (Add/Edit) */}
      <DeliveryCompanyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        company={selectedCompany}
        onSave={handleSave}
        loading={loading}
      />

      {/* API Keys Modal (API + Mappings) */}
      <ApiKeysModal
        isOpen={isApiModalOpen}
        onClose={() => setIsApiModalOpen(false)}
        company={selectedCompany}
        initialTab={apiModalInitialTab}
      />
    </div>
  );
};

export default DeliveryCompaniesSection;