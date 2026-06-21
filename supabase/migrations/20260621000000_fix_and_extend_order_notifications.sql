-- ============================================
-- FIX + EXTEND ORDER NOTIFICATIONS
-- ============================================
-- notify_order_update() previously fired on every single UPDATE to orders
-- (even ones that don't touch status, e.g. editing the shipping address),
-- and only ever notified the seller. Customers and dropshippers never got
-- notified about their own orders.

CREATE OR REPLACE FUNCTION public.notify_order_update()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.seller_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, type, entity_type, entity_id, title, message)
      VALUES (NEW.seller_id, 'order_update', 'order', NEW.id,
              'Order ' || NEW.order_number,
              'Status changed to ' || NEW.status);
    END IF;

    IF NEW.customer_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, type, entity_type, entity_id, title, message)
      VALUES (NEW.customer_id, 'order_update', 'order', NEW.id,
              'Order ' || NEW.order_number,
              'Your order status changed to ' || NEW.status);
    END IF;

    IF NEW.dropshipper_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, type, entity_type, entity_id, title, message)
      VALUES (NEW.dropshipper_id, 'order_update', 'order', NEW.id,
              'Order ' || NEW.order_number,
              'Order status changed to ' || NEW.status);
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

-- New: notify the seller (and dropshipper, if any) the moment an order is placed.
-- Guests/customers don't need this one - they already get the confirmation email.
CREATE OR REPLACE FUNCTION public.notify_new_order()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.seller_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, entity_type, entity_id, title, message)
    VALUES (NEW.seller_id, 'new_order', 'order', NEW.id,
            'New order received',
            'Order ' || NEW.order_number || ' was just placed.');
  END IF;

  IF NEW.dropshipper_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, entity_type, entity_id, title, message)
    VALUES (NEW.dropshipper_id, 'new_order', 'order', NEW.id,
            'Order placed',
            'Order ' || NEW.order_number || ' was placed successfully.');
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS tr_notify_new_order ON public.orders;
CREATE TRIGGER tr_notify_new_order
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_order();
