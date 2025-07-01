# Edge Function Deployment Guide

## Current Status
The Stripe integration is currently using a **mock implementation** for development. This allows you to test the UI and subscription flow without needing the Edge Function deployed.

## To Deploy the Edge Function (Production)

### Option 1: Using Supabase Dashboard (Recommended)

1. **Go to your Supabase Dashboard**
   - Navigate to your project
   - Go to "Edge Functions" in the left sidebar

2. **Create the Edge Function**
   - Click "Create a new function"
   - Name it: `stripe-handler`
   - Copy the contents of `supabase/functions/stripe-handler/index.ts` into the function editor

3. **Set Environment Variables**
   - In the Edge Function settings, add these environment variables:
   ```
   STRIPE_SECRET_KEY=sk_test_... (your Stripe secret key)
   STRIPE_WEBHOOK_SECRET=whsec_... (your webhook secret)
   ```

4. **Deploy the Function**
   - Click "Deploy" to make it live

### Option 2: Using Supabase CLI (Alternative)

If you can get the CLI working:

```bash
# Install Supabase CLI (if not already installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref YOUR_PROJECT_REF

# Deploy the function
supabase functions deploy stripe-handler
```

## Switch to Production Mode

Once the Edge Function is deployed, update `src/lib/stripeService.ts`:

1. **Replace the mock implementation** with the real Stripe calls
2. **Remove the alert() calls** and use proper error handling
3. **Update the createCheckoutSession method** to call the Edge Function

## Testing the Integration

### Current (Mock Mode)
- ✅ UI works and shows subscription options
- ✅ Database updates with mock subscription data
- ✅ Tier restrictions work
- ✅ Subscription management UI works

### After Edge Function Deployment
- ✅ Real Stripe checkout flow
- ✅ Actual payment processing
- ✅ Webhook handling for subscription events
- ✅ Billing portal integration

## Environment Variables Needed

Make sure you have these in your `.env.local`:

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_STRIPE_STARTER_PRICE_ID=price_...
VITE_STRIPE_PROFESSIONAL_PRICE_ID=price_...
VITE_STRIPE_ENTERPRISE_PRICE_ID=price_...
```

## Next Steps

1. **Test the mock implementation** - it should work now without the 404 error
2. **Set up your Stripe account** and get the necessary keys
3. **Deploy the Edge Function** when ready for production
4. **Switch from mock to real implementation**

The mock implementation allows you to continue development while the Edge Function deployment is being set up! 