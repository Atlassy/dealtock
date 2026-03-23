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
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        </div>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <p>Invoice not found</p>
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-gray-100 rounded">Close</button>
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
      generated: 'bg-yellow-100 text-yellow-800',
      sent: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Invoice {invoice.invoice_number}</h2>
            <p className="text-sm text-gray-500">Order #{invoice.order_number}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onDownloadPDF(invoice.invoice_id)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              disabled={!invoice.pdf_url}
            >
              <Download size={16} />
              Download PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
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
            <span className="text-sm text-gray-500">
              Issued: {formatDate(invoice.invoice_date)}
            </span>
          </div>

          {/* Parties */}
          <div className="grid grid-cols-2 gap-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">Seller</h3>
              <p className="font-medium">{invoice.seller_info?.full_name || invoice.seller_name}</p>
              {invoice.seller_info?.company && (
                <p className="text-sm text-gray-600">{invoice.seller_info.company}</p>
              )}
              <p className="text-sm text-gray-600">{invoice.seller_info?.email || invoice.seller_email}</p>
              {invoice.seller_info?.phone && (
                <p className="text-sm text-gray-600">{invoice.seller_info.phone}</p>
              )}
              {invoice.seller_info?.city && (
                <p className="text-sm text-gray-600">{invoice.seller_info.city}</p>
              )}
            </div>
            
            {invoice.dropshipper_name && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-2">Dropshipper</h3>
                <p className="font-medium">{invoice.dropshipper_info?.full_name || invoice.dropshipper_name}</p>
                {invoice.dropshipper_info?.company && (
                  <p className="text-sm text-gray-600">{invoice.dropshipper_info.company}</p>
                )}
              </div>
            )}
          </div>

          {/* Escrow Info */}
          {invoice.escrow_info && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">Escrow Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-600">Amount Held:</span>{' '}
                  <span className="font-medium">{formatCurrency(invoice.escrow_info.amount_held)} {invoice.escrow_info.currency}</span>
                </div>
                <div>
                  <span className="text-blue-600">Held At:</span>{' '}
                  <span className="font-medium">{formatDate(invoice.escrow_info.held_at)}</span>
                </div>
                <div>
                  <span className="text-blue-600">Released At:</span>{' '}
                  <span className="font-medium">{formatDate(invoice.escrow_info.released_at)}</span>
                </div>
                <div>
                  <span className="text-blue-600">Release Reason:</span>{' '}
                  <span className="font-medium">{invoice.escrow_info.release_reason}</span>
                </div>
              </div>
            </div>
          )}

          {/* Financial Breakdown */}
          <div>
            <h3 className="font-semibold mb-4">Financial Breakdown</h3>
            <table className="w-full">
              <tbody className="divide-y">
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
                  <td className="py-2 text-red-600">Dealtock Commission</td>
                  <td className="py-2 text-right text-red-600">-{formatCurrency(financialSummary.dealtock_commission)}</td>
                </tr>
                {financialSummary.dropshipper_commission > 0 && (
                  <tr>
                    <td className="py-2 text-orange-600">Dropshipper Commission</td>
                    <td className="py-2 text-right text-orange-600">-{formatCurrency(financialSummary.dropshipper_commission)}</td>
                  </tr>
                )}
                <tr className="font-bold text-lg border-t-2">
                  <td className="py-4">Seller Net</td>
                  <td className="py-4 text-right">{formatCurrency(financialSummary.seller_net)}</td>
                </tr>
              </tbody>
            </table>
          </div>

{/* Invoice Lines */}
{invoice.lines && invoice.lines.length > 0 && (
  <div>
    <h3 className="font-semibold mb-4">Invoice Details</h3>
    <table className="w-full">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Description</th>
          <th className="px-4 py-2 text-right text-sm font-medium text-gray-600">Qty</th>
          <th className="px-4 py-2 text-right text-sm font-medium text-gray-600">Unit Price</th>
          <th className="px-4 py-2 text-right text-sm font-medium text-gray-600">Total</th>
          <th className="px-4 py-2 text-right text-sm font-medium text-gray-600">Tax</th>
        </tr>
      </thead>
      <tbody className="divide-y">
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
  <div className="border-t pt-4">
    <h3 className="font-semibold mb-2">Financial Ledger</h3>
    <div className="space-y-2">
      {invoice.ledger_entries.map((entry) => (
        <div key={entry.ledger_id} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded">
          <div>
            <span className="font-medium capitalize">{entry.role}</span>
            <span className="mx-2 text-gray-400">•</span>
            <span className="capitalize">{entry.type}</span>
            <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
              entry.status === 'settled' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
            }`}>
              {entry.status}
            </span>
          </div>
          <div className="font-medium">
            {entry.type === 'credit' ? '+' : '-'}{formatCurrency(entry.amount)}
          </div>
        </div>
      ))}
    </div>
  </div>
)}
          {/* Order Details */}
          {invoice.order_details && (
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Order Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Ordered At:</span>{' '}
                  <span className="font-medium">{formatDate(invoice.order_details.ordered_at)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Payment Method:</span>{' '}
                  <span className="font-medium">{invoice.order_details.payment_method}</span>
                </div>
                {invoice.order_details.shipping_city && (
                  <div>
                    <span className="text-gray-600">Shipping City:</span>{' '}
                    <span className="font-medium">{invoice.order_details.shipping_city}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Return Information */}
          {invoice.return_status === 'has_return' && invoice.return_info && (
            <div className="p-4 bg-red-50 rounded-lg">
              <h3 className="font-semibold text-red-800 mb-2">Return Information</h3>
              <pre className="text-sm text-red-700 overflow-auto">
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