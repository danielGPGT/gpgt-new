import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
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

// Copy styles from QuotePDFDocument
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 20,
    fontFamily: 'Helvetica',
  },
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
  bookingInfo: {
    alignItems: 'flex-end',
  },
  bookingNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  bookingDate: {
    fontSize: 8,
    color: '#6b7280',
  },
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
  twoColumn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  column: {
    width: '48%',
  },
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
  travelersList: {
    marginTop: 10,
  },
  travelerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    paddingVertical: 4,
    paddingHorizontal: 6,
    backgroundColor: '#f0f9eb',
    borderRadius: 3,
  },
  travelerNumber: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#22c55e',
    marginRight: 8,
  },
  travelerName: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#111827',
    marginRight: 8,
  },
  travelerType: {
    fontSize: 8,
    color: '#6b7280',
  },
  paymentTableHeader: {
    fontSize: 10,
    fontWeight: 'bold',
    padding: 2,
    borderRight: 1,
    borderColor: '#ccc',
    backgroundColor: '#f5f5f5',
  },
  paymentTableCell: {
    fontSize: 10,
    padding: 2,
    borderRight: 1,
    borderColor: '#eee',
  },
});

// Helper function to extract component information (adapted for booking components)
const extractComponentInfo = (component: any) => {
  if (!component) return { name: 'N/A', details: 'N/A', quantity: 1 };
  const data = component.component_data || component.componentData || component.data || component;

  // TICKET
  if (component.component_type === 'ticket' || component.componentType === 'ticket') {
    const ticketName = data.ticket_category_name || data.category || data.name || component.component_name || 'Event Ticket';
    const seat = data.seat || data.seat_number;
    return {
      name: 'Event Ticket',
      details: seat ? `${ticketName} (Seat: ${seat})` : ticketName,
      quantity: component.quantity || data.quantity || 1
    };
  }

  // HOTEL ROOM
  if (component.component_type === 'hotel_room' || component.componentType === 'hotel_room') {
    const hotel = data.hotel_name || data.hotelName || data.hotel || component.component_name || 'Hotel';
    const room = data.room_type || data.roomType || data.room || data.room_name;
    const bed = data.bed_type || data.bedType;
    const checkIn = data.check_in || data.checkIn;
    const checkOut = data.check_out || data.checkOut;
    let details = hotel;
    if (room) details += `, Room: ${room}`;
    if (bed) details += `, Bed: ${bed}`;
    if (checkIn || checkOut) details += `, ${checkIn ? 'Check-in: ' + new Date(checkIn).toLocaleDateString() : ''}${checkIn && checkOut ? ', ' : ''}${checkOut ? 'Check-out: ' + new Date(checkOut).toLocaleDateString() : ''}`;
    return {
      name: 'Hotel Room',
      details,
      quantity: component.quantity || data.quantity || 1
    };
  }

  // AIRPORT TRANSFER
  if (component.component_type === 'airport_transfer' || component.componentType === 'airport_transfer') {
    const transportType = data.transport_type
      ? data.transport_type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
      : 'Airport Transfer';
    // Check all possible sources for direction
    const direction =
      component.direction ||
      data.direction ||
      data.transferDirection ||
      (component.component_data && component.component_data.transferDirection);
    const directionStr = direction ? `Direction: ${direction.charAt(0).toUpperCase() + direction.slice(1)}` : '';
    const details = [transportType, directionStr].filter(Boolean).join(', ');
    return {
      name: 'Airport Transfer',
      details,
      quantity: component.quantity || data.quantity || 1,
    };
  }

  // CIRCUIT TRANSFER
  if (component.component_type === 'circuit_transfer' || component.componentType === 'circuit_transfer') {
    const transferType = data.transfer_type
      ? data.transfer_type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
      : 'Circuit Transfer';
    const days = data.days ? `Days: ${data.days}` : '';
    const details = [transferType, days].filter(Boolean).join(', ');
    return {
      name: 'Circuit Transfer',
      details,
      quantity: component.quantity || data.quantity || 1,
    };
  }

  // LOUNGE PASS
  if (component.component_type === 'lounge_pass' || component.componentType === 'lounge_pass') {
    const lounge = data.lounge_name || data.name || component.component_name || 'Lounge';
    return {
      name: 'Lounge Pass',
      details: lounge,
      quantity: component.quantity || data.quantity || 1
    };
  }

  // Fallback for custom/generic components
  if (component.component_name) {
    return {
      name: component.component_name,
      details: data.description || data.details || 'Service Included',
      quantity: component.quantity || data.quantity || 1
    };
  }
  if (component.component_type) {
    return {
      name: component.component_type.replace('_', ' ').toUpperCase(),
      details: data.description || data.details || 'Service Included',
      quantity: component.quantity || data.quantity || 1
    };
  }
  return {
    name: 'Component',
    details: data.description || data.details || 'Service Included',
    quantity: component.quantity || data.quantity || 1
  };
};

