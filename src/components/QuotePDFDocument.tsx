import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  pdf,
  Image,
} from '@react-pdf/renderer';

// Register fonts for better typography
Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/helveticaneue/v70/1Ptsg8zYS_SKggPNyC0IT4ttDfA.ttf', fontWeight: 'normal' },
    { src: 'https://fonts.gstatic.com/s/helveticaneue/v70/1Ptsg8zYS_SKggPNyC0IT4ttDfB.ttf', fontWeight: 'bold' },
  ],
});

// Create styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 20,
    fontFamily: 'Helvetica',
  },
  
  // Header styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    borderBottom: '1 solid #CF212A',
    paddingBottom: 8,
  },
  companyInfo: {
    flexDirection: 'column',
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#CF212A',
    marginBottom: 2,
  },
  companyLogo: {
    width: 'auto',
    height: 40,
    marginBottom: 2,
  },
  companyTagline: {
    fontSize: 8,
    color: '#6b7280',
  },
  quoteInfo: {
    alignItems: 'flex-end',
  },
  quoteNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  quoteDate: {
    fontSize: 8,
    color: '#6b7280',
  },
  
  // Section styles
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#CF212A',
    marginBottom: 6,
    borderBottom: '0.5 solid #e5e7eb',
    paddingBottom: 2,
  },
  sectionSubtitle: {
    fontWeight: 'bold',
    fontSize: 8,
    color: '#22223b',
    marginBottom: 4,
  },
  
  // Two column layout
  twoColumn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  column: {
    width: '48%',
  },
  
  // Info row styles
  infoRow: {
    flexDirection: 'row',
    marginBottom: 4,
    alignItems: 'center',
  },
  label: {
    fontSize: 8,
    fontWeight: 'bold',
    width: 60,
    color: '#374151',
  },
  value: {
    fontSize: 8,
    flex: 1,
    color: '#111827',
  },
  
  // Table styles
  table: {
    marginTop: 10,
    border: '1 solid #e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#CF212A',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableHeaderCell: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderBottom: '0.5 solid #f3f4f6',
  },
  tableRowAlt: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 8,
    backgroundColor: '#f9fafb',
    borderBottom: '0.5 solid #f3f4f6',
  },
  tableCell: {
    fontSize: 8,
    color: '#374151',
  },
  
  // Payment schedule styles
  paymentSection: {
    marginTop: 20,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#ffffff',
    marginBottom: 4,
    borderRadius: 3,
    border: '0.5 solid #e5e7eb',
  },
  paymentLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#374151',
    width: '35%',
  },
  paymentAmount: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#CF212A',
    width: '35%',
    textAlign: 'right',
  },
  paymentDate: {
    fontSize: 8,
    color: '#6b7280',
    width: '30%',
    textAlign: 'right',
  },
  
  // Total price styles
  totalSection: {
    marginTop: 20,
    padding: 8,
    backgroundColor: '#f8fafc',
    borderRadius: 4,
    border: '0.5 solid #e5e7eb',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#374151',
  },
  totalAmount: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#CF212A',
  },
  
  // Footer styles
  footer: {
    position: 'absolute',
    bottom: 15,
    left: 20,
    right: 20,
    borderTop: '0.5 solid #e5e7eb',
    paddingTop: 8,
  },
  footerText: {
    fontSize: 6,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 2,
  },
  pageNumber: {
    fontSize: 6,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 2,
  },
  
  // Travelers list styles
  travelersList: {
    marginTop: 6,
  },
  travelerItem: {
    flexDirection: 'row',
    paddingVertical: 2,
    paddingHorizontal: 6,
    backgroundColor: '#f9fafb',
    marginBottom: 2,
    borderRadius: 2,
  },
  travelerNumber: {
    fontSize: 7,
    fontWeight: 'bold',
    color: '#CF212A',
    width: 15,
  },
  travelerName: {
    fontSize: 7,
    color: '#111827',
    flex: 1,
  },
  travelerType: {
    fontSize: 6,
    color: '#6b7280',
    fontStyle: 'italic',
  },
});

