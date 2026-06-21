// components/admin/invoices/InvoicesList.tsx
import React, { useState } from 'react'
import { useInvoices } from '@/hooks/useInvoices'
import { InvoiceDetailModal } from './InvoiceDetailModal'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Download, Eye, Search, Filter, RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function InvoicesList() {
  const { t } = useTranslation()
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [statusFilter, setStatusFilter] = useState<'all' | 'generated' | 'sent' | 'paid' | 'overdue' | 'cancelled'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  
  const { 
    invoices, 
    loading, 
    error, 
    pagination, 
    goToPage, 
    fetchInvoiceDetail,
    generatePDF,
    refresh 
  } = useInvoices({ 
    status: statusFilter,
    search: searchTerm
  })

  const handleViewInvoice = async (invoiceId: string) => {
    setSelectedInvoiceId(invoiceId)
    setShowDetailModal(true)
  }

  const handleDownloadPDF = async (invoiceId: string) => {
    await generatePDF(invoiceId)
  }

  const getStatusBadgeClass = (status: string) => {
    const classes = {
      generated: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      paid: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      overdue: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    }
    return classes[status as keyof typeof classes] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    refresh()
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('invoices.title')}</h2>
        <button
          onClick={() => refresh()}
          className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg flex items-center gap-2"
        >
          <RefreshCw size={16} />
          {t('invoices.refresh')}
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <form onSubmit={handleSearch} className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
          <input
            type="text"
            placeholder={t('invoices.searchPlaceholder')}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </form>

        <select
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
        >
          <option value="all">{t('invoices.allStatus')}</option>
          <option value="generated">{t('invoices.generated')}</option>
          <option value="sent">{t('invoices.sent')}</option>
          <option value="paid">{t('invoices.paid')}</option>
          <option value="overdue">{t('invoices.overdue')}</option>
          <option value="cancelled">{t('invoices.cancelled')}</option>
        </select>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-400 p-4 rounded-lg">
          {t('invoices.error', { error })}
        </div>
      )}

      {/* Invoices Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('invoices.table.invoiceNumber')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('invoices.table.orderNumber')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('invoices.table.customer')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('invoices.table.date')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('invoices.table.total')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('invoices.table.status')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('invoices.table.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
                  </div>
                </td>
              </tr>
            ) : invoices.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                  {t('invoices.noInvoicesFound')}
                </td>
              </tr>
            ) : (
              invoices.map((invoice) => (
                <tr key={invoice.invoice_id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-white">
                    {invoice.invoice_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-300">
                    {invoice.order_number}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-gray-900 dark:text-white">{invoice.seller_name}</div>
                    {invoice.seller_company && (
                      <div className="text-sm text-gray-500 dark:text-gray-400">{invoice.seller_company}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-300">
                    {formatDate(invoice.invoice_date)}
                    {invoice.days_old > 0 && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {t('invoices.table.daysAgo', { count: invoice.days_old })}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-white">
                    {formatCurrency(invoice.total)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(invoice.invoice_status)}`}>
                      {invoice.invoice_status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewInvoice(invoice.invoice_id)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30"
                        title={t('invoices.table.viewInvoice')}
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => handleDownloadPDF(invoice.invoice_id)}
                        className="p-1 rounded text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/30"
                        title={t('invoices.table.downloadPdf')}
                      >
                        <Download size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            {t('invoices.showingResults', {
              from: ((pagination.page - 1) * pagination.pageSize) + 1,
              to: Math.min(pagination.page * pagination.pageSize, pagination.total),
              total: pagination.total
            })}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => goToPage(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 dark:text-gray-200 rounded disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              {t('invoices.previous')}
            </button>
            <span className="px-3 py-1 text-gray-700 dark:text-gray-300">
              {t('invoices.pageOf', { page: pagination.page, totalPages: pagination.totalPages })}
            </span>
            <button
              onClick={() => goToPage(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 dark:text-gray-200 rounded disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              {t('invoices.next')}
            </button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedInvoiceId && (
        <InvoiceDetailModal
          invoiceId={selectedInvoiceId}
          onClose={() => {
            setShowDetailModal(false)
            setSelectedInvoiceId(null)
          }}
          onDownloadPDF={handleDownloadPDF}
          fetchInvoiceDetail={fetchInvoiceDetail}
        />
      )}
    </div>
  )
}
export default InvoicesList;  // For default export
