-- ============================================
-- MISSING DROPSHIPPER RPC FUNCTIONS
-- ============================================
-- src/components/dashboard/dropshipper/PlaceOrderModal.jsx and ProductCard.jsx
-- call three RPCs that never existed in the database:
-- get_dropshipper_customers, calculate_commission, place_dropshipper_order_v2.
-- This means dropshippers have never been able to place a B2B order through
-- this modal. This migration adds all three.

-- 1. Customers a dropshipper has ordered for before (mirrors the client-side
--    logic already used in DropshipperCustomersPage.jsx, server-side).
CREATE OR REPLACE FUNCTION get_dropshipper_customers(p_dropshipper_id UUID)
RETURNS TABLE (
    customer_id UUID,
    full_name TEXT,
    email TEXT,
    phone TEXT,
    city TEXT,
    address TEXT,
    total_orders BIGINT,
    last_order_at TIMESTAMPTZ
)
SECURITY DEFINER
SET search_path = public
LANGUAGE sql
AS $$
  SELECT
    p.id,
    p.full_name,
    p.email,
    p.phone,
    p.city,
    p.address,
    COUNT(o.id),
    MAX(o.ordered_at)
  FROM orders o
  JOIN profiles p ON p.id = o.customer_id
  WHERE o.dropshipper_id = p_dropshipper_id
    AND o.customer_id IS NOT NULL
  GROUP BY p.id, p.full_name, p.email, p.phone, p.city, p.address
  ORDER BY MAX(o.ordered_at) DESC;
$$;

GRANT EXECUTE ON FUNCTION get_dropshipper_customers(UUID) TO authenticated;

-- 2. Dropshipper commission rate (percentage) for a given markup amount.
--    products has no category_id column (despite the frontend assuming one),
--    so this only looks up by applies_to='dropshipper' + amount range, the
--    same lookup compute_order_financials() already does for consistency.
CREATE OR REPLACE FUNCTION calculate_commission(
    p_seller_id UUID DEFAULT NULL,
    p_category_id UUID DEFAULT NULL,
    p_product_id UUID DEFAULT NULL,
    p_amount NUMERIC DEFAULT 0,
    p_for_role TEXT DEFAULT 'dropshipper'
)
RETURNS NUMERIC
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_rate NUMERIC;
BEGIN
  SELECT percentage
  INTO v_rate
  FROM commission_rules
  WHERE applies_to = p_for_role
    AND is_active = true
    AND (valid_from IS NULL OR valid_from <= now())
    AND (valid_to IS NULL OR valid_to >= now())
    AND (min_amount IS NULL OR p_amount >= min_amount)
    AND (max_amount IS NULL OR p_amount <= max_amount)
  ORDER BY priority DESC, (min_amount IS NOT NULL) DESC
  LIMIT 1;

  RETURN COALESCE(v_rate, 5);
END;
$$;

GRANT EXECUTE ON FUNCTION calculate_commission(UUID, UUID, UUID, NUMERIC, TEXT) TO authenticated;

-- 3. Place a dropshipper B2B order: validates stock, inserts the order
--    (compute_order_financials() trigger handles the financial breakdown
--    automatically), decrements product stock.
CREATE OR REPLACE FUNCTION place_dropshipper_order_v2(
    p_product_id UUID,
    p_quantity INTEGER,
    p_dropshipper_id UUID,
    p_customer_id UUID,
    p_markup NUMERIC,
    p_commission_rate NUMERIC,
    p_commission_amount NUMERIC,
    p_net_profit NUMERIC,
    p_shipping_address JSONB,
    p_shipping_city TEXT,
    p_shipping_fee NUMERIC
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_product RECORD;
  v_order_id UUID;
  v_final_price NUMERIC;
BEGIN
  SELECT * INTO v_product FROM products WHERE id = p_product_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Product not found');
  END IF;

  IF v_product.quantity < p_quantity THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not enough stock');
  END IF;

  v_final_price := v_product.purchase_price + p_markup + COALESCE(p_shipping_fee, 0);

  INSERT INTO orders (
    product_id, dropshipper_id, customer_id, status,
    product_price, dropshipper_markup, final_customer_price,
    ordered_quantity, shipping_city, shipping_address, shipping_fee,
    payment_method, payment_status, order_type,
    dropshipper_commission_rate, dropshipper_commission_amount, dropshipper_net_earnings
  ) VALUES (
    p_product_id, p_dropshipper_id, p_customer_id, 'ordered',
    v_product.purchase_price, p_markup, v_final_price,
    p_quantity, p_shipping_city, p_shipping_address, COALESCE(p_shipping_fee, 0),
    'COD', 'pending', 'b2b',
    p_commission_rate, p_commission_amount, p_net_profit
  )
  RETURNING id INTO v_order_id;

  UPDATE products SET quantity = quantity - p_quantity WHERE id = p_product_id;

  RETURN jsonb_build_object('success', true, 'order_id', v_order_id);
END;
$$;

GRANT EXECUTE ON FUNCTION place_dropshipper_order_v2(UUID, INTEGER, UUID, UUID, NUMERIC, NUMERIC, NUMERIC, NUMERIC, JSONB, TEXT, NUMERIC) TO authenticated;

-- 4. Create a lightweight "customer" profile (no auth account) for a
--    dropshipper's new customer. The profiles INSERT policy only allows
--    `auth.uid() = id`, so a dropshipper can never insert a row for someone
--    else directly - this SECURITY DEFINER function bypasses that safely,
--    always forcing role='customer' regardless of caller input.
CREATE OR REPLACE FUNCTION create_dropshipper_customer(
    p_full_name TEXT,
    p_phone TEXT,
    p_city TEXT,
    p_address TEXT
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
  VALUES (v_id, p_phone || '@temp.customer', p_full_name, p_phone, p_city, p_address, 'customer', NOW());

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION create_dropshipper_customer(TEXT, TEXT, TEXT, TEXT) TO authenticated;
