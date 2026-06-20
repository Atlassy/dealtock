-- ============================================
-- WAREHOUSE ROLE: allow warehouse partners to manage their own products
-- ============================================
-- WarehouseDashboard has never been reachable (commented out in
-- Dashboard.jsx) and even once wired up, a 'warehouse' profile couldn't
-- update or delete its own products - those policies only allowed
-- 'seller'/'pro_seller'. products_select_seller_own already covers any
-- role (just checks user_id = auth.uid()), so only UPDATE/DELETE need
-- extending.

DROP POLICY IF EXISTS products_update_seller ON public.products;
CREATE POLICY products_update_seller
  ON public.products
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = ANY (ARRAY['seller', 'pro_seller', 'warehouse'])
    )
  );

DROP POLICY IF EXISTS products_delete_seller ON public.products;
CREATE POLICY products_delete_seller
  ON public.products
  FOR DELETE
  USING (
    auth.uid() IS NOT NULL
    AND user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = ANY (ARRAY['seller', 'pro_seller', 'warehouse'])
    )
  );
