// src/types/invoice.ts
export interface Invoice {
  invoice_id: string
  invoice_number: string
  invoice_type: 'b2c' | 'b2b' | 'delivery' | 'settlement'
  invoice_status: 'generated' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  invoice_date: string
  pdf_url: string | null
  pdf_generated_at: string | null
  
  // Order info
  order_id: string
  order_number: string
  order_status: string
  order_date: string
  
  // Seller info
  seller_id: string
  seller_name: string
  seller_company: string | null
  seller_email: string
  
  // Dropshipper info (optional)
  dropshipper_name?: string
  dropshipper_company?: string
  
  // Financials
  subtotal: number
  tax: number
  total: number
  
  // Return status
  return_status: 'has_return' | 'no_return'
  
  // Calculated
  days_old: number
}

// Add these interfaces
export interface InvoiceLine {
  id: string
  description: string
  quantity: number
  unit_price: number
  total_price: number
  tax_rate: number
  tax_amount: number
}

export interface LedgerEntry {
  ledger_id: string
  amount: number
  role: 'seller' | 'dropshipper' | 'dealtock' | 'delivery'
  type: 'credit' | 'debit'
  status: 'pending' | 'settled' | 'failed'
  settled_at: string | null
}

// Update InvoiceDetail interface
  // ... existing properties


export interface InvoiceDetail extends Invoice {
  financial_summary?: {
    product_price: number
    delivery_fee: number
    subtotal: number
    dealtock_commission: number
    dropshipper_commission?: number
    seller_net: number
    total: number
  }
  escrow_info?: {
    escrow_id: string
    amount_held: number
    currency: string
    held_at: string
    released_at: string
    release_reason: string
  }
  seller_info?: {
    id: string
    full_name: string
    email: string
    company: string | null
    phone: string | null
    city: string | null
  }
  dropshipper_info?: {
    id: string
    full_name: string
    email: string
    company: string | null
  }
  order_details?: {
    order_number: string
    ordered_at: string
    payment_method: string
    shipping_city: string | null
  }
  return_info?: any
    lines?: InvoiceLine[]
  ledger_entries?: LedgerEntry[]

}

export interface InvoicesResponse {
  data: Invoice[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export type InvoiceStatus = 'generated' | 'sent' | 'paid' | 'overdue' | 'cancelled' | 'all'