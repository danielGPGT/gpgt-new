-- Function to update inventory when a quote becomes a booking
-- This function handles all component types and updates their reserved/provisional quantities

CREATE OR REPLACE FUNCTION update_inventory_from_booking(
    p_quote_id UUID,
    p_booking_id UUID,
    p_status TEXT DEFAULT 'confirmed' -- 'confirmed', 'provisional', 'cancelled'
)
RETURNS VOID AS $$
DECLARE
    quote_data RECORD;
    component JSONB;
    component_type TEXT;
    component_id UUID;
    quantity INTEGER;
    current_reserved INTEGER;
    current_provisional INTEGER;
BEGIN
    -- Get quote data
    SELECT selected_components, status INTO quote_data
    FROM public.quotes 
    WHERE id = p_quote_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Quote not found: %', p_quote_id;
    END IF;
    
    -- Process each component type
    FOR component_type IN SELECT UNNEST(ARRAY['tickets', 'hotels', 'circuitTransfers', 'airportTransfers', 'flights', 'loungePass'])
    LOOP
        -- Handle array components (tickets, hotels, transfers, flights)
        IF component_type IN ('tickets', 'hotels', 'circuitTransfers', 'airportTransfers', 'flights') THEN
            FOR component IN SELECT * FROM jsonb_array_elements(quote_data.selected_components->component_type)
            LOOP
                component_id := (component->>'id')::UUID;
                quantity := (component->>'quantity')::INTEGER;
                
                IF component_id IS NOT NULL AND quantity > 0 THEN
                    -- Update based on component type
                    CASE component_type
                        WHEN 'tickets' THEN
                            -- Update tickets
                            IF p_status = 'confirmed' THEN
                                UPDATE public.tickets 
                                SET quantity_reserved = quantity_reserved + quantity,
                                    updated_at = NOW()
                                WHERE id = component_id;
                            ELSIF p_status = 'provisional' THEN
                                UPDATE public.tickets 
                                SET quantity_provisional = quantity_provisional + quantity,
                                    updated_at = NOW()
                                WHERE id = component_id;
                            ELSIF p_status = 'cancelled' THEN
                                -- Revert the booking - remove from reserved/provisional
                                UPDATE public.tickets 
                                SET quantity_reserved = GREATEST(0, quantity_reserved - quantity),
                                    quantity_provisional = GREATEST(0, quantity_provisional - quantity),
                                    updated_at = NOW()
                                WHERE id = component_id;
                            END IF;
                            
                        WHEN 'hotels' THEN
                            -- Update hotel rooms
                            IF p_status = 'confirmed' THEN
                                UPDATE public.hotel_rooms 
                                SET quantity_reserved = quantity_reserved + quantity,
                                    updated_at = NOW()
                                WHERE id = component_id;
                            ELSIF p_status = 'provisional' THEN
                                UPDATE public.hotel_rooms 
                                SET quantity_provisional = quantity_provisional + quantity,
                                    updated_at = NOW()
                                WHERE id = component_id;
                            ELSIF p_status = 'cancelled' THEN
                                UPDATE public.hotel_rooms 
                                SET quantity_reserved = GREATEST(0, quantity_reserved - quantity),
                                    quantity_provisional = GREATEST(0, quantity_provisional - quantity),
                                    updated_at = NOW()
                                WHERE id = component_id;
                            END IF;
                            
                        WHEN 'circuitTransfers' THEN
                            -- Update circuit transfers (uses 'used' field)
                            IF p_status = 'confirmed' THEN
                                UPDATE public.circuit_transfers 
                                SET used = used + quantity,
                                    updated_at = NOW()
                                WHERE id = component_id;
                            ELSIF p_status = 'cancelled' THEN
                                UPDATE public.circuit_transfers 
                                SET used = GREATEST(0, used - quantity),
                                    updated_at = NOW()
                                WHERE id = component_id;
                            END IF;
                            
                        WHEN 'airportTransfers' THEN
                            -- Update airport transfers (uses vehicles_reserved/vehicles_provisional)
                            IF p_status = 'confirmed' THEN
                                UPDATE public.airport_transfers 
                                SET vehicles_reserved = vehicles_reserved + quantity,
                                    updated_at = NOW()
                                WHERE id = component_id;
                            ELSIF p_status = 'provisional' THEN
                                UPDATE public.airport_transfers 
                                SET vehicles_provisional = vehicles_provisional + quantity,
                                    updated_at = NOW()
                                WHERE id = component_id;
                            ELSIF p_status = 'cancelled' THEN
                                UPDATE public.airport_transfers 
                                SET vehicles_reserved = GREATEST(0, vehicles_reserved - quantity),
                                    vehicles_provisional = GREATEST(0, vehicles_provisional - quantity),
                                    updated_at = NOW()
                                WHERE id = component_id;
                            END IF;
                            
                        WHEN 'flights' THEN
                            -- Flights don't typically have inventory to update
                            -- But you could track flight bookings if needed
                            NULL;
                    END CASE;
                END IF;
            END LOOP;
            
        -- Handle single object components (lounge pass)
        ELSIF component_type = 'loungePass' THEN
            component := quote_data.selected_components->'loungePass';
            component_id := (component->>'id')::UUID;
            quantity := (component->>'quantity')::INTEGER;
            
            IF component_id IS NOT NULL AND quantity > 0 THEN
                -- Lounge passes don't typically have inventory tracking
                -- But you could add it if needed
                NULL;
            END IF;
        END IF;
    END LOOP;
    
    -- Log the inventory update
    INSERT INTO public.quote_activity_log (
        quote_id,
        activity_type,
        activity_description,
        metadata
    ) VALUES (
        p_quote_id,
        'inventory_updated',
        'Inventory updated for booking ' || p_booking_id,
        jsonb_build_object(
            'booking_id', p_booking_id,
            'status', p_status,
            'components_updated', quote_data.selected_components
        )
    );
    
