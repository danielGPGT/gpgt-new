const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
require('dotenv').config({ path: './server.env' });
const fetch = require('node-fetch');

// Test webhook events
async function testWebhook() {
  const webhookEndpoint = 'http://localhost:3001/api/webhook';
  
  console.log('🧪 Testing Stripe Webhook Events...\n');

  // Test events to send
  const testEvents = [
    {
      type: 'checkout.session.completed',
      data: {
        id: 'cs_test_' + Date.now(),
        subscription: 'sub_test_' + Date.now(),
        customer: 'cus_test_' + Date.now(),
        metadata: {
          user_id: 'test-user-123',
          plan_type: 'professional'
        }
      }
    },
    {
      type: 'customer.subscription.created',
      data: {
        id: 'sub_test_' + Date.now(),
        customer: 'cus_test_' + Date.now(),
        status: 'active',
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
        cancel_at_period_end: false,
        items: {
          data: [{
            price: {
              id: process.env.STRIPE_PROFESSIONAL_PRICE_ID || 'price_test_professional'
            }
          }]
        }
      }
    },
    {
      type: 'customer.subscription.updated',
      data: {
        id: 'sub_test_' + Date.now(),
        customer: 'cus_test_' + Date.now(),
        status: 'active',
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
        cancel_at_period_end: false,
        items: {
          data: [{
            price: {
              id: process.env.STRIPE_ENTERPRISE_PRICE_ID || 'price_test_enterprise'
            }
          }]
        }
      }
    }
  ];

  for (const event of testEvents) {
    try {
      console.log(`📤 Sending ${event.type} event...`);

      const payload = JSON.stringify({
        type: event.type,
        data: {
          object: event.data
        }
      });

      const signature = stripe.webhooks.generateTestHeaderString({
        payload: payload,
        secret: process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test_secret',
      });
      
      const response = await fetch(webhookEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Stripe-Signature': signature
        },
        body: payload,
      });

      if (response.ok) {
        console.log(`✅ ${event.type} - Success`);
      } else {
        const text = await response.text();
        console.log(`❌ ${event.type} - Failed: ${response.status} - ${text}`);
      }
    } catch (error) {
      console.log(`❌ ${event.type} - Error: ${error.message}`);
    }
    
    console.log('');
  }
}

// Run the test
testWebhook().catch(console.error); 