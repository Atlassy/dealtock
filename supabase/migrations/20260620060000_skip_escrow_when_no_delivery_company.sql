-- ============================================
-- FIX: create_escrow_on_order() crashed on any order without a courier yet
-- ============================================
-- This trigger fires on every order INSERT and unconditionally inserts into
-- escrow_holdings using NEW.delivery_company_id, but escrow_holdings.
-- delivery_company_id is NOT NULL. Any order created without a delivery
-- company already assigned (e.g. a dropshipper B2B order, where a courier
-- gets assigned later) crashed with "null value in column
-- delivery_company_id... violates not-null constraint". Escrow only makes
-- sense once a courier actually holds the COD funds, so skip it entirely
-- when there's no delivery company yet.

CREATE OR REPLACE FUNCTION public.create_escrow_on_order()
RETURNS trigger
LANGUAGE plpgsql
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
