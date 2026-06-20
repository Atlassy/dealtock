-- ============================================
-- FIX: 'warehouse' was not an allowed profiles.role value at all
-- ============================================
-- profiles_role_check only allowed '', 'seller', 'dropshipper', 'customer',
-- 'admin', 'delivery' - so no profile could ever be set to role='warehouse',
-- blocking the entire warehouse partner concept at the database level
-- (Dashboard.jsx's "warehouse" case, RLS policies referencing it, and the
-- importer's warehouse-partner assignment all depend on this role existing).

ALTER TABLE public.profiles DROP CONSTRAINT profiles_role_check;

ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role = ANY (ARRAY[''::text, 'seller'::text, 'dropshipper'::text, 'customer'::text, 'admin'::text, 'delivery'::text, 'warehouse'::text]));
