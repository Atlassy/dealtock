-- ============================================
-- URGENT FIX: profiles_select_own_customers caused infinite recursion
-- ============================================
-- That policy's USING clause queried `orders`, and orders' own RLS policy
-- queries `profiles` to check the caller's role - evaluating one policy
-- required evaluating the other, in an infinite loop. This broke reading
-- ANY profile for ANY user (not just dropshippers), since Postgres must
-- evaluate every RLS policy's condition to determine row visibility.
--
-- Fix: wrap the check in a SECURITY DEFINER function, which runs with
-- elevated privileges internally and bypasses RLS on `orders` entirely,
-- breaking the recursive cycle.

DROP POLICY IF EXISTS profiles_select_own_customers ON public.profiles;

CREATE OR REPLACE FUNCTION public.is_own_customer(p_profile_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.customer_id = p_profile_id
      AND o.dropshipper_id = auth.uid()
  );
$$;

CREATE POLICY profiles_select_own_customers
  ON public.profiles
  FOR SELECT
  USING (public.is_own_customer(id));