interface QuoteData {
  quote_number?: string;
  created_at?: string;
  status?: string;
  client_name?: string;
  client_email?: string;
  client_phone?: string;
  event_name?: string;
  event_location?: string;
  event_start_date?: string;
  event_end_date?: string;
  package_name?: string;
  tier_name?: string;
  travelers?: any[];
  travelers_total?: number;
  total_price?: number;
  currency?: string;
  payment_deposit?: number;
  payment_second_payment?: number;
  payment_final_payment?: number;
  payment_deposit_date?: string;
  payment_second_payment_date?: string;
  payment_final_payment_date?: string;
  selected_components?: any[];
  team?: {
    id: string;
    name: string;
    logo_url?: string;
    agency_name?: string;
  };
}

interface QuotePDFDocumentProps {
  quoteData: QuoteData;
}

// Helper function to extract component information
const extractComponentInfo = (component: any) => {
  if (!component) return { name: 'N/A', details: 'N/A', quantity: 1 };
  
  // Handle tickets
  if (component.ticket_category_id || component.category) {
    return {
      name: 'Event Ticket',
      details: component.category || component.ticket_category_name || 'General Admission',
      quantity: component.quantity || 1
    };
  }
  
  // Handle hotels
  if (component.hotel_id || component.hotelName || component.hotel_name) {
    return {
      name: 'Hotel Accommodation',
      details: component.hotelName || component.hotel_name || component.hotelName || 'Hotel Room',
      quantity: component.quantity || component.room_quantity || 1
    };
  }
  
  // Handle flights
  if (component.outbound_flight_number || component.flight_number) {
    const departure = component.outbound_departure_airport_code || component.departure_airport || 'N/A';
    const arrival = component.outbound_arrival_airport_code || component.arrival_airport || 'N/A';
    return {
      name: 'Flight',
      details: `${departure} → ${arrival}`,
      quantity: component.quantity || 1
    };
  }
  
  // Handle circuit transfers - check multiple possible properties
  if (component.transfer_type || component.type === 'circuit_transfer' || 
      component.component_type === 'circuit_transfer' || 
      component.transferType || component.transfer_type_id) {
    const transferType = component.transfer_type?.toLowerCase().replace(/\b\w/g, (l: string) => l.toUpperCase()) || 
                        component.transferType?.toLowerCase().replace(/\b\w/g, (l: string) => l.toUpperCase()) || 
                        'Coach';
    const days = component.days || component.number_of_days || component.duration || 1;
    return {
      name: 'Circuit Transfer',
      details: `${transferType} - ${days} day(s)`,
      quantity: component.quantity || component.used || component.capacity || 1
    };
  }
  
  // Handle airport transfers - check multiple possible properties
  if (component.transport_type || component.type === 'airport_transfer' || 
      component.component_type === 'airport_transfer' || 
      component.transportType || component.transport_type_id) {
    const transportType = component.transport_type?.replace('_', ' ').toLowerCase().replace(/\b\w/g, (l: string) => l.toUpperCase()) || 
                         component.transportType?.replace('_', ' ').toLowerCase().replace(/\b\w/g, (l: string) => l.toUpperCase()) || 
                         'Hotel Chauffeur';
    const direction = component.transferDirection ? ` (${component.transferDirection})` : '';
    return {
      name: 'Airport Transfer',
      details: `${transportType}${direction}`,
      quantity: component.quantity || component.used || component.capacity || 1
    };
  }
  
  // Handle lounge passes
  if (component.variant && component.variant.includes('Lounge')) {
    return {
      name: 'Lounge Access',
      details: component.variant,
      quantity: component.quantity || 1
    };
  }
  
  // Handle generic components with name
  if (component.name) {
    return {
      name: component.name,
      details: component.description || component.details || 'Service Included',
      quantity: component.quantity || 1
    };
  }
  
  // Handle components with component_type
  if (component.component_type) {
    return {
      name: component.component_type.replace('_', ' ').toUpperCase(),
      details: component.description || component.details || 'Service Included',
      quantity: component.quantity || 1
    };
  }
  
  // Default fallback
  return {
    name: 'Component',
    details: 'Service Included',
    quantity: component.quantity || 1
  };
};

