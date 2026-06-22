-- seller_mark_ready() set status = 'ready', but every other part of the app
-- (SellerOrders.jsx, MyOrders.jsx, DropshipperOrders.jsx, DropshipperDashboard.jsx,
-- StatusMappingTab.jsx) uses 'ready_for_pickup'. DeliveryDashboard.jsx never saw
-- these orders because it filters on 'ready', not 'ready_for_pickup'. Align on the
-- name used everywhere else in the app.
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
    SET status = 'ready_for_pickup',
        ready_for_pickup_at = NOW(),
        updated_at = NOW()
    WHERE id = p_order_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'code', 'UPDATE_FAILED', 'error', 'Failed to update order status');
    END IF;

    INSERT INTO order_status_history (order_id, old_status, new_status, changed_by)
    VALUES (p_order_id, v_status, 'ready_for_pickup', p_seller_id);

    RETURN jsonb_build_object('success', true);
END;
$$;
