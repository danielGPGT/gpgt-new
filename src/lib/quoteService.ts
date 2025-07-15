import { supabase } from './supabase';
import { getCurrentUserTeamId } from './teamUtils';
import { 
  Quote, 
  QuoteResponse, 
  QuoteError, 
  CreateQuoteData, 
  QuoteDetails, 
  QuoteActivity, 
  QuoteEmail, 
  QuoteAttachment 
} from '@/types';

// Helper to group flat array into expected object
function groupComponents(componentsArray: any[]) {
  const grouped = {
    tickets: [],
    hotels: [],
    circuitTransfers: [],
    airportTransfers: [],
    flights: [],
    loungePass: null
  };
  if (!Array.isArray(componentsArray)) return grouped;
  for (const comp of componentsArray) {
    switch (comp.type) {
      case 'ticket':
        grouped.tickets.push(comp.data);
        break;
      case 'hotel_room':
        grouped.hotels.push(comp.data);
        break;
      case 'circuit_transfer':
        grouped.circuitTransfers.push(comp.data);
        break;
      case 'airport_transfer':
        grouped.airportTransfers.push(comp.data);
        break;
      case 'flight':
        grouped.flights.push(comp.data);
        break;
      case 'lounge_pass':
        grouped.loungePass = comp.data;
        break;
    }
  }
  return grouped;
}

export class QuoteService {
  // Generate quote reference based on event name, sport, year, and sequence
  private static async generateQuoteReference(eventName: string, eventLocation: string, year: string): Promise<string> {
    // Extract event type (first 3 letters, uppercase)
    const eventPrefix = eventName.substring(0, 3).toUpperCase();
    
    // Extract sport/location (first 2-3 letters, uppercase)
    const sportPrefix = eventLocation.substring(0, 3).toUpperCase();
    
    // Get current year
    const currentYear = year || new Date().getFullYear().toString();
    
    // Query database to get the next sequence number for this pattern
    const pattern = `${eventPrefix}-${sportPrefix}-${currentYear}-%`;
    
    const { data: existingQuotes, error } = await supabase
      .from('quotes')
      .select('quote_reference')
      .like('quote_reference', pattern)
      .order('quote_reference', { ascending: false })
      .limit(1);
    
    let sequence = 1;
    if (!error && existingQuotes && existingQuotes.length > 0) {
      // Extract the sequence number from the last quote reference
      const lastReference = existingQuotes[0].quote_reference;
      const match = lastReference.match(/-(\d{3})$/);
      if (match) {
        sequence = parseInt(match[1]) + 1;
      }
    }
    
    return `${eventPrefix}-${sportPrefix}-${currentYear}-${sequence.toString().padStart(3, '0')}`;
  }

