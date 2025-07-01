# Stripe Production Setup Guide

This guide will help you set up your Stripe integration for production using Supabase Edge Functions instead of the local development server.

## 🚀 What's Changed

We've migrated from a local development server (`server.cjs`) to using Supabase Edge Functions for all Stripe operations. This provides:

- ✅ Better scalability and reliability
- ✅ Automatic deployment with your Supabase project
- ✅ No need to run a local server
- ✅ Production-ready webhook handling
- ✅ Secure environment variable management

## 📋 Prerequisites

1. **Stripe Account**: Set up your production Stripe account
2. **Supabase Project**: Ensure your Supabase project is ready
3. **Environment Variables**: Configure all necessary environment variables

## 🔧 Step 1: Stripe Production Setup

### 1.1 Create Production Products and Prices

1. Log into your [Stripe Dashboard](https://dashboard.stripe.com)
2. Go to **Products** → **Add Product**
3. Create products for each plan:

#### Free Plan
- **Name**: Free (Solo)
- **Price**: £0/month
- **No Stripe product needed** (handled in code)

#### Pro Plan
- **Name**: Pro (White-label)
- **Price**: £29/month
- **Billing**: Recurring
- **Currency**: GBP
- **Copy the Price ID** (starts with `price_`)

#### Agency Plan
- **Name**: Agency
- **Price**: £79/month
- **Billing**: Recurring
- **Currency**: GBP
- **Copy the Price ID** (starts with `price_`)

#### Enterprise Plan
- **Name**: Enterprise
- **Price**: Custom
- **No Stripe product needed** (handled manually)

### 1.2 Set Up Webhooks

1. Go to **Developers** → **Webhooks** in Stripe Dashboard
2. Click **Add endpoint**
3. Set the endpoint URL to: `https://your-project.supabase.co/functions/v1/stripe-handler`
4. Select these events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the **Webhook Secret** (starts with `whsec_`)

## 🔧 Step 2: Environment Variables

### 2.1 Frontend Environment Variables

Create a `.env` file in your project root:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_publishable_key
VITE_STRIPE_PRO_PRICE_ID=price_your_pro_price_id
VITE_STRIPE_AGENCY_PRICE_ID=price_your_agency_price_id
```

### 2.2 Supabase Edge Function Secrets

Set these secrets in your Supabase project:

```bash
# Deploy to Supabase
supabase secrets set STRIPE_SECRET_KEY=sk_live_your_secret_key
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

## 🔧 Step 3: Deploy Edge Function

### 3.1 Deploy the Stripe Handler

```bash
# Deploy the edge function
supabase functions deploy stripe-handler

# Verify deployment
supabase functions list
```

### 3.2 Test the Edge Function

You can test the edge function using the Supabase CLI:

```bash
# Test the function locally
supabase functions serve stripe-handler --env-file .env.local

# Or test the deployed function
curl -X POST https://your-project.supabase.co/functions/v1/stripe-handler \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-anon-key" \
  -d '{"action": "create-customer", "userId": "test", "email": "test@example.com", "name": "Test User"}'
```

## 🔧 Step 4: Database Setup

### 4.1 Run Migrations

Ensure all your database migrations are applied:

```bash
# Apply migrations
supabase db push

# Verify tables exist
supabase db diff
```

### 4.2 Verify Required Tables

Make sure these tables exist in your database:
- `subscriptions`
- `teams`
- `team_members`
- `users`
- `stripe_events` (optional, for webhook idempotency)

## 🔧 Step 5: Update Your Application

### 5.1 Environment Variables

Update your deployment environment with the production environment variables:

**Vercel/Netlify:**
- Add all `VITE_*` variables to your deployment platform
- Ensure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set

**Supabase:**
- All secrets are already set via `supabase secrets set`

### 5.2 Build and Deploy

```bash
# Build your application
npm run build

# Deploy to your platform
# (Vercel, Netlify, etc.)
```

## 🔧 Step 6: Testing Production Setup

### 6.1 Test Checkout Flow

1. Go to your pricing page
2. Select a plan (Pro or Agency)
3. Complete the checkout process
4. Verify the subscription is created in Stripe
5. Check that the user account is created in Supabase

### 6.2 Test Webhooks

1. Make a test payment
2. Check the webhook logs in Stripe Dashboard
3. Verify the subscription is updated in your database
4. Check the Edge Function logs in Supabase Dashboard

### 6.3 Test Subscription Management

1. Test upgrading/downgrading plans
2. Test canceling subscriptions
3. Test billing portal access
4. Verify all changes sync between Stripe and your database

## 🔧 Step 7: Monitoring and Maintenance

### 7.1 Monitor Webhook Delivery

- Check Stripe Dashboard → Developers → Webhooks
- Monitor delivery status and retry attempts
- Set up alerts for failed webhooks

### 7.2 Monitor Edge Function Logs

- Check Supabase Dashboard → Edge Functions → Logs
- Monitor for errors and performance issues
- Set up alerts for function failures

### 7.3 Database Monitoring

- Monitor subscription table for sync issues
- Check for orphaned subscriptions
- Verify team-subscription relationships

## 🚨 Important Notes

### Security
- Never commit API keys to version control
- Use environment variables for all sensitive data
- Regularly rotate your Stripe API keys
- Monitor for suspicious activity

### Testing
- Use Stripe's test mode for development
- Test webhooks using Stripe CLI
- Verify all edge cases work in production

### Backup
- Regularly backup your database
- Keep Stripe data in sync
- Monitor for data inconsistencies

## 🔧 Troubleshooting

### Common Issues

1. **Webhook Not Receiving Events**
   - Check webhook endpoint URL
   - Verify webhook secret
   - Check Edge Function logs

2. **Subscription Not Syncing**
   - Check database permissions
   - Verify RLS policies
   - Check Edge Function logs

3. **Checkout Session Creation Fails**
   - Verify price IDs
   - Check Stripe API key
   - Verify Edge Function deployment

### Debug Commands

```bash
# Check Edge Function status
supabase functions list

# View Edge Function logs
supabase functions logs stripe-handler

# Test webhook locally
stripe listen --forward-to localhost:54321/functions/v1/stripe-handler

# Check database tables
supabase db diff
```

## 🎉 You're Ready for Production!

Your Stripe integration is now production-ready with:
- ✅ Supabase Edge Functions handling all Stripe operations
- ✅ Secure webhook processing
- ✅ Automatic user and subscription creation
- ✅ Team-based billing
- ✅ Comprehensive error handling

Remember to:
- Monitor your application regularly
- Keep your dependencies updated
- Test new features thoroughly
- Maintain good documentation

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review Stripe and Supabase documentation
3. Check the logs in both platforms
4. Contact support if needed

---

**Last Updated**: December 2024
**Version**: 1.0.0 