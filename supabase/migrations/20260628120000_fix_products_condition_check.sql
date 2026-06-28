-- AddProductForm.jsx / EditProductForm.jsx have always sent condition as
-- 'new' / 'opened_like_new' / 'damaged', but the CHECK constraint only
-- allowed 'A'/'B'/'C'/'D' — every "Add Product" from the UI has been
-- failing on this constraint since the form existed.
--
-- 'A' isn't just a legacy code though: products_returned_sealed_only
-- requires condition = 'A' specifically for source_type = 'returned'
-- (the "Sealed" badge on returned-product listings). So 'A' must stay a
-- valid value alongside the new seller-facing scheme, not be replaced by it.
--
-- Drop the old constraint FIRST: it's still enforced during the UPDATE
-- below otherwise, and writing 'new' would violate the still-active
-- 'A'/'B'/'C'/'D'-only check before we ever get to swapping it.
ALTER TABLE products DROP CONSTRAINT products_condition_check;

-- Only the regular (non-returned) listings that used the old letter-grade
-- scheme get migrated to the new value; returned/sealed items keep 'A'.
UPDATE products SET condition = 'new' WHERE condition = 'A' AND source_type = 'new';

ALTER TABLE products ADD CONSTRAINT products_condition_check
  CHECK (condition IS NULL OR condition = ANY (ARRAY['new', 'opened_like_new', 'damaged', 'A']));
