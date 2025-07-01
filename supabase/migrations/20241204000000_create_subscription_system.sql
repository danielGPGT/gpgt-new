-- Create subscription system tables
-- This migration creates the necessary tables for Stripe subscription management

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    name TEXT,
    stripe_customer_id TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    stripe_subscription_id TEXT UNIQUE,
    stripe_customer_id TEXT,
    plan_type TEXT NOT NULL CHECK (plan_type IN ('starter', 'professional', 'enterprise')),
    status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'incomplete', 'incomplete_expired')),
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create billing_history table for tracking payments
CREATE TABLE IF NOT EXISTS billing_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
    stripe_invoice_id TEXT,
    amount INTEGER NOT NULL, -- Amount in cents
    currency TEXT DEFAULT 'usd',
    status TEXT NOT NULL CHECK (status IN ('paid', 'open', 'void', 'uncollectible')),
    billing_reason TEXT CHECK (billing_reason IN ('subscription_cycle', 'subscription_create', 'subscription_update', 'subscription_threshold', 'manual')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_stripe_customer_id ON customers(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_billing_history_user_id ON billing_history(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_history_subscription_id ON billing_history(subscription_id);

-- Create RLS policies for customers table
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own customer data" ON customers
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own customer data" ON customers
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own customer data" ON customers
    FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for subscriptions table
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscriptions" ON subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscriptions" ON subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions" ON subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for billing_history table
ALTER TABLE billing_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own billing history" ON billing_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own billing history" ON billing_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to handle subscription status changes
CREATE OR REPLACE FUNCTION handle_subscription_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- If subscription is canceled, update user tier to starter
    IF NEW.status = 'canceled' AND OLD.status != 'canceled' THEN
        -- Update user profile to starter tier
        UPDATE user_profiles 
        SET tier = 'starter' 
        WHERE user_id = NEW.user_id;
    END IF;
    
    -- If subscription becomes active, update user tier
    IF NEW.status = 'active' AND OLD.status != 'active' THEN
        UPDATE user_profiles 
        SET tier = NEW.plan_type 
        WHERE user_id = NEW.user_id;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for subscription status changes
CREATE TRIGGER handle_subscription_status_change_trigger
    AFTER UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION handle_subscription_status_change();

-- Create function to get current subscription for a user
CREATE OR REPLACE FUNCTION get_current_subscription(user_uuid UUID)
RETURNS TABLE (
    id UUID,
    plan_type TEXT,
    status TEXT,
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.plan_type,
        s.status,
        s.current_period_start,
        s.current_period_end,
        s.cancel_at_period_end
    FROM subscriptions s
    WHERE s.user_id = user_uuid 
    AND s.status = 'active'
    ORDER BY s.created_at DESC
    LIMIT 1;
END;
$$ language 'plpgsql';

-- Create function to get subscription usage stats
CREATE OR REPLACE FUNCTION get_subscription_usage_stats(user_uuid UUID)
RETURNS TABLE (
    total_paid INTEGER,
    total_invoices INTEGER,
    last_payment_date TIMESTAMP WITH TIME ZONE,
    subscription_duration_days INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(bh.amount), 0) as total_paid,
        COUNT(bh.id) as total_invoices,
        MAX(bh.created_at) as last_payment_date,
        EXTRACT(DAY FROM (NOW() - MIN(s.created_at)))::INTEGER as subscription_duration_days
    FROM subscriptions s
    LEFT JOIN billing_history bh ON s.id = bh.subscription_id AND bh.status = 'paid'
    WHERE s.user_id = user_uuid;
END;
$$ language 'plpgsql';

-- Insert some sample data for testing (optional)
-- INSERT INTO customers (user_id, email, name) VALUES 
-- ('00000000-0000-0000-0000-000000000001', 'test@example.com', 'Test User');

-- INSERT INTO subscriptions (user_id, plan_type, status, current_period_start, current_period_end) VALUES 
-- ('00000000-0000-0000-0000-000000000001', 'professional', 'active', NOW(), NOW() + INTERVAL '30 days'); 