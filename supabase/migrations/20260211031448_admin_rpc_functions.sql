-- ============================================
-- ADMIN RPC FUNCTIONS FOR DEALTOCK PLATFORM
-- ============================================

-- 1. DELIVERY API FUNCTION (Core function)
CREATE OR REPLACE FUNCTION update_order_from_delivery(
    p_api_key TEXT,
    p_order_id UUID,
    p_status TEXT,
    p_tracking_code TEXT DEFAULT NULL,
    p_cod_collected DECIMAL DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    v_company_id UUID;
    v_old_status TEXT;
    v_order_exists BOOLEAN;
BEGIN
    -- Verify API key and get company
    SELECT id INTO v_company_id 
    FROM delivery_companies 
    WHERE api_key = p_api_key AND is_active = true;
    
    IF v_company_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Invalid API key or company inactive'
        );
    END IF;
    
    -- Check if order exists and belongs to this company
    SELECT EXISTS (
        SELECT 1 FROM orders 
        WHERE id = p_order_id 
        AND delivery_company_id = v_company_id
    ) INTO v_order_exists;
    
    IF NOT v_order_exists THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Order not found or not assigned to this company'
        );
    END IF;
    
    -- Get current status
    SELECT status INTO v_old_status FROM orders WHERE id = p_order_id;
    
    -- Update order
    UPDATE orders 
    SET 
        status = p_status,
        carrier_tracking_code = COALESCE(p_tracking_code, carrier_tracking_code),
        cod_collected_amount = CASE 
            WHEN p_status = 'delivered' AND payment_method = 'COD' 
            THEN COALESCE(p_cod_collected, cod_collected_amount)
            ELSE cod_collected_amount
        END,
        payment_status = CASE 
            WHEN p_status = 'delivered' AND payment_method = 'COD' AND p_cod_collected IS NOT NULL
            THEN 'collected'
            WHEN p_status = 'delivered' AND payment_method = 'COD'
            THEN 'pending'
            ELSE payment_status
        END,
        updated_at = NOW(),
        delivered_at = CASE WHEN p_status = 'delivered' THEN NOW() ELSE delivered_at END
    WHERE id = p_order_id;
    
    -- Log status history
    INSERT INTO order_status_history (order_id, old_status, new_status, changed_by)
    VALUES (p_order_id, v_old_status, p_status, NULL);
    
    -- Handle escrow for COD deliveries
    IF p_status = 'delivered' AND EXISTS (
        SELECT 1 FROM orders o
        JOIN delivery_companies dc ON o.delivery_company_id = dc.id
        WHERE o.id = p_order_id 
        AND o.payment_method = 'COD'
        AND dc.escrow_enabled = true
    ) THEN
        INSERT INTO escrow_holdings (order_id, delivery_company_id, amount_held)
        SELECT 
            o.id,
            o.delivery_company_id,
            o.final_customer_price
        FROM orders o
        WHERE o.id = p_order_id
        ON CONFLICT (order_id) DO NOTHING;
    END IF;
    
    -- Log delivery company action
    INSERT INTO order_events (
        order_id,
        event_type,
        payload
    ) VALUES (
        p_order_id,
        'delivery_status_update',
        jsonb_build_object(
            'company_id', v_company_id,
            'old_status', v_old_status,
            'new_status', p_status,
            'tracking_code', p_tracking_code,
            'cod_collected', p_cod_collected,
            'notes', p_notes
        )
    );
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Order updated successfully',
        'order_id', p_order_id,
        'new_status', p_status
    );
END;
$$;

