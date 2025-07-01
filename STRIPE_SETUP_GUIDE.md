# Stripe Subscription System Setup Guide

This guide will help you set up a complete Stripe subscription system for your LuxeTripBuilder application.

## Prerequisites

- Stripe account (https://stripe.com)
- Supabase project with Edge Functions enabled
- Node.js and npm installed

## 1. Stripe Setup

### 1.1 Create Stripe Products and Prices

1. Log into your Stripe Dashboard
2. Go to **Products** → **Add Product**
3. Create three products:

#### Starter Plan
- **Name**: Starter Plan
- **Description**: Perfect for individual travel agents
- **Product ID**: `prod_starter`
- **Price**: £29.00
- **Billing**: Recurring (monthly)
- **Trial period**: None (will be set at subscription level)
- **Note the Price ID**: `price_starter`

#### Professional Plan
- **Name**: Professional Plan
- **Description**: Ideal for growing travel agencies
- **Product ID**: `prod_professional`
- **Price**: £79.00
- **Billing**: Recurring (monthly)
- **Trial period**: None
- **Note the Price ID**: `price_professional`

#### Enterprise Plan
- **Name**: Enterprise Plan
- **Description**: For large travel organizations
- **Product ID**: `prod_enterprise`
- **Price**: £199.00
- **Billing**: Recurring (monthly)
- **Trial period**: None
- **Note the Price ID**: `price_enterprise`

### 1.2 Configure Webhooks

1. Go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Set endpoint URL: `https://your-project.supabase.co/functions/v1/stripe-handler`
4. Select events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Note the **Webhook Secret**: `whsec_xxxxxxxxxxxxx`

### 1.3 Get API Keys

1. Go to **Developers** → **API Keys**
2. Copy your **Publishable Key** and **Secret Key**

### 1.2 Create Prices

#### Starter Plan Price
1. Go to the Starter Plan product
2. Click "Add price"
3. Configure:
   - **Pricing model**: Standard pricing
   - **Price**: £29.00
   - **Billing period**: Monthly
   - **Trial period**: None (will be set at subscription level)
   - **Price ID**: Note this (e.g., `price_starter`)

#### Professional Plan Price
1. Go to the Professional Plan product
2. Click "Add price"
3. Configure:
   - **Pricing model**: Standard pricing
   - **Price**: £79.00
   - **Billing period**: Monthly
   - **Trial period**: None
   - **Price ID**: Note this (e.g., `price_professional`)

#### Enterprise Plan Price
1. Go to the Enterprise Plan product
2. Click "Add price"
3. Configure:
   - **Pricing model**: Standard pricing
   - **Price**: £199.00
   - **Billing period**: Monthly
   - **Trial period**: None
   - **Price ID**: Note this (e.g., `price_enterprise`)

## 2. Environment Variables

Add these environment variables to your `.env.local` file:

```env
# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx
VITE_STRIPE_STARTER_PRICE_ID=price_starter
VITE_STRIPE_PROFESSIONAL_PRICE_ID=price_professional
VITE_STRIPE_ENTERPRISE_PRICE_ID=price_enterprise

# Supabase Configuration (for Edge Functions)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe Webhook Secret (for Edge Functions)
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

## 3. Database Setup

### 3.1 Run Migration

Execute the database migration to create the subscription tables:

```bash
# Apply the migration
supabase db push
```

Or manually run the SQL from `supabase/migrations/20241204000000_create_subscription_system.sql`

### 3.2 Verify Tables

Check that these tables were created:
- `customers`
- `subscriptions`
- `billing_history`

## 4. Deploy Edge Function

### 4.1 Deploy the Stripe Handler

```bash
# Deploy the edge function
supabase functions deploy stripe-handler
```

### 4.2 Set Environment Variables for Edge Function

```bash
# Set environment variables for the edge function
supabase secrets set STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
supabase secrets set SUPABASE_URL=https://your-project.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 5. Frontend Integration

### 5.1 Install Dependencies

```bash
npm install stripe @stripe/stripe-js
```

### 5.2 Update API Endpoints

The frontend code expects these API endpoints:

- `POST /api/stripe/create-customer`
- `POST /api/stripe/create-checkout-session`
- `POST /api/stripe/update-subscription`
- `POST /api/stripe/cancel-subscription`
- `POST /api/stripe/reactivate-subscription`
- `POST /api/stripe/billing-portal`

These are handled by the Edge Function at `/functions/v1/stripe-handler`.

### 5.3 Update Stripe Service

The `src/lib/stripeService.ts` file contains the API calls. Update the fetch URLs to point to your Edge Function:

```typescript
// Update these URLs in stripeService.ts
const response = await fetch('/functions/v1/stripe-handler', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    action: 'create-checkout-session', // or other actions
    // ... other data
  }),
});
```

## 6. Testing

### 6.1 Test Cards

Use these Stripe test cards:

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Requires Authentication**: `4000 0025 0000 3155`

### 6.2 Test Flow

1. Create a test user account
2. Go to Pricing page
3. Click "Subscribe" on a plan
4. Complete checkout with test card
5. Verify subscription is created in Stripe Dashboard
6. Check database tables for subscription data

## 7. Production Deployment

### 7.1 Switch to Live Keys

1. Replace test keys with live keys in environment variables
2. Update webhook endpoint to production URL
3. Test with real payment methods

### 7.2 Security Considerations

- Never expose secret keys in frontend code
- Use environment variables for all sensitive data
- Implement proper error handling
- Add rate limiting to API endpoints
- Monitor webhook failures

## 8. Usage

### 8.1 Creating Subscriptions

```typescript
import { useStripeSubscription } from '@/hooks/useStripeSubscription';

const { createSubscription } = useStripeSubscription();

// Create a subscription
const result = await createSubscription(
  'professional',
  'user@example.com',
  'John Doe'
);
```

### 8.2 Managing Subscriptions

```typescript
const { 
  updateSubscription, 
  cancelSubscription, 
  openBillingPortal 
} = useStripeSubscription();

// Upgrade/downgrade
await updateSubscription('enterprise');

// Cancel
await cancelSubscription();

// Open billing portal
await openBillingPortal();
```

### 8.3 Checking Subscription Status

```typescript
const { 
  subscription, 
  isSubscriptionActive, 
  getCurrentPlan 
} = useStripeSubscription();

if (isSubscriptionActive()) {
  console.log('Current plan:', getCurrentPlan());
}
```

## 9. Troubleshooting

### Common Issues

1. **Webhook failures**: Check webhook secret and endpoint URL
2. **CORS errors**: Ensure Edge Function has proper CORS headers
3. **Database errors**: Verify RLS policies and table structure
4. **Payment failures**: Check Stripe dashboard for error details

### Debug Mode

Enable debug logging in the Edge Function:

```typescript
// Add to stripe-handler/index.ts
console.log('Request data:', data);
```

### Monitoring

- Monitor webhook delivery in Stripe Dashboard
- Check Supabase logs for Edge Function errors
- Set up alerts for failed payments

## 10. Additional Features

### 10.1 Usage Tracking

Implement usage tracking for API calls, storage, etc.:

```sql
-- Add usage tracking table
CREATE TABLE usage_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  metric_type TEXT NOT NULL,
  value INTEGER NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 10.2 Dunning Management

Handle failed payments and retry logic:

```typescript
// Add to webhook handler
case 'invoice.payment_failed':
  await handlePaymentFailed(event.data.object);
  break;
```

### 10.3 Analytics

Track subscription metrics:

```sql
-- Subscription analytics
SELECT 
  plan_type,
  COUNT(*) as subscribers,
  AVG(EXTRACT(DAY FROM (NOW() - created_at))) as avg_days_subscribed
FROM subscriptions 
WHERE status = 'active'
GROUP BY plan_type;
```

## Support

For issues with this implementation:

1. Check Stripe documentation: https://stripe.com/docs
2. Review Supabase Edge Functions docs: https://supabase.com/docs/guides/functions
3. Check the application logs for detailed error messages
4. Verify all environment variables are set correctly

## Security Notes

- Always validate webhook signatures
- Use HTTPS in production
- Implement proper authentication
- Monitor for suspicious activity
- Keep dependencies updated 

## Step 3: Trial Period Configuration

### 3.1 How Trial Periods Work
- **Trial periods are set at the subscription level**, not the product/price level
- The server automatically adds a 7-day trial for Starter plan subscriptions
- Professional and Enterprise plans have no trial period

### 3.2 Starter Plan Trial Setup
The server automatically configures:
- **Trial period**: 7 days (set in `subscription_data.trial_period_days`)
- **Payment method**: Required during signup
- **Trial end behavior**: Create invoice (default)

### 3.3 Trial Flow
1. User enters card details during signup
2. No charge is made immediately
3. User gets 7 days of full access
4. After 7 days, first charge is made
5. User can cancel anytime during trial to avoid charges 