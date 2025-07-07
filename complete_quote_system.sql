-- Complete Quote System SQL Functions
-- This script provides all the functions needed for the end-to-end quote system

-- Function to generate quote numbers (if not already exists)
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

-- Trigger to auto-generate quote numbers (if not already exists)
DROP TRIGGER IF EXISTS trigger_generate_quote_number ON public.quotes;
CREATE TRIGGER trigger_generate_quote_number
    BEFORE INSERT ON public.quotes
    FOR EACH ROW
    WHEN (NEW.quote_number IS NULL)
    EXECUTE FUNCTION generate_quote_number();

-- Function to create quote from package intake form data
CREATE OR REPLACE FUNCTION create_quote_from_intake(
    p_client_data JSONB,
    p_travelers_data JSONB,
    p_event_data JSONB,
    p_package_data JSONB,
    p_components_data JSONB,
    p_payments_data JSONB,
    p_consultant_id UUID DEFAULT NULL,
    p_internal_notes TEXT DEFAULT NULL,
    p_team_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    new_quote_id UUID;
    current_user_id UUID;
    quote_number_val VARCHAR(50);
    year_part VARCHAR(4);
    sequence_num INTEGER;
BEGIN
    -- Get current user ID
    current_user_id := auth.uid();
    
    -- Get team ID if not provided
    IF p_team_id IS NULL THEN
        SELECT team_id INTO p_team_id
        FROM public.team_members
        WHERE user_id = current_user_id
        LIMIT 1;
    END IF;
    
    -- Generate quote number
    year_part := EXTRACT(YEAR FROM NOW())::VARCHAR;
    SELECT COALESCE(MAX(CAST(SUBSTRING(quote_number FROM 8) AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM public.quotes
    WHERE quote_number LIKE 'Q-' || year_part || '-%';
    quote_number_val := 'Q-' || year_part || '-' || LPAD(sequence_num::VARCHAR, 3, '0');
    
    -- Create the quote
    INSERT INTO public.quotes (
        quote_number,
        status,
        client_name,
        client_email,
        client_phone,
        destination,
        start_date,
        end_date,
        total_price,
        currency,
        event_name,
        event_location,
        package_name,
        tier_name,
        travelers_adults,
        travelers_children,
        travelers_total,
        payment_deposit,
        payment_second_payment,
        payment_final_payment,
        payment_deposit_date,
        payment_second_payment_date,
        payment_final_payment_date,
        selected_components,
        selected_package,
        selected_tier,
        price_breakdown,
        internal_notes,
        consultant_id,
        team_id,
        user_id,
        expires_at
    ) VALUES (
        quote_number_val,
        'draft',
        p_client_data->>'firstName' || ' ' || p_client_data->>'lastName',
        p_client_data->>'email',
        p_client_data->>'phone',
        p_event_data->>'location',
        p_event_data->>'startDate',
        p_event_data->>'endDate',
        (p_payments_data->>'total')::NUMERIC,
        p_payments_data->>'currency',
        p_event_data->>'name',
        p_event_data->>'location',
        p_package_data->>'name',
        p_package_data->>'tierName',
        (p_travelers_data->>'adults')::INTEGER,
        (p_travelers_data->>'children')::INTEGER,
        (p_travelers_data->>'total')::INTEGER,
        (p_payments_data->>'deposit')::NUMERIC,
        (p_payments_data->>'secondPayment')::NUMERIC,
        (p_payments_data->>'finalPayment')::NUMERIC,
        p_payments_data->>'depositDate',
        p_payments_data->>'secondPaymentDate',
        p_payments_data->>'finalPaymentDate',
        p_components_data,
        p_package_data,
        jsonb_build_object(
            'id', p_package_data->>'tierId',
            'name', p_package_data->>'tierName',
            'description', p_package_data->>'tierDescription',
            'priceOverride', (p_package_data->>'tierPriceOverride')::NUMERIC
        ),
        p_payments_data,
        p_internal_notes,
        p_consultant_id,
        p_team_id,
        current_user_id,
        NOW() + INTERVAL '30 days'
    ) RETURNING id INTO new_quote_id;
    
    -- Log the activity
    INSERT INTO public.quote_activities (
        quote_id,
        activity_type,
        activity_description,
        performed_by,
        metadata
    ) VALUES (
        new_quote_id,
        'quote_created',
        'Quote created from package intake form',
        current_user_id,
        jsonb_build_object(
            'source', 'package_intake',
            'event_name', p_event_data->>'name',
            'package_name', p_package_data->>'name'
        )
    );
    
    RETURN new_quote_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update quote status
CREATE OR REPLACE FUNCTION update_quote_status(
    p_quote_id UUID,
    p_status TEXT,
    p_notes TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    current_user_id UUID;
    status_update_time TIMESTAMP WITH TIME ZONE;
BEGIN
    current_user_id := auth.uid();
    status_update_time := NOW();
    
    -- Update the quote status
    UPDATE public.quotes
    SET 
        status = p_status,
        updated_at = status_update_time
    WHERE id = p_quote_id;
    
    -- Set specific timestamps based on status
    CASE p_status
        WHEN 'sent' THEN
            UPDATE public.quotes SET sent_at = status_update_time WHERE id = p_quote_id;
        WHEN 'accepted' THEN
            UPDATE public.quotes SET accepted_at = status_update_time WHERE id = p_quote_id;
        WHEN 'declined' THEN
            UPDATE public.quotes SET declined_at = status_update_time WHERE id = p_quote_id;
        WHEN 'confirmed' THEN
            UPDATE public.quotes SET confirmed_at = status_update_time WHERE id = p_quote_id;
    END CASE;
    
    -- Log the activity
    INSERT INTO public.quote_activities (
        quote_id,
        activity_type,
        activity_description,
        performed_by,
        metadata
    ) VALUES (
        p_quote_id,
        'status_updated',
        'Quote status updated to ' || p_status,
        current_user_id,
        jsonb_build_object(
            'old_status', (SELECT status FROM public.quotes WHERE id = p_quote_id),
            'new_status', p_status,
            'notes', p_notes
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to send quote email
CREATE OR REPLACE FUNCTION send_quote_email(
    p_quote_id UUID,
    p_recipient_email TEXT,
    p_email_type TEXT DEFAULT 'quote_sent',
    p_subject TEXT DEFAULT NULL,
    p_message TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    email_id UUID;
    current_user_id UUID;
    quote_data RECORD;
BEGIN
    current_user_id := auth.uid();
    
    -- Get quote data
    SELECT * INTO quote_data FROM public.quotes WHERE id = p_quote_id;
    
    -- Create email record
    INSERT INTO public.quote_emails (
        quote_id,
        email_type,
        recipient_email,
        subject,
        message,
        sent_by
    ) VALUES (
        p_quote_id,
        p_email_type,
        p_recipient_email,
        COALESCE(p_subject, 'Quote ' || quote_data.quote_number || ' from ' || quote_data.client_name),
        p_message,
        current_user_id
    ) RETURNING id INTO email_id;
    
    -- Log the activity
    INSERT INTO public.quote_activities (
        quote_id,
        activity_type,
        activity_description,
        performed_by,
        metadata
    ) VALUES (
        p_quote_id,
        'email_sent',
        'Quote email sent to ' || p_recipient_email,
        current_user_id,
        jsonb_build_object(
            'email_id', email_id,
            'email_type', p_email_type,
            'recipient_email', p_recipient_email
        )
    );
    
    RETURN email_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create quote revision
CREATE OR REPLACE FUNCTION create_quote_revision(
    p_original_quote_id UUID,
    p_revision_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    original_quote RECORD;
    new_quote_id UUID;
    current_user_id UUID;
BEGIN
    current_user_id := auth.uid();
    
    -- Get original quote data
    SELECT * INTO original_quote FROM public.quotes WHERE id = p_original_quote_id;
    
    -- Create new quote as revision
    INSERT INTO public.quotes (
        quote_number,
        status,
        client_name,
        client_email,
        client_phone,
        destination,
        start_date,
        end_date,
        total_price,
        currency,
        event_name,
        event_location,
        package_name,
        tier_name,
        travelers_adults,
        travelers_children,
        travelers_total,
        payment_deposit,
        payment_second_payment,
        payment_final_payment,
        payment_deposit_date,
        payment_second_payment_date,
        payment_final_payment_date,
        selected_components,
        selected_package,
        selected_tier,
        price_breakdown,
        internal_notes,
        consultant_id,
        team_id,
        user_id,
        version,
        is_revision,
        parent_quote_id,
        expires_at
    ) VALUES (
        original_quote.quote_number || '-R' || (original_quote.version + 1),
        'draft',
        original_quote.client_name,
        original_quote.client_email,
        original_quote.client_phone,
        original_quote.destination,
        original_quote.start_date,
        original_quote.end_date,
        original_quote.total_price,
        original_quote.currency,
        original_quote.event_name,
        original_quote.event_location,
        original_quote.package_name,
        original_quote.tier_name,
        original_quote.travelers_adults,
        original_quote.travelers_children,
        original_quote.travelers_total,
        original_quote.payment_deposit,
        original_quote.payment_second_payment,
        original_quote.payment_final_payment,
        original_quote.payment_deposit_date,
        original_quote.payment_second_payment_date,
        original_quote.payment_final_payment_date,
        original_quote.selected_components,
        original_quote.selected_package,
        original_quote.selected_tier,
        original_quote.price_breakdown,
        COALESCE(p_revision_notes, 'Revision of quote ' || original_quote.quote_number),
        original_quote.consultant_id,
        original_quote.team_id,
        current_user_id,
        original_quote.version + 1,
        true,
        p_original_quote_id,
        NOW() + INTERVAL '30 days'
    ) RETURNING id INTO new_quote_id;
    
    -- Log the activity
    INSERT INTO public.quote_activities (
        quote_id,
        activity_type,
        activity_description,
        performed_by,
        metadata
    ) VALUES (
        new_quote_id,
        'revision_created',
        'Quote revision created from ' || original_quote.quote_number,
        current_user_id,
        jsonb_build_object(
            'original_quote_id', p_original_quote_id,
            'original_quote_number', original_quote.quote_number,
            'revision_notes', p_revision_notes
        )
    );
    
    RETURN new_quote_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add quote attachment
CREATE OR REPLACE FUNCTION add_quote_attachment(
    p_quote_id UUID,
    p_file_name TEXT,
    p_file_path TEXT,
    p_file_size INTEGER,
    p_mime_type TEXT,
    p_attachment_type TEXT DEFAULT 'quote_pdf'
)
RETURNS UUID AS $$
DECLARE
    attachment_id UUID;
    current_user_id UUID;
BEGIN
    current_user_id := auth.uid();
    
    -- Create attachment record
    INSERT INTO public.quote_attachments (
        quote_id,
        file_name,
        file_path,
        file_size,
        mime_type,
        attachment_type,
        uploaded_by
    ) VALUES (
        p_quote_id,
        p_file_name,
        p_file_path,
        p_file_size,
        p_mime_type,
        p_attachment_type,
        current_user_id
    ) RETURNING id INTO attachment_id;
    
    -- Log the activity
    INSERT INTO public.quote_activities (
        quote_id,
        activity_type,
        activity_description,
        performed_by,
        metadata
    ) VALUES (
        p_quote_id,
        'attachment_added',
        'Attachment added: ' || p_file_name,
        current_user_id,
        jsonb_build_object(
            'attachment_id', attachment_id,
            'file_name', p_file_name,
            'file_size', p_file_size,
            'attachment_type', p_attachment_type
        )
    );
    
    RETURN attachment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get quote details with all related data
CREATE OR REPLACE FUNCTION get_quote_details(p_quote_id UUID)
RETURNS TABLE (
    quote_data JSONB,
    activities JSONB,
    emails JSONB,
    attachments JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        -- Quote data
        jsonb_build_object(
            'id', q.id,
            'quoteNumber', q.quote_number,
            'status', q.status,
            'clientName', q.client_name,
            'clientEmail', q.client_email,
            'clientPhone', q.client_phone,
            'destination', q.destination,
            'startDate', q.start_date,
            'endDate', q.end_date,
            'totalPrice', q.total_price,
            'currency', q.currency,
            'eventName', q.event_name,
            'eventLocation', q.event_location,
            'packageName', q.package_name,
            'tierName', q.tier_name,
            'travelersAdults', q.travelers_adults,
            'travelersChildren', q.travelers_children,
            'travelersTotal', q.travelers_total,
            'paymentDeposit', q.payment_deposit,
            'paymentSecondPayment', q.payment_second_payment,
            'paymentFinalPayment', q.payment_final_payment,
            'paymentDepositDate', q.payment_deposit_date,
            'paymentSecondPaymentDate', q.payment_second_payment_date,
            'paymentFinalPaymentDate', q.payment_final_payment_date,
            'expiresAt', q.expires_at,
            'sentAt', q.sent_at,
            'acceptedAt', q.accepted_at,
            'declinedAt', q.declined_at,
            'createdAt', q.created_at,
            'updatedAt', q.updated_at,
            'selectedComponents', q.selected_components,
            'selectedPackage', q.selected_package,
            'selectedTier', q.selected_tier,
            'priceBreakdown', q.price_breakdown,
            'internalNotes', q.internal_notes,
            'consultantId', q.consultant_id,
            'teamId', q.team_id,
            'version', q.version,
            'isRevision', q.is_revision,
            'parentQuoteId', q.parent_quote_id
        ) as quote_data,
        
        -- Activities
        COALESCE(
            (SELECT jsonb_agg(
                jsonb_build_object(
                    'id', qa.id,
                    'activityType', qa.activity_type,
                    'activityDescription', qa.activity_description,
                    'performedBy', qa.performed_by,
                    'performedAt', qa.performed_at,
                    'metadata', qa.metadata
                )
            ) FROM public.quote_activities qa WHERE qa.quote_id = q.id),
            '[]'::jsonb
        ) as activities,
        
        -- Emails
        COALESCE(
            (SELECT jsonb_agg(
                jsonb_build_object(
                    'id', qe.id,
                    'emailType', qe.email_type,
                    'recipientEmail', qe.recipient_email,
                    'subject', qe.subject,
                    'message', qe.message,
                    'sentAt', qe.sent_at,
                    'openedAt', qe.opened_at,
                    'clickedAt', qe.clicked_at,
                    'bounced', qe.bounced,
                    'metadata', qe.metadata
                )
            ) FROM public.quote_emails qe WHERE qe.quote_id = q.id),
            '[]'::jsonb
        ) as emails,
        
        -- Attachments
        COALESCE(
            (SELECT jsonb_agg(
                jsonb_build_object(
                    'id', qa.id,
                    'fileName', qa.file_name,
                    'filePath', qa.file_path,
                    'fileSize', qa.file_size,
                    'mimeType', qa.mime_type,
                    'attachmentType', qa.attachment_type,
                    'createdAt', qa.created_at
                )
            ) FROM public.quote_attachments qa WHERE qa.quote_id = q.id),
            '[]'::jsonb
        ) as attachments
        
    FROM public.quotes q
    WHERE q.id = p_quote_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add missing constraints if they don't exist
DO $$
BEGIN
  -- Add valid_travelers constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'valid_travelers' AND table_name = 'quotes'
  ) THEN
    ALTER TABLE public.quotes 
    ADD CONSTRAINT valid_travelers 
      CHECK (travelers_total = travelers_adults + travelers_children);
  END IF;

  -- Add valid_payment_schedule constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'valid_payment_schedule' AND table_name = 'quotes'
  ) THEN
    ALTER TABLE public.quotes 
    ADD CONSTRAINT valid_payment_schedule 
      CHECK (payment_deposit + payment_second_payment + payment_final_payment = total_price);
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_quotes_status ON public.quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON public.quotes(created_at);
CREATE INDEX IF NOT EXISTS idx_quotes_event_id ON public.quotes(event_id);
CREATE INDEX IF NOT EXISTS idx_quotes_consultant_id ON public.quotes(consultant_id);
CREATE INDEX IF NOT EXISTS idx_quotes_quote_number ON public.quotes(quote_number);
CREATE INDEX IF NOT EXISTS idx_quotes_team_id ON public.quotes(team_id);
CREATE INDEX IF NOT EXISTS idx_quotes_client_email ON public.quotes(client_email);

-- Enable RLS on quote tables if not already enabled
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_settings ENABLE ROW LEVEL SECURITY; 