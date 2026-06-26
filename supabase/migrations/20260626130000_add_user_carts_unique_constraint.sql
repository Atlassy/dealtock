-- useCart.jsx treated user_carts as one JSONB-blob row per user (a column
-- "items" that never existed), so every cart save for a logged-in user
-- failed silently and nothing ever persisted. The real schema is normalized
-- (one row per user_id + product_id), but had no unique constraint to
-- upsert against. Add it so the rewritten cart logic can upsert per item.
ALTER TABLE user_carts ADD CONSTRAINT user_carts_user_product_unique UNIQUE (user_id, product_id);