  // Create a new quote from package intake form data
  static async createQuoteFromIntake(data: CreateQuoteData): Promise<string> {
    try {
      const teamId = await getCurrentUserTeamId();
      if (!teamId) {
        throw new Error('User must be part of a team to create quotes');
      }

      // Helper functions for date parsing
      const parseDate = (dateString: string | undefined): string => {
        if (!dateString) return new Date().toISOString().split('T')[0];
        return new Date(dateString).toISOString().split('T')[0];
      };

      const parseOptionalDate = (dateString: string | undefined): string | null => {
        if (!dateString) return null;
        return new Date(dateString).toISOString().split('T')[0];
      };

      // Generate quote reference
      const eventYear = data.eventData.startDate ? new Date(data.eventData.startDate).getFullYear().toString() : new Date().getFullYear().toString();
      const quoteReference = await this.generateQuoteReference(
        data.eventData.name,
        data.eventData.location,
        eventYear
      );

      // Prepare components data for JSONB storage
      const componentsArray = [
        ...data.componentsData.tickets.map((ticket: any, index: number) => ({
          type: 'ticket',
          id: ticket.id,
          name: ticket.category || 'Event Ticket',
          description: `Event ticket - ${ticket.category || 'General'}`,
          unitPrice: ticket.price || 0,
          quantity: ticket.quantity || 1,
          totalPrice: (ticket.price || 0) * (ticket.quantity || 1),
          sortOrder: index,
          data: ticket
        })),
        ...data.componentsData.hotels.map((hotel: any, index: number) => ({
          type: 'hotel_room',
          id: hotel.roomId,
          name: `Hotel Room - ${hotel.hotelName || 'Unknown Hotel'}`,
          description: `Hotel accommodation`,
          unitPrice: hotel.pricePerNight || 0,
          quantity: hotel.quantity || 1,
          totalPrice: (hotel.pricePerNight || 0) * (hotel.quantity || 1),
          sortOrder: data.componentsData.tickets.length + index,
          data: hotel
        })),
        ...data.componentsData.circuitTransfers.map((transfer: any, index: number) => ({
          type: 'circuit_transfer',
          id: transfer.id,
          name: `Circuit Transfer - ${transfer.transferType || 'Standard'}`,
          description: `Transportation between venues`,
          unitPrice: transfer.price || 0,
          quantity: transfer.quantity || 1,
          totalPrice: (transfer.price || 0) * (transfer.quantity || 1),
          sortOrder: data.componentsData.tickets.length + data.componentsData.hotels.length + index,
          data: transfer
        })),
        ...data.componentsData.airportTransfers.map((transfer: any, index: number) => {
          const directionMultiplier = transfer.transferDirection === 'both' ? 2 : 1;
          return {
            type: 'airport_transfer',
            id: transfer.id,
            name: `Airport Transfer - ${transfer.transferType || 'Standard'}`,
            description: `Transportation to/from airport`,
            unitPrice: transfer.price || 0,
            quantity: transfer.quantity || 1, // vehicles per direction
            totalPrice: (transfer.price || 0) * (transfer.quantity || 1) * directionMultiplier,
            sortOrder: data.componentsData.tickets.length + data.componentsData.hotels.length + data.componentsData.circuitTransfers.length + index,
            data: transfer
          };
        }),
        ...data.componentsData.flights.map((flight: any, index: number) => ({
          type: 'flight',
          id: flight.id || `flight-${index}`,
          name: `Flight - ${flight.originAirport || flight.origin} to ${flight.destinationAirport || flight.destination}`,
          description: `Flight from ${flight.originAirport || flight.origin} to ${flight.destinationAirport || flight.destination}`,
          unitPrice: flight.total || flight.price || 0,
          quantity: flight.passengers || 1,
          totalPrice: (flight.total || flight.price || 0) * (flight.passengers || 1),
          sortOrder: data.componentsData.tickets.length + data.componentsData.hotels.length + data.componentsData.circuitTransfers.length + data.componentsData.airportTransfers.length + index,
          data: {
            // Basic flight info
            origin: flight.origin || flight.originAirport,
            destination: flight.destination || flight.destinationAirport,
            departureDate: flight.departureDate,
            returnDate: flight.returnDate,
            passengers: flight.passengers || 1,
            price: flight.price || 0,
            total: flight.total || 0,
            
            // Outbound flight details
            outboundFlightId: flight.outboundFlightId,
            outboundMarketingAirlineId: flight.outboundMarketingAirlineId,
            outboundOperatingAirlineId: flight.outboundOperatingAirlineId,
            outboundMarketingAirlineName: flight.outboundMarketingAirlineName,
            outboundOperatingAirlineName: flight.outboundOperatingAirlineName,
            outboundDepartureAirportId: flight.outboundDepartureAirportId,
            outboundDepartureAirportName: flight.outboundDepartureAirportName,
            outboundArrivalAirportId: flight.outboundArrivalAirportId,
            outboundArrivalAirportName: flight.outboundArrivalAirportName,
            outboundDepartureDateTime: flight.outboundDepartureDateTime,
            outboundDepartureDateTimeUtc: flight.outboundDepartureDateTimeUtc,
            outboundArrivalDateTime: flight.outboundArrivalDateTime,
            outboundArrivalDateTimeUtc: flight.outboundArrivalDateTimeUtc,
            outboundFlightDuration: flight.outboundFlightDuration,
            outboundAircraftType: flight.outboundAircraftType,
            outboundDepartureTerminal: flight.outboundDepartureTerminal,
            outboundArrivalTerminal: flight.outboundArrivalTerminal,
            outboundCabinId: flight.outboundCabinId,
            outboundCabinName: flight.outboundCabinName,
            outboundFareBasisCode: flight.outboundFareBasisCode,
            outboundFareTypeId: flight.outboundFareTypeId,
            outboundFareTypeName: flight.outboundFareTypeName,
            outboundFareSubTypeId: flight.outboundFareSubTypeId,
            outboundFareSubTypeName: flight.outboundFareSubTypeName,
            outboundBaggageAllowance: flight.outboundBaggageAllowance,
            outboundCheckedBaggage: flight.outboundCheckedBaggage,
            outboundCarryOnBaggage: flight.outboundCarryOnBaggage,
            outboundStops: flight.outboundStops,
            outboundLayoverInfo: flight.outboundLayoverInfo,
            outboundFlightSegments: flight.outboundFlightSegments,
            
            // Inbound flight details (for return flights)
            inboundFlightId: flight.inboundFlightId,
            inboundMarketingAirlineId: flight.inboundMarketingAirlineId,
            inboundOperatingAirlineId: flight.inboundOperatingAirlineId,
            inboundMarketingAirlineName: flight.inboundMarketingAirlineName,
            inboundOperatingAirlineName: flight.inboundOperatingAirlineName,
            inboundDepartureAirportId: flight.inboundDepartureAirportId,
            inboundDepartureAirportName: flight.inboundDepartureAirportName,
            inboundArrivalAirportId: flight.inboundArrivalAirportId,
            inboundArrivalAirportName: flight.inboundArrivalAirportName,
            inboundDepartureDateTime: flight.inboundDepartureDateTime,
            inboundDepartureDateTimeUtc: flight.inboundDepartureDateTimeUtc,
            inboundArrivalDateTime: flight.inboundArrivalDateTime,
            inboundArrivalDateTimeUtc: flight.inboundArrivalDateTimeUtc,
            inboundFlightDuration: flight.inboundFlightDuration,
            inboundAircraftType: flight.inboundAircraftType,
            inboundDepartureTerminal: flight.inboundDepartureTerminal,
            inboundArrivalTerminal: flight.inboundArrivalTerminal,
            inboundCabinId: flight.inboundCabinId,
            inboundCabinName: flight.inboundCabinName,
            inboundFareBasisCode: flight.inboundFareBasisCode,
            inboundFareTypeId: flight.inboundFareTypeId,
            inboundFareTypeName: flight.inboundFareTypeName,
            inboundFareSubTypeId: flight.inboundFareSubTypeId,
            inboundFareSubTypeName: flight.inboundFareSubTypeName,
            inboundBaggageAllowance: flight.inboundBaggageAllowance,
            inboundCheckedBaggage: flight.inboundCheckedBaggage,
            inboundCarryOnBaggage: flight.inboundCarryOnBaggage,
            inboundStops: flight.inboundStops,
            inboundLayoverInfo: flight.inboundLayoverInfo,
            returnFlightSegments: flight.returnFlightSegments,
            
            // Legacy fields for backward compatibility
            outboundFlightNumber: flight.outboundFlightNumber,
            inboundFlightNumber: flight.inboundFlightNumber,
            outboundDepartureAirportCode: flight.outboundDepartureAirportCode,
            outboundArrivalAirportCode: flight.outboundArrivalAirportCode,
            inboundDepartureAirportCode: flight.inboundDepartureAirportCode,
            inboundArrivalAirportCode: flight.inboundArrivalAirportCode,
            airline: flight.airline,
            cabin: flight.cabin,
            refundable: flight.refundable,
            baggageAllowance: flight.baggageAllowance,
            
            // Fare and pricing details
            fareTypeId: flight.fareTypeId,
            fareTypeName: flight.fareTypeName,
            fareSubTypeId: flight.fareSubTypeId,
            fareSubTypeName: flight.fareSubTypeName,
            revenueStreamId: flight.revenueStreamId,
            revenueStreamName: flight.revenueStreamName,
            passengerTypeId: flight.passengerTypeId,
            passengerTypeName: flight.passengerTypeName,
            baseFare: flight.baseFare,
            taxes: flight.taxes,
            fees: flight.fees,
            totalFare: flight.totalFare,
            currencyId: flight.currencyId,
            currencyCode: flight.currencyCode,
            currencyName: flight.currencyName,
            currencySymbol: flight.currencySymbol,
            decimalPlaces: flight.decimalPlaces,
            
            // Additional metadata
            recommendationId: flight.recommendationId,
            validatingAirlineId: flight.validatingAirlineId,
            validatingAirlineName: flight.validatingAirlineName,
            skytraxRating: flight.skytraxRating,
            isPremium: flight.isPremium,
            isCorporate: flight.isCorporate,
            isInstantTicketing: flight.isInstantTicketing,
            isSemiDeferred: flight.isSemiDeferred,
            isBaggageOnly: flight.isBaggageOnly,
            isAlternateRoute: flight.isAlternateRoute,
            
            // Original API response data for reference
            originalApiData: flight.originalApiData
          }
        }))
      ];

      // Add lounge pass if selected
      if (data.componentsData.loungePass && data.componentsData.loungePass.id) {
        componentsArray.push({
          type: 'lounge_pass',
          id: data.componentsData.loungePass.id,
          name: `Lounge Pass - ${data.componentsData.loungePass.variant || 'Standard'}`,
          description: 'Airport lounge access',
          unitPrice: data.componentsData.loungePass.price || 0,
          quantity: data.componentsData.loungePass.quantity || 1,
          totalPrice: (data.componentsData.loungePass.price || 0) * (data.componentsData.loungePass.quantity || 1),
          sortOrder: componentsArray.length,
          data: data.componentsData.loungePass
        });
      }

      // Create the quote record
      const { data: quoteData, error: quoteError } = await supabase
        .from('quotes')
        .insert({
          user_id: data.consultantId || (await supabase.auth.getUser()).data.user?.id,
          team_id: teamId,
          consultant_id: data.consultantId,
          client_id: data.clientId, // <-- Store client_id
          
          // Client Information
          client_name: `${data.clientData.firstName} ${data.clientData.lastName}`,
          client_email: data.clientData.email,
          client_phone: data.clientData.phone,
          client_address: data.clientData.address,
          
          // Event Information
          event_id: data.eventData.id,
          event_name: data.eventData.name,
          event_location: data.eventData.location,
          event_start_date: parseDate(data.eventData.startDate),
          event_end_date: parseDate(data.eventData.endDate),
          
          // Package Information
          package_id: data.packageData.id,
          package_name: data.packageData.name,
          package_base_type: data.packageData.baseType,
          tier_id: data.packageData.tierId,
          tier_name: data.packageData.tierName,
          tier_description: data.packageData.tierDescription,
          tier_price_override: data.packageData.tierPriceOverride,
          
          // Travel Information
          travelers: data.travelersData,
          travelers_adults: data.travelersData.adults,
          travelers_children: data.travelersData.children,
          travelers_total: data.travelersData.total,
          
          // Pricing Information
          total_price: data.paymentsData.total,
          currency: data.paymentsData.currency || 'GBP',
          
          // Payment Schedule
          payment_deposit: data.paymentsData.deposit,
          payment_second_payment: data.paymentsData.secondPayment,
          payment_final_payment: data.paymentsData.finalPayment,
          payment_deposit_date: parseOptionalDate(data.paymentsData.depositDate),
          payment_second_payment_date: parseOptionalDate(data.paymentsData.secondPaymentDate),
          payment_final_payment_date: parseOptionalDate(data.paymentsData.finalPaymentDate),
          
          // Quote Details
          status: 'draft',
          internal_notes: data.internalNotes,
          quote_reference: quoteReference,
          
          // Component Data (JSONB)
          selected_components: componentsArray,
          selected_package: data.packageData,
          selected_tier: {
            id: data.packageData.tierId,
            name: data.packageData.tierName,
            description: data.packageData.tierDescription,
            priceOverride: data.packageData.tierPriceOverride
          },
          price_breakdown: data.paymentsData,
          
          // Timestamps
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
        })
        .select()
        .single();

      if (quoteError) {
        console.error('Error creating quote:', quoteError);
        throw new Error(`Failed to create quote: ${quoteError.message}`);
      }

      return quoteData.id;
    } catch (error) {
      console.error('Error in createQuoteFromIntake:', error);
      throw error;
    }
  }

