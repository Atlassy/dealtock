-- ============================================
-- MISSING INVOICE VIEWS
-- ============================================
-- src/hooks/useInvoices.ts queries two views that were never created
-- (admin_invoices_overview, order_oversight_with_invoices), so the whole
-- admin "Invoices" tab has never been able to load anything. This migration
-- creates both, built from the real underlying tables (invoices, invoice_lines,
-- orders, order_financials, profiles, escrow_holdings, financial_ledger, returns).

-- 1. List view used by InvoicesList.tsx
CREATE OR REPLACE VIEW admin_invoices_overview AS
SELECT
    i.id AS invoice_id,
    i.invoice_number,
    i.order_id,
    i.invoice_type,
    i.invoice_date,
    i.status AS invoice_status,
    i.pdf_url,
    i.pdf_generated_at,
    i.created_at,
    o.order_number,
    COALESCE(of_.product_price, 0) + COALESCE(of_.delivery_fee, 0) AS total,
    p.full_name AS seller_name,
    p.company AS seller_company,
    EXTRACT(DAY FROM NOW() - i.invoice_date)::INTEGER AS days_old
FROM invoices i
LEFT JOIN orders o ON o.id = i.order_id
LEFT JOIN order_financials of_ ON of_.id = i.financials_id
LEFT JOIN profiles p ON p.id = o.seller_id;

GRANT SELECT ON admin_invoices_overview TO authenticated;

-- 2. Detail view used by useInvoices.fetchInvoiceDetail() / InvoiceDetailModal.tsx
CREATE OR REPLACE VIEW order_oversight_with_invoices AS
SELECT
    i.id AS invoice_id,
    i.invoice_number,
    i.order_id,
    i.invoice_date,
    i.status AS invoice_status,
    i.pdf_url,

    o.order_number,
    seller.full_name AS seller_name,
    seller.email AS seller_email,
    dropshipper.full_name AS dropshipper_name,

    jsonb_build_object(
        'full_name', seller.full_name,
        'company', seller.company,
        'email', seller.email,
        'phone', seller.phone,
        'city', seller.city
    ) AS seller_info,

    CASE WHEN dropshipper.id IS NOT NULL THEN jsonb_build_object(
        'full_name', dropshipper.full_name,
        'company', dropshipper.company
    ) END AS dropshipper_info,

    jsonb_build_object(
        'product_price', COALESCE(of_.product_price, 0),
        'delivery_fee', COALESCE(of_.delivery_fee, 0),
        'subtotal', COALESCE(of_.product_price, 0) + COALESCE(of_.delivery_fee, 0),
        'dealtock_commission', COALESCE(of_.dealtock_commission, 0),
        'dropshipper_commission', COALESCE(of_.dropshipper_commission, 0),
        'seller_net', COALESCE(of_.seller_net, 0),
        'total', COALESCE(of_.product_price, 0) + COALESCE(of_.delivery_fee, 0)
    ) AS financial_summary,

    jsonb_build_object(
        'ordered_at', o.ordered_at,
        'payment_method', o.payment_method,
        'shipping_city', o.shipping_city
    ) AS order_details,

    (
        SELECT jsonb_build_object(
            'amount_held', eh.amount_held,
            'currency', eh.currency,
            'held_at', eh.held_at,
            'released_at', eh.released_at,
            'release_reason', eh.release_reason
        )
        FROM escrow_holdings eh
        WHERE eh.order_id = o.id
        LIMIT 1
    ) AS escrow_info,

    (
        SELECT jsonb_agg(jsonb_build_object(
            'id', il.id,
            'description', il.description,
            'quantity', il.quantity,
            'unit_price', il.unit_price,
            'total_price', il.total_price,
            'tax_amount', il.tax_amount
        ))
        FROM invoice_lines il
        WHERE il.invoice_id = i.id
    ) AS lines,

    (
        SELECT jsonb_agg(jsonb_build_object(
            'ledger_id', fl.id,
            'role', fl.role,
            'type', fl.type,
            'status', fl.status,
            'amount', fl.amount
        ))
        FROM financial_ledger fl
        WHERE fl.reference_id = o.id AND fl.reference_type = 'order'
    ) AS ledger_entries,

    CASE WHEN EXISTS (SELECT 1 FROM returns r WHERE r.order_id = o.id)
        THEN 'has_return' ELSE 'no_return' END AS return_status,

    (
        SELECT jsonb_build_object(
            'return_id', r.id,
            'created_at', r.created_at,
            'condition', ri.condition,
            'decision', ri.decision,
            'notes', ri.notes
        )
        FROM returns r
        LEFT JOIN return_inspections ri ON ri.return_id = r.id
        WHERE r.order_id = o.id
        LIMIT 1
    ) AS return_info

FROM invoices i
LEFT JOIN orders o ON o.id = i.order_id
LEFT JOIN order_financials of_ ON of_.id = i.financials_id
LEFT JOIN profiles seller ON seller.id = o.seller_id
LEFT JOIN profiles dropshipper ON dropshipper.id = o.dropshipper_id;

GRANT SELECT ON order_oversight_with_invoices TO authenticated;
