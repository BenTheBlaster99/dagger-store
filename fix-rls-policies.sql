-- Fix RLS Policies for orders and order_items tables
-- Run this in Supabase SQL Editor

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow insert for orders" ON public.orders;
DROP POLICY IF EXISTS "Allow insert for order_items" ON public.order_items;
DROP POLICY IF EXISTS "Allow all for orders" ON public.orders;
DROP POLICY IF EXISTS "Allow all for order_items" ON public.order_items;

-- Create new policies that allow anonymous inserts
CREATE POLICY "Allow insert for orders" ON public.orders
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow insert for order_items" ON public.order_items
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Optional: Allow SELECT for service role (if you need to read orders from admin)
-- CREATE POLICY "Allow select for service role" ON public.orders
--   FOR SELECT
--   TO service_role
--   USING (true);