  // Get all quotes for the current team
  static async getTeamQuotes(
    status?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ quotes: Quote[]; total: number }> {
    try {
      const teamId = await getCurrentUserTeamId();
      if (!teamId) {
        throw new Error('User must be part of a team to view quotes');
      }

      let query = supabase
        .from('quotes')
        .select(`
          *,
          teams!quotes_team_id_fkey (
            id,
            name,
            logo_url,
            agency_name
          )
        `, { count: 'exact' })
        .eq('team_id', teamId)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error, count } = await query
        .range(offset, offset + limit - 1);

      if (error) {
        throw new Error(`Failed to fetch quotes: ${error.message}`);
      }

      const quotes = data?.map(this.mapQuoteFromJson) || [];
      return { quotes, total: count || 0 };
    } catch (error) {
      console.error('Error in getTeamQuotes:', error);
      throw error;
    }
  }

  // Get user's own quotes (only quotes created by the current user)
  static async getUserQuotes(
    status?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ quotes: Quote[]; total: number }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User must be authenticated to view quotes');
      }

      let query = supabase
        .from('quotes')
        .select(`
          *,
          teams!quotes_team_id_fkey (
            id,
            name,
            logo_url,
            agency_name
          )
        `, { count: 'exact' })
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error, count } = await query
        .range(offset, offset + limit - 1);

      if (error) {
        throw new Error(`Failed to fetch user quotes: ${error.message}`);
      }

      const quotes = data?.map(this.mapQuoteFromJson) || [];
      return { quotes, total: count || 0 };
    } catch (error) {
      console.error('Error in getUserQuotes:', error);
      throw error;
    }
  }

  // Get a single quote by ID
  static async getQuoteById(quoteId: string): Promise<Quote> {
    try {
      const { data, error } = await supabase
        .from('quotes')
        .select(`
          *,
          teams!quotes_team_id_fkey (
            id,
            name,
            logo_url,
            agency_name
          )
        `)
        .eq('id', quoteId)
        .single();

      if (error) {
        throw new Error(`Failed to fetch quote: ${error.message}`);
      }

      return this.mapQuoteFromJson(data);
    } catch (error) {
      console.error('Error in getQuoteById:', error);
      throw error;
    }
  }

  // Get quote details with activities, emails, and attachments
  static async getQuoteDetails(quoteId: string): Promise<QuoteDetails> {
    try {
      const quote = await this.getQuoteById(quoteId);
      
      // For now, return empty arrays for activities, emails, and attachments
      // These would be populated from separate tables if they existed
      const activities: QuoteActivity[] = [];
      const emails: QuoteEmail[] = [];
      const attachments: QuoteAttachment[] = [];

      return {
        quote,
        activities,
        emails,
        attachments
      };
    } catch (error) {
      console.error('Error in getQuoteDetails:', error);
      throw error;
    }
  }

  // Send quote email
  static async sendQuoteEmail(
    quoteId: string,
    recipientEmail: string,
    emailType: string = 'quote_sent',
    subject?: string,
    message?: string
  ): Promise<string> {
    try {
      // For now, just log the email sending
      // In a real implementation, this would integrate with an email service
      console.log('Sending quote email:', {
        quoteId,
        recipientEmail,
        emailType,
        subject,
        message
      });

      // Update quote status to 'sent' if this is the first email
      await this.updateQuoteStatus(quoteId, 'sent');

      return 'email_sent_' + Date.now(); // Return a mock email ID
    } catch (error) {
      console.error('Error in sendQuoteEmail:', error);
      throw error;
    }
  }

  // Create quote revision
  static async createQuoteRevision(
    originalQuoteId: string,
    revisionNotes?: string
  ): Promise<string> {
    try {
      const originalQuote = await this.getQuoteById(originalQuoteId);
      
      // Generate new quote reference for the revision
      const eventYear = originalQuote.eventStartDate ? new Date(originalQuote.eventStartDate).getFullYear().toString() : new Date().getFullYear().toString();
      const quoteReference = await this.generateQuoteReference(
        originalQuote.eventName,
        originalQuote.eventLocation,
        eventYear
      );
      
      // Create a new quote based on the original
      const { data: newQuote, error } = await supabase
        .from('quotes')
        .insert({
          user_id: originalQuote.userId,
          team_id: originalQuote.teamId,
          consultant_id: originalQuote.consultantId,
          
          // Client Information
          client_name: originalQuote.clientName,
          client_email: originalQuote.clientEmail,
          client_phone: originalQuote.clientPhone,
          client_address: originalQuote.clientAddress,
          
          // Event Information
          event_id: originalQuote.eventId,
          event_name: originalQuote.eventName,
          event_location: originalQuote.eventLocation,
          event_start_date: originalQuote.eventStartDate,
          event_end_date: originalQuote.eventEndDate,
          
          // Package Information
          package_id: originalQuote.packageId,
          package_name: originalQuote.packageName,
          package_base_type: originalQuote.packageBaseType,
          tier_id: originalQuote.tierId,
          tier_name: originalQuote.tierName,
          tier_description: originalQuote.tierDescription,
          tier_price_override: originalQuote.tierPriceOverride,
          
          // Travel Information
          travelers: originalQuote.travelers,
          travelers_adults: originalQuote.travelersAdults,
          travelers_children: originalQuote.travelersChildren,
          travelers_total: originalQuote.travelersTotal,
          
          // Pricing Information
          total_price: originalQuote.totalPrice,
          currency: originalQuote.currency,
          base_cost: originalQuote.baseCost,
          
          // Payment Schedule
          payment_deposit: originalQuote.paymentDeposit,
          payment_second_payment: originalQuote.paymentSecondPayment,
          payment_final_payment: originalQuote.paymentFinalPayment,
          payment_deposit_date: originalQuote.paymentDepositDate,
          payment_second_payment_date: originalQuote.paymentSecondPaymentDate,
          payment_final_payment_date: originalQuote.paymentFinalPaymentDate,
          
          // Quote Details
          status: 'draft',
          version: (originalQuote.version || 1) + 1,
          is_revision: true,
          parent_quote_id: originalQuoteId,
          quote_reference: quoteReference,
          internal_notes: revisionNotes || `Revision of quote ${originalQuote.quoteNumber}`,
          
          // Component Data (JSONB)
          selected_components: originalQuote.selectedComponents,
          selected_package: originalQuote.selectedPackage,
          selected_tier: originalQuote.selectedTier,
          price_breakdown: originalQuote.priceBreakdown,
          
          // Timestamps
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create quote revision: ${error.message}`);
      }

      return newQuote.id;
    } catch (error) {
      console.error('Error in createQuoteRevision:', error);
      throw error;
    }
  }

  // Add quote attachment
  static async addQuoteAttachment(
    quoteId: string,
    fileName: string,
    filePath: string,
    fileSize: number,
    mimeType: string,
    attachmentType: string = 'quote_pdf'
  ): Promise<string> {
    try {
      // For now, just log the attachment
      // In a real implementation, this would store file metadata
      console.log('Adding quote attachment:', {
        quoteId,
        fileName,
        filePath,
        fileSize,
        mimeType,
        attachmentType
      });

      return 'attachment_' + Date.now(); // Return a mock attachment ID
    } catch (error) {
      console.error('Error in addQuoteAttachment:', error);
      throw error;
    }
  }

  // Update quote status
  static async updateQuoteStatus(
    quoteId: string,
    status: Quote['status'],
    notes?: string
  ): Promise<void> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      // Set specific timestamps based on status
      switch (status) {
        case 'sent':
          updateData.sent_at = new Date().toISOString();
          break;
        case 'accepted':
          updateData.accepted_at = new Date().toISOString();
          break;
        case 'declined':
          updateData.declined_at = new Date().toISOString();
          break;
        case 'expired':
          updateData.expired_at = new Date().toISOString();
          break;
      }

      if (notes) {
        updateData.internal_notes = notes;
      }

      const { error } = await supabase
        .from('quotes')
        .update(updateData)
        .eq('id', quoteId);

      if (error) {
        throw new Error(`Failed to update quote status: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in updateQuoteStatus:', error);
      throw error;
    }
  }

  // Update quote details
  static async updateQuote(
    quoteId: string,
    updateData: Partial<Quote>
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('quotes')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', quoteId);

      if (error) {
        throw new Error(`Failed to update quote: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in updateQuote:', error);
      throw error;
    }
  }

  // Delete a quote
  static async deleteQuote(quoteId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('quotes')
        .delete()
        .eq('id', quoteId);

      if (error) {
        throw new Error(`Failed to delete quote: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in deleteQuote:', error);
      throw error;
    }
  }

  // Get quote statistics
  static async getQuoteStats(): Promise<{
    total: number;
    draft: number;
    sent: number;
    accepted: number;
    declined: number;
    expired: number;
    totalValue: number;
  }> {
    try {
      const teamId = await getCurrentUserTeamId();
      if (!teamId) {
        throw new Error('User must be part of a team to view quote stats');
      }

      const { data, error } = await supabase
        .from('quotes')
        .select('status, total_price, currency')
        .eq('team_id', teamId);

      if (error) {
        throw new Error(`Failed to fetch quote stats: ${error.message}`);
      }

      const stats = {
        total: 0,
        draft: 0,
        sent: 0,
        accepted: 0,
        declined: 0,
        expired: 0,
        totalValue: 0
      };

      data?.forEach(quote => {
        stats.total++;
        stats[quote.status as keyof typeof stats]++;
        if (quote.total_price) {
          stats.totalValue += quote.total_price;
        }
      });

      return stats;
    } catch (error) {
      console.error('Error in getQuoteStats:', error);
      throw error;
    }
  }

  // Search quotes
  static async searchQuotes(
    searchTerm: string,
    status?: string,
    limit: number = 50,
    offset: number = 0,
    scope: 'team' | 'user' = 'team'
  ): Promise<{ quotes: Quote[]; total: number }> {
    try {
      if (scope === 'user') {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('User must be authenticated to search quotes');
        }

        let query = supabase
          .from('quotes')
          .select(`
            *,
            teams!quotes_team_id_fkey (
              id,
              name,
              logo_url,
              agency_name
            )
          `, { count: 'exact' })
          .eq('user_id', user.id)
          .or(`client_name.ilike.%${searchTerm}%,client_email.ilike.%${searchTerm}%,event_name.ilike.%${searchTerm}%,package_name.ilike.%${searchTerm}%`)
          .order('created_at', { ascending: false });

        if (status) {
          query = query.eq('status', status);
        }

        const { data, error, count } = await query
          .range(offset, offset + limit - 1);

        if (error) {
          throw new Error(`Failed to search user quotes: ${error.message}`);
        }

        const quotes = data?.map(this.mapQuoteFromJson) || [];
        return { quotes, total: count || 0 };
      } else {
        const teamId = await getCurrentUserTeamId();
        if (!teamId) {
          throw new Error('User must be part of a team to search quotes');
        }

        let query = supabase
          .from('quotes')
          .select(`
            *,
            teams!quotes_team_id_fkey (
              id,
              name,
              logo_url,
              agency_name
            )
          `, { count: 'exact' })
          .eq('team_id', teamId)
          .or(`client_name.ilike.%${searchTerm}%,client_email.ilike.%${searchTerm}%,event_name.ilike.%${searchTerm}%,package_name.ilike.%${searchTerm}%`)
          .order('created_at', { ascending: false });

        if (status) {
          query = query.eq('status', status);
        }

        const { data, error, count } = await query
          .range(offset, offset + limit - 1);

        if (error) {
          throw new Error(`Failed to search quotes: ${error.message}`);
        }

        const quotes = data?.map(this.mapQuoteFromJson) || [];
        return { quotes, total: count || 0 };
      }
    } catch (error) {
      console.error('Error in searchQuotes:', error);
      throw error;
    }
  }

  // Map database record to Quote interface
  private static mapQuoteFromJson(data: any): Quote {
    return {
      id: data.id,
      userId: data.user_id,
      clientId: data.client_id,
      teamId: data.team_id,
      consultantId: data.consultant_id,
      team: data.teams ? {
        id: data.teams.id,
        name: data.teams.name,
        logo_url: data.teams.logo_url,
        agency_name: data.teams.agency_name
      } : undefined,
      
      // Client Information
      clientName: data.client_name,
      clientEmail: data.client_email,
      clientPhone: data.client_phone,
      clientAddress: data.client_address,
      
      // Event Information
      eventId: data.event_id,
      eventName: data.event_name,
      eventLocation: data.event_location,
      eventStartDate: data.event_start_date,
      eventEndDate: data.event_end_date,
      
      // Package Information
      packageId: data.package_id,
      packageName: data.package_name,
      packageBaseType: data.package_base_type,
      tierId: data.tier_id,
      tierName: data.tier_name,
      tierDescription: data.tier_description,
      tierPriceOverride: data.tier_price_override,
      
      // Travel Information
      travelers: data.travelers,
      travelersAdults: data.travelers_adults,
      travelersChildren: data.travelers_children,
      travelersTotal: data.travelers_total,
      
      // Pricing Information
      totalPrice: data.total_price,
      currency: data.currency,
      baseCost: data.base_cost,
      
      // Payment Schedule
      paymentDeposit: data.payment_deposit,
      paymentSecondPayment: data.payment_second_payment,
      paymentFinalPayment: data.payment_final_payment,
      paymentDepositDate: data.payment_deposit_date,
      paymentSecondPaymentDate: data.payment_second_payment_date,
      paymentFinalPaymentDate: data.payment_final_payment_date,
      
      // Quote Details
      quoteNumber: data.quote_number,
      quoteReference: data.quote_reference,
      status: data.status,
      version: data.version,
      isRevision: data.is_revision,
      parentQuoteId: data.parent_quote_id,
      
      // Component Data (JSONB)
      selectedComponents: groupComponents(data.selected_components),
      selectedPackage: data.selected_package,
      selectedTier: data.selected_tier,
      priceBreakdown: data.price_breakdown,
      
      // Additional Data
      internalNotes: data.internal_notes,
      
      // Timestamps
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      expiresAt: data.expires_at,
      sentAt: data.sent_at,
      acceptedAt: data.accepted_at,
      declinedAt: data.declined_at,
      expiredAt: data.expired_at
    };
  }

  // Legacy methods for backward compatibility
  static async getQuotes(): Promise<QuoteResponse[]> {
    const { quotes } = await this.getTeamQuotes();
    return quotes.map(quote => ({
      id: quote.id,
      status: quote.status,
      totalPrice: quote.totalPrice || 0,
      currency: quote.currency,
      clientName: quote.clientName,
      clientEmail: quote.clientEmail,
      clientPhone: quote.clientPhone,
      eventName: quote.eventName,
      eventLocation: quote.eventLocation,
      packageName: quote.packageName,
      tierName: quote.tierName,
      travelersAdults: quote.travelersAdults,
      travelersChildren: quote.travelersChildren,
      travelersTotal: quote.travelersTotal,
      paymentDeposit: quote.paymentDeposit,
      paymentSecondPayment: quote.paymentSecondPayment,
      paymentFinalPayment: quote.paymentFinalPayment,
      quoteNumber: quote.quoteNumber,
      quoteReference: quote.quoteReference,
      createdAt: quote.createdAt,
      updatedAt: quote.updatedAt,
      selectedComponents: quote.selectedComponents,
      selectedPackage: quote.selectedPackage,
      selectedTier: quote.selectedTier,
      priceBreakdown: quote.priceBreakdown
    }));
  }

  static async getQuotesByClient(clientId: string): Promise<QuoteResponse[]> {
    const { quotes } = await this.getTeamQuotes();
    return quotes
      .filter(quote => quote.clientId === clientId)
      .map(quote => ({
        id: quote.id,
        status: quote.status,
        totalPrice: quote.totalPrice || 0,
        currency: quote.currency,
        clientName: quote.clientName,
        clientEmail: quote.clientEmail,
        clientPhone: quote.clientPhone,
        eventName: quote.eventName,
        eventLocation: quote.eventLocation,
        packageName: quote.packageName,
        tierName: quote.tierName,
        travelersAdults: quote.travelersAdults,
        travelersChildren: quote.travelersChildren,
        travelersTotal: quote.travelersTotal,
              paymentDeposit: quote.paymentDeposit,
      paymentSecondPayment: quote.paymentSecondPayment,
      paymentFinalPayment: quote.paymentFinalPayment,
      quoteNumber: quote.quoteNumber,
      quoteReference: quote.quoteReference,
      createdAt: quote.createdAt,
        updatedAt: quote.updatedAt,
        selectedComponents: quote.selectedComponents,
        selectedPackage: quote.selectedPackage,
        selectedTier: quote.selectedTier,
        priceBreakdown: quote.priceBreakdown
      }));
  }

  static async confirmQuote(quoteId: string): Promise<string> {
    await this.updateQuoteStatus(quoteId, 'confirmed');
    return quoteId;
  }

  static async createBooking(quoteId: string, bookingData: any): Promise<string> {
    // This would create a booking from a quote
    // Implementation depends on your booking system
    throw new Error('Booking creation not implemented yet');
  }
} 

/**
 * Generates a professional, email-ready quote summary for a client, using clean tables for each section.
 * @param quote Quote object (with selectedComponents grouped)
 * @returns string - ready to copy-paste into an email
 */
export function generateEmailQuote(quote: Quote): string {
  const formatDate = (date?: string) => date ? new Date(date).toLocaleDateString() : '-';
  const formatMoney = (amount?: number, currency?: string) =>
    typeof amount === 'number' ? `${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency || ''}`.trim() : '-';

  // Event details table
  const eventTable = `
| Event         | Location         | Dates                        |
|---------------|------------------|------------------------------|
| ${quote.eventName || '-'} | ${quote.eventLocation || '-'} | ${formatDate(quote.eventStartDate)} to ${formatDate(quote.eventEndDate)} |
`;

  // Package & tier table
  const packageTable = `
| Package       | Tier             | Description                  |
|---------------|------------------|------------------------------|
| ${quote.packageName || '-'} | ${quote.tierName || '-'} | ${quote.tierDescription ? quote.tierDescription.replace(/\n/g, ' ') : '-'} |
`;

  // Components tables
  const comps = quote.selectedComponents || {};
  // Tickets
  const ticketsRows = (comps.tickets || []).map((t: any) =>
    `| ${t.category || t.name || 'Ticket'} | ${t.quantity || 1} | ${formatMoney(t.price, quote.currency)} | ${t.notes || '-'} |`
  );
  const ticketsTable = ticketsRows.length ?
    `| Ticket Type   | Quantity | Price    | Notes         |
|--------------|----------|----------|--------------|
${ticketsRows.join('\n')}` : 'No tickets included.';
  // Hotels
  const hotelsRows = (comps.hotels || []).map((h: any) =>
    `| ${h.hotelName || h.name || 'Hotel'} | ${h.roomType || h.room || '-'} | ${h.nights || '-'} | ${h.checkIn ? formatDate(h.checkIn) : '-'} | ${h.checkOut ? formatDate(h.checkOut) : '-'} | ${formatMoney(h.pricePerNight, quote.currency)} | ${h.notes || '-'} |`
  );
  const hotelsTable = hotelsRows.length ?
    `| Hotel         | Room Type | Nights | Check-in | Check-out | Price/Night | Notes |
|--------------|-----------|--------|----------|-----------|-------------|-------|
${hotelsRows.join('\n')}` : 'No hotel included.';
  // Circuit Transfers
  const circuitRows = (comps.circuitTransfers || []).map((tr: any) =>
    `| Circuit Transfer | ${tr.transferType || tr.type || '-'} | ${tr.notes || '-'} |`
  );
  const circuitTable = circuitRows.length ?
    `| Type             | Transfer Type | Notes |
|------------------|--------------|-------|
${circuitRows.join('\n')}` : '';
  // Airport Transfers
  const airportRows = (comps.airportTransfers || []).map((tr: any) => {
    const directionMultiplier = tr.transferDirection === 'both' ? 2 : 1;
    return `| Airport Transfer | ${tr.transferType || tr.type || '-'} | ${tr.notes || '-'} | ${formatMoney(tr.price, quote.currency)} | ${tr.quantity || 1} | ${formatMoney(tr.price * (tr.quantity || 1) * directionMultiplier, quote.currency)} |`;
  });
  const airportTable = airportRows.length ?
    `| Type             | Transfer Type | Notes | Price/Vehicle | Quantity | Total Price |
|------------------|--------------|-------|---------------|----------|-------------|
${airportRows.join('\n')}` : '';
  // Extras
  const extrasTable = comps.loungePass ?
    `| Extra        | Details |
|--------------|---------|
| Lounge Pass  | ${comps.loungePass.variant || 'Standard'}${comps.loungePass.notes ? ` (${comps.loungePass.notes})` : ''} |` : '';

  // Flights table
  const flightsRows = (comps.flights || []).map((f: any, idx: number) =>
    `| ${idx + 1} | ${f.airline || f.outboundMarketingAirlineName || '-'} | ${f.flightNumber || f.outboundFlightNumber || '-'} | ${f.origin || f.outboundDepartureAirportName || '-'} | ${f.destination || f.outboundArrivalAirportName || '-'} | ${formatDate(f.departureDate || f.outboundDepartureDateTime)} | ${formatDate(f.arrivalDate || f.outboundArrivalDateTime)} | ${f.cabin || f.outboundCabinName || '-'} | ${f.stops || f.outboundStops || 0} | ${f.baggageAllowance || f.outboundBaggageAllowance || '-'} |`
  );
  const flightsTable = flightsRows.length ?
    `| # | Airline | Flight # | From | To | Departure | Arrival | Class | Stops | Baggage |
|---|---------|----------|------|----|-----------|--------|-------|-------|---------|
${flightsRows.join('\n')}` : 'No flights included.';

  // Payment schedule table
  const paymentRows = [
    { label: 'Deposit', amount: quote.paymentDeposit, date: quote.paymentDepositDate },
    { label: 'Second Payment', amount: quote.paymentSecondPayment, date: quote.paymentSecondPaymentDate },
    { label: 'Final Payment', amount: quote.paymentFinalPayment, date: quote.paymentFinalPaymentDate },
  ].filter(row => row.amount && row.amount > 0);
  const paymentTable = paymentRows.length
    ? `| Payment Stage   | Amount         | Due Date         |\n|----------------|---------------|------------------|\n${paymentRows.map(row => `| ${row.label.padEnd(14)}| ${formatMoney(row.amount, quote.currency).padEnd(13)} | ${formatDate(row.date).padEnd(16)} |`).join('\n')}`
    : 'No payment schedule.';

  // Total price
  const totalPrice = formatMoney(quote.totalPrice, quote.currency);

  // Compose email
  return `Dear ${quote.clientName || 'Client'},\n\nThank you for your interest in our event packages. Please find your personalized quote below.\n\n---\n\n**Event Details**\n${eventTable}\n\n**Package & Tier**\n${packageTable}\n\n**Tickets**\n${ticketsTable}\n\n**Hotel**\n${hotelsTable}\n\n${circuitTable ? `**Circuit Transfers**\n${circuitTable}\n` : ''}${airportTable ? `**Airport Transfers**\n${airportTable}\n` : ''}${extrasTable ? `**Extras**\n${extrasTable}\n` : ''}\n**Flights**\n${flightsTable}\n\n**Payment Schedule**\n${paymentTable}\n\n**Total Price:** ${totalPrice}\n\n---\n\nIf you have any questions or would like to make adjustments, please let us know. We look forward to helping you create an unforgettable experience!\n\nBest regards,\n[Your Name/Company]\n[Contact Information]\n`;
} 

/**
 * Generates a professional, PDF-style HTML email-ready quote summary for a client.
 * All non-flight components are combined into a single 'Included in the Package' table.
 * No component prices are shown. Matches the PDF's look and feel.
 * @param quote Quote object (with selectedComponents grouped)
 * @returns string - HTML ready to copy-paste into an email
 */
export function generateHtmlEmailQuote(quote: Quote): string {
  const formatDate = (date?: string) => date ? new Date(date).toLocaleDateString() : '-';
  const fontFamily = 'font-family:Helvetica,Arial,sans-serif;';
  const sectionTitleStyle = 'font-size:16px;font-weight:bold;color:#CF212A;border-bottom:2px solid #CF212A;padding-bottom:4px;margin-bottom:10px;margin-top:24px;'+fontFamily;
  const infoTableStyle = 'width:100%;border-collapse:collapse;margin-bottom:10px;'+fontFamily;
  const infoLabelStyle = 'font-weight:bold;color:#374151;padding:4px 8px;width:120px;background:#f9fafb;font-size:13px;';
  const infoValueStyle = 'color:#111827;padding:4px 8px;font-size:13px;';
  const tableStyle = 'border-collapse:collapse;margin-bottom:14px;width:100%;'+fontFamily+'font-size:13px;';
  const thStyle = 'background:#CF212A;color:#fff;border:1px solid #e0e0e0;padding:6px 8px;text-align:left;font-weight:600;';
  const tdStyle = 'border:1px solid #e0e0e0;padding:6px 8px;background:#fff;color:#222;';
  const totalBoxStyle = 'margin-top:18px;padding:12px 16px;background:#f8fafc;border-radius:6px;border:1px solid #e5e7eb;display:inline-block;'+fontFamily;
  const totalLabelStyle = 'font-size:15px;font-weight:bold;color:#374151;';
  const totalAmountStyle = 'font-size:20px;font-weight:bold;color:#CF212A;';
  const paymentRedStyle = 'color:#CF212A;font-weight:bold;';


  // Event Info Table
  const eventTable = `
<table style="${infoTableStyle}">
  <tr><td style="${infoLabelStyle}">Event:</td><td style="${infoValueStyle}">${quote.eventName || '-'}</td></tr>
  <tr><td style="${infoLabelStyle}">Location:</td><td style="${infoValueStyle}">${quote.eventLocation || '-'}</td></tr>
  <tr><td style="${infoLabelStyle}">Dates:</td><td style="${infoValueStyle}">${formatDate(quote.eventStartDate)} to ${formatDate(quote.eventEndDate)}</td></tr>
</table>`;

  // Package Info Table
  const packageTable = `
<table style="${infoTableStyle}">
  <tr><td style="${infoLabelStyle}">Package:</td><td style="${infoValueStyle}">${quote.packageName || '-'}</td></tr>
  <tr><td style="${infoLabelStyle}">Tier:</td><td style="${infoValueStyle}">${quote.tierName || '-'}</td></tr>
  
</table>`;

  // Combine all non-flight components into a single table
  const comps = quote.selectedComponents || {};
  const allComponents: any[] = [
    ...(comps.tickets || []),
    ...(comps.hotels || []),
    ...(comps.circuitTransfers ? comps.circuitTransfers.map((c: any) => ({ ...c, _forceType: 'Circuit Transfer' })) : []),
    ...(comps.airportTransfers ? comps.airportTransfers.map((c: any) => ({ ...c, _forceType: 'Airport Transfer' })) : []),
    ...(comps.loungePass ? [comps.loungePass] : []),
  ];
  // Helper to extract info for each component
  const extractComponent = (c: any) => {
    // Prefer .data for transfer details if present
    const d = c.data || c;
    if (c._forceType === 'Circuit Transfer') {
      // Use database field names that match the Components tab
      const type = d.transfer_type || d.transferType || d.type || '-';
      const days = d.days || d.number_of_days || d.duration;
      const supplier = d.supplier || 'TBD';
      
      let details = type;
      // Convert database format to readable text (e.g., 'hotel_chauffeur' -> 'Hotel Chauffeur')
      if (details !== '-') {
        details = details.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
      }
      if (days) details += `, ${days} day${days > 1 ? 's' : ''}`;

      
      return {
        type: 'Circuit Transfer',
        details,
        quantity: d.quantity || 1,
        
      };
    }
    if (c._forceType === 'Airport Transfer') {
      // Use database field names that match the Components tab
      const type = d.transport_type || d.transferType || d.type || '-';
      const supplier = d.supplier || 'TBD';
      let details = type;
      // Convert database format to readable text (e.g., 'hotel_chauffeur' -> 'Hotel Chauffeur')
      if (details !== '-') {
        details = details.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
      }
      if (supplier && supplier !== 'TBD') details += ` (${supplier})`;
      // Add transfer direction info
      const directionLabel = d.transferDirection === 'both'
        ? 'both ways (outbound & return)'
        : d.transferDirection || '-';
      details += ` — ${d.quantity || 1} vehicle${(d.quantity || 1) > 1 ? 's' : ''} ${directionLabel}`;
      return {
        type: 'Airport Transfer',
        details,
        quantity: d.quantity || 1,
      };
    }
    if (c.category || c.name) {
      return {
        type: c.category ? 'Ticket' : (c.name || 'Component'),
        details: c.category || c.name || '-',
        quantity: c.quantity || 1,
        
      };
    }
    if (c.hotelName || c.roomType || c.room) {
      const formatDate = (date?: string) => date ? new Date(date).toLocaleDateString() : '';
      const checkIn = formatDate(c.checkIn);
      const checkOut = formatDate(c.checkOut);
      let details = `${c.hotelName || c.name || '-'}${c.roomType ? ', ' + c.roomType : c.room ? ', ' + c.room : ''}`;
      if (checkIn && checkOut) {
        details += ` (${checkIn} - ${checkOut})`;
      }
      
      return {
        type: 'Hotel',
        details,
        quantity: c.nights || c.quantity || 1,
        
      };
    }
    if (c.variant && c.variant.toLowerCase().includes('lounge')) {
      return {
        type: 'Lounge Pass',
        details: c.variant,
        quantity: c.quantity || 1,
       
      };
    }
    return {
      type: c.type || 'Component',
      details: c.name || '-',
      quantity: c.quantity || 1,
    };
  };
  // Filter out flights
  const nonFlightComponents = allComponents.filter(c => c && c.type !== 'flight');
  const componentsRows = nonFlightComponents.map((c, i) => {
    const info = extractComponent(c);
    return `<tr${i%2===1?` style=\"background:#f9fafb;\"`:''}><td style=\"${tdStyle}\">${info.type}</td><td style=\"${tdStyle}\">${info.details}</td><td style=\"${tdStyle}\">${info.quantity}</td></tr>`;
  }).join('');
  const componentsTable = componentsRows ?
    `<div style=\"${sectionTitleStyle}\">Included in the Package</div><table style=\"${tableStyle}\"><tr><th style=\"${thStyle}\">Component</th><th style=\"${thStyle}\">Details</th><th style=\"${thStyle}\">Quantity</th></tr>${componentsRows}</table>` : '';

  // Flights Table (no prices)
  const formatDateTime = (dt?: string) => dt ? new Date(dt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : 'N/A';
  const getBaggage = (seg: any, flightData: any) => seg?.BaggageAllowance?.NumberOfPieces || seg?.baggageAllowance?.NumberOfPieces || flightData.baggageAllowance?.NumberOfPieces || 'N/A';
  
  // Currency code mapping function
  const getCurrencySymbol = (code: any) => {
    if (!code) return '£';
    const codeStr = String(code).toUpperCase();
    
    // Handle numeric currency codes and return symbols
    const currencyMap: { [key: string]: string } = {
      '826': '£', // British Pound
      '840': '$', // US Dollar
      '978': '€', // Euro
      '036': 'A$', // Australian Dollar
      '124': 'C$', // Canadian Dollar
      '756': 'CHF', // Swiss Franc
      '392': '¥', // Japanese Yen
      '156': '¥', // Chinese Yuan
      '356': '₹', // Indian Rupee
      '554': 'NZ$', // New Zealand Dollar
      '710': 'R', // South African Rand
      '986': 'R$', // Brazilian Real
      '484': '$', // Mexican Peso
      '032': '$', // Argentine Peso
      '152': '$', // Chilean Peso
      '604': 'S/', // Peruvian Sol
      '858': '$', // Uruguayan Peso
      '862': 'Bs', // Venezuelan Bolivar
      '188': '₡', // Costa Rican Colon
      '320': 'Q', // Guatemalan Quetzal
      '340': 'L', // Honduran Lempira
      '558': 'C$', // Nicaraguan Cordoba
      '590': 'B/.', // Panamanian Balboa
      '600': '₲', // Paraguayan Guarani
      '222': '₡', // Salvadoran Colon
    };
    
    // If it's a numeric code, map it to symbol
    if (currencyMap[codeStr]) {
      return currencyMap[codeStr];
    }
    
    // If it's already a 3-letter code, map to symbol
    const symbolMap: { [key: string]: string } = {
      'GBP': '£',
      'USD': '$',
      'EUR': '€',
      'AUD': 'A$',
      'CAD': 'C$',
      'CHF': 'CHF',
      'JPY': '¥',
      'CNY': '¥',
      'INR': '₹',
      'NZD': 'NZ$',
      'ZAR': 'R',
      'BRL': 'R$',
      'MXN': '$',
      'ARS': '$',
      'CLP': '$',
      'PEN': 'S/',
      'UYU': '$',
      'VEF': 'Bs',
      'CRC': '₡',
      'GTQ': 'Q',
      'HNL': 'L',
      'NIO': 'C$',
      'PAB': 'B/.',
      'PYG': '₲',
      'SVC': '₡',
    };
    
    if (symbolMap[codeStr]) {
      return symbolMap[codeStr];
    }
    
    // Default to £
    return '£';
  };
  
  const flightsTable = (comps.flights || []).map((f: any, idx: number) => {
    const flightData = f.data || f;
    const outboundSegments = flightData.outboundFlightSegments || (flightData.outboundFlight ? [flightData.outboundFlight] : []);
    const returnSegments = flightData.returnFlightSegments || (flightData.inboundFlight ? [flightData.inboundFlight] : []);
    const passengers = flightData.passengers || flightData.Passengers || flightData.recommendation?.Passengers?.length || 'N/A';
    const totalPrice = flightData.total || flightData.totalFare || flightData.price || (flightData.recommendation?.Total) || 'N/A';
    const currencySymbol = getCurrencySymbol(flightData.currencyCode || flightData.currencyId || 'GBP');
    let displayPrice = totalPrice;
    if (typeof displayPrice === 'string') displayPrice = displayPrice.replace(/[^\d.,-]/g, '');
    
    // Helper to get shared info from first segment
    const getSharedInfo = (segments: any[]) => {
      const seg = segments[0] || {};
      return {
        airline: seg.marketingAirlineName || seg.operatingAirlineName || flightData.airline || 'N/A',
        class: seg.cabin || seg.CabinId || flightData.cabin || 'N/A',
        baggage: getBaggage(seg, flightData),
      };
    };
    
    // Helper to render segment table rows
    const renderSegmentRows = (segments: any[]) => {
      return segments.map((seg: any, i: number) => 
        `<tr${i%2===1?` style=\"background:#f9fafb;\"`:''}>
          <td style=\"${tdStyle}\">${seg.departureAirportName || seg.DepartureAirportName || 'N/A'} (${seg.departureAirportId || 'N/A'})</td>
          <td style=\"${tdStyle}\">${seg.arrivalAirportName || seg.ArrivalAirportName || 'N/A'} (${seg.arrivalAirportId || 'N/A'})</td>
          <td style=\"${tdStyle}\">${formatDateTime(seg.departureDateTime)}</td>
          <td style=\"${tdStyle}\">${formatDateTime(seg.arrivalDateTime)}</td>
          <td style=\"${tdStyle}\">${seg.flightDuration || 'N/A'}</td>
        </tr>`
      ).join('');
    };
    
    // Outbound flight section
    const outboundInfo = getSharedInfo(outboundSegments);
    const outboundSection = outboundSegments.length > 0 ? `
      <div style=\"margin-bottom:16px;\">
        <div style=\"background:#f8fafc;border-radius:4px;padding:6px;margin-bottom:4px;font-size:13px;${fontFamily}\">
          <span style=\"font-weight:bold;margin-right:12px;\">Airline</span>
          <span style=\"margin-right:24px;\">${outboundInfo.airline}</span>
          <span style=\"font-weight:bold;margin-right:12px;\">Class</span>
          <span style=\"margin-right:24px;\">${outboundInfo.class}</span>
          <span style=\"font-weight:bold;margin-right:12px;\">Baggage</span>
          <span>${outboundInfo.baggage}</span>
        </div>
        <table style=\"${tableStyle}\">
          <tr><th style=\"${thStyle}\">From</th><th style=\"${thStyle}\">To</th><th style=\"${thStyle}\">Departure</th><th style=\"${thStyle}\">Arrival</th><th style=\"${thStyle}\">Duration</th></tr>
          ${renderSegmentRows(outboundSegments)}
        </table>
      </div>
    ` : '<p style=\"margin-left:10px;font-size:13px;\">N/A</p>';
    
    // Return flight section
    const returnInfo = getSharedInfo(returnSegments);
    const returnSection = returnSegments.length > 0 ? `
      <div style=\"margin-bottom:16px;\">
        <div style=\"background:#f8fafc;border-radius:4px;padding:6px;margin-bottom:4px;font-size:13px;${fontFamily}\">
          <span style=\"font-weight:bold;margin-right:12px;\">Airline</span>
          <span style=\"margin-right:24px;\">${returnInfo.airline}</span>
          <span style=\"font-weight:bold;margin-right:12px;\">Class</span>
          <span style=\"margin-right:24px;\">${returnInfo.class}</span>
          <span style=\"font-weight:bold;margin-right:12px;\">Baggage</span>
          <span>${returnInfo.baggage}</span>
        </div>
        <table style=\"${tableStyle}\">
          <tr><th style=\"${thStyle}\">From</th><th style=\"${thStyle}\">To</th><th style=\"${thStyle}\">Departure</th><th style=\"${thStyle}\">Arrival</th><th style=\"${thStyle}\">Duration</th></tr>
          ${renderSegmentRows(returnSegments)}
        </table>
      </div>
    ` : '<p style=\"margin-left:10px;font-size:13px;\">N/A</p>';
    
    // Summary section
    const summarySection = `
      <div style=\"margin-top:14px;border-top:1px solid #eee;padding-top:8px;font-size:13px;${fontFamily}\">
        <div style=\"display:flex;justify-content:space-between;margin-bottom:2px;\">
          <span style=\"font-weight:bold;\">Passengers</span>
          <span>${passengers}</span>
        </div>
        <div style=\"display:flex;justify-content:space-between;\">
          <span style=\"font-weight:bold;\">Total Price</span>
          <span>${currencySymbol}${displayPrice} per person</span>
        </div>
      </div>
    `;
    
    return `
      <div style=\"margin-bottom:24px;\">
        <div style=\"${sectionTitleStyle}\">Flight ${idx + 1}</div>
        <div style=\"margin-bottom:8px;font-size:14px;font-weight:bold;color:#22223b;${fontFamily}\">Outbound Flight</div>
        ${outboundSection}
        <div style=\"margin-top:8px;margin-bottom:8px;font-size:14px;font-weight:bold;color:#22223b;${fontFamily}\">Return Flight</div>
        ${returnSection}
        ${summarySection}
      </div>
    `;
  }).join('');
  
  const flightsSection = flightsTable ? `<div style=\"${sectionTitleStyle}\">Flights</div>${flightsTable}` : '';

  // Payment schedule table (keep prices here)
  const formatMoney = (amount?: number, currency?: string) =>
    typeof amount === 'number' ? `${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency || ''}`.trim() : '-';
  const paymentRows = [
    { label: 'Deposit', amount: quote.paymentDeposit, date: 'Upon Acceptance' },
    { label: 'Second Payment', amount: quote.paymentSecondPayment, date: quote.paymentSecondPaymentDate },
    { label: 'Final Payment', amount: quote.paymentFinalPayment, date: quote.paymentFinalPaymentDate },
  ].filter(row => row.amount && row.amount > 0);
  const paymentTable = paymentRows.length
    ? `<div style=\"${sectionTitleStyle}\">Payment Schedule</div><table style=\"${tableStyle}\"><tr><th style=\"${thStyle}\">Payment Stage</th><th style=\"${thStyle}\">Amount</th><th style=\"${thStyle}\">Due Date</th></tr>${paymentRows.map((row, i) => `<tr${i%2===1?` style=\\\"background:#f9fafb;\\\"`:''}><td style=\"${tdStyle}\">${row.label}</td><td style=\"${tdStyle+paymentRedStyle}\">${formatMoney(row.amount, quote.currency)}</td><td style=\"${tdStyle}\">${formatDate(row.date)}</td></tr>`).join('')}</table>`
    : '';

  // Total price
  const totalPrice = formatMoney(quote.totalPrice, quote.currency);
  const totalBox = `<div style=\"${totalBoxStyle}\"><span style=\"${totalLabelStyle}\">Total Price:</span> <span style=\"${totalAmountStyle}\">${totalPrice}</span></div>`;

  // Compose HTML email
  return `
<div> <div style=\"${sectionTitleStyle}\">Event Information</div>${eventTable}</div>
<div> <div style=\"${sectionTitleStyle}\">Package Details</div>${packageTable}</div>
${componentsTable}
${flightsSection}
${paymentTable}
${totalBox}
`;
} 