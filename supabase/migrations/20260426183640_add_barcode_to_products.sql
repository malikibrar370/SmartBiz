-- Add barcode column to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS barcode TEXT;

-- Add unique constraint so a user cannot have two products with the same barcode
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_user_barcode'
  ) THEN
    ALTER TABLE public.products ADD CONSTRAINT unique_user_barcode UNIQUE (created_by, barcode);
  END IF;
END $$;