-- 2. Get delivery companies with stats (for admin dashboard)
CREATE OR REPLACE FUNCTION get_delivery_companies_with_stats()
RETURNS TABLE (
    id UUID,
    name TEXT,
    service_type TEXT,
    is_active BOOLEAN,
    escrow_enabled BOOLEAN,
    total_orders BIGINT,
    delivered_orders BIGINT,
    pending_escrow DECIMAL(10,2),
    average_rating NUMERIC,
    capacity INTEGER
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        dc.id,
        dc.name,
        dc.service_type,
        dc.is_active,
        dc.escrow_enabled,
        COUNT(o.id) as total_orders,
        COUNT(o.id) FILTER (WHERE o.status = 'delivered') as delivered_orders,
        COALESCE(SUM(
            CASE 
                WHEN o.status = 'delivered' 
                    AND o.payment_method = 'COD' 
                    AND dc.escrow_enabled = true 
                    AND NOT EXISTS (
                        SELECT 1 FROM escrow_holdings eh 
                        WHERE eh.order_id = o.id AND eh.released_at IS NOT NULL
                    )
                THEN o.final_customer_price 
                ELSE 0 
            END
        ), 0) as pending_escrow,
        dc.average_rating,
        dc.capacity
    FROM delivery_companies dc
    LEFT JOIN orders o ON dc.id = o.delivery_company_id
    GROUP BY dc.id
    ORDER BY dc.created_at DESC;
END;
$$;

-- 3. Admin override order status
CREATE OR REPLACE FUNCTION admin_override_order_status(
    p_order_id UUID,
    p_new_status TEXT,
    p_admin_id UUID,
    p_reason TEXT
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    v_old_status TEXT;
    v_order_number TEXT;
BEGIN
    -- Get current status and order number
    SELECT status, order_number INTO v_old_status, v_order_number 
    FROM orders WHERE id = p_order_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Order not found');
    END IF;
    
    -- Update order
    UPDATE orders 
    SET 
        status = p_new_status,
        updated_at = NOW()
    WHERE id = p_order_id;
    
    -- Log to order_status_history
    INSERT INTO order_status_history (order_id, old_status, new_status, changed_by)
    VALUES (p_order_id, v_old_status, p_new_status, p_admin_id);
    
    -- Log admin action
    INSERT INTO admin_actions (
        admin_id,
        entity_type,
        entity_id,
        action_type,
        reason,
        metadata
    ) VALUES (
        p_admin_id,
        'order',
        p_order_id,
        'override_status',
        p_reason,
        jsonb_build_object(
            'order_number', v_order_number,
            'old_status', v_old_status,
            'new_status', p_new_status
        )
    );
    
    RETURN jsonb_build_object('success', true, 'message', 'Status overridden');
END;
$$;

-- 4. Get pending escrow for admin
CREATE OR REPLACE FUNCTION get_pending_escrow()
RETURNS TABLE (
    order_id UUID,
    order_number VARCHAR,
    delivery_company_name TEXT,
    seller_name TEXT,
    seller_id UUID,
    amount_held NUMERIC,
    held_at TIMESTAMP,
    days_held INTEGER,
    is_eligible BOOLEAN
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.id,
        o.order_number,
        dc.name as delivery_company_name,
        p_seller.full_name as seller_name,
        o.seller_id,
        eh.amount_held,
        eh.held_at,
        EXTRACT(DAY FROM NOW() - eh.held_at)::INTEGER as days_held,
        CASE 
            WHEN EXTRACT(DAY FROM NOW() - eh.held_at) >= 3 
            THEN true 
            ELSE false 
        END as is_eligible
    FROM escrow_holdings eh
    JOIN orders o ON eh.order_id = o.id
    JOIN delivery_companies dc ON o.delivery_company_id = dc.id
    JOIN profiles p_seller ON o.seller_id = p_seller.id
    WHERE eh.released_at IS NULL
        AND o.status = 'delivered'
        AND o.payment_method = 'COD'
        AND dc.escrow_enabled = true
    ORDER BY eh.held_at ASC;
END;
$$;

-- 5. Release escrow funds
CREATE OR REPLACE FUNCTION release_escrow_funds(
    p_order_id UUID,
    p_admin_id UUID
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    v_escrow_record escrow_holdings%ROWTYPE;
    v_order_record orders%ROWTYPE;
BEGIN
    -- Get escrow record
    SELECT * INTO v_escrow_record 
    FROM escrow_holdings 
    WHERE order_id = p_order_id 
        AND released_at IS NULL;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'No pending escrow found');
    END IF;
    
    -- Get order record
    SELECT * INTO v_order_record FROM orders WHERE id = p_order_id;
    
    -- Update escrow record
    UPDATE escrow_holdings 
    SET 
        released_at = NOW(),
        release_reason = 'settled',
        updated_at = NOW()
    WHERE id = v_escrow_record.id;
    
    -- Update order status to settled
    UPDATE orders 
    SET 
        status = 'settled',
        updated_at = NOW()
    WHERE id = p_order_id;
    
    -- Log order status change
    INSERT INTO order_status_history (order_id, old_status, new_status, changed_by)
    VALUES (p_order_id, 'delivered', 'settled', p_admin_id);
    
    -- Log admin action
    INSERT INTO admin_actions (
        admin_id,
        entity_type,
        entity_id,
        action_type,
        reason,
        metadata
    ) VALUES (
        p_admin_id,
        'settlement',
        p_order_id,
        'force_settlement',
        'Released escrow funds to seller',
        jsonb_build_object(
            'order_id', p_order_id,
            'order_number', v_order_record.order_number,
            'amount', v_escrow_record.amount_held,
            'seller_id', v_order_record.seller_id
        )
    );
    
    RETURN jsonb_build_object(
        'success', true,
        'message', CONCAT('Released MAD ', v_escrow_record.amount_held, ' from escrow')
    );
END;
$$;

-- 6. Simple function to validate order status transitions
CREATE OR REPLACE FUNCTION validate_order_status_transition(old_status TEXT, new_status TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN CASE 
        WHEN old_status = 'ordered' AND new_status IN ('ready', 'cancelled') THEN true
        WHEN old_status = 'ready' AND new_status IN ('picked', 'cancelled') THEN true
        WHEN old_status = 'picked' AND new_status IN ('shipped', 'cancelled') THEN true
        WHEN old_status = 'shipped' AND new_status IN ('in_transit', 'out_for_delivery', 'cancelled') THEN true
        WHEN old_status = 'in_transit' AND new_status IN ('out_for_delivery', 'delivered', 'returned', 'cancelled') THEN true
        WHEN old_status = 'out_for_delivery' AND new_status IN ('delivered', 'returned', 'cancelled') THEN true
        WHEN old_status = 'delivered' AND new_status IN ('settled', 'returned') THEN true
        WHEN old_status = 'returned' AND new_status = 'cancelled' THEN true
        ELSE false
    END;
END;
$$;

-- ============================================
-- PERFORMANCE INDEXES (Only if they don't exist)
-- ============================================

DO $$ 
BEGIN
    -- Check and create indexes safely
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_orders_status_created' AND schemaname = 'public') THEN
        CREATE INDEX idx_orders_status_created ON orders(status, created_at DESC);
        RAISE NOTICE 'Created index idx_orders_status_created';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_orders_delivery_company_status' AND schemaname = 'public') THEN
        CREATE INDEX idx_orders_delivery_company_status ON orders(delivery_company_id, status);
        RAISE NOTICE 'Created index idx_orders_delivery_company_status';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_escrow_holdings_released' AND schemaname = 'public') THEN
        CREATE INDEX idx_escrow_holdings_released ON escrow_holdings(released_at) WHERE released_at IS NULL;
        RAISE NOTICE 'Created index idx_escrow_holdings_released';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_admin_actions_admin_created' AND schemaname = 'public') THEN
        CREATE INDEX idx_admin_actions_admin_created ON admin_actions(admin_id, created_at DESC);
        RAISE NOTICE 'Created index idx_admin_actions_admin_created';
    END IF;
    
    RAISE NOTICE 'All indexes checked/created successfully';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error creating indexes: %', SQLERRM;
END $$;
