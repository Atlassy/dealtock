// components/admin/invoices/InvoiceDetailModal.tsx
import React, { useEffect, useState } from 'react'
import { InvoiceDetail } from '@/types/invoice'
import { formatCurrency, formatDate } from '@/lib/utils'
import { X, Download, Printer } from 'lucide-react'

interface InvoiceDetailModalProps {
  invoiceId: string
  onClose: () => void
  onDownloadPDF: (invoiceId: string) => void
  fetchInvoiceDetail: (invoiceId: string) => Promise<InvoiceDetail | null>
}

export function InvoiceDetailModal({ 
  invoiceId, 
  onClose, 
  onDownloadPDF,
  fetchInvoiceDetail 
}: InvoiceDetailModalProps) {
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadInvoiceDetail()
  }, [invoiceId])

  const loadInvoiceDetail = async () => {
    setLoading(true)
    const data = await fetchInvoiceDetail(invoiceId)
    setInvoice(data)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100 mx-auto"></div>
        </div>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8">
          <p className="text-gray-900 dark:text-white">Invoice not found</p>
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-gray-100 dark:bg-gray-700 dark:text-gray-200 rounded">Close</button>
        </div>
      </div>
    )
  }

  const financialSummary = invoice.financial_summary || {
    product_price: 0,
    delivery_fee: 0,
    subtotal: 0,
    dealtock_commission: 0,
    dropshipper_commission: 0,
    seller_net: 0,
    total: 0
  }

  const getStatusColor = (status: string) => {
    const colors = {
      generated: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      paid: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      overdue: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Invoice {invoice.invoice_number}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Order #{invoice.order_number}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onDownloadPDF(invoice.invoice_id)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Download size={16} />
              Download PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg dark:text-gray-300"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status */}
          <div className="flex justify-between items-start">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(invoice.invoice_status)}`}>
              {invoice.invoice_status.toUpperCase()}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Issued: {formatDate(invoice.invoice_date)}
            </span>
          </div>

          {/* Parties */}
          <div className="grid grid-cols-2 gap-6">
            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">Seller</h3>
              <p className="font-medium text-gray-900 dark:text-white">{invoice.seller_info?.full_name || invoice.seller_name}</p>
              {invoice.seller_info?.company && (
                <p className="text-sm text-gray-600 dark:text-gray-400">{invoice.seller_info.company}</p>
              )}
              <p className="text-sm text-gray-600 dark:text-gray-400">{invoice.seller_info?.email || invoice.seller_email}</p>
              {invoice.seller_info?.phone && (
                <p className="text-sm text-gray-600 dark:text-gray-400">{invoice.seller_info.phone}</p>
              )}
              {invoice.seller_info?.city && (
                <p className="text-sm text-gray-600 dark:text-gray-400">{invoice.seller_info.city}</p>
              )}
            </div>

            {invoice.dropshipper_name && (
              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">Dropshipper</h3>
                <p className="font-medium text-gray-900 dark:text-white">{invoice.dropshipper_info?.full_name || invoice.dropshipper_name}</p>
                {invoice.dropshipper_info?.company && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">{invoice.dropshipper_info.company}</p>
                )}
              </div>
            )}
          </div>

          {/* Escrow Info */}
          {invoice.escrow_info && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h3 className="font-semibold text-blue-800 dark:text-blue-400 mb-2">Escrow Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-600 dark:text-blue-400">Amount Held:</span>{' '}
                  <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(invoice.escrow_info.amount_held)} {invoice.escrow_info.currency}</span>
                </div>
                <div>
                  <span className="text-blue-600 dark:text-blue-400">Held At:</span>{' '}
                  <span className="font-medium text-gray-900 dark:text-white">{formatDate(invoice.escrow_info.held_at)}</span>
                </div>
                <div>
                  <span className="text-blue-600 dark:text-blue-400">Released At:</span>{' '}
                  <span className="font-medium text-gray-900 dark:text-white">{formatDate(invoice.escrow_info.released_at)}</span>
                </div>
                <div>
                  <span className="text-blue-600 dark:text-blue-400">Release Reason:</span>{' '}
                  <span className="font-medium text-gray-900 dark:text-white">{invoice.escrow_info.release_reason}</span>
                </div>
              </div>
            </div>
          )}

          {/* Financial Breakdown */}
          <div>
            <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">Financial Breakdown</h3>
            <table className="w-full">
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700 text-gray-900 dark:text-white">
                <tr>
                  <td className="py-2">Product Price</td>
                  <td className="py-2 text-right">{formatCurrency(financialSummary.product_price)}</td>
                </tr>
                <tr>
                  <td className="py-2">Delivery Fee</td>
                  <td className="py-2 text-right">{formatCurrency(financialSummary.delivery_fee)}</td>
                </tr>
                <tr className="font-medium">
                  <td className="py-2">Subtotal</td>
                  <td className="py-2 text-right">{formatCurrency(financialSummary.subtotal)}</td>
                </tr>
                <tr>
                  <td className="py-2 text-red-600 dark:text-red-400">Dealtock Commission</td>
                  <td className="py-2 text-right text-red-600 dark:text-red-400">-{formatCurrency(financialSummary.dealtock_commission)}</td>
                </tr>
                {financialSummary.dropshipper_commission > 0 && (
                  <tr>
                    <td className="py-2 text-kraft-600 dark:text-kraft-400">Dropshipper Commission</td>
                    <td className="py-2 text-right text-kraft-600 dark:text-kraft-400">-{formatCurrency(financialSummary.dropshipper_commission)}</td>
                  </tr>
                )}
                <tr className="font-bold text-lg border-t-2 border-gray-200 dark:border-gray-700">
                  <td className="py-4">Seller Net</td>
                  <td className="py-4 text-right">{formatCurrency(financialSummary.seller_net)}</td>
                </tr>
              </tbody>
            </table>
          </div>

{/* Invoice Lines */}
{invoice.lines && invoice.lines.length > 0 && (
  <div>
    <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">Invoice Details</h3>
    <table className="w-full">
      <thead className="bg-gray-50 dark:bg-gray-900">
        <tr>
          <th className="px-4 py-2 text-left text-sm font-medium text-gray-600 dark:text-gray-300">Description</th>
          <th className="px-4 py-2 text-right text-sm font-medium text-gray-600 dark:text-gray-300">Qty</th>
          <th className="px-4 py-2 text-right text-sm font-medium text-gray-600 dark:text-gray-300">Unit Price</th>
          <th className="px-4 py-2 text-right text-sm font-medium text-gray-600 dark:text-gray-300">Total</th>
          <th className="px-4 py-2 text-right text-sm font-medium text-gray-600 dark:text-gray-300">Tax</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200 dark:divide-gray-700 text-gray-900 dark:text-white">
        {invoice.lines.map((line) => (
          <tr key={line.id}>
            <td className="px-4 py-2">{line.description}</td>
            <td className="px-4 py-2 text-right">{line.quantity}</td>
            <td className="px-4 py-2 text-right">{formatCurrency(line.unit_price)}</td>
            <td className="px-4 py-2 text-right">{formatCurrency(line.total_price)}</td>
            <td className="px-4 py-2 text-right">{formatCurrency(line.tax_amount)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)}

{/* Financial Ledger Entries */}
{invoice.ledger_entries && invoice.ledger_entries.length > 0 && (
  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
    <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">Financial Ledger</h3>
    <div className="space-y-2">
      {invoice.ledger_entries.map((entry) => (
        <div key={entry.ledger_id} className="flex justify-between items-center text-sm p-2 bg-gray-50 dark:bg-gray-900 rounded">
          <div>
            <span className="font-medium capitalize text-gray-900 dark:text-white">{entry.role}</span>
            <span className="mx-2 text-gray-400 dark:text-gray-500">•</span>
            <span className="capitalize text-gray-700 dark:text-gray-300">{entry.type}</span>
            <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
              entry.status === 'settled' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
            }`}>
              {entry.status}
            </span>
          </div>
          <div className="font-medium text-gray-900 dark:text-white">
            {entry.type === 'credit' ? '+' : '-'}{formatCurrency(entry.amount)}
          </div>
        </div>
      ))}
    </div>
  </div>
)}
          {/* Order Details */}
          {invoice.order_details && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">Order Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Ordered At:</span>{' '}
                  <span className="font-medium text-gray-900 dark:text-white">{formatDate(invoice.order_details.ordered_at)}</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Payment Method:</span>{' '}
                  <span className="font-medium text-gray-900 dark:text-white">{invoice.order_details.payment_method}</span>
                </div>
                {invoice.order_details.shipping_city && (
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Shipping City:</span>{' '}
                    <span className="font-medium text-gray-900 dark:text-white">{invoice.order_details.shipping_city}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Return Information */}
          {invoice.return_status === 'has_return' && invoice.return_info && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <h3 className="font-semibold text-red-800 dark:text-red-400 mb-2">Return Information</h3>
              <pre className="text-sm text-red-700 dark:text-red-400 overflow-auto">
                {JSON.stringify(invoice.return_info, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
export default InvoiceDetailModal;  