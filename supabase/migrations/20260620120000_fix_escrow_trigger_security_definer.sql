-- ============================================
-- FIX: create_escrow_on_order() ran as the caller, not as an elevated role
-- ============================================
-- This trigger fires automatically whenever ANY order is inserted, by ANY
-- role (guest, customer, dropshipper, seller, admin). But it wasn't marked
-- SECURITY DEFINER, so it ran with the *calling* role's own permissions -
-- and escrow_holdings only allows admins to insert directly ("no direct
-- escrow insert" / "admin manages escrow" policies). So any order placed
-- by a non-admin (i.e. every real customer order) failed with "new row
-- violates row-level security policy for table escrow_holdings" the moment
-- a delivery company was set. compute_order_financials() (the sibling
-- trigger) already correctly uses SECURITY DEFINER - this aligns
-- create_escrow_on_order() with that same pattern.

CREATE OR REPLACE FUNCTION public.create_escrow_on_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    IF NEW.delivery_company_id IS NULL THEN
        RETURN NEW;
    END IF;

    INSERT INTO public.escrow_holdings (
        order_id,
        delivery_company_id,
        amount_held,
        currency
    )
    VALUES (
        NEW.id,
        NEW.delivery_company_id,
        NEW.final_customer_price,
        'MAD'
    );

    RETURN NEW;
END;
$function$;
