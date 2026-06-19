-- ============================================
-- AUTO-GENERATE INVOICE WHEN AN ORDER IS DELIVERED
-- ============================================
-- The `invoices` table has always been empty: nothing in the database ever
-- inserted a row into it. This adds a trigger that creates an invoice
-- (+ one invoice_lines row) the first time an order's status becomes
-- 'delivered', using the financials already computed by
-- compute_order_financials() into order_financials.

CREATE OR REPLACE FUNCTION public.generate_invoice_on_delivery()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_financials_id UUID;
  v_invoice_id UUID;
  v_invoice_number TEXT;
  v_product_name TEXT;
  v_quantity INTEGER;
  v_unit_price NUMERIC;
BEGIN
  IF NEW.status <> 'delivered' OR OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  -- Don't double-invoice the same order
  IF EXISTS (SELECT 1 FROM invoices WHERE order_id = NEW.id) THEN
    RETURN NEW;
  END IF;

  SELECT id INTO v_financials_id FROM order_financials WHERE order_id = NEW.id;

  v_invoice_number := 'INV-' || COALESCE(
    NULLIF(regexp_replace(NEW.order_number, '^ORD-', ''), ''),
    substr(NEW.id::text, 1, 8)
  );

  INSERT INTO invoices (invoice_number, order_id, financials_id, invoice_type, invoice_date, status)
  VALUES (v_invoice_number, NEW.id, v_financials_id, 'sale', NOW(), 'generated')
  RETURNING id INTO v_invoice_id;

  SELECT p.name, NEW.ordered_quantity, NEW.product_price
  INTO v_product_name, v_quantity, v_unit_price
  FROM products p WHERE p.id = NEW.product_id;

  INSERT INTO invoice_lines (invoice_id, description, quantity, unit_price, total_price, tax_rate, tax_amount)
  VALUES (
    v_invoice_id,
    COALESCE(v_product_name, 'Order ' || NEW.order_number),
    COALESCE(v_quantity, 1),
    COALESCE(v_unit_price, 0),
    COALESCE(v_unit_price, 0) * COALESCE(v_quantity, 1),
    COALESCE(NEW.tax_rate, 0),
    COALESCE(NEW.tax_amount, 0)
  );

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS tr_generate_invoice ON orders;
CREATE TRIGGER tr_generate_invoice
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION generate_invoice_on_delivery();
