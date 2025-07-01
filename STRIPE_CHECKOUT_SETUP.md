# Stripe Checkout Setup Guide

## 🎉 Your Stripe Checkout is Ready!

The integration is now set up with a local Express server to handle Stripe checkout sessions securely.

## 📋 Setup Steps

### 1. Configure Environment Variables

**Frontend (.env.local):**
```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
VITE_STRIPE_STARTER_PRICE_ID=price_starter_id_here
VITE_STRIPE_PROFESSIONAL_PRICE_ID=price_professional_id_here
VITE_STRIPE_ENTERPRISE_PRICE_ID=price_enterprise_id_here
```

**Backend (server.env):**
```env
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
PORT=3001
```

### 2. Get Your Stripe Keys

1. **Go to [Stripe Dashboard](https://dashboard.stripe.com/)**
2. **Get your API keys:**
   - Publishable key: `pk_test_...`
   - Secret key: `sk_test_...`

3. **Create Products & Prices:**
   - Create 3 products: Starter, Professional, Enterprise
   - Set up recurring prices for each
   - Copy the price IDs: `price_...`

### 3. Run the Application

**Option A: Run both servers together**
```bash
npm run dev:full
```

**Option B: Run servers separately**
```bash
# Terminal 1 - Backend
npm run server

# Terminal 2 - Frontend  
npm run dev
```

## 🧪 Test the Checkout

1. **Start both servers** (frontend on 5173, backend on 3001)
2. **Go to Pricing page** and click "Subscribe"
3. **You'll be redirected to Stripe Checkout**
4. **Use test card:** `4242 4242 4242 4242`
5. **Complete the payment** and return to dashboard

## 🔧 How It Works

### Frontend (React)
- `stripeService.ts` calls local server API
- Creates checkout session via `/api/create-checkout-session`
- Redirects to Stripe Checkout using `stripe.redirectToCheckout()`

### Backend (Express)
- `server.js` handles Stripe API calls securely
- Creates checkout sessions with your secret key
- Processes webhooks for subscription events
- Updates database when payments complete

### Database Integration
- Subscription data stored in Supabase `subscriptions` table
- Tier restrictions enforced based on subscription status
- User access controlled by subscription plan

## 🚀 Production Deployment

### Option 1: Deploy Backend to Vercel/Railway
1. **Deploy `server.js`** to your preferred platform
2. **Update frontend API URL** in `stripeService.ts`
3. **Set environment variables** on the platform

### Option 2: Use Supabase Edge Functions
1. **Deploy the Edge Function** from `supabase/functions/stripe-handler/`
2. **Update frontend** to use Edge Function instead of local server
3. **Set environment variables** in Supabase dashboard

## 🔒 Security Features

- ✅ **Secret key never exposed** to frontend
- ✅ **CORS protection** on backend
- ✅ **Webhook signature verification**
- ✅ **Environment variable separation**
- ✅ **Database integration** for subscription tracking

## 🎯 Next Steps

1. **Set up your Stripe account** and get real keys
2. **Create products and prices** in Stripe dashboard
3. **Update environment variables** with real values
4. **Test the checkout flow** with test cards
5. **Deploy to production** when ready

## 🆘 Troubleshooting

**"Server error: 500"**
- Check your Stripe secret key in `server.env`
- Verify price IDs are correct

**"Stripe failed to initialize"**
- Check your publishable key in `.env.local`
- Ensure Stripe is loaded properly

**"CORS error"**
- Backend server must be running on port 3001
- CORS is configured to allow localhost:5173

**"Webhook errors"**
- Set up webhook endpoint in Stripe dashboard
- Use ngrok for local webhook testing

The checkout is now fully functional! 🎉 