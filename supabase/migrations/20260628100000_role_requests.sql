-- "Become a seller / delivery partner" flow (like Amazon/AliExpress seller
-- onboarding): anyone can sign up as a plain customer immediately, but
-- requesting the 'seller' or 'delivery' role creates a pending request an
-- admin must approve before the role is actually granted. Self-signup never
-- grants these roles directly — that would let anyone list products or get
-- access to delivery/customer data without vetting.

CREATE TABLE role_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    requested_role TEXT NOT NULL CHECK (requested_role IN ('seller', 'delivery')),
    company_name TEXT NOT NULL,
    phone TEXT,
    message TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by UUID REFERENCES profiles(id),
    reviewed_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE role_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY role_requests_insert_own ON role_requests
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY role_requests_select_own_or_admin ON role_requests
FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY role_requests_update_admin ON role_requests
FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE OR REPLACE FUNCTION approve_role_request(p_request_id UUID)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    v_admin_id UUID := auth.uid();
    v_request role_requests;
    v_email TEXT;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = v_admin_id AND role = 'admin') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authorized');
    END IF;

    SELECT * INTO v_request FROM role_requests WHERE id = p_request_id;
    IF NOT FOUND OR v_request.status <> 'pending' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Request not found or already reviewed');
    END IF;

    UPDATE profiles SET role = v_request.requested_role WHERE id = v_request.user_id
    RETURNING email INTO v_email;

    -- For a delivery partner, create the matching delivery_companies row
    -- right away so their dashboard finds it immediately (DeliveryDashboard.jsx
    -- looks up the company by matching profiles.email = delivery_companies.email).
    IF v_request.requested_role = 'delivery' THEN
        INSERT INTO delivery_companies (name, email, phone, is_active)
        VALUES (v_request.company_name, v_email, v_request.phone, true)
        ON CONFLICT DO NOTHING;
    END IF;

    UPDATE role_requests
    SET status = 'approved', reviewed_by = v_admin_id, reviewed_at = NOW()
    WHERE id = p_request_id;

    RETURN jsonb_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION reject_role_request(p_request_id UUID, p_reason TEXT DEFAULT NULL)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    v_admin_id UUID := auth.uid();
BEGIN
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = v_admin_id AND role = 'admin') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authorized');
    END IF;

    UPDATE role_requests
    SET status = 'rejected', reviewed_by = v_admin_id, reviewed_at = NOW(), rejection_reason = p_reason
    WHERE id = p_request_id AND status = 'pending';

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Request not found or already reviewed');
    END IF;

    RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION approve_role_request(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION reject_role_request(UUID, TEXT) TO authenticated;