// Helper to detect if a component is a flight
const isFlightComponent = (component: any) => {
  if (!component || typeof component !== 'object') return false;
  if (component.componentType === 'flight' || component.type === 'flight') return true;
  if (component.origin || component.destination || component.originAirport || component.destinationAirport) return true;
  const data = component.componentData || component.data || {};
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

const BookingConfirmationPDFDocument = ({ bookingData }: { bookingData: any }) => {
  // bookingData should have: booking, components, payments, travelers, team
  const { booking, components, payments, travelers, team } = bookingData;
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.companyInfo}>
            {booking?.team?.logo_url ? (
              <Image 
                src={booking.team.logo_url} 
                style={styles.companyLogo}
              />
            ) : (
              <Text style={styles.companyName}>
                {booking?.team?.agency_name || booking?.team?.name || 'GPGT TRAVEL'}
              </Text>
            )}
          </View>
          <View style={styles.bookingInfo}>
            <Text style={styles.bookingNumber}>Booking Confirmation #{booking?.booking_reference || booking?.id || 'N/A'}</Text>
            <Text style={styles.bookingDate}>
              {booking?.created_at ? new Date(booking.created_at).toLocaleDateString() : 'N/A'}
            </Text>
          </View>
        </View>

        {/* Client and Travelers */}
        <View style={styles.twoColumn}>
          <View style={styles.column}>
            <Text style={styles.sectionTitle}>CLIENT INFORMATION</Text>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Name:</Text>
              <Text style={styles.value}>{
                (booking?.quote?.client_name) ? booking.quote.client_name : (booking?.leadTravelerName || 'N/A')
              }</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Email:</Text>
              <Text style={styles.value}>{
                (booking?.quote?.client_email) ? booking.quote.client_email : (booking?.leadTravelerEmail || 'N/A')
              }</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Phone:</Text>
              <Text style={styles.value}>{
                (booking?.quote?.client_phone) ? booking.quote.client_phone : (booking?.leadTravelerPhone || 'N/A')
              }</Text>
            </View>
          </View>
          <View style={styles.column}>
            <Text style={styles.sectionTitle}>TRAVELERS</Text>
            <Text style={styles.value}>Total Travelers: {Array.isArray(travelers) ? travelers.length : 1}</Text>
            {Array.isArray(travelers) && travelers.length > 0 && (
              <View style={styles.travelersList}>
                {travelers.map((traveler, idx) => (
                  <View key={traveler.id || idx} style={styles.travelerItem}>
                    <Text style={styles.travelerNumber}>{idx + 1}.</Text>
                    <Text style={styles.travelerName}>{traveler.first_name} {traveler.last_name}</Text>
                    <Text style={styles.travelerType}>{traveler.traveler_type}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Event and Package Details */}
        <View style={styles.twoColumn}>
          <View style={styles.column}>
            <Text style={styles.sectionTitle}>EVENT INFORMATION</Text>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Event:</Text>
              <Text style={styles.value}>{
                (booking?.quote?.event_name) ? booking.quote.event_name : (booking?.eventName || 'N/A')
              }</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Location:</Text>
              <Text style={styles.value}>{
                (booking?.quote?.event_location) ? booking.quote.event_location : (booking?.eventLocation || 'N/A')
              }</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Dates:</Text>
              <Text style={styles.value}>{
                (booking?.eventStartDate && booking?.eventEndDate)
                  ? `${new Date(booking.eventStartDate).toLocaleDateString()} - ${new Date(booking.eventEndDate).toLocaleDateString()}`
                  : 'N/A'
              }</Text>
            </View>
          </View>
          <View style={styles.column}>
            <Text style={styles.sectionTitle}>PACKAGE DETAILS</Text>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Package:</Text>
              <Text style={styles.value}>{
                (booking?.quote?.package_name) ? booking.quote.package_name : (booking?.packageName || 'N/A')
              }</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Tier:</Text>
              <Text style={styles.value}>{
                (booking?.quote?.tier_name) ? booking.quote.tier_name : (booking?.tierName || 'N/A')
              }</Text>
            </View>
          </View>
        </View>

        {/* Components Table (excluding flights) */}
        {components && components.filter((component: any) => component && typeof component === 'object' && !isFlightComponent(component)).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>INCLUDED IN THE PACKAGE</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { width: '30%' }]}>Component</Text>
                <Text style={[styles.tableHeaderCell, { width: '50%' }]}>Details</Text>
                <Text style={[styles.tableHeaderCell, { width: '20%' }]}>Quantity</Text>
              </View>
              {components
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
        {components?.some(isFlightComponent) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>FLIGHTS</Text>
            {components.filter(isFlightComponent).map((component: any, idx: number) => {
              const flightData = component.componentData || component.data || component;
              const formatDateTime = (dt: string) => dt ? new Date(dt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : 'N/A';
              const outboundSegments = flightData.outboundFlightSegments || (flightData.outboundFlight ? [flightData.outboundFlight] : []);
              const returnSegments = flightData.returnFlightSegments || (flightData.inboundFlight ? [flightData.inboundFlight] : []);
              const passengers = flightData.passengers || flightData.Passengers || flightData.recommendation?.Passengers?.length || 'N/A';
              const totalPrice = flightData.total || flightData.totalFare || flightData.price || (flightData.recommendation?.Total) || 'N/A';
              const currencyCode = (flightData.currencyCode || flightData.currencyId || booking?.currency || 'GBP').toUpperCase();
              let displayPrice = totalPrice;
              if (typeof displayPrice === 'string') displayPrice = displayPrice.replace(/[^\d.,-]/g, '');
              const tableHeaders = [
                'From', 'To', 'Departure', 'Arrival', 'Duration'
              ];
              const renderTableRow = (seg: any, i: number) => (
                <View key={i} style={[styles.tableRow, {flexDirection: 'row', borderBottomWidth: 1, borderColor: '#eee', paddingVertical: 6, width: '100%'}]}>
                  <Text style={[styles.tableCell, { flex: 2 }]}>{seg.departureAirportName || seg.DepartureAirportName || 'N/A'} ({seg.departureAirportId || 'N/A'})</Text>
                  <Text style={[styles.tableCell, { flex: 2 }]}>{seg.arrivalAirportName || seg.ArrivalAirportName || 'N/A'} ({seg.arrivalAirportId || 'N/A'})</Text>
                  <Text style={[styles.tableCell, { flex: 2 }]}>{formatDateTime(seg.departureDateTime)}</Text>
                  <Text style={[styles.tableCell, { flex: 2 }]}>{formatDateTime(seg.arrivalDateTime)}</Text>
                  <Text style={[styles.tableCell, { flex: 1 }]}>{seg.flightDuration || 'N/A'}</Text>
                </View>
              );
              const renderTableHeader = () => (
                <View style={[styles.tableHeader, {flexDirection: 'row', borderBottomWidth: 1, borderColor: '#bbb', backgroundColor: '#f3f4f6', paddingVertical: 3, borderRadius: 4, width: '100%'}]}>
                  {tableHeaders.map((header, i) => (
                    <Text key={i} style={[styles.tableHeaderCell, { flex: i === 4 ? 1 : 2, color: '#22223b', fontWeight: 'bold'}]}>{header}</Text>
                  ))}
                </View>
              );
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
        {payments && payments.length > 0 && (
          <View style={styles.paymentSection}>
            <Text style={styles.sectionTitle}>PAYMENT SCHEDULE</Text>
            {/* Compact payment table */}
            <View style={{ flexDirection: 'row', borderBottom: 1, borderColor: '#ccc', marginBottom: 4 }}>
              <Text style={[styles.paymentTableHeader, { flex: 2 }]}>Type</Text>
              <Text style={[styles.paymentTableHeader, { flex: 2 }]}>Amount</Text>
              <Text style={[styles.paymentTableHeader, { flex: 2 }]}>Due Date</Text>
              <Text style={[styles.paymentTableHeader, { flex: 1 }]}>Status</Text>
            </View>
            {payments.map((payment: any, index: number) => (
              payment.amount && payment.amount > 0 && (
                <View key={index} style={{ flexDirection: 'row', borderBottom: 1, borderColor: '#eee', paddingVertical: 2 }}>
                  <Text style={[styles.paymentTableCell, { flex: 2 }]}>
                    {(payment.paymentType || payment.payment_type || 'Payment')
                      .replace(/_/g, ' ')
                      .replace(/\b\w/g, (l: string) => l.toUpperCase())}
                  </Text>
                  <Text style={[styles.paymentTableCell, { flex: 2 }]}>GBP {Number(payment.amount).toFixed(2)}</Text>
                  <Text style={[styles.paymentTableCell, { flex: 2 }]}>
                    {payment.dueDate || payment.due_date || ''}
                  </Text>
                  <Text style={[styles.paymentTableCell, { flex: 1 }]}> 
                    {payment.paid ? 'Paid' : 'Unpaid'}
                  </Text>
                </View>
              )
            ))}
          </View>
        )}

        {/* Total Price */}
        {booking?.totalCost && (
          <View style={styles.totalSection}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Price</Text>
              <Text style={styles.totalAmount}>
                {booking?.currency || 'GBP'} {Number(booking.totalCost).toFixed(2)}
              </Text>
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            This booking is confirmed. Please keep this confirmation for your records.
          </Text>
          <Text style={styles.footerText}>
            For questions or support, please contact your travel consultant.
          </Text>
          <Text style={styles.pageNumber}>
            Page 1 of 1
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default BookingConfirmationPDFDocument; 