-- Add coupon code and discount amount columns to orders table
-- Run this in Supabase SQL Editor

-- Add coupon_code column
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS coupon_code TEXT;

-- Add discount_amount column
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS discount_amount NUMERIC DEFAULT 0;

-- Verify columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'orders' 
AND column_name IN ('coupon_code', 'discount_amount')
ORDER BY column_name;



