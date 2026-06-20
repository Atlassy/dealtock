-- ============================================
-- ADD OPTIONAL EMAIL PARAM TO create_dropshipper_customer
-- ============================================
-- AddCustomerModal.jsx (the standalone "Customers" tab) collects an email
-- field that the original 4-param version of this function couldn't accept.

DROP FUNCTION IF EXISTS create_dropshipper_customer(TEXT, TEXT, TEXT, TEXT);

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
BEGIN
  INSERT INTO profiles (id, email, full_name, phone, city, address, role, created_at)
  VALUES (v_id, COALESCE(p_email, p_phone || '@temp.customer'), p_full_name, p_phone, p_city, p_address, 'customer', NOW());

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION create_dropshipper_customer(TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;
