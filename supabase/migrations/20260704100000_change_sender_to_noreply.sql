-- Change order confirmation sender from commandes@ to noreply@dealtock.ma
CREATE OR REPLACE FUNCTION send_order_confirmation_email(order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order orders%ROWTYPE;
  v_product products%ROWTYPE;
  v_resend_key text;
BEGIN
  SELECT * INTO v_order FROM orders WHERE id = order_id;
  SELECT * INTO v_product FROM products WHERE id = v_order.product_id;

  SELECT value INTO v_resend_key
  FROM app_secrets WHERE key = 'RESEND_API_KEY';

  PERFORM net.http_post(
    url := 'https://api.resend.com/emails',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || v_resend_key,
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'from', 'Dealtock <noreply@dealtock.ma>',
      'to', ARRAY[v_order.customer_email],
      'subject', 'Confirmation de commande #' || COALESCE(v_order.order_number::text, v_order.id::text),
      'html', '<h2>Merci pour votre commande !</h2>' ||
              '<p>Votre commande pour <strong>' || COALESCE(v_product.name, 'produit') || '</strong> a bien été reçue.</p>' ||
              '<p><strong>Montant :</strong> ' || v_order.final_customer_price || ' MAD</p>' ||
              '<p><strong>Ville :</strong> ' || COALESCE(v_order.shipping_city, '') || '</p>' ||
              '<p>Nous vous contacterons pour confirmer la livraison.</p>' ||
              '<br><p>— L''équipe Dealtock</p>'
    )
  );
END;
$$;
