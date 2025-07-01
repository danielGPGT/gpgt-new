const { createClient } = require('@supabase/supabase-js');
const Stripe = require('stripe');

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function testTrialUpgrade() {
  try {
    console.log('🔍 Testing Trial Upgrade Process...\n');

    // Replace with your actual user ID
    const userId = '9583966e-0dbf-4199-a2c8-27478bb3d185'; // Replace with your user ID
    
    console.log(`Testing for user: ${userId}\n`);

    // 1. Check current database subscription
    console.log('1. Checking current database subscription...');
    const { data: dbSubscription, error: dbError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (dbError) {
      console.error('❌ Database error:', dbError);
      return;
    }

    if (!dbSubscription) {
      console.error('❌ No subscription found in database');
      return;
    }

    console.log('✅ Database subscription found:');
    console.log(`   Status: ${dbSubscription.status}`);
    console.log(`   Plan: ${dbSubscription.plan_type}`);
    console.log(`   Stripe ID: ${dbSubscription.stripe_subscription_id || 'None'}`);
    console.log(`   Trial End: ${dbSubscription.current_period_end}\n`);

    // 2. If there's a Stripe subscription ID, check Stripe
    if (dbSubscription.stripe_subscription_id) {
      console.log('2. Checking Stripe subscription...');
      try {
        const stripeSubscription = await stripe.subscriptions.retrieve(dbSubscription.stripe_subscription_id);
        console.log('✅ Stripe subscription found:');
        console.log(`   Status: ${stripeSubscription.status}`);
        console.log(`   Plan: ${stripeSubscription.items.data[0]?.price.id}`);
        console.log(`   Cancel at period end: ${stripeSubscription.cancel_at_period_end}\n`);

        // 3. Check for status mismatch
        if (dbSubscription.status !== stripeSubscription.status) {
          console.log('⚠️  STATUS MISMATCH DETECTED!');
          console.log(`   Database: ${dbSubscription.status}`);
          console.log(`   Stripe: ${stripeSubscription.status}\n`);

          // 4. Fix the mismatch
          console.log('3. Fixing status mismatch...');
          const { error: updateError } = await supabase
            .from('subscriptions')
            .update({
              status: stripeSubscription.status,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', userId);

          if (updateError) {
            console.error('❌ Error updating subscription:', updateError);
          } else {
            console.log('✅ Status updated successfully!');
            
            // 5. Verify the fix
            const { data: updatedSub } = await supabase
              .from('subscriptions')
              .select('*')
              .eq('user_id', userId)
              .single();
            
            console.log(`   New status: ${updatedSub.status}`);
          }
        } else {
          console.log('✅ Database and Stripe status match');
        }
      } catch (stripeError) {
        console.error('❌ Stripe error:', stripeError.message);
      }
    } else {
      console.log('ℹ️  No Stripe subscription ID - this is a trial subscription');
      console.log('   To upgrade, you need to go through the checkout process');
    }

    // 6. Check if trial has expired
    if (dbSubscription.status === 'trialing') {
      const trialEnd = new Date(dbSubscription.current_period_end);
      const now = new Date();
      const daysRemaining = Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24));
      
      console.log(`\n📅 Trial Status:`);
      console.log(`   Trial ends: ${trialEnd.toISOString()}`);
      console.log(`   Days remaining: ${daysRemaining}`);
      
      if (daysRemaining < 0) {
        console.log('⚠️  Trial has expired!');
      } else {
        console.log('✅ Trial is still active');
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testTrialUpgrade(); 