// Enhanced extractFlightInfo to show as many details as possible
const extractFlightInfo = (component: any) => {
  if (!component) return {
    route: 'N/A',
    airline: 'N/A',
    flightNumbers: 'N/A',
    departure: 'N/A',
    returnDate: 'N/A',
    class: 'N/A',
    passengers: 'N/A',
    totalPrice: 'N/A',
    currency: 'N/A',
    fareType: 'N/A',
    baggage: 'N/A',
    aircraft: 'N/A',
    refundable: 'N/A',
    layovers: 'N/A',
    details: '',
  };
  const flightData = component.data || component;
  const origin = flightData.originAirport || flightData.origin || component.originAirport || component.origin || 'N/A';
  const destination = flightData.destinationAirport || flightData.destination || component.destinationAirport || component.destination || 'N/A';
  const route = `${origin} → ${destination}`;
  const airline = flightData.airline || component.airline || flightData.validatingAirlineName || 'N/A';
  // Flight numbers: try to get all segments
  let flightNumbers = [];
  if (flightData.outboundFlightNumber) flightNumbers.push(flightData.outboundFlightNumber);
  if (flightData.inboundFlightNumber) flightNumbers.push(flightData.inboundFlightNumber);
  if (flightData.flightNumber) flightNumbers.push(flightData.flightNumber);
  if (flightData.outboundFlightSegments && Array.isArray(flightData.outboundFlightSegments)) {
    flightNumbers.push(...flightData.outboundFlightSegments.map((seg: any) => seg.flightNumber || '').filter(Boolean));
  }
  if (flightData.returnFlightSegments && Array.isArray(flightData.returnFlightSegments)) {
    flightNumbers.push(...flightData.returnFlightSegments.map((seg: any) => seg.flightNumber || '').filter(Boolean));
  }
  if (flightNumbers.length === 0) flightNumbers.push('N/A');
  // Departure/return
  let departure = 'N/A';
  if (flightData.departureDate) {
    departure = new Date(flightData.departureDate).toLocaleString();
  } else if (flightData.outboundDepartureDateTime) {
    departure = new Date(flightData.outboundDepartureDateTime).toLocaleString();
  }
  let returnDate = 'N/A';
  if (flightData.returnDate) {
    returnDate = new Date(flightData.returnDate).toLocaleString();
  } else if (flightData.inboundDepartureDateTime) {
    returnDate = new Date(flightData.inboundDepartureDateTime).toLocaleString();
  }
  // Class/cabin
  const flightClass = flightData.cabin || flightData.class || flightData.cabinClass || component.cabin || component.class || component.cabinClass || 'N/A';
  // Passengers
  const passengers = flightData.passengers || component.passengers || flightData.quantity || component.quantity || 'N/A';
  // Price
  const totalPrice = (typeof flightData.total === 'number' && !isNaN(flightData.total) && flightData.total > 0)
    ? flightData.total
    : (typeof flightData.price === 'number' && !isNaN(flightData.price) && flightData.price > 0)
      ? flightData.price
      : 'N/A';
  const currency = flightData.currency || flightData.currencyId || flightData.currencyCode || flightData.currencySymbol || 'N/A';
  // Fare type
  const fareType = flightData.fareTypeName || flightData.fareTypeId || (flightData.fareType && (flightData.fareType.FareTypeName || flightData.fareType.FareTypeId)) || 'N/A';
  // Baggage
  let baggage = 'N/A';
  if (flightData.baggageAllowance && typeof flightData.baggageAllowance === 'object') {
    if (flightData.baggageAllowance.NumberOfPieces) baggage = `${flightData.baggageAllowance.NumberOfPieces} pcs`;
  } else if (flightData.baggageAllowance) {
    baggage = String(flightData.baggageAllowance);
  }
  // Aircraft
  let aircraft = [];
  if (flightData.outboundAircraftType) aircraft.push(flightData.outboundAircraftType);
  if (flightData.inboundAircraftType) aircraft.push(flightData.inboundAircraftType);
  if (flightData.outboundFlightSegments && Array.isArray(flightData.outboundFlightSegments)) {
    aircraft.push(...flightData.outboundFlightSegments.map((seg: any) => seg.aircraftType || '').filter(Boolean));
  }
  if (flightData.returnFlightSegments && Array.isArray(flightData.returnFlightSegments)) {
    aircraft.push(...flightData.returnFlightSegments.map((seg: any) => seg.aircraftType || '').filter(Boolean));
  }
  if (aircraft.length === 0) aircraft.push('N/A');
  // Refundable
  const refundable = typeof flightData.refundable === 'boolean' ? (flightData.refundable ? 'Yes' : 'No') : 'N/A';
  // Layovers
  let layovers = [];
  if (flightData.outboundLayoverInfo && Array.isArray(flightData.outboundLayoverInfo)) {
    layovers.push(...flightData.outboundLayoverInfo.map((l: any) => `${l.airport || l.airportCode || ''} (${l.duration || ''})`).filter(Boolean));
  }
  if (flightData.inboundLayoverInfo && Array.isArray(flightData.inboundLayoverInfo)) {
    layovers.push(...flightData.inboundLayoverInfo.map((l: any) => `${l.airport || l.airportCode || ''} (${l.duration || ''})`).filter(Boolean));
  }
  // Details block (for multi-line cell)
  let details = '';
  if (fareType !== 'N/A') details += `Fare: ${fareType}\n`;
  if (baggage !== 'N/A') details += `Baggage: ${baggage}\n`;
  if (aircraft.length && aircraft[0] !== 'N/A') details += `Aircraft: ${aircraft.join(', ')}\n`;
  if (layovers.length) details += `Layovers: ${layovers.join(', ')}\n`;
  if (refundable !== 'N/A') details += `Refundable: ${refundable}\n`;
  // Add any other interesting fields
  if (flightData.skytraxRating) details += `Skytrax: ${flightData.skytraxRating}\n`;
  if (flightData.isCorporate) details += `Corporate Fare\n`;
  if (flightData.isPremium) details += `Premium Fare\n`;
  if (flightData.isBaggageOnly) details += `Baggage Only\n`;
  if (flightData.isSemiDeferred) details += `Semi-Deferred\n`;
  return {
    route,
    airline,
    flightNumbers: flightNumbers.join(', '),
    departure,
    returnDate,
    class: flightClass,
    passengers,
    totalPrice,
    currency,
    fareType,
    baggage,
    aircraft: aircraft.join(', '),
    refundable,
    layovers: layovers.join(', '),
    details: details.trim(),
  };
};

