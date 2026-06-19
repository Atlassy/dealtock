-- ============================================
-- MISSING ORDER-STATUS RPC FUNCTIONS
-- ============================================
-- These functions are called from the frontend (src/components/dashboard/seller/SellerOrders.jsx
-- and src/components/dashboard/admin/components/OrderOversightSection.jsx) but were never
-- deployed to the database — every call to them currently fails with "function not found".
-- This migration adds them.

-- 1. Seller approves an incoming order ('ordered' -> 'approved')
CREATE OR REPLACE FUNCTION seller_approve_order(
    p_order_id UUID,
    p_seller_id UUID
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    v_status TEXT;
    v_owns_order BOOLEAN;
BEGIN
    SELECT o.status,
           (o.seller_id = p_seller_id OR EXISTS (
               SELECT 1 FROM products pr WHERE pr.id = o.product_id AND pr.user_id = p_seller_id
           ))
    INTO v_status, v_owns_order
    FROM orders o
    WHERE o.id = p_order_id;

    IF NOT FOUND OR NOT v_owns_order THEN
        RETURN jsonb_build_object('success', false, 'code', 'ORDER_NOT_FOUND', 'error', 'Order not found or access denied');
    END IF;

    IF v_status <> 'ordered' THEN
        RETURN jsonb_build_object('success', false, 'code', 'INVALID_STATUS', 'error', 'Order cannot be approved at this stage');
    END IF;

    UPDATE orders
    SET status = 'approved',
        approved_at = NOW(),
        updated_at = NOW()
    WHERE id = p_order_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'code', 'UPDATE_FAILED', 'error', 'Failed to update order status');
    END IF;

    INSERT INTO order_status_history (order_id, old_status, new_status, changed_by)
    VALUES (p_order_id, v_status, 'approved', p_seller_id);

    RETURN jsonb_build_object('success', true);
END;
$$;

-- 2. Seller marks an approved order ready for pickup ('approved' -> 'ready')
CREATE OR REPLACE FUNCTION seller_mark_ready(
    p_order_id UUID,
    p_seller_id UUID
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    v_status TEXT;
    v_owns_order BOOLEAN;
BEGIN
    SELECT o.status,
           (o.seller_id = p_seller_id OR EXISTS (
               SELECT 1 FROM products pr WHERE pr.id = o.product_id AND pr.user_id = p_seller_id
           ))
    INTO v_status, v_owns_order
    FROM orders o
    WHERE o.id = p_order_id;

    IF NOT FOUND OR NOT v_owns_order THEN
        RETURN jsonb_build_object('success', false, 'code', 'ORDER_NOT_FOUND', 'error', 'Order not found or access denied');
    END IF;

    IF v_status <> 'approved' THEN
        RETURN jsonb_build_object('success', false, 'code', 'INVALID_STATUS', 'error', 'Order cannot be marked ready at this stage');
    END IF;

    UPDATE orders
    SET status = 'ready',
        ready_for_pickup_at = NOW(),
        updated_at = NOW()
    WHERE id = p_order_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'code', 'UPDATE_FAILED', 'error', 'Failed to update order status');
    END IF;

    INSERT INTO order_status_history (order_id, old_status, new_status, changed_by)
    VALUES (p_order_id, v_status, 'ready', p_seller_id);

    RETURN jsonb_build_object('success', true);
END;
$$;

-- 3. Admin manually sets an order's status from the Order Oversight tab
CREATE OR REPLACE FUNCTION update_order_status(
    p_order_id UUID,
    p_new_status TEXT,
    p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    v_old_status TEXT;
    v_admin_id UUID := auth.uid();
BEGIN
    SELECT status INTO v_old_status FROM orders WHERE id = p_order_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Order not found');
    END IF;

    UPDATE orders
    SET status = p_new_status,
        updated_at = NOW()
    WHERE id = p_order_id;

    INSERT INTO order_status_history (order_id, old_status, new_status, changed_by)
    VALUES (p_order_id, v_old_status, p_new_status, v_admin_id);

    INSERT INTO admin_actions (admin_id, entity_type, entity_id, action_type, reason, metadata)
    VALUES (
        v_admin_id,
        'order',
        p_order_id,
        'update_status',
        p_reason,
        jsonb_build_object('old_status', v_old_status, 'new_status', p_new_status)
    );

    RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION seller_approve_order(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION seller_mark_ready(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_order_status(UUID, TEXT, TEXT) TO authenticated;
