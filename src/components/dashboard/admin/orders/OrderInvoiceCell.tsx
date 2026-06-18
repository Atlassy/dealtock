// components/admin/orders/OrderInvoiceCell.tsx
import React, { useState } from 'react'
import { FileText, Download, Eye } from 'lucide-react'
import { InvoiceDetailModal } from '../invoices/InvoiceDetailModal'
import { useInvoices } from '@/hooks/useInvoices'

interface OrderInvoiceCellProps {
  orderId: string
  invoiceId?: string
  invoiceNumber?: string
  invoiceStatus?: string
  pdfUrl?: string
}

export function OrderInvoiceCell({ 
  orderId, 
  invoiceId, 
  invoiceNumber, 
  invoiceStatus,
  pdfUrl 
}: OrderInvoiceCellProps) {
  const [showModal, setShowModal] = useState(false)
  const { fetchInvoiceDetail, generatePDF } = useInvoices()

  const handleViewInvoice = () => {
    if (invoiceId) {
      setShowModal(true)
    }
  }

  const handleDownloadPDF = async () => {
    if (invoiceId) {
      const pdfUrl = await generatePDF(invoiceId)
      if (pdfUrl) {
        window.open(pdfUrl, '_blank')
      }
    }
  }

  if (!invoiceId) {
    return (
      <div className="text-sm text-gray-400 dark:text-gray-500 italic flex items-center gap-1">
        <FileText size={14} className="text-gray-300 dark:text-gray-600" />
        No invoice
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    const colors = {
      generated: 'text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/30',
      sent: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/30',
      paid: 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/30',
      overdue: 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/30',
      cancelled: 'text-gray-600 bg-gray-50 dark:text-gray-300 dark:bg-gray-700'
    }
    return colors[status as keyof typeof colors] || 'text-gray-600 bg-gray-50 dark:text-gray-300 dark:bg-gray-700'
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={handleViewInvoice}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          title="View Invoice"
        >
          <Eye size={16} className="text-blue-600 dark:text-blue-400" />
        </button>

        <button
          onClick={handleDownloadPDF}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          title={pdfUrl ? "Download PDF" : "Generate PDF"}
        >
          <Download size={16} className={pdfUrl ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'} />
        </button>

        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-900 dark:text-white">{invoiceNumber}</span>
          {invoiceStatus && (
            <span className={`text-xs px-2 py-0.5 rounded-full inline-block ${getStatusColor(invoiceStatus)}`}>
              {invoiceStatus}
            </span>
          )}
        </div>
      </div>

      {showModal && invoiceId && (
        <InvoiceDetailModal
          invoiceId={invoiceId}
          onClose={() => setShowModal(false)}
          onDownloadPDF={generatePDF}
          fetchInvoiceDetail={fetchInvoiceDetail}
        />
      )}
    </>
  )
}