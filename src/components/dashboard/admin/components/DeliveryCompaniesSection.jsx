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
import { useTranslation } from "react-i18next";

const DeliveryCompaniesSection = ({ companies, onRefresh, onExport }) => {
  const { t } = useTranslation();
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
    if (!window.confirm(t('deliveryCompanies.confirmDelete'))) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('delivery_companies')
        .delete()
        .eq('id', companyId);

      if (error) throw error;

      toast.success(t('deliveryCompanies.companyDeleted'));
      onRefresh();
    } catch (error) {
      console.error('Error deleting company:', error);
      toast.error(t('deliveryCompanies.deleteFailed'));
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
        toast.success(t('deliveryCompanies.companyUpdated'));
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
        toast.success(t('deliveryCompanies.companyAdded'));
      }

      setIsModalOpen(false);
      onRefresh();
    } catch (error) {
      console.error('Error saving company:', error);
      toast.error(t('deliveryCompanies.saveFailed'));
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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Truck className="w-6 h-6" />
            {t('deliveryCompanies.title')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            {t('deliveryCompanies.subtitle')}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleAdd}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            {t('deliveryCompanies.addPartner')}
          </button>
          <button
            onClick={onExport}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-200 flex items-center gap-2 text-sm"
          >
            <Download className="w-4 h-4" />
            {t('deliveryCompanies.export')}
          </button>
          <button
            onClick={onRefresh}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-200 flex items-center gap-2 text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            {t('deliveryCompanies.refresh')}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder={t('deliveryCompanies.searchPlaceholder')}
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
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm"
          >
            <option value="all">{t('deliveryCompanies.allStatus')}</option>
            <option value="active">{t('deliveryCompanies.active')}</option>
            <option value="inactive">{t('deliveryCompanies.inactive')}</option>
            <option value="suspended">{t('deliveryCompanies.suspended')}</option>
          </select>
        </div>
      </div>

      {/* Companies Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="text-left p-4 font-medium text-sm text-gray-700 dark:text-gray-300">{t('deliveryCompanies.table.company')}</th>
                <th className="text-left p-4 font-medium text-sm text-gray-700 dark:text-gray-300">{t('deliveryCompanies.table.contact')}</th>
                <th className="text-left p-4 font-medium text-sm text-gray-700 dark:text-gray-300">{t('deliveryCompanies.table.serviceType')}</th>
                <th className="text-left p-4 font-medium text-sm text-gray-700 dark:text-gray-300">{t('deliveryCompanies.table.commission')}</th>
                <th className="text-left p-4 font-medium text-sm text-gray-700 dark:text-gray-300">{t('deliveryCompanies.table.escrow')}</th>
                <th className="text-left p-4 font-medium text-sm text-gray-700 dark:text-gray-300">{t('deliveryCompanies.table.status')}</th>
                <th className="text-left p-4 font-medium text-sm text-gray-700 dark:text-gray-300">{t('deliveryCompanies.table.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredCompanies.map(company => (
                <tr key={company.id} className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="p-4">
                    <div className="font-medium text-gray-900 dark:text-white">{company.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{company.email}</div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm text-gray-700 dark:text-gray-300">{company.phone || 'N/A'}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{company.address || t('deliveryCompanies.table.noAddress')}</div>
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                      {company.service_type || 'standard'}
                    </span>
                  </td>
                  <td className="p-4 font-medium text-gray-900 dark:text-white">
                    {company.commission_rate || 10}%
                  </td>
                  <td className="p-4">
                    {company.escrow_enabled ? (
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                        {t('deliveryCompanies.table.enabled')}
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                        {t('deliveryCompanies.table.disabled')}
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      company.status === 'active'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : company.status === 'inactive'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {company.status || 'active'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {/* Edit button */}
                      <button
                        onClick={() => handleEdit(company)}
                        className="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded"
                        title={t('deliveryCompanies.table.editCompany')}
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      {/* API Configuration button - opens API tab */}
                      <button
                        onClick={() => handleOpenApiModal(company, 'api')}
                        className="p-1 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded"
                        title={t('deliveryCompanies.table.apiConfiguration')}
                      >
                        <Key className="w-4 h-4" />
                      </button>

                      {/* Status Mappings button - opens Mappings tab */}
                      <button
                        onClick={() => handleOpenApiModal(company, 'mappings')}
                        className="p-1 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded"
                        title={t('deliveryCompanies.table.statusMappings')}
                      >
                        <Map className="w-4 h-4" />
                      </button>

                      {/* Delete button */}
                      <button
                        onClick={() => handleDelete(company.id)}
                        className="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                        title={t('deliveryCompanies.table.deleteCompany')}
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
            <Truck className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">{t('deliveryCompanies.noCompaniesFound')}</p>
            <button
              onClick={handleAdd}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {t('deliveryCompanies.addFirstPartner')}
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