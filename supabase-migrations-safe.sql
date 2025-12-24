-- SAFE VERSION: Only creates tables if they don't exist, and indexes only if columns exist
-- Use this if you want to preserve existing data

-- Step 1: Create orders table (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  wilaya TEXT NOT NULL,
  commune TEXT NOT NULL,
  notes TEXT,
  delivery_method TEXT NOT NULL,
  delivery_cost NUMERIC NOT NULL,
  total_price NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  size TEXT,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Step 2: Create order_items table (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  price NUMERIC NOT NULL,
  size TEXT,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Step 3: Add missing columns if they don't exist (for existing tables)
DO $$ 
BEGIN
  -- Add columns to orders table if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='size') THEN
    ALTER TABLE public.orders ADD COLUMN size TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='color') THEN
    ALTER TABLE public.orders ADD COLUMN color TEXT;
  END IF;
  
  -- Add columns to order_items table if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='order_items' AND column_name='size') THEN
    ALTER TABLE public.order_items ADD COLUMN size TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='order_items' AND column_name='color') THEN
    ALTER TABLE public.order_items ADD COLUMN color TEXT;
  END IF;
END $$;

-- Step 4: Create indexes only if columns exist
DO $$
BEGIN
  -- Create indexes for orders table
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='status') THEN
    CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='created_at') THEN
    CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);
  END IF;
  
  -- Create indexes for order_items table
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='order_items' AND column_name='order_id') THEN
    CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='order_items' AND column_name='product_id') THEN
    CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);
  END IF;
END $$;





