-- role_requests_insert_own (auth.uid() = user_id) blocked every submission:
-- right after supabase.auth.signUp(), with email confirmation required,
-- there is no active session yet, so auth.uid() is null and the insert
-- always failed with 42501. Use a SECURITY DEFINER RPC instead, which can
-- validate the target user exists without needing an active session.
CREATE OR REPLACE FUNCTION submit_role_request(
    p_user_id UUID,
    p_requested_role TEXT,
    p_company_name TEXT,
    p_phone TEXT DEFAULT NULL,
    p_message TEXT DEFAULT NULL
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_user_id) THEN
        RETURN jsonb_build_object('success', false, 'error', 'User not found');
    END IF;

    IF p_requested_role NOT IN ('seller', 'delivery') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid role');
    END IF;

    INSERT INTO role_requests (user_id, requested_role, company_name, phone, message)
    VALUES (p_user_id, p_requested_role, p_company_name, p_phone, p_message);

    RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION submit_role_request(UUID, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;