// Helper function to robustly detect if a component is a flight
const isFlightComponent = (component: any) => {
  if (!component || typeof component !== 'object') return false;
  // Check top-level type
  if (component.type === 'flight') return true;
  // Check top-level flight-like properties
  if (component.origin || component.destination || component.originAirport || component.destinationAirport) return true;
  // Check nested data object for flight-like properties
  const data = component.data || {};
  if (
    data.type === 'flight' ||
    data.origin || data.destination ||
    data.originAirport || data.destinationAirport ||
    data.airline || data.flightNumber || data.cabin || data.class || data.cabinClass
  ) {
    return true;
  }
  return false;
};

const QuotePDFDocument: React.FC<QuotePDFDocumentProps> = ({ quoteData }) => {
  // Debug: Log team data to see what's being received
  console.log('PDF Team Data:', {
    team: quoteData.team,
    logo_url: quoteData.team?.logo_url,
    logo_url_type: quoteData.team?.logo_url ? (quoteData.team.logo_url.startsWith('data:') ? 'base64' : 'url') : 'none',
    agency_name: quoteData.team?.agency_name,
    name: quoteData.team?.name
  });
  
  // Debug: Log all components to see what's available
  console.log('PDF Components:', quoteData.selected_components);
  if (quoteData.selected_components) {
    quoteData.selected_components.forEach((component: any, index: number) => {
      console.log(`Component ${index}:`, {
        type: component.type,
        originAirport: component.originAirport,
        destinationAirport: component.destinationAirport,
        name: component.name,
        data: component.data
      });
    });
  }
  
  return (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.companyInfo}>
          {quoteData.team?.logo_url ? (
            <Image 
              src={quoteData.team.logo_url} 
              style={styles.companyLogo}
            />
          ) : (
            <Text style={styles.companyName}>
              {quoteData.team?.agency_name || quoteData.team?.name || 'GPGT TRAVEL'}
            </Text>
          )}
        </View>
        <View style={styles.quoteInfo}>
          <Text style={styles.quoteNumber}>Quote #{quoteData.quote_number || 'N/A'}</Text>
          <Text style={styles.quoteDate}>
            {quoteData.created_at ? new Date(quoteData.created_at).toLocaleDateString() : 'N/A'}
          </Text>
        </View>
      </View>

      {/* Client and Event Information */}
      <View style={styles.twoColumn}>
        <View style={styles.column}>
          <Text style={styles.sectionTitle}>CLIENT INFORMATION</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Name:</Text>
            <Text style={styles.value}>{quoteData.client_name || 'N/A'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Email:</Text>
            <Text style={styles.value}>{quoteData.client_email || 'N/A'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Phone:</Text>
            <Text style={styles.value}>{quoteData.client_phone || 'N/A'}</Text>
          </View>
        </View>

        {/* Travelers */}
      <View style={styles.column}>
        <Text style={styles.sectionTitle}>TRAVELERS</Text>
        <Text style={styles.value}>Total Travelers: {quoteData.travelers_total || 0}</Text>
      </View>

        
          
        </View>

      {/* Package Details */}
      <View style={styles.twoColumn}>
      <View style={styles.column}>
        <Text style={styles.sectionTitle}>EVENT INFORMATION</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Event:</Text>
            <Text style={styles.value}>{quoteData.event_name || 'N/A'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Location:</Text>
            <Text style={styles.value}>{quoteData.event_location || 'N/A'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Dates:</Text>
            <Text style={styles.value}>
              {quoteData.event_start_date && quoteData.event_end_date
                ? `${new Date(quoteData.event_start_date).toLocaleDateString()} - ${new Date(quoteData.event_end_date).toLocaleDateString()}`
                : 'N/A'}
            </Text>
          </View>
        </View>

        <View style={styles.column}>
        <Text style={styles.sectionTitle}>PACKAGE DETAILS</Text>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Package:</Text>
          <Text style={styles.value}>{quoteData.package_name || 'N/A'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Tier:</Text>
          <Text style={styles.value}>{quoteData.tier_name || 'N/A'}</Text>
        </View>
      </View>

      
      </View>

      

      

      {/* Components Table (excluding flights) */}
      {quoteData.selected_components && quoteData.selected_components.filter((component: any) => 
        component && typeof component === 'object' && !isFlightComponent(component)
      ).length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>INCLUDED IN THE PACKAGE</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { width: '30%' }]}>Component</Text>
              <Text style={[styles.tableHeaderCell, { width: '50%' }]}>Details</Text>
              <Text style={[styles.tableHeaderCell, { width: '20%' }]}>Quantity</Text>
            </View>
            {quoteData.selected_components
              ?.filter((component: any) => component && typeof component === 'object' && !isFlightComponent(component))
              .map((component: any, index: number) => {
                const componentInfo = extractComponentInfo(component);
                return (
                  <View key={index} style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                    <Text style={[styles.tableCell, { width: '30%' }]}> {componentInfo.name} </Text>
                    <Text style={[styles.tableCell, { width: '50%' }]}> {componentInfo.details} </Text>
                    <Text style={[styles.tableCell, { width: '20%' }]}> {componentInfo.quantity} </Text>
                  </View>
                );
              })}
          </View>
        </View>
      )}

      {/* Flights Section */}
      {quoteData.selected_components?.some(isFlightComponent) && (
        <View style={styles.section}> {/* extra spacing for section */}
          <Text style={styles.sectionTitle}>FLIGHTS</Text>
          {quoteData.selected_components.filter(isFlightComponent).map((component: any, idx: number) => {
            const flightData = component.data || component;
            const formatDateTime = (dt: string) => dt ? new Date(dt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : 'N/A';
            const getBaggage = (seg: any) => seg?.BaggageAllowance?.NumberOfPieces || seg?.baggageAllowance?.NumberOfPieces || flightData.baggageAllowance?.NumberOfPieces || 'N/A';
            const outboundSegments = flightData.outboundFlightSegments || (flightData.outboundFlight ? [flightData.outboundFlight] : []);
            const returnSegments = flightData.returnFlightSegments || (flightData.inboundFlight ? [flightData.inboundFlight] : []);
            const passengers = flightData.passengers || flightData.Passengers || flightData.recommendation?.Passengers?.length || 'N/A';
            const totalPrice = flightData.total || flightData.totalFare || flightData.price || (flightData.recommendation?.Total) || 'N/A';
            // Remove all currency symbol logic, just use the code
            const currencyCode = (flightData.currencyCode || flightData.currencyId || 'GBP').toUpperCase();
            let displayPrice = totalPrice;
            if (typeof displayPrice === 'string') displayPrice = displayPrice.replace(/[^\d.,-]/g, '');
            // Table column headers (only segment-specific fields)
            const tableHeaders = [
              'From', 'To', 'Departure', 'Arrival', 'Duration'
            ];
            // Helper to render a table row for a segment
            const renderTableRow = (seg: any, i: number) => (
              <View key={i} style={[styles.tableRow, {flexDirection: 'row', borderBottomWidth: 1, borderColor: '#eee', paddingVertical: 6, width: '100%'}]}>
                <Text style={[styles.tableCell, { flex: 2 }]}>{seg.departureAirportName || seg.DepartureAirportName || 'N/A'} ({seg.departureAirportId || 'N/A'})</Text>
                <Text style={[styles.tableCell, { flex: 2 }]}>{seg.arrivalAirportName || seg.ArrivalAirportName || 'N/A'} ({seg.arrivalAirportId || 'N/A'})</Text>
                <Text style={[styles.tableCell, { flex: 2 }]}>{formatDateTime(seg.departureDateTime)}</Text>
                <Text style={[styles.tableCell, { flex: 2 }]}>{formatDateTime(seg.arrivalDateTime)}</Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>{seg.flightDuration || 'N/A'}</Text>
              </View>
            );
            // Helper to render table header
            const renderTableHeader = () => (
              <View style={[styles.tableHeader, {flexDirection: 'row', borderBottomWidth: 1, borderColor: '#bbb', backgroundColor: '#f3f4f6', paddingVertical: 3, borderRadius: 4, width: '100%'}]}>
                {tableHeaders.map((header, i) => (
                  <Text key={i} style={[styles.tableHeaderCell, { flex: i === 4 ? 1 : 2, color: '#22223b', fontWeight: 'bold'}]}>{header}</Text>
                ))}
              </View>
            );
            // Helper to get shared info from first segment
            const getSharedInfo = (segments: any[]) => {
              const seg = segments[0] || {};
              return {
                airline: seg.marketingAirlineName || seg.operatingAirlineName || flightData.airline || 'N/A',
                class: seg.cabin || seg.CabinId || flightData.cabin || 'N/A',
                baggage: seg.BaggageAllowance?.NumberOfPieces || seg.baggageAllowance?.NumberOfPieces || flightData.baggageAllowance?.NumberOfPieces || 'N/A',
              };
            };
            return (
              <View key={idx}>
                {/* Outbound Flight Table */}
                <Text style={[styles.sectionSubtitle, {marginBottom: 8}]}>Outbound Flight</Text>
                {outboundSegments.length > 0 ? (
                  <View style={{ marginBottom: 16 }}>
                    {/* Shared info row */}
                    {(() => { const info = getSharedInfo(outboundSegments); return (
                      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 4, paddingVertical: 6, marginBottom: 4, paddingHorizontal: 6 }}>
                        <Text style={[styles.value, { fontWeight: 'bold', marginRight: 12 }]}>Airline</Text>
                        <Text style={[styles.value, { marginRight: 24 }]}>{info.airline}</Text>
                        <Text style={[styles.value, { fontWeight: 'bold', marginRight: 12 }]}>Class</Text>
                        <Text style={[styles.value, { marginRight: 24 }]}>{info.class}</Text>
                        <Text style={[styles.value, { fontWeight: 'bold', marginRight: 12 }]}>Baggage</Text>
                        <Text style={styles.value}>{info.baggage}</Text>
                      </View>
                    ); })()}
                    {renderTableHeader()}
                    {outboundSegments.map(renderTableRow)}
                  </View>
                ) : <Text style={[styles.value, { marginLeft: 10 }]}>N/A</Text>}
                {/* Return Flight Table */}
                <Text style={[styles.sectionSubtitle, {marginTop: 8, marginBottom: 8}]}>Return Flight</Text>
                {returnSegments.length > 0 ? (
                  <View style={{ marginBottom: 16 }}>
                    {/* Shared info row */}
                    {(() => { const info = getSharedInfo(returnSegments); return (
                      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 4, paddingVertical: 6, marginBottom: 4, paddingHorizontal: 6 }}>
                        <Text style={[styles.value, { fontWeight: 'bold', marginRight: 12 }]}>Airline</Text>
                        <Text style={[styles.value, { marginRight: 24 }]}>{info.airline}</Text>
                        <Text style={[styles.value, { fontWeight: 'bold', marginRight: 12 }]}>Class</Text>
                        <Text style={[styles.value, { marginRight: 24 }]}>{info.class}</Text>
                        <Text style={[styles.value, { fontWeight: 'bold', marginRight: 12 }]}>Baggage</Text>
                        <Text style={styles.value}>{info.baggage}</Text>
                      </View>
                    ); })()}
                    {renderTableHeader()}
                    {returnSegments.map(renderTableRow)}
                  </View>
                ) : <Text style={[styles.value, { marginLeft: 10 }]}>N/A</Text>}
                {/* Summary Row */}
                <View style={{ marginTop: 14, borderTopWidth: 1, borderColor: '#eee', paddingTop: 8 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
                    <Text style={[styles.value, { fontWeight: 'bold' }]}>Passengers</Text>
                    <Text style={styles.value}>{passengers}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={[styles.value, { fontWeight: 'bold' }]}>Total Price</Text>
                    <Text style={styles.value}>{currencyCode} {displayPrice} per person</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Payment Schedule */}
      {(quoteData.payment_deposit || quoteData.payment_second_payment || quoteData.payment_final_payment) && (
        <View style={styles.paymentSection}>
          <Text style={styles.sectionTitle}>PAYMENT SCHEDULE</Text>
          {[
            { name: 'Deposit', amount: quoteData.payment_deposit, date: quoteData.payment_deposit_date },
            { name: 'Second Payment', amount: quoteData.payment_second_payment, date: quoteData.payment_second_payment_date },
            { name: 'Final Payment', amount: quoteData.payment_final_payment, date: quoteData.payment_final_payment_date }
          ].map((payment, index) => (
            payment.amount && payment.amount > 0 && (
              <View key={index} style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>{payment.name}</Text>
                <Text style={styles.paymentAmount}>
                  {quoteData.currency || 'GBP'} {payment.amount.toFixed(2)}
                </Text>
                <Text style={styles.paymentDate}>
                  {payment.date ? new Date(payment.date).toLocaleDateString() : 'TBD'}
                </Text>
              </View>
            )
          ))}
        </View>
      )}

      {/* Total Price */}
      {quoteData.total_price && (
        <View style={styles.totalSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Price</Text>
            <Text style={styles.totalAmount}>
              {quoteData.currency || 'GBP'} {quoteData.total_price.toFixed(2)}
            </Text>
          </View>
        </View>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          This quote is valid for 30 days from the date of issue.
        </Text>
        <Text style={styles.footerText}>
          For questions or to proceed with booking, please contact your travel consultant.
        </Text>
        <Text style={styles.pageNumber}>
          Page 1 of 1
        </Text>
      </View>
    </Page>
  </Document>
  );
};

export default QuotePDFDocument; 