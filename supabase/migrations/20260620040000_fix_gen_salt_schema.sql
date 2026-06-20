-- ============================================
-- FIX: gen_salt/crypt live in the "extensions" schema, not "public"
-- ============================================
-- create_dropshipper_customer sets search_path = public, so the unqualified
-- calls to crypt()/gen_salt() (from the pgcrypto extension) failed with
-- "function gen_salt(unknown) does not exist". Schema-qualifying them fixes
-- it without having to widen the function's search_path.

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
    extensions.crypt(gen_random_uuid()::text, extensions.gen_salt('bf')),
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
