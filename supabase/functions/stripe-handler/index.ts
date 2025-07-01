import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.0.0'

// Create crypto provider for Deno compatibility
const cryptoProvider = Stripe.createSubtleCryptoProvider()

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2023-10-16',
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
}

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

serve(async (req) => {
  // Log ALL incoming requests immediately at the start
  console.log('🚀 FUNCTION START - Incoming request:', {
    method: req.method,
    url: req.url,
    timestamp: new Date().toISOString()
  })

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('🔄 CORS preflight request - returning ok')
    return new Response('ok', { headers: corsHeaders })
  }

  // Add a simple health check endpoint
  const url = new URL(req.url)
  if (url.pathname.endsWith('/health')) {
    console.log('🏥 Health check request - returning ok')
    return new Response(
      JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }

  // Log all incoming requests for debugging
  console.log('📨 Incoming request:', {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries())
  })

  // IMPORTANT: Check for webhook requests FIRST, before any authorization checks
  // Check if this is a Stripe webhook request by looking for stripe-signature header
  const sig = req.headers.get('stripe-signature')
  
  console.log('🔍 WEBHOOK DETECTION:', {
    hasStripeSignature: !!sig,
    stripeSignature: sig ? 'PRESENT' : 'MISSING',
    allHeaders: Array.from(req.headers.keys()),
    contentType: req.headers.get('content-type'),
    userAgent: req.headers.get('user-agent'),
    origin: req.headers.get('origin'),
    stripeSignatureHeader: req.headers.get('stripe-signature'),
    // Check all possible variations of the signature header
    stripeSignatureVariations: {
      lowercase: req.headers.get('stripe-signature'),
      uppercase: req.headers.get('Stripe-Signature'),
      httpStripeSignature: req.headers.get('http-stripe-signature'),
      HTTP_STRIPE_SIGNATURE: req.headers.get('HTTP_STRIPE_SIGNATURE')
    }
  })
  
  if (sig) {
    // This is a webhook request - handle it exactly like server.cjs
    console.log('🔔 Processing Stripe webhook request')
    return await handleWebhookRaw(req)
  }

  console.log('❌ NOT a webhook request - processing as API request')

  // For all other requests, check authorization within the handler
  const authHeader = req.headers.get('authorization')
  console.log('🔐 AUTHORIZATION DEBUG:', {
    hasAuthHeader: !!authHeader,
    authHeader: authHeader ? 'PRESENT' : 'MISSING',
    authHeaderValue: authHeader ? authHeader.substring(0, 20) + '...' : 'NONE'
  })

  // Parse JSON for API requests
  try {
    const { action, ...data } = await req.json()
    
    console.log('🔧 Processing API request:', action)

    // Check authorization for API requests (but not webhooks)
    if (!authHeader) {
      console.log('❌ Missing authorization header for API request')
      return new Response(
        JSON.stringify({ success: false, error: 'Missing authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    switch (action) {
      case 'create-customer':
        return await handleCreateCustomer(data)
      case 'create-checkout-session':
        return await handleCreateCheckoutSession(data)
      case 'update-subscription':
        return await handleUpdateSubscription(data)
      case 'cancel-subscription':
        return await handleCancelSubscription(data)
      case 'reactivate-subscription':
        return await handleReactivateSubscription(data)
      case 'billing-portal':
        return await handleBillingPortal(data)
      default:
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid action' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
    }
  } catch (error) {
    console.error('Error processing request:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

// New webhook handler that matches Node.js docs exactly
async function handleWebhookRaw(req: Request) {
  const sig = req.headers.get('stripe-signature')
  let event

  console.log('🔔 Raw webhook request received')
  console.log('Headers:', Object.fromEntries(req.headers.entries()))
  
  // Get the raw body as text (like express.json does)
  const body = await req.text()
  console.log('Body length:', body.length)

  try {
    console.log('🔐 Attempting to verify webhook signature...')
    console.log('Using webhook secret:', Deno.env.get('STRIPE_WEBHOOK_SECRET') ? 'PRESENT' : 'MISSING')
    
    // Use constructEventAsync with crypto provider for Deno compatibility
    event = await stripe.webhooks.constructEventAsync(
      body, 
      sig!, 
      Deno.env.get('STRIPE_WEBHOOK_SECRET')!,
      undefined,
      cryptoProvider
    )
    console.log('✅ Webhook signature verified')
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err)
    return new Response(
      JSON.stringify({ success: false, error: 'Webhook signature verification failed' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }

  console.log('📨 Webhook received:', event.type)
  console.log('Event ID:', event.id)

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        console.log('🔄 Processing checkout.session.completed event...')
        const result = await handleCheckoutSessionCompleted(event.data.object)
        if (result && result.success === false) {
          console.error('❌ Checkout session processing failed:', result.error)
          return new Response(
            JSON.stringify({ success: false, error: result.error }),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }
        break
      case 'customer.subscription.updated':
        console.log('🔄 Processing subscription update...')
        await handleSubscriptionChange(event.data.object)
        break
      case 'customer.subscription.deleted':
        console.log('🔄 Processing subscription deletion...')
        await handleSubscriptionCancellation(event.data.object)
        break
      case 'invoice.payment_succeeded':
        console.log('🔄 Processing successful payment...')
        await handlePaymentSucceeded(event.data.object)
        break
      case 'invoice.payment_failed':
        console.log('🔄 Processing failed payment...')
        await handlePaymentFailed(event.data.object)
        break
      default:
        console.log(`⚠️ Unhandled event type: ${event.type}`)
    }

    console.log('✅ Webhook processed successfully')
    return new Response(
      JSON.stringify({ success: true, received: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('❌ Error processing webhook:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Webhook processing failed' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

async function handleCreateCustomer({ userId, email, name }: any) {
  try {
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        userId,
      },
    })

    return new Response(
      JSON.stringify({ success: true, customerId: customer.id }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Error creating customer:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to create customer' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

async function handleCreateCheckoutSession({ 
  userId, 
  priceId, 
  planType, 
  customerEmail, 
  customerName,
  seatCount,
  signupData,
  successUrl,
  cancelUrl 
}: any) {
  try {
    // Handle Free plan: no Stripe session needed
    if (planType === 'free') {
      return new Response(
        JSON.stringify({ success: true, message: 'Free plan activated.' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Handle Enterprise plan: do not allow self-serve checkout
    if (planType === 'enterprise') {
      return new Response(
        JSON.stringify({ success: false, error: 'Enterprise plans are custom. Please contact sales.' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Handle Agency plan seat count
    let finalPriceId = priceId;
    let quantity = 1;
    if (planType === 'agency') {
      const seats = Math.max(1, Math.min(10, parseInt(seatCount) || 1));
      quantity = seats;
    }

    let sessionConfig: any = {
      payment_method_types: ['card'],
      line_items: [
        {
          price: finalPriceId,
          quantity,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        plan_type: planType,
      },
      allow_promotion_codes: true,
    };

    // Handle new signup (no userId) vs existing user
    if (!userId && signupData) {
      // New signup - store signup data in metadata for account creation after payment
      console.log('🆕 Creating checkout session for new signup');
      sessionConfig.metadata.signup_email = signupData.email;
      sessionConfig.metadata.signup_password = signupData.password;
      sessionConfig.metadata.signup_name = signupData.name;
      sessionConfig.metadata.signup_phone = signupData.phone || null;
      sessionConfig.metadata.signup_agency_name = signupData.agency_name || null;
      sessionConfig.metadata.signup_logo_url = signupData.logo_url || null;
      sessionConfig.metadata.needs_account_creation = 'true';
      sessionConfig.customer_email = customerEmail;
    } else if (userId) {
      // Existing user - check for existing subscription
      console.log('👤 Creating checkout session for existing user:', userId);
      sessionConfig.metadata.user_id = userId;
      
      const { data: existingSubscription } = await supabase
        .from('subscriptions')
        .select('stripe_customer_id, stripe_subscription_id, status')
        .eq('user_id', userId)
        .single();

      // If user has an existing customer ID, use it
      if (existingSubscription?.stripe_customer_id) {
        console.log(`Using existing customer ID: ${existingSubscription.stripe_customer_id}`);
        sessionConfig.customer = existingSubscription.stripe_customer_id;
        
        // Update customer metadata to ensure user_id is available for webhooks
        try {
          await stripe.customers.update(existingSubscription.stripe_customer_id, {
            metadata: {
              user_id: userId,
            }
          });
          console.log(`Updated customer metadata with user_id: ${userId}`);
        } catch (error) {
          console.error('Error updating customer metadata:', error);
        }
      } else {
        // For existing users without customer ID, use customer_email
        sessionConfig.customer_email = customerEmail;
      }

      // If user is currently on a trial, we need to handle the transition
      if (existingSubscription?.status === 'trialing') {
        console.log(`User ${userId} is converting from trial to paid subscription`);
        
        // Add metadata to indicate this is a trial conversion
        sessionConfig.metadata.trial_conversion = 'true';
        sessionConfig.metadata.original_trial_end = existingSubscription.current_period_end;
      }
    } else {
      return new Response(
        JSON.stringify({ success: false, error: 'Either userId or signupData is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Configure trial period only for starter plan
    if (planType === 'starter') {
      console.log('Creating starter plan subscription with trial period');
      // Set trial period at the subscription level
      sessionConfig.subscription_data = {
        trial_period_days: 7,
        metadata: {
          plan_type: planType,
          trial_plan: 'true'
        }
      };
    } else {
      console.log(`Creating ${planType} plan subscription - immediate billing`);
      // Professional and Enterprise plans start billing immediately
      // No trial period configured
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return new Response(
      JSON.stringify({ success: true, sessionId: session.id }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to create checkout session' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

async function handleUpdateSubscription({ 
  subscriptionId, 
  newPriceId, 
  userId, 
  newPlanType 
}: any) {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    
    // Update the subscription with the new price
    const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
      items: [
        {
          id: subscription.items.data[0].id,
          price: newPriceId,
        },
      ],
      metadata: {
        userId,
        planType: newPlanType,
      },
    })

    return new Response(
      JSON.stringify({ success: true, subscription: updatedSubscription }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Error updating subscription:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to update subscription' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

async function handleCancelSubscription({ subscriptionId }: any) {
  try {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    })

    return new Response(
      JSON.stringify({ success: true, subscription }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Error canceling subscription:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to cancel subscription' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

async function handleReactivateSubscription({ subscriptionId }: any) {
  try {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    })

    return new Response(
      JSON.stringify({ success: true, subscription }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Error reactivating subscription:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to reactivate subscription' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

async function handleBillingPortal({ customerId, returnUrl }: any) {
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    })

    return new Response(
      JSON.stringify({ success: true, url: session.url }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Error creating billing portal session:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to create billing portal session' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

async function handleWebhookFailure(subscriptionId: string, error: string) {
  console.error('❌ Webhook processing failed for subscription:', subscriptionId, error)
  
  try {
    // Cancel the subscription if webhook processing failed
    // This prevents orphaned subscriptions without user accounts
    await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
      metadata: {
        webhook_failure: 'true',
        failure_reason: error,
        failed_at: new Date().toISOString()
      }
    })
    
    console.log('✅ Subscription canceled due to webhook failure:', subscriptionId)
    
    // You might also want to send an alert to your team
    // await sendAlertToTeam(`Webhook failed for subscription ${subscriptionId}: ${error}`)
    
  } catch (cancelError) {
    console.error('❌ Failed to cancel subscription after webhook failure:', cancelError)
  }
}

async function handleCheckoutSessionCompleted(session: any) {
  console.log('🔄 Processing checkout.session.completed event...')
  console.log('Session data:', JSON.stringify(session, null, 2))
  
  // Check if this is a new signup that needs account creation
  if (session.metadata?.needs_account_creation === 'true') {
    console.log('🆕 New signup detected - creating user account')
    try {
      // First check if user already exists by email
      const { data: existingUser, error: checkError } = await supabase.auth.admin.listUsers()
      if (checkError) {
        console.error('❌ Error checking existing users:', checkError)
        // If we can't even check users, this is a critical failure
        if (session.subscription) {
          await handleWebhookFailure(session.subscription, 'Failed to check existing users')
        }
        return { success: false, error: 'Failed to check existing users' }
      }
      
      const userExists = existingUser?.users?.find(u => u.email === session.metadata.signup_email)
      let newUserId
      
      if (userExists) {
        console.log('✅ User already exists:', userExists.id)
        newUserId = userExists.id
      } else {
        // Create the user account in Supabase Auth
        console.log('🆕 Creating new user account...')
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: session.metadata.signup_email,
          password: session.metadata.signup_password,
          email_confirm: true, // Auto-confirm email since payment is complete
          user_metadata: {
            name: session.metadata.signup_name,
            phone: session.metadata.signup_phone || null,
            agency_name: session.metadata.signup_agency_name || null,
            logo_url: session.metadata.signup_logo_url || null
          }
        })
        
        if (authError) {
          console.error('❌ Error creating user account:', authError)
          // Critical failure - cancel subscription
          if (session.subscription) {
            await handleWebhookFailure(session.subscription, 'Failed to create user account')
          }
          return { success: false, error: 'Failed to create user account' }
        }
        
        newUserId = authData.user.id
        console.log('✅ User account created:', newUserId)
      }

      // Create user profile
      console.log('📝 Creating user profile...')
      const userUpsertData = {
        id: newUserId,
        email: session.metadata.signup_email,
        name: session.metadata.signup_name,
        phone: session.metadata.signup_phone || null,
        agency_name: session.metadata.signup_agency_name || null,
        logo_url: session.metadata.signup_logo_url || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { error: profileError } = await supabase
        .from('users')
        .upsert(userUpsertData, { onConflict: 'id' })
      
      if (profileError) {
        console.error('❌ Error creating user profile:', profileError)
        // Critical failure - cancel subscription
        if (session.subscription) {
          await handleWebhookFailure(session.subscription, 'Failed to create user profile')
        }
        return { success: false, error: 'Failed to create user profile' }
      } else {
        console.log('✅ User profile created/updated')
      }

      // Create subscription record
      console.log('💳 Creating subscription record...')
      const isStarterPlan = session.metadata.plan_type === 'starter'
      const subscriptionStatus = isStarterPlan ? 'trialing' : 'active'
      const periodEnd = isStarterPlan 
        ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days for trial
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days for paid plans

      const { error: subscriptionError } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: newUserId,
          plan_type: session.metadata.plan_type,
          status: subscriptionStatus,
          current_period_start: new Date().toISOString(),
          current_period_end: periodEnd,
          cancel_at_period_end: false,
          stripe_subscription_id: session.subscription || null,
          stripe_customer_id: session.customer || null
        }, {
          onConflict: 'user_id'
        })

      if (subscriptionError) {
        console.error('❌ Error creating subscription record:', subscriptionError)
        // Critical failure - cancel subscription
        if (session.subscription) {
          await handleWebhookFailure(session.subscription, 'Failed to create subscription record')
        }
        return { success: false, error: 'Failed to create subscription record' }
      } else {
        console.log('✅ Subscription record created/updated')
      }

      // Update the session metadata with the new user ID
      console.log('🔄 Updating session metadata...')
      try {
        await stripe.checkout.sessions.update(session.id, {
          metadata: {
            ...session.metadata,
            user_id: newUserId,
            needs_account_creation: 'false'
          }
        })
        console.log('✅ Session metadata updated with new user ID')
      } catch (stripeError) {
        console.error('⚠️ Error updating session metadata:', stripeError)
        // Don't fail the whole process for this
      }

      // Find the team for the user and link subscription
      console.log('👥 Linking subscription to team...')
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .select('id')
        .eq('owner_id', newUserId)
        .single()

      if (team && team.id && session.subscription) {
        // Link subscription to team
        const { error: subUpdateError } = await supabase
          .from('subscriptions')
          .update({ team_id: team.id })
          .eq('stripe_subscription_id', session.subscription)
        
        if (!subUpdateError) {
          console.log('✅ Subscription team_id updated:', session.subscription, team.id)
        } else {
          console.error('❌ Error updating subscription with team_id:', subUpdateError)
        }

        // Link team to subscription
        const { error: teamUpdateError } = await supabase
          .from('teams')
          .update({ subscription_id: session.subscription })
          .eq('id', team.id)
        
        if (!teamUpdateError) {
          console.log('✅ Team subscription_id updated:', team.id, session.subscription)
        } else {
          console.error('❌ Error updating team with subscription_id:', teamUpdateError)
        }
      } else {
        if (!team || !team.id) {
          console.warn('⚠️ No team found for user after signup:', newUserId)
        }
        if (!session.subscription) {
          console.warn('⚠️ No subscription found to link to team')
        }
      }

      console.log('🎉 Account creation process completed successfully')
      return { success: true }
    } catch (error) {
      console.error('❌ Error in account creation process:', error)
      // Critical failure - cancel subscription
      if (session.subscription) {
        await handleWebhookFailure(session.subscription, 'Account creation failed')
      }
      return { success: false, error: 'Account creation failed' }
    }
  } else {
    // Existing user - update subscription
    console.log('👤 Existing user checkout completed')
    if (session.subscription && session.metadata?.user_id) {
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          stripe_subscription_id: session.subscription,
          stripe_customer_id: session.customer,
          status: 'active',
          plan_type: session.metadata.plan_type
        })
        .eq('user_id', session.metadata.user_id)

      if (updateError) {
        console.error('❌ Error updating existing user subscription:', updateError)
        return { success: false, error: 'Failed to update subscription' }
      } else {
        console.log('✅ Existing user subscription updated')
        return { success: true }
      }
    }
    return { success: true }
  }
}

async function handleSubscriptionChange(subscription: any) {
  console.log('🔄 Processing subscription change:', subscription.id)
  
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      plan_type: subscription.metadata?.planType || 'pro'
    })
    .eq('stripe_subscription_id', subscription.id)

  if (error) {
    console.error('❌ Error updating subscription:', error)
  } else {
    console.log('✅ Subscription updated in database')
  }
}

async function handleSubscriptionCancellation(subscription: any) {
  console.log('❌ Processing subscription cancellation:', subscription.id)
  
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      cancel_at_period_end: true
    })
    .eq('stripe_subscription_id', subscription.id)

  if (error) {
    console.error('❌ Error canceling subscription:', error)
  } else {
    console.log('✅ Subscription canceled in database')
  }
}

async function handlePaymentSucceeded(invoice: any) {
  console.log('💰 Processing successful payment:', invoice.id)
  
  // Update subscription status if needed
  if (invoice.subscription) {
    const { error } = await supabase
      .from('subscriptions')
      .update({ status: 'active' })
      .eq('stripe_subscription_id', invoice.subscription)

    if (error) {
      console.error('❌ Error updating subscription status:', error)
    } else {
      console.log('✅ Subscription status updated to active')
    }
  }
}

async function handlePaymentFailed(invoice: any) {
  console.log('💸 Processing failed payment:', invoice.id)
  
  // Update subscription status if needed
  if (invoice.subscription) {
    const { error } = await supabase
      .from('subscriptions')
      .update({ status: 'past_due' })
      .eq('stripe_subscription_id', invoice.subscription)

    if (error) {
      console.error('❌ Error updating subscription status:', error)
    } else {
      console.log('✅ Subscription status updated to past_due')
    }
  }
} 