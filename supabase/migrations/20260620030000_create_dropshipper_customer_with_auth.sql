-- ============================================
-- FIX: profiles.id requires a matching auth.users row (profiles_id_fkey)
-- ============================================
-- create_dropshipper_customer generated a random UUID and inserted straight
-- into profiles, but profiles.id has a foreign key to auth.users.id - so
-- every "new customer" creation failed with a FK violation. There's no
-- lightweight "profile without an account" concept in this schema; this
-- creates a minimal, unusable-login shadow auth.users row alongside the
-- profile so the FK is satisfied. The customer never logs in with this
-- account - it exists purely so the dropshipper can attach orders to them.

CREATE OR REPLACE FUNCTION create_dropshipper_customer(
    p_full_name TEXT,
    p_phone TEXT,
    p_city TEXT,
    p_address TEXT,
    p_email TEXT DEFAULT NULL
)
RETURNS UUID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_id UUID := gen_random_uuid();
  v_email TEXT := COALESCE(p_email, p_phone || '-' || extract(epoch from now())::bigint || '@temp.customer');
BEGIN
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    confirmation_token, recovery_token,
    raw_app_meta_data, raw_user_meta_data, is_super_admin
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', v_email,
    crypt(gen_random_uuid()::text, gen_salt('bf')),
    NOW(), NOW(), NOW(),
    '', '',
    '{"provider":"email","providers":["email"]}', '{}', false
  );

  INSERT INTO profiles (id, email, full_name, phone, city, address, role, created_at)
  VALUES (v_id, v_email, p_full_name, p_phone, p_city, p_address, 'customer', NOW());

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION create_dropshipper_customer(TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;
