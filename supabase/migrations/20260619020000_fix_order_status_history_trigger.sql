-- ============================================
-- FIX: track_order_status_change() trigger referenced a column that doesn't exist
-- ============================================
-- order_status_history has a `created_at` column (with a default), not `changed_at`.
-- This trigger fires on every UPDATE to orders.status, so it broke every single
-- status change on the platform (seller approve/ready, admin override, delivery
-- webhooks, etc) the moment OLD.status != NEW.status — not just the new RPCs.

CREATE OR REPLACE FUNCTION public.track_order_status_change()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.order_status_history (order_id, old_status, new_status)
    VALUES (NEW.id, OLD.status, NEW.status);
  END IF;
  RETURN NEW;
END;
$function$;

-- Since this trigger already logs every status change automatically, remove the
-- now-redundant manual INSERT INTO order_status_history from our own RPCs
-- (added in 20260619000000_seller_admin_order_status_rpcs.sql) to avoid double logging.

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

    RETURN jsonb_build_object('success', true);
END;
$$;

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

    RETURN jsonb_build_object('success', true);
END;
$$;

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
        p_reason,
        jsonb_build_object('old_status', v_old_status, 'new_status', p_new_status)
    );

    RETURN jsonb_build_object('success', true);
END;
$$;
