-- dealtock.ma is now verified on Resend, so order confirmation emails no
-- longer need to ride on the shared onboarding@resend.dev sandbox address
-- (which also couldn't send to anyone but the account owner).
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
      'from', 'Dealtock <commandes@dealtock.ma>',
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
