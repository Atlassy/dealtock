// components/admin/invoices/InvoicesList.tsx
import React, { useState } from 'react'
import { useInvoices } from '@/hooks/useInvoices'
import { InvoiceDetailModal } from './InvoiceDetailModal'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Download, Eye, Search, Filter, RefreshCw } from 'lucide-react'

export function InvoicesList() {
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
    const pdfUrl = await generatePDF(invoiceId)
    if (pdfUrl) {
      window.open(pdfUrl, '_blank')
    }
  }

  const getStatusBadgeClass = (status: string) => {
    const classes = {
      generated: 'bg-yellow-100 text-yellow-800',
      sent: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800'
    }
    return classes[status as keyof typeof classes] || 'bg-gray-100 text-gray-800'
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    refresh()
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Invoices</h2>
        <button
          onClick={() => refresh()}
          className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-2"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <form onSubmit={handleSearch} className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by invoice #, order #, or customer..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </form>
        
        <select
          className="px-4 py-2 border rounded-lg bg-white"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
        >
          <option value="all">All Status</option>
          <option value="generated">Generated</option>
          <option value="sent">Sent</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 text-red-800 p-4 rounded-lg">
          Error: {error}
        </div>
      )}

      {/* Invoices Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Invoice #
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Order #
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  </div>
                </td>
              </tr>
            ) : invoices.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                  No invoices found
                </td>
              </tr>
            ) : (
              invoices.map((invoice) => (
                <tr key={invoice.invoice_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium">
                    {invoice.invoice_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {invoice.order_number}
                  </td>
                  <td className="px-6 py-4">
                    <div>{invoice.seller_name}</div>
                    {invoice.seller_company && (
                      <div className="text-sm text-gray-500">{invoice.seller_company}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {formatDate(invoice.invoice_date)}
                    {invoice.days_old > 0 && (
                      <div className="text-xs text-gray-500">
                        {invoice.days_old} days ago
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium">
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
                        className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                        title="View Invoice"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => handleDownloadPDF(invoice.invoice_id)}
                        className={`p-1 rounded ${
                          invoice.pdf_url 
                            ? 'text-green-600 hover:text-green-800 hover:bg-green-50' 
                            : 'text-gray-400 cursor-not-allowed'
                        }`}
                        title={invoice.pdf_url ? "Download PDF" : "PDF not generated"}
                        disabled={!invoice.pdf_url}
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
          <div className="text-sm text-gray-700">
            Showing {((pagination.page - 1) * pagination.pageSize) + 1} to{' '}
            {Math.min(pagination.page * pagination.pageSize, pagination.total)} of{' '}
            {pagination.total} results
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => goToPage(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-50"
            >
              Previous
            </button>
            <span className="px-3 py-1">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => goToPage(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-50"
            >
              Next
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
