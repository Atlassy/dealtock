-- ============================================
-- FIX: admins could never actually read other users' profiles
-- ============================================
-- profiles_select_admin checked auth.jwt() -> 'app_metadata' ->> 'role', but
-- nothing in the codebase ever sets that JWT app_metadata field - the real
-- role lives in profiles.role. So this policy always evaluated to false,
-- meaning no admin could ever see a seller's or customer's profile via the
-- embedded join (orders -> seller:profiles!seller_id(...)), which is why
-- "Seller Information" / "Customer Information" always showed N/A in the
-- Order Oversight detail modal. current_user_role() already reads the
-- correct column and is used correctly elsewhere (the update policy) -
-- reuse it here for consistency.

DROP POLICY IF EXISTS profiles_select_admin ON public.profiles;

CREATE POLICY profiles_select_admin
  ON public.profiles
  FOR SELECT
  USING (current_user_role() = 'admin');
