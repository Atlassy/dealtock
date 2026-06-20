-- ============================================
-- FIX: update_order_status crashed when no reason was given
-- ============================================
-- OrderOversightSection.jsx calls update_order_status with p_reason: null
-- (changing status via the dropdown doesn't ask the admin for a reason),
-- but admin_actions.reason is NOT NULL. Default to a generic message
-- instead of requiring every status change to carry an explicit reason.

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

    INSERT INTO admin_actions (admin_id, entity_type, entity_id, action_type, reason, metadata)
    VALUES (
        v_admin_id,
        'order',
        p_order_id,
        'update_status',
        COALESCE(p_reason, 'Status updated via Order Oversight'),
        jsonb_build_object('old_status', v_old_status, 'new_status', p_new_status)
    );

    RETURN jsonb_build_object('success', true);
END;
$$;
