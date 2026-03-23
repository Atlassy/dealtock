// src/hooks/useInvoices.ts
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Invoice, InvoicesResponse, InvoiceStatus, InvoiceDetail } from '@/types/invoice'

interface UseInvoicesProps {
  initialPage?: number
  pageSize?: number
  status?: InvoiceStatus
  search?: string
}

export function useInvoices({ 
  initialPage = 1, 
  pageSize = 20, 
  status = 'all',
  search = ''
}: UseInvoicesProps = {}) {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: initialPage,
    pageSize,
    total: 0,
    totalPages: 0
  })

  const fetchInvoices = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      let query = supabase
        .from('admin_invoices_overview')
        .select('*', { count: 'exact' })
      
      if (status !== 'all') {
        query = query.eq('invoice_status', status)
      }
      
      if (search) {
        query = query.or(
          `invoice_number.ilike.%${search}%,order_number.ilike.%${search}%,seller_name.ilike.%${search}%`
        )
      }
      
      const from = (pagination.page - 1) * pageSize
      const to = from + pageSize - 1
      
      const { data, count, error } = await query
        .order('invoice_date', { ascending: false })
        .range(from, to)
      
      if (error) throw error
      
      setInvoices(data || [])
      setPagination(prev => ({
        ...prev,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize)
      }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch invoices')
    } finally {
      setLoading(false)
    }
  }, [pagination.page, pageSize, status, search])

  const fetchInvoiceDetail = useCallback(async (invoiceId: string): Promise<InvoiceDetail | null> => {
    try {
      const { data, error } = await supabase
        .from('order_oversight_with_invoices')
        .select('*')
        .eq('invoice_id', invoiceId)
        .single()
      
      if (error) throw error
      return data
    } catch (err) {
      console.error('Error fetching invoice detail:', err)
      return null
    }
  }, [])

  const generatePDF = useCallback(async (invoiceId: string): Promise<string | null> => {
    try {
      // This will call the Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('generate-invoice-pdf', {
        body: { invoiceId }
      })
      
      if (error) throw error
      
      // Update the invoice with PDF URL
      if (data?.pdf_url) {
        await supabase
          .from('invoices')
          .update({ 
            pdf_url: data.pdf_url,
            pdf_generated_at: new Date().toISOString()
          })
          .eq('id', invoiceId)
        
        // Refresh the list
        fetchInvoices()
      }
      
      return data?.pdf_url
    } catch (err) {
      console.error('Error generating PDF:', err)
      return null
    }
  }, [fetchInvoices])

  const goToPage = (page: number) => {
    setPagination(prev => ({ ...prev, page }))
  }

  useEffect(() => {
    fetchInvoices()
  }, [fetchInvoices])

  return {
    invoices,
    loading,
    error,
    pagination,
    goToPage,
    fetchInvoiceDetail,
    generatePDF,
    refresh: fetchInvoices
  }
}