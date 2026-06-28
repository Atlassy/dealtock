-- AddProductForm.jsx / EditProductForm.jsx have always sent condition as
-- 'new' / 'opened_like_new' / 'damaged', but the CHECK constraint only
-- allowed 'A'/'B'/'C'/'D' — every "Add Product" from the UI has been
-- failing on this constraint since the form existed. All 38 existing
-- products were inserted some other way (bulk import), bypassing the form
-- entirely, which is why this went unnoticed.
-- Existing rows used the old letter-grade scheme; 'A' was the only value
-- actually used and maps to the closest equivalent, "new". Must run before
-- swapping the constraint, otherwise adding the new CHECK fails validation
-- against the still-present 'A' values.
UPDATE products SET condition = 'new' WHERE condition = 'A';

ALTER TABLE products DROP CONSTRAINT products_condition_check;
ALTER TABLE products ADD CONSTRAINT products_condition_check
  CHECK (condition IS NULL OR condition = ANY (ARRAY['new', 'opened_like_new', 'damaged']));
