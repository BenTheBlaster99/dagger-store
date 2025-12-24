# Order Submission Debugging Guide

## What I've Added

1. **Comprehensive Console Logging**
   - Logs all data being sent to Supabase
   - Logs each step of the order creation process
   - Shows detailed error messages with codes

2. **Better Error Handling**
   - Specific error messages for RLS policy issues
   - Product ID validation
   - Data type conversion (ensuring numbers are numbers)

3. **Improved Validation**
   - Better phone number cleaning
   - More specific error messages

## How to Debug

### Step 1: Open Browser Console
1. Open your checkout page
2. Press `F12` or `Right-click → Inspect → Console tab`
3. Fill out the form and click "Place Order"

### Step 2: Check Console Logs
You should see logs like:
```
📦 Submitting order with data: {...}
Step 1: Creating order...
✅ Order created successfully: [order-id]
Step 2: Creating order item...
✅ Order item created successfully: {...}
🎉 Complete order submitted
```

### Step 3: If You See Errors

#### Error: "RLS policy error"
**Solution:** Run `fix-rls-policies.sql` in Supabase SQL Editor

#### Error: "Could not find the table"
**Solution:** Run `supabase-migrations.sql` in Supabase SQL Editor

#### Error: "Product ID is missing"
**Check:** 
- Is the product being fetched correctly?
- Check the product object in console

#### Error: Validation errors
**Check:**
- All required fields are filled
- Phone number format is correct (0550123456)
- Size and Color are selected
- Wilaya and Commune are selected

### Step 4: Verify in Supabase

1. Go to Supabase Dashboard → Table Editor
2. Check `orders` table - should see your order
3. Check `order_items` table - should see the order item

## Common Issues & Fixes

### Issue: "new row violates row-level security policy"
**Fix:** Run this in Supabase SQL Editor:
```sql
-- From fix-rls-policies.sql
DROP POLICY IF EXISTS "Allow insert for orders" ON public.orders;
DROP POLICY IF EXISTS "Allow insert for order_items" ON public.order_items;

CREATE POLICY "Allow insert for orders" ON public.orders
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow insert for order_items" ON public.order_items
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
```

### Issue: Table not found
**Fix:** Run `supabase-migrations.sql` in Supabase SQL Editor

### Issue: Product ID format mismatch
**Check:** 
- Product ID should be UUID format
- Check if product.id exists in console logs

## Testing Checklist

- [ ] Product loads correctly
- [ ] All form fields are visible
- [ ] Validation works (try submitting empty form)
- [ ] Size selection works
- [ ] Color selection works
- [ ] Wilaya/Commune selection works
- [ ] Console shows order data before submission
- [ ] Order is created in Supabase
- [ ] Order item is created in Supabase
- [ ] Success message appears

## Next Steps

1. Try placing an order
2. Check browser console for logs
3. Share the console output if there are errors
4. Verify data appears in Supabase tables



