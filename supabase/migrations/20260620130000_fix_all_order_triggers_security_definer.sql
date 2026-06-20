-- ============================================
-- FIX: 9 order-related trigger functions weren't SECURITY DEFINER
-- ============================================
-- Any trigger fired by a direct client-side insert/update on `orders`
-- (guest checkout, regular marketplace checkout, status changes from the
-- seller/admin dashboards that aren't wrapped in an already-elevated RPC)
-- runs with the *original caller's* permissions unless the trigger function
-- itself is SECURITY DEFINER. Several of these write to tables that only
-- admins/the system are allowed to touch directly (financial_ledger,
-- escrow_holdings-adjacent tables, payouts, admin_actions, order_status_history),
-- so guest/customer orders failed RLS the moment any of these fired.
-- compute_order_financials, create_escrow_on_order, auto_assign_delivery_company
-- and generate_invoice_on_delivery were already fixed/correct - this covers
-- the rest so we don't keep hitting this one function at a time.

ALTER FUNCTION public.create_ledger_entry() SECURITY DEFINER SET search_path = public;
ALTER FUNCTION public.create_payouts_on_delivery() SECURITY DEFINER SET search_path = public;
ALTER FUNCTION public.detect_order_anomalies() SECURITY DEFINER SET search_path = public;
ALTER FUNCTION public.finalize_ledger_on_delivery() SECURITY DEFINER SET search_path = public;
ALTER FUNCTION public.generate_order_number() SECURITY DEFINER SET search_path = public;
ALTER FUNCTION public.notify_order_update() SECURITY DEFINER SET search_path = public;
ALTER FUNCTION public.release_escrow_on_delivery() SECURITY DEFINER SET search_path = public;
ALTER FUNCTION public.set_default_order_status() SECURITY DEFINER SET search_path = public;
ALTER FUNCTION public.track_order_status_change() SECURITY DEFINER SET search_path = public;
