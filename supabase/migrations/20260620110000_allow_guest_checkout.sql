-- ============================================
-- FIX: guest checkout was advertised in the UI but impossible in the DB
-- ============================================
-- orders_insert_buyer requires auth.uid() IS NOT NULL, so any anonymous
-- (not-logged-in) checkout attempt always failed this policy - even though
-- the marketplace cart explicitly offers "Guest checkout" and tells the
-- customer "You're ordering as a guest." This adds a second INSERT policy
-- allowing anonymous orders, but only plain B2C orders that don't claim to
-- be a registered customer or dropshipper (those fields must be NULL),
-- to avoid a guest being able to forge an order under someone else's
-- customer_id/dropshipper_id.

CREATE POLICY orders_insert_guest
  ON public.orders
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NULL
    AND customer_id IS NULL
    AND dropshipper_id IS NULL
  );
