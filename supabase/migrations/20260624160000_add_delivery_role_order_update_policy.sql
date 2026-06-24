-- orders only had UPDATE policies for seller/dropshipper/admin. A delivery
-- company account had no policy at all, so updateDeliveryStatus() in
-- DeliveryDashboard.jsx silently matched 0 rows (Supabase doesn't error on
-- an RLS-filtered UPDATE) — the toast said "success" but nothing was ever
-- written, and the next refetch showed the order reverted to its old status.
-- Matches DeliveryDashboard.jsx's own lookup: a delivery account is linked
-- to a delivery_companies row by matching email.
CREATE POLICY orders_update_delivery ON orders
FOR UPDATE
USING (
  delivery_company_id IN (
    SELECT dc.id FROM delivery_companies dc
    JOIN profiles p ON p.email = dc.email
    WHERE p.id = auth.uid() AND p.role = 'delivery'
  )
);
