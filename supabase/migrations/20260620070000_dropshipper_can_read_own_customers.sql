-- ============================================
-- FIX: dropshippers could never read their own customers' profiles
-- ============================================
-- profiles only had 2 SELECT policies: own row (auth.uid() = id) and admin
-- (current_user_role() = 'admin'). A dropshipper viewing customer info on
-- their own orders (the `customer:customer_id(...)` embedded join in
-- DropshipperOrders.jsx / DropshipperCustomersPage.jsx) would always get
-- null back - not an error, RLS just silently hides the row - making
-- "Customer: N/A" show forever regardless of the data being correct.

CREATE POLICY profiles_select_own_customers
  ON public.profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.customer_id = profiles.id
        AND o.dropshipper_id = auth.uid()
    )
  );