END;
$$ LANGUAGE plpgsql;

-- Function to create a booking from a quote and update inventory
CREATE OR REPLACE FUNCTION create_booking_from_quote(
    p_quote_id UUID,
    p_status TEXT DEFAULT 'confirmed'
)
RETURNS UUID AS $$
DECLARE
    quote_data RECORD;
    new_booking_id UUID;
BEGIN
    -- Get quote data
    SELECT * INTO quote_data
    FROM public.quotes 
    WHERE id = p_quote_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Quote not found: %', p_quote_id;
    END IF;
    
    -- Create booking record
    INSERT INTO public.bookings (
        quote_id,
        user_id,
        client_name,
        booking_data,
        total_cost,
        currency,
        status,
        client_id,
        team_id,
        selected_components,
        selected_package,
        selected_tier,
        price_breakdown
    ) VALUES (
        p_quote_id,
        quote_data.user_id,
        quote_data.client_name,
        jsonb_build_object(
            'destination', quote_data.destination,
            'start_date', quote_data.start_date,
            'end_date', quote_data.end_date,
            'travelers', quote_data.travelers,
            'event', jsonb_build_object(
                'id', quote_data.event_id,
                'name', quote_data.event_name,
                'location', quote_data.event_location,
                'start_date', quote_data.event_start_date,
                'end_date', quote_data.event_end_date
            )
        ),
        quote_data.total_price,
        quote_data.currency,
        p_status,
        quote_data.client_id,
        quote_data.team_id,
        quote_data.selected_components,
        quote_data.selected_package,
        quote_data.selected_tier,
        quote_data.price_breakdown
    ) RETURNING id INTO new_booking_id;
    
    -- Update inventory
    PERFORM update_inventory_from_booking(p_quote_id, new_booking_id, p_status);
    
    -- Update quote status
    UPDATE public.quotes 
    SET status = 'confirmed',
        accepted_at = NOW(),
        updated_at = NOW()
    WHERE id = p_quote_id;
    
    -- Log the booking creation
    INSERT INTO public.quote_activity_log (
        quote_id,
        activity_type,
        activity_description,
        performed_by,
        metadata
    ) VALUES (
        p_quote_id,
        'booking_created',
        'Booking created from quote',
        quote_data.user_id,
        jsonb_build_object(
            'booking_id', new_booking_id,
            'status', p_status
        )
    );
    
    RETURN new_booking_id;
