-- ALTER script to modify existing quotes table and add supporting tables
-- This script enhances the existing quotes table to support package intake form data

-- First, let's add the missing columns to the existing quotes table
ALTER TABLE public.quotes 
ADD COLUMN IF NOT EXISTS quote_number VARCHAR(50) UNIQUE,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS consultant_id UUID,
ADD COLUMN IF NOT EXISTS client_first_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS client_last_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS client_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS client_phone VARCHAR(50),
ADD COLUMN IF NOT EXISTS travelers_adults INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS travelers_children INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS travelers_total INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES public.events(id),
ADD COLUMN IF NOT EXISTS event_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS event_location VARCHAR(255),
ADD COLUMN IF NOT EXISTS event_start_date DATE,
ADD COLUMN IF NOT EXISTS event_end_date DATE,
ADD COLUMN IF NOT EXISTS package_id UUID REFERENCES public.packages(id),
ADD COLUMN IF NOT EXISTS package_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS package_base_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS tier_id UUID REFERENCES public.package_tiers(id),
ADD COLUMN IF NOT EXISTS tier_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS tier_description TEXT,
ADD COLUMN IF NOT EXISTS tier_price_override DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS payment_deposit DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_second_payment DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_final_payment DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_deposit_date DATE,
ADD COLUMN IF NOT EXISTS payment_second_payment_date DATE,
ADD COLUMN IF NOT EXISTS payment_final_payment_date DATE,
ADD COLUMN IF NOT EXISTS internal_notes TEXT,
ADD COLUMN IF NOT EXISTS quote_reference VARCHAR(100),
ADD COLUMN IF NOT EXISTS sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS declined_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS expired_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS parent_quote_id UUID REFERENCES public.quotes(id),
ADD COLUMN IF NOT EXISTS is_revision BOOLEAN DEFAULT FALSE;

-- Update status column to include new statuses
ALTER TABLE public.quotes 
DROP CONSTRAINT IF EXISTS quotes_status_check;

ALTER TABLE public.quotes 
ADD CONSTRAINT quotes_status_check 
CHECK (status IN ('draft', 'sent', 'accepted', 'declined', 'expired', 'confirmed', 'cancelled'));

-- Add constraints for data integrity
ALTER TABLE public.quotes 
ADD CONSTRAINT IF NOT EXISTS valid_travelers 
CHECK (travelers_total = travelers_adults + travelers_children);

ALTER TABLE public.quotes 
ADD CONSTRAINT IF NOT EXISTS valid_payment_schedule 
CHECK (payment_deposit + payment_second_payment + payment_final_payment = total_price);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_quotes_status ON public.quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_client_email ON public.quotes(client_email);
CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON public.quotes(created_at);
CREATE INDEX IF NOT EXISTS idx_quotes_event_id ON public.quotes(event_id);
CREATE INDEX IF NOT EXISTS idx_quotes_consultant_id ON public.quotes(consultant_id);
CREATE INDEX IF NOT EXISTS idx_quotes_quote_number ON public.quotes(quote_number);

-- Create quote_components table
CREATE TABLE IF NOT EXISTS public.quote_components (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
    
    -- Component identification
    component_type VARCHAR(50) NOT NULL CHECK (
        component_type IN ('ticket', 'hotel_room', 'circuit_transfer', 'airport_transfer', 'flight', 'lounge_pass')
    ),
    component_id UUID, -- Reference to original component (ticket, hotel_room, etc.)
    
    -- Component details (stored as JSON for flexibility)
    component_data JSONB NOT NULL, -- Store all component details
    component_name VARCHAR(255), -- Human-readable name
    component_description TEXT,
    
    -- Pricing
    unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    quantity INTEGER NOT NULL DEFAULT 1,
    total_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    
    -- Additional metadata
    sort_order INTEGER DEFAULT 0,
    is_optional BOOLEAN DEFAULT FALSE,
    is_included BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_component_pricing CHECK (total_price = unit_price * quantity)
);

