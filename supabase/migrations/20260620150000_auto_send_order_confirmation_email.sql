-- ============================================
-- AUTO-SEND ORDER CONFIRMATION EMAIL VIA RESEND
-- ============================================
-- Sends an email with the order number as soon as an order is created,
-- using pg_net (async HTTP from Postgres) to call the Resend API directly -
-- no edge function deployment needed. The Resend API key itself is NOT in
-- this file; it must be stored via Supabase Vault separately:
--   SELECT vault.create_secret('the-real-key', 'resend_api_key');
-- (run that directly in the SQL editor, never commit the literal key).
-- ALTER DATABASE ... SET app.settings.* requires superuser and is not
-- available on hosted Supabase, so Vault is used instead.
-- If the key isn't configured yet, this silently does nothing rather than
-- blocking order creation.

CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE OR REPLACE FUNCTION public.send_order_confirmation_email()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $function$
DECLARE
  v_api_key TEXT;
  v_email TEXT := NEW.customer_email;
  v_name TEXT := COALESCE(NEW.shipping_address->>'name', 'there');
BEGIN
  SELECT decrypted_secret INTO v_api_key
  FROM vault.decrypted_secrets
  WHERE name = 'resend_api_key';

  IF v_api_key IS NULL OR v_email IS NULL THEN
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url := 'https://api.resend.com/emails',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || v_api_key,
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'from', 'Dealtock <onboarding@resend.dev>',
      'to', jsonb_build_array(v_email),
      'subject', 'Your Dealtock order ' || NEW.order_number || ' is confirmed',
      'html',
        '<h2>Thanks for your order, ' || v_name || '!</h2>' ||
        '<p>Your order number is <strong>' || NEW.order_number || '</strong>. ' ||
        'Keep this to track your delivery.</p>' ||
        '<p>Total: ' || COALESCE(NEW.final_customer_price::text, '0') || ' MAD (Cash on Delivery)</p>'
    )
  );

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS tr_send_order_confirmation_email ON public.orders;
CREATE TRIGGER tr_send_order_confirmation_email
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.send_order_confirmation_email();
