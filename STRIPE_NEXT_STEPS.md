# Stripe Integration - Next Steps

Your database is now ready! Here are the next steps to complete the Stripe integration:

## ✅ **Completed**
- Database tables created with Stripe columns
- Stripe service updated for your schema
- Edge Function updated for your schema

## 🚀 **Next Steps**

### 1. **Set Up Stripe Account**
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Create your account if you haven't already
3. Switch to **Test Mode** for development

### 2. **Create Products & Prices**
1. Go to **Products** → **Add Product**
2. Create these products:

#### Starter Plan
- **Name**: Starter Plan
- **Price**: $29/month
- **Billing**: Recurring (monthly)
- **Copy the Price ID**: `price_xxxxxxxxxxxxx`

#### Professional Plan
- **Name**: Professional Plan  
- **Price**: $79/month
- **Billing**: Recurring (monthly)
- **Copy the Price ID**: `price_xxxxxxxxxxxxx`

#### Enterprise Plan
- **Name**: Enterprise Plan
- **Price**: Custom
- **Billing**: One-time
- **Copy the Price ID**: `price_xxxxxxxxxxxxx`

### 3. **Set Environment Variables**
Add these to your `.env.local` file:

```env
# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx
VITE_STRIPE_STARTER_PRICE_ID=price_xxxxxxxxxxxxx
VITE_STRIPE_PROFESSIONAL_PRICE_ID=price_xxxxxxxxxxxxx
VITE_STRIPE_ENTERPRISE_PRICE_ID=price_xxxxxxxxxxxxx
```

### 4. **Deploy Edge Function**
1. Install Supabase CLI (if not already installed):
   ```bash
   # For Windows (using PowerShell)
   iwr https://github.com/supabase/cli/releases/latest/download/supabase_windows_amd64.exe -OutFile supabase.exe
   ```

2. Deploy the function:
   ```bash
   supabase functions deploy stripe-handler
   ```

3. Set environment variables for the function:
   ```bash
   supabase secrets set STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
   supabase secrets set SUPABASE_URL=https://your-project.supabase.co
   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

### 5. **Configure Webhooks**
1. Go to **Developers** → **Webhooks** in Stripe Dashboard
2. Click **Add endpoint**
3. Set URL: `https://your-project.supabase.co/functions/v1/stripe-handler`
4. Select events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the **Webhook Secret**
6. Add to Supabase secrets:
   ```bash
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
   ```

### 6. **Test the Integration**
1. Start your development server
2. Go to the Pricing page
3. Click "Subscribe" on a plan
4. Use test card: `4242 4242 4242 4242`
5. Complete the checkout
6. Verify subscription appears in Stripe Dashboard
7. Check your database tables for the subscription data

## 🧪 **Test Cards**
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Requires Authentication**: `4000 0025 0000 3155`

## 🔧 **Troubleshooting**

### Common Issues:
1. **CORS errors**: Make sure Edge Function has proper CORS headers
2. **Webhook failures**: Check webhook secret and endpoint URL
3. **Database errors**: Verify RLS policies are set up correctly

### Debug Mode:
Add this to your Edge Function for debugging:
```typescript
console.log('Request data:', data);
```

## 📱 **Usage Examples**

### Create Subscription:
```typescript
const { createSubscription } = useStripeSubscription();
await createSubscription('professional', 'user@example.com', 'John Doe');
```

### Check Subscription:
```typescript
const { subscription, isSubscriptionActive } = useStripeSubscription();
if (isSubscriptionActive()) {
  console.log('Active subscription:', subscription);
}
```

### Manage Subscription:
```typescript
const { updateSubscription, cancelSubscription } = useStripeSubscription();
await updateSubscription('enterprise'); // Upgrade
await cancelSubscription(); // Cancel
```

## 🎉 **You're Ready!**

Once you complete these steps, your Stripe subscription system will be fully functional with:
- ✅ Subscription creation and management
- ✅ Plan upgrades/downgrades
- ✅ Billing portal access
- ✅ Payment tracking
- ✅ Webhook handling
- ✅ Tier system integration

Let me know if you need help with any of these steps! 