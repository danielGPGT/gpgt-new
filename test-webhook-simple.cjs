import fetch from 'node-fetch';

// Simple webhook test without requiring Stripe keys
async function testWebhookSimple() {
  const webhookEndpoint = 'http://localhost:3001/api/webhook';
  
  console.log('🧪 Testing Webhook Endpoint (Simple Mode)...\n');

  // Test basic connectivity
  try {
    console.log('📡 Testing server connectivity...');
    const healthResponse = await fetch('http://localhost:3001/api/health');
    
    if (healthResponse.ok) {
      console.log('✅ Server is running and healthy');
    } else {
      console.log('❌ Server health check failed');
      return;
    }
  } catch (error) {
    console.log('❌ Cannot connect to server. Make sure to run: npm run server');
    return;
  }

  // Test webhook endpoint with mock data
  const mockEvents = [
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
              id: 'price_test_professional'
            }
          }]
        }
      }
    }
  ];

  for (const event of mockEvents) {
    try {
      console.log(`📤 Sending ${event.type} event...`);
      
      const response = await fetch(webhookEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Stripe-Signature': 'test_signature'
        },
        body: JSON.stringify({
          type: event.type,
          data: {
            object: event.data
          }
        })
      });

      if (response.ok) {
        console.log(`✅ ${event.type} - Success (200 OK)`);
      } else {
        const errorText = await response.text();
        console.log(`❌ ${event.type} - Failed: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.log(`❌ ${event.type} - Error: ${error.message}`);
    }
    
    console.log('');
  }

  console.log('🎯 Webhook test completed!');
  console.log('💡 Note: Database updates will fail without proper Supabase credentials');
  console.log('💡 This test only verifies the webhook endpoint is working');
}

// Run the test
testWebhookSimple().catch(console.error); 