-- Create indexes for quote components
CREATE INDEX IF NOT EXISTS idx_quote_components_quote_id ON public.quote_components(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_components_type ON public.quote_components(component_type);
CREATE INDEX IF NOT EXISTS idx_quote_components_sort_order ON public.quote_components(quote_id, sort_order);

-- Create quote_attachments table
CREATE TABLE IF NOT EXISTS public.quote_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
    
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    attachment_type VARCHAR(50) DEFAULT 'quote_pdf', -- 'quote_pdf', 'terms', 'itinerary', etc.
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Create indexes for attachments
CREATE INDEX IF NOT EXISTS idx_quote_attachments_quote_id ON public.quote_attachments(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_attachments_type ON public.quote_attachments(attachment_type);

-- Create quote_activity_log table
CREATE TABLE IF NOT EXISTS public.quote_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
    
    activity_type VARCHAR(50) NOT NULL, -- 'created', 'sent', 'viewed', 'accepted', 'declined', 'expired', 'revised'
    activity_description TEXT,
    
    performed_by UUID REFERENCES auth.users(id),
    performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Additional context
    metadata JSONB -- Store additional context like email sent, IP address, etc.
);

-- Create indexes for activity log
CREATE INDEX IF NOT EXISTS idx_quote_activity_quote_id ON public.quote_activity_log(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_activity_type ON public.quote_activity_log(activity_type);
CREATE INDEX IF NOT EXISTS idx_quote_activity_performed_at ON public.quote_activity_log(performed_at);

-- Create quote_email_tracking table
CREATE TABLE IF NOT EXISTS public.quote_email_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
    
    email_type VARCHAR(50) NOT NULL, -- 'quote_sent', 'reminder', 'follow_up', etc.
    recipient_email VARCHAR(255) NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Email tracking
    opened_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE,
    bounced BOOLEAN DEFAULT FALSE,
    bounce_reason TEXT,
    
    -- Email metadata
    email_provider VARCHAR(100),
    email_id VARCHAR(255), -- External email service ID
    metadata JSONB
);

-- Create indexes for email tracking
CREATE INDEX IF NOT EXISTS idx_quote_email_quote_id ON public.quote_email_tracking(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_email_recipient ON public.quote_email_tracking(recipient_email);
CREATE INDEX IF NOT EXISTS idx_quote_email_sent_at ON public.quote_email_tracking(sent_at);

-- Create quote_settings table
CREATE TABLE IF NOT EXISTS public.quote_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
    
    setting_key VARCHAR(100) NOT NULL,
    setting_value JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(quote_id, setting_key)
);

-- Create index for settings
CREATE INDEX IF NOT EXISTS idx_quote_settings_quote_id ON public.quote_settings(quote_id);

-- Function to generate quote numbers
CREATE OR REPLACE FUNCTION generate_quote_number()
RETURNS TRIGGER AS $$
DECLARE
    year_part VARCHAR(4);
    sequence_num INTEGER;
    new_quote_number VARCHAR(50);
BEGIN
    year_part := EXTRACT(YEAR FROM NOW())::VARCHAR;
    
    -- Get the next sequence number for this year
    SELECT COALESCE(MAX(CAST(SUBSTRING(quote_number FROM 8) AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM public.quotes
    WHERE quote_number LIKE 'Q-' || year_part || '-%';
    
    new_quote_number := 'Q-' || year_part || '-' || LPAD(sequence_num::VARCHAR, 3, '0');
    NEW.quote_number := new_quote_number;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate quote numbers
DROP TRIGGER IF EXISTS trigger_generate_quote_number ON public.quotes;
CREATE TRIGGER trigger_generate_quote_number
    BEFORE INSERT ON public.quotes
    FOR EACH ROW
    WHEN (NEW.quote_number IS NULL)
    EXECUTE FUNCTION generate_quote_number();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS trigger_update_quotes_updated_at ON public.quotes;
CREATE TRIGGER trigger_update_quotes_updated_at
    BEFORE UPDATE ON public.quotes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate quote totals
CREATE OR REPLACE FUNCTION calculate_quote_total(quote_uuid UUID)
RETURNS DECIMAL(10,2) AS $$
DECLARE
    total DECIMAL(10,2);
BEGIN
    SELECT COALESCE(SUM(total_price), 0)
    INTO total
    FROM public.quote_components
    WHERE quote_id = quote_uuid AND is_included = TRUE;
    
    RETURN total;
END;
$$ LANGUAGE plpgsql;

-- Function to create quote from package intake data
CREATE OR REPLACE FUNCTION create_quote_from_intake(
    p_client_data JSONB,
    p_travelers_data JSONB,
    p_event_data JSONB,
    p_package_data JSONB,
    p_components_data JSONB,
    p_payments_data JSONB,
    p_consultant_id UUID DEFAULT NULL,
    p_internal_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    new_quote_id UUID;
    component JSONB;
    component_id UUID;
BEGIN
    -- Insert main quote record
    INSERT INTO public.quotes (
        user_id,
        consultant_id,
        client_first_name,
        client_last_name,
        client_email,
        client_phone,
        client_address,
        travelers_adults,
        travelers_children,
        travelers_total,
        event_id,
        event_name,
        event_location,
        event_start_date,
        event_end_date,
        package_id,
        package_name,
        package_base_type,
        tier_id,
        tier_name,
        tier_description,
        tier_price_override,
        total_price,
        currency,
        payment_deposit,
        payment_second_payment,
        payment_final_payment,
        payment_deposit_date,
        payment_second_payment_date,
        payment_final_payment_date,
        internal_notes,
        status,
        destination,
        start_date,
        end_date,
        travelers,
        client_name
    ) VALUES (
        p_consultant_id, -- user_id (using consultant_id as user_id for now)
        p_consultant_id,
        p_client_data->>'firstName',
        p_client_data->>'lastName',
        p_client_data->>'email',
        p_client_data->>'phone',
        p_client_data->'address',
        (p_travelers_data->>'adults')::INTEGER,
        (p_travelers_data->>'children')::INTEGER,
        (p_travelers_data->>'total')::INTEGER,
        (p_event_data->>'id')::UUID,
        p_event_data->>'name',
        p_event_data->>'location',
        (p_event_data->>'startDate')::DATE,
        (p_event_data->>'endDate')::DATE,
        (p_package_data->>'id')::UUID,
        p_package_data->>'name',
        p_package_data->>'baseType',
        (p_package_data->>'tierId')::UUID,
        p_package_data->>'tierName',
        p_package_data->>'tierDescription',
        (p_package_data->>'tierPriceOverride')::DECIMAL,
        (p_payments_data->>'total')::DECIMAL,
        p_payments_data->>'currency',
        (p_payments_data->>'deposit')::DECIMAL,
        (p_payments_data->>'secondPayment')::DECIMAL,
        (p_payments_data->>'finalPayment')::DECIMAL,
        (p_payments_data->>'depositDate')::DATE,
        (p_payments_data->>'secondPaymentDate')::DATE,
        (p_payments_data->>'finalPaymentDate')::DATE,
        p_internal_notes,
        'draft',
        p_event_data->>'location',
        (p_event_data->>'startDate')::DATE,
        (p_event_data->>'endDate')::DATE,
        p_travelers_data,
        p_client_data->>'firstName' || ' ' || p_client_data->>'lastName'
    ) RETURNING id INTO new_quote_id;
    
    -- Insert components
    FOR component IN SELECT * FROM jsonb_array_elements(p_components_data)
    LOOP
        INSERT INTO public.quote_components (
            quote_id,
            component_type,
            component_id,
            component_data,
            component_name,
            component_description,
            unit_price,
            quantity,
            total_price,
            sort_order
        ) VALUES (
            new_quote_id,
            component->>'type',
            (component->>'id')::UUID,
            component,
            component->>'name',
            component->>'description',
            (component->>'unitPrice')::DECIMAL,
            (component->>'quantity')::INTEGER,
            (component->>'totalPrice')::DECIMAL,
            (component->>'sortOrder')::INTEGER
        );
    END LOOP;
    
    -- Log quote creation
    INSERT INTO public.quote_activity_log (
        quote_id,
        activity_type,
        activity_description,
        performed_by
    ) VALUES (
        new_quote_id,
        'created',
        'Quote created from package intake form',
        p_consultant_id
    );
    
    RETURN new_quote_id;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security (RLS) on new tables
ALTER TABLE public.quote_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_email_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_settings ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (you may need to adjust these based on your auth requirements)
CREATE POLICY "Users can view quote components for their quotes" ON public.quote_components
    FOR SELECT USING (
        quote_id IN (
            SELECT id FROM public.quotes WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert quote components for their quotes" ON public.quote_components
    FOR INSERT WITH CHECK (
        quote_id IN (
            SELECT id FROM public.quotes WHERE user_id = auth.uid()
        )
    );

-- Similar policies for other tables...
-- (Add appropriate RLS policies based on your authentication and authorization requirements)

-- Comments for documentation
COMMENT ON TABLE public.quotes IS 'Enhanced quotes table storing all package intake data and quote lifecycle information';
COMMENT ON TABLE public.quote_components IS 'Individual components (tickets, hotels, transfers) within a quote';
COMMENT ON TABLE public.quote_attachments IS 'Files and documents associated with quotes';
COMMENT ON TABLE public.quote_activity_log IS 'Audit trail of all quote activities and status changes';
COMMENT ON TABLE public.quote_email_tracking IS 'Email tracking for quote communications';
COMMENT ON TABLE public.quote_settings IS 'Quote-specific settings and configuration';

COMMENT ON COLUMN public.quotes.quote_number IS 'Auto-generated unique quote identifier (e.g., Q-2024-001)';
COMMENT ON COLUMN public.quotes.status IS 'Current status of the quote in the lifecycle';
COMMENT ON COLUMN public.quotes.client_address IS 'JSON object containing street, city, state, zipCode, country';
COMMENT ON COLUMN public.quote_components.component_data IS 'JSON object containing all component details and metadata';
COMMENT ON COLUMN public.quote_activity_log.metadata IS 'Additional context for the activity (IP, user agent, etc.)';

-- Update existing quotes to have quote numbers if they don't have them
UPDATE public.quotes 
SET quote_number = 'Q-' || EXTRACT(YEAR FROM created_at)::VARCHAR || '-' || LPAD(id::text, 3, '0')
WHERE quote_number IS NULL; 