END;
$$ LANGUAGE plpgsql;

-- Function to cancel a booking and revert inventory
CREATE OR REPLACE FUNCTION cancel_booking_and_revert_inventory(
    p_booking_id UUID
)
RETURNS VOID AS $$
DECLARE
    booking_data RECORD;
BEGIN
    -- Get booking data
    SELECT * INTO booking_data
    FROM public.bookings 
    WHERE id = p_booking_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Booking not found: %', p_booking_id;
    END IF;
    
    -- Revert inventory
    PERFORM update_inventory_from_booking(booking_data.quote_id, p_booking_id, 'cancelled');
    
    -- Update booking status
    UPDATE public.bookings 
    SET status = 'cancelled',
        updated_at = NOW()
    WHERE id = p_booking_id;
    
    -- Update quote status
    UPDATE public.quotes 
    SET status = 'cancelled',
        declined_at = NOW(),
        updated_at = NOW()
    WHERE id = booking_data.quote_id;
    
    -- Log the cancellation
    INSERT INTO public.quote_activity_log (
        quote_id,
        activity_type,
        activity_description,
        performed_by,
        metadata
    ) VALUES (
        booking_data.quote_id,
        'booking_cancelled',
        'Booking cancelled and inventory reverted',
        booking_data.user_id,
        jsonb_build_object(
            'booking_id', p_booking_id
        )
    );
END;
$$ LANGUAGE plpgsql;

-- Function to check inventory availability before creating booking
CREATE OR REPLACE FUNCTION check_inventory_availability(
    p_quote_id UUID
)
RETURNS TABLE(
    component_type TEXT,
    component_id UUID,
    component_name TEXT,
    requested_quantity INTEGER,
    available_quantity INTEGER,
    is_available BOOLEAN
) AS $$
DECLARE
    quote_data RECORD;
    component JSONB;
    component_type TEXT;
    component_id UUID;
    quantity INTEGER;
    available_qty INTEGER;
BEGIN
    -- Get quote data
    SELECT selected_components INTO quote_data
    FROM public.quotes 
    WHERE id = p_quote_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Quote not found: %', p_quote_id;
    END IF;
    
    -- Check each component type
    FOR component_type IN SELECT UNNEST(ARRAY['tickets', 'hotels', 'circuitTransfers', 'airportTransfers'])
    LOOP
        FOR component IN SELECT * FROM jsonb_array_elements(quote_data.selected_components->component_type)
        LOOP
            component_id := (component->>'id')::UUID;
            quantity := (component->>'quantity')::INTEGER;
            
            IF component_id IS NOT NULL AND quantity > 0 THEN
                CASE component_type
                    WHEN 'tickets' THEN
                        SELECT quantity_available INTO available_qty
                        FROM public.tickets 
                        WHERE id = component_id;
                        
                    WHEN 'hotels' THEN
                        SELECT quantity_available INTO available_qty
                        FROM public.hotel_rooms 
                        WHERE id = component_id;
                        
                    WHEN 'circuitTransfers' THEN
                        -- For circuit transfers, check if there's capacity
                        SELECT coach_capacity - used INTO available_qty
                        FROM public.circuit_transfers 
                        WHERE id = component_id;
                        
                    WHEN 'airportTransfers' THEN
                        SELECT vehicles_available INTO available_qty
                        FROM public.airport_transfers 
                        WHERE id = component_id;
                END CASE;
                
                RETURN QUERY SELECT 
                    component_type::TEXT,
                    component_id,
                    component->>'name'::TEXT,
                    quantity,
                    COALESCE(available_qty, 0),
                    COALESCE(available_qty, 0) >= quantity;
            END IF;
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Example usage:
-- 
-- 1. Check if inventory is available before booking:
-- SELECT * FROM check_inventory_availability('quote-uuid-here');
--
-- 2. Create a confirmed booking:
-- SELECT create_booking_from_quote('quote-uuid-here', 'confirmed');
--
-- 3. Create a provisional booking:
-- SELECT create_booking_from_quote('quote-uuid-here', 'provisional');
--
-- 4. Cancel a booking:
-- SELECT cancel_booking_and_revert_inventory('booking-uuid-here'); 