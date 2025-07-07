import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowLeft, 
  Mail, 
  Download, 
  Copy, 
  Share2, 
  Edit, 
  Eye, 
  Calendar, 
  MapPin, 
  Users, 
  DollarSign, 
  FileText, 
  Activity,
  CheckCircle, 
  XCircle,
  Clock,
  AlertCircle,
  Loader2,
  Send,
  History,
  Settings,
  Star,
  Hotel,
  Car,
  Plane,
  Ticket,
  ExternalLink,
  Printer,
  MessageSquare,
  Phone,
  Globe,
  Building,
  BedDouble,
  Map,
  CreditCard,
  Receipt,
  Trash2,
  Archive,
  MoreHorizontal,
  RefreshCw,
  BookOpen,
  CheckSquare,
  Square,
  AlertTriangle,
  Info
} from 'lucide-react';
import { QuoteService } from '@/lib/quoteService';
import { Quote, QuoteDetails, QuoteActivity } from '@/types';
import { toast } from 'sonner';
import { format } from 'date-fns';

export function ViewQuote() {
  const { quoteId } = useParams<{ quoteId: string }>();
  const navigate = useNavigate();
  const [quoteDetails, setQuoteDetails] = useState<QuoteDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [confirmQuoteDialogOpen, setConfirmQuoteDialogOpen] = useState(false);
  const [duplicateNotes, setDuplicateNotes] = useState('');
  const [duplicateLoading, setDuplicateLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [emailData, setEmailData] = useState({
    recipient: '',
    subject: '',
    message: ''
  });

  useEffect(() => {
    if (quoteId) {
      loadQuoteDetails();
    }
  }, [quoteId]);

  const loadQuoteDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const details = await QuoteService.getQuoteDetails(quoteId!);
      setQuoteDetails(details);
      
      // Pre-fill email data
      setEmailData({
        recipient: details.quote.clientEmail || '',
        subject: `Your Quote ${details.quote.quoteNumber} - ${details.quote.eventName || 'Event Package'}`,
        message: `Dear ${details.quote.clientName},\n\nThank you for your interest in our event package. Please find your detailed quote attached.\n\nBest regards,\nYour Travel Team`
      });
    } catch (err) {
      console.error('Error loading quote details:', err);
      setError(err instanceof Error ? err.message : 'Failed to load quote details');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: Quote['status'], notes?: string) => {
    try {
      setUpdatingStatus(true);
      await QuoteService.updateQuoteStatus(quoteId!, newStatus, notes);
      await loadQuoteDetails(); // Reload to get updated data
      toast.success(`Quote status updated to ${newStatus}`);
    } catch (err) {
      console.error('Error updating quote status:', err);
      toast.error('Failed to update quote status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSendEmail = async () => {
    try {
      setSendingEmail(true);
      await QuoteService.sendQuoteEmail(
        quoteId!,
        emailData.recipient,
        'quote_sent',
        emailData.subject,
        emailData.message
      );
      setEmailDialogOpen(false);
      await loadQuoteDetails(); // Reload to get updated activity
      toast.success('Quote email sent successfully');
    } catch (err) {
      console.error('Error sending quote email:', err);
      toast.error('Failed to send quote email');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      const url = `${window.location.origin}/quote/${quoteId}`;
      await navigator.clipboard.writeText(url);
      toast.success('Quote link copied to clipboard');
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  const handleDownloadPDF = () => {
    // TODO: Implement PDF generation
    toast.info('PDF download feature coming soon');
  };

  const handlePrint = () => {
    window.print();
  };

  // CRUD Operations
  const handleDeleteQuote = async () => {
    try {
      setDeleteLoading(true);
      await QuoteService.deleteQuote(quoteId!);
      toast.success('Quote deleted successfully');
      navigate('/quotes'); // Navigate back to quotes list
    } catch (err) {
      console.error('Error deleting quote:', err);
      toast.error('Failed to delete quote');
    } finally {
      setDeleteLoading(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleDuplicateQuote = async () => {
    try {
      setDuplicateLoading(true);
      const newQuoteId = await QuoteService.createQuoteRevision(quoteId!, duplicateNotes);
      toast.success('Quote duplicated successfully');
      navigate(`/quotes/${newQuoteId}`); // Navigate to the new quote
    } catch (err) {
      console.error('Error duplicating quote:', err);
      toast.error('Failed to duplicate quote');
    } finally {
      setDuplicateLoading(false);
      setDuplicateDialogOpen(false);
      setDuplicateNotes('');
    }
  };

  const handleArchiveQuote = async () => {
    try {
      setArchiveLoading(true);
      await QuoteService.updateQuoteStatus(quoteId!, 'cancelled', 'Quote archived');
      await loadQuoteDetails(); // Reload to get updated data
      toast.success('Quote archived successfully');
    } catch (err) {
      console.error('Error archiving quote:', err);
      toast.error('Failed to archive quote');
    } finally {
      setArchiveLoading(false);
      setArchiveDialogOpen(false);
    }
  };

  const handleConfirmQuote = async () => {
    try {
      setConfirmLoading(true);
      const bookingId = await QuoteService.confirmQuote(quoteId!);
      await loadQuoteDetails(); // Reload to get updated data
      toast.success(`Quote confirmed! Booking created with ID: ${bookingId}`);
      // Optionally navigate to booking page
      // navigate(`/bookings/${bookingId}`);
    } catch (err) {
      console.error('Error confirming quote:', err);
      toast.error('Failed to confirm quote');
    } finally {
      setConfirmLoading(false);
      setConfirmQuoteDialogOpen(false);
    }
  };

  const handleEditQuote = () => {
    // Navigate to edit page (you'll need to create this)
    navigate(`/quotes/${quoteId}/edit`);
  };

  const handleCreateRevision = () => {
    setDuplicateDialogOpen(true);
  };

  const handleCallClient = () => {
    if (quoteDetails?.quote.clientPhone) {
      window.open(`tel:${quoteDetails.quote.clientPhone}`, '_self');
    } else {
      toast.error('No phone number available for this client');
    }
  };

  const handleEmailClient = () => {
    if (quoteDetails?.quote.clientEmail) {
      window.open(`mailto:${quoteDetails.quote.clientEmail}?subject=Re: Quote ${quoteDetails.quote.quoteNumber}`, '_self');
    } else {
      toast.error('No email address available for this client');
    }
  };

  const getStatusColor = (status: Quote['status']) => {
    switch (status) {
      case 'draft': return 'bg-gray-500';
      case 'sent': return 'bg-blue-500';
      case 'accepted': return 'bg-green-500';
      case 'declined': return 'bg-red-500';
      case 'expired': return 'bg-orange-500';
      case 'confirmed': return 'bg-purple-500';
      case 'cancelled': return 'bg-red-600';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: Quote['status']) => {
    switch (status) {
      case 'draft': return <FileText className="h-4 w-4" />;
      case 'sent': return <Mail className="h-4 w-4" />;
      case 'accepted': return <CheckCircle className="h-4 w-4" />;
      case 'declined': return <XCircle className="h-4 w-4" />;
      case 'expired': return <Clock className="h-4 w-4" />;
      case 'confirmed': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const formatCurrency = (amount: number, currency: string = 'GBP') => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading quote details...</p>
        </div>
      </div>
    );
  }

  if (error || !quoteDetails) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || 'Quote not found'}</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button onClick={() => navigate('/quotes')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Quotes
          </Button>
        </div>
      </div>
    );
  }

  const { quote, activities, emails, attachments } = quoteDetails;

  return (
    <div className="mx-auto px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate('/quotes')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
              Back to Quotes
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Quote {quote.quoteNumber}</h1>
            <p className="text-muted-foreground">
              {quote.clientName} • {quote.eventName || 'Event Package'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge className={`${getStatusColor(quote.status)} text-white flex items-center gap-1`}>
            {getStatusIcon(quote.status)}
            {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
          </Badge>
        </div>
      </div>

      {/* Quick Actions */}
      <Card className="py-0">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Send Email
            </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Send Quote Email</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="recipient">Recipient Email</Label>
                    <Input
                      id="recipient"
                      value={emailData.recipient}
                      onChange={(e) => setEmailData({ ...emailData, recipient: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      value={emailData.subject}
                      onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      value={emailData.message}
                      onChange={(e) => setEmailData({ ...emailData, message: e.target.value })}
                      rows={4}
                    />
                  </div>
                  <Button 
                    onClick={handleSendEmail} 
                    disabled={sendingEmail}
                    className="w-full"
                  >
                    {sendingEmail ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    Send Email
                  </Button>
        </div>
              </DialogContent>
            </Dialog>

            <Button variant="outline" className="flex items-center gap-2" onClick={handleDownloadPDF}>
              <Download className="h-4 w-4" />
              Download PDF
            </Button>

            <Button variant="outline" className="flex items-center gap-2" onClick={handleCopyLink}>
              <Copy className="h-4 w-4" />
              Copy Link
            </Button>

            <Button variant="outline" className="flex items-center gap-2" onClick={handlePrint}>
              <Printer className="h-4 w-4" />
              Print
            </Button>

            <Button variant="outline" className="flex items-center gap-2" onClick={handleEditQuote}>
              <Edit className="h-4 w-4" />
              Edit
            </Button>

            <Button variant="outline" className="flex items-center gap-2" onClick={handleCreateRevision}>
              <History className="h-4 w-4" />
              Create Revision
            </Button>

            {quote.status === 'accepted' && (
              <Button 
                variant="default" 
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                onClick={() => setConfirmQuoteDialogOpen(true)}
              >
                <CheckSquare className="h-4 w-4" />
                Confirm Quote
              </Button>
            )}

            {(quote.status === 'accepted' || quote.status === 'sent') && (
              <Button 
                variant="default" 
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                onClick={() => navigate(`/quotes/${quote.id}/create-booking`)}
              >
                <Users className="h-4 w-4" />
                Create Booking
              </Button>
            )}

            <Button variant="outline" className="flex items-center gap-2" onClick={() => setArchiveDialogOpen(true)}>
              <Archive className="h-4 w-4" />
              Archive
            </Button>

            <Button 
              variant="destructive" 
              className="flex items-center gap-2"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
      </div>
        </CardContent>
      </Card>

        {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Quote Details */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="components">Components</TabsTrigger>
              <TabsTrigger value="payments">Payments</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Quote Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Quote Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                        <Label className="text-sm font-medium text-muted-foreground">Client Information</Label>
                  </div>
                      <div className="pl-6">
                        <p className="font-medium">{quote.clientName}</p>
                        <p className="text-sm text-muted-foreground">{quote.clientEmail}</p>
                        {quote.clientPhone && (
                          <p className="text-sm text-muted-foreground">{quote.clientPhone}</p>
                        )}
                </div>
                    </div>
                    <div className="space-y-3">
                <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <Label className="text-sm font-medium text-muted-foreground">Event Details</Label>
                  </div>
                      <div className="pl-6">
                        <p className="font-medium">{quote.eventName || 'N/A'}</p>
                        <p className="text-sm text-muted-foreground">{quote.eventLocation}</p>
                        <p className="text-sm text-muted-foreground">
                          {quote.eventStartDate && quote.eventEndDate 
                            ? `${format(new Date(quote.eventStartDate), 'MMM dd, yyyy')} - ${format(new Date(quote.eventEndDate), 'MMM dd, yyyy')}`
                            : 'Dates TBD'
                          }
                        </p>
                </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <Label className="text-sm font-medium text-muted-foreground">Travelers</Label>
                  </div>
                      <p className="font-medium">{quote.travelersTotal} total</p>
                      <p className="text-sm text-muted-foreground">
                        {quote.travelersAdults} adults, {quote.travelersChildren} children
                      </p>
                </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <Label className="text-sm font-medium text-muted-foreground">Package</Label>
                      </div>
                      <p className="font-medium">{quote.packageName}</p>
                      <p className="text-sm text-muted-foreground">{quote.tierName}</p>
                    </div>
                    <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <Label className="text-sm font-medium text-muted-foreground">Total Price</Label>
                  </div>
                      <p className="text-2xl font-bold text-primary">
                        {formatCurrency(quote.totalPrice || 0, quote.currency)}
                      </p>
                </div>
              </div>
            </CardContent>
          </Card>

              {/* Status Management */}
            <Card>
              <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Status Management
                  </CardTitle>
              </CardHeader>
              <CardContent>
                  <div className="flex items-center gap-4">
                    <Select
                      value={quote.status}
                      onValueChange={(value: Quote['status']) => handleStatusUpdate(value)}
                      disabled={updatingStatus}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="sent">Sent</SelectItem>
                        <SelectItem value="accepted">Accepted</SelectItem>
                        <SelectItem value="declined">Declined</SelectItem>
                        <SelectItem value="expired">Expired</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    {updatingStatus && <Loader2 className="h-4 w-4 animate-spin" />}
                </div>
              </CardContent>
            </Card>
            </TabsContent>

            <TabsContent value="components" className="space-y-6">
            <Card>
              <CardHeader>
                  <CardTitle>Package Components</CardTitle>
              </CardHeader>
                <CardContent className="space-y-6">
                  {/* Tickets */}
                  {quote.selectedComponents?.tickets?.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-medium flex items-center gap-2 text-lg">
                        <Ticket className="h-5 w-5 text-primary" />
                        Event Tickets
                      </h4>
                      {quote.selectedComponents.tickets.map((ticket: any, index: number) => (
                        <div key={index} className="flex justify-between items-center p-4 bg-muted/50 rounded-lg border">
                          <div className="space-y-1">
                            <p className="font-medium">{ticket.category}</p>
                            <p className="text-sm text-muted-foreground">
                              Quantity: {ticket.quantity} × {formatCurrency(ticket.price, quote.currency)}
                            </p>
                        </div>
                          <p className="font-medium text-lg">
                            {formatCurrency(ticket.quantity * ticket.price, quote.currency)}
                          </p>
                          </div>
                        ))}
                    </div>
                  )}

                  {/* Hotels */}
                  {quote.selectedComponents?.hotels?.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-medium flex items-center gap-2 text-lg">
                        <Hotel className="h-5 w-5 text-primary" />
                        Hotel Rooms
                      </h4>
                      {quote.selectedComponents.hotels.map((hotel: any, index: number) => (
                        <div key={index} className="flex justify-between items-center p-4 bg-muted/50 rounded-lg border">
                          <div className="space-y-1">
                            <p className="font-medium">{hotel.hotelName || 'Hotel Room'}</p>
                            <p className="text-sm text-muted-foreground">
                              {hotel.roomType || 'Standard Room'}
                              {hotel.hotelCity && ` • ${hotel.hotelCity}, ${hotel.hotelCountry}`}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {hotel.checkIn} - {hotel.checkOut}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Quantity: {hotel.quantity || 1} room{hotel.quantity !== 1 ? 's' : ''}
                              {hotel.roomMaxPeople && ` • Max ${hotel.roomMaxPeople} people`}
                            </p>
                            {hotel.hotelStarRating > 0 && (
                              <p className="text-sm text-muted-foreground">
                                {Array(hotel.hotelStarRating).fill('★').join('')} {hotel.hotelBrand}
                              </p>
                            )}
                        </div>
                          <p className="font-medium text-lg">
                            {formatCurrency(hotel.price || 0, quote.currency)}
                          </p>
                          </div>
                        ))}
                    </div>
                  )}

                  {/* Circuit Transfers */}
                  {quote.selectedComponents?.circuitTransfers?.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-medium flex items-center gap-2 text-lg">
                        <Car className="h-5 w-5 text-primary" />
                        Circuit Transfers
                      </h4>
                      {quote.selectedComponents.circuitTransfers.map((transfer: any, index: number) => (
                        <div key={index} className="flex justify-between items-center p-4 bg-muted/50 rounded-lg border">
                          <div className="space-y-1">
                            <p className="font-medium">Circuit Transfer</p>
                            <p className="text-sm text-muted-foreground">
                              Quantity: {transfer.quantity} × {formatCurrency(transfer.price, quote.currency)}
                            </p>
                        </div>
                          <p className="font-medium text-lg">
                            {formatCurrency(transfer.quantity * transfer.price, quote.currency)}
                          </p>
                          </div>
                        ))}
                    </div>
                  )}

                  {/* Airport Transfers */}
                  {quote.selectedComponents?.airportTransfers?.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-medium flex items-center gap-2 text-lg">
                        <Car className="h-5 w-5 text-primary" />
                        Airport Transfers
                      </h4>
                      {quote.selectedComponents.airportTransfers.map((transfer: any, index: number) => (
                        <div key={index} className="flex justify-between items-center p-4 bg-muted/50 rounded-lg border">
                          <div className="space-y-1">
                            <p className="font-medium">Airport Transfer</p>
                            <p className="text-sm text-muted-foreground">
                              Quantity: {transfer.quantity} × {formatCurrency(transfer.price, quote.currency)}
                            </p>
                            {transfer.transferDirection && (
                              <p className="text-sm text-muted-foreground">
                                Direction: {transfer.transferDirection}
                              </p>
                            )}
                        </div>
                          <p className="font-medium text-lg">
                            {formatCurrency(transfer.quantity * transfer.price, quote.currency)}
                          </p>
                          </div>
                        ))}
                    </div>
                  )}

                  {/* Flights */}
                  {quote.selectedComponents?.flights?.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-medium flex items-center gap-2 text-lg">
                        <Plane className="h-5 w-5 text-primary" />
                        Flights
                      </h4>
                      {quote.selectedComponents.flights.map((flight: any, index: number) => (
                        <div key={index} className="flex justify-between items-center p-4 bg-muted/50 rounded-lg border">
                          <div className="space-y-1">
                            <p className="font-medium">{flight.origin} → {flight.destination}</p>
                            <p className="text-sm text-muted-foreground">
                              {flight.departureDate} {flight.returnDate && `- ${flight.returnDate}`}
                            </p>
                            {flight.airline && (
                              <p className="text-sm text-muted-foreground">{flight.airline}</p>
                            )}
                          </div>
                          <p className="font-medium text-lg">
                            {formatCurrency(flight.price || 0, quote.currency)}
                          </p>
                          </div>
                        ))}
                    </div>
                  )}

                  {/* Lounge Pass */}
                  {quote.selectedComponents?.loungePass && (
                    <div className="space-y-3">
                      <h4 className="font-medium flex items-center gap-2 text-lg">
                        <Star className="h-5 w-5 text-primary" />
                        Lounge Pass
                      </h4>
                      <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg border">
                        <div className="space-y-1">
                          <p className="font-medium">{quote.selectedComponents.loungePass.variant}</p>
                          <p className="text-sm text-muted-foreground">
                            Quantity: {quote.selectedComponents.loungePass.quantity || 1}
                          </p>
                            </div>
                        <p className="font-medium text-lg">
                          {formatCurrency(quote.selectedComponents.loungePass.price || 0, quote.currency)}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payments" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment Schedule
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 border rounded-lg bg-muted/30">
                      <div className="flex items-center gap-2 mb-2">
                        <Receipt className="h-4 w-4 text-primary" />
                        <h4 className="font-medium text-sm text-muted-foreground">Deposit</h4>
                        </div>
                      <p className="text-2xl font-bold text-primary">
                        {formatCurrency(quote.paymentDeposit, quote.currency)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {quote.paymentDepositDate ? format(new Date(quote.paymentDepositDate), 'MMM dd, yyyy') : 'Upon acceptance'}
                      </p>
                          </div>
                    <div className="p-4 border rounded-lg bg-muted/30">
                      <div className="flex items-center gap-2 mb-2">
                        <Receipt className="h-4 w-4 text-primary" />
                        <h4 className="font-medium text-sm text-muted-foreground">Second Payment</h4>
                      </div>
                      <p className="text-2xl font-bold text-primary">
                        {formatCurrency(quote.paymentSecondPayment, quote.currency)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {quote.paymentSecondPaymentDate ? format(new Date(quote.paymentSecondPaymentDate), 'MMM dd, yyyy') : 'TBD'}
                          </p>
                        </div>
                    <div className="p-4 border rounded-lg bg-muted/30">
                      <div className="flex items-center gap-2 mb-2">
                        <Receipt className="h-4 w-4 text-primary" />
                        <h4 className="font-medium text-sm text-muted-foreground">Final Payment</h4>
                      </div>
                      <p className="text-2xl font-bold text-primary">
                        {formatCurrency(quote.paymentFinalPayment, quote.currency)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {quote.paymentFinalPaymentDate ? format(new Date(quote.paymentFinalPaymentDate), 'MMM dd, yyyy') : 'TBD'}
                      </p>
                    </div>
                  </div>

                  {/* Payment Summary */}
                  <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Total Amount</span>
                      <span className="text-xl font-bold text-primary">
                        {formatCurrency(quote.totalPrice || 0, quote.currency)}
                      </span>
                    </div>
                </div>
              </CardContent>
            </Card>
            </TabsContent>

            <TabsContent value="activity" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Activity Log
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                    {activities.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">No activity recorded yet.</p>
                    ) : (
                      activities.map((activity: QuoteActivity) => (
                        <div key={activity.id} className="flex items-start gap-3 p-3 border rounded-lg">
                          <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="font-medium">{activity.activityDescription}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(activity.performedAt), 'MMM dd, yyyy HH:mm')}
                            </p>
                            {activity.performedBy && (
                      <p className="text-xs text-muted-foreground">
                                by {activity.performedBy}
                      </p>
                            )}
                    </div>
                        </div>
                      ))
                    )}
                </div>
              </CardContent>
            </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Quote Info */}
            <Card>
              <CardHeader>
              <CardTitle>Quote Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                    <div>
                <Label className="text-sm font-medium text-muted-foreground">Quote Number</Label>
                <p className="font-medium">{quote.quoteNumber}</p>
                    </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Created</Label>
                <p className="text-sm">{format(new Date(quote.createdAt), 'MMM dd, yyyy HH:mm')}</p>
                  </div>
                    <div>
                <Label className="text-sm font-medium text-muted-foreground">Last Updated</Label>
                <p className="text-sm">{format(new Date(quote.updatedAt), 'MMM dd, yyyy HH:mm')}</p>
                    </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Expires</Label>
                <p className="text-sm">
                  {quote.expiresAt ? format(new Date(quote.expiresAt), 'MMM dd, yyyy') : 'No expiration'}
                </p>
              </div>
              {quote.sentAt && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Sent</Label>
                  <p className="text-sm">{format(new Date(quote.sentAt), 'MMM dd, yyyy HH:mm')}</p>
                  </div>
                )}
              {quote.acceptedAt && (
                  <div>
                  <Label className="text-sm font-medium text-muted-foreground">Accepted</Label>
                  <p className="text-sm">{format(new Date(quote.acceptedAt), 'MMM dd, yyyy HH:mm')}</p>
                    </div>
              )}
              {quote.declinedAt && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Declined</Label>
                  <p className="text-sm">{format(new Date(quote.declinedAt), 'MMM dd, yyyy HH:mm')}</p>
                  </div>
                )}
              </CardContent>
            </Card>

          {/* Email History */}
          {emails.length > 0 && (
          <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email History
                </CardTitle>
            </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {emails.map((email) => (
                    <div key={email.id} className="p-3 border rounded-lg">
                      <p className="font-medium text-sm">{email.recipientEmail}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(email.sentAt), 'MMM dd, yyyy HH:mm')}
                      </p>
                      {email.openedAt && (
                        <p className="text-xs text-green-600 flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          Opened
                        </p>
                      )}
                      {email.bounced && (
                        <p className="text-xs text-red-600">Bounced</p>
                      )}
              </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" onClick={handleEditQuote}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Quote
                </Button>
              <Button variant="outline" className="w-full justify-start" onClick={handleCreateRevision}>
                <History className="h-4 w-4 mr-2" />
                Create Revision
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={handleEmailClient}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Email Client
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={handleCallClient}>
                  <Phone className="h-4 w-4 mr-2" />
                Call Client
                </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => setEmailDialogOpen(true)}>
                <Mail className="h-4 w-4 mr-2" />
                Send Quote Email
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={handleCopyLink}>
                <Copy className="h-4 w-4 mr-2" />
                Copy Link
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Print Quote
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Confirmation Dialogs */}
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Quote</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
              <div>
                <p className="font-medium">Are you sure you want to delete quote <strong>{quote.quoteNumber}</strong>?</p>
                <p className="text-sm text-muted-foreground mt-2">
                  This action cannot be undone. All quote data, including components and activity history, will be permanently deleted.
                </p>
                    </div>
                </div>
        </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteQuote}
              disabled={deleteLoading}
            >
              {deleteLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Delete Quote
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Duplicate Confirmation Dialog */}
      <Dialog open={duplicateDialogOpen} onOpenChange={setDuplicateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Quote Revision</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <p className="font-medium">Create a revision of quote <strong>{quote.quoteNumber}</strong>?</p>
                <p className="text-sm text-muted-foreground mt-1">
                  This will create a new quote with all the same details that you can then modify.
                </p>
      </div>
            </div>
            <div>
              <Label htmlFor="revision-notes">Revision Notes (Optional)</Label>
              <Textarea
                id="revision-notes"
                placeholder="Enter notes about this revision..."
                value={duplicateNotes}
                onChange={(e) => setDuplicateNotes(e.target.value)}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDuplicateDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleDuplicateQuote}
              disabled={duplicateLoading}
            >
              {duplicateLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <History className="h-4 w-4 mr-2" />}
              Create Revision
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Archive Confirmation Dialog */}
      <Dialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Archive Quote</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-start gap-3">
              <Archive className="h-5 w-5 text-orange-500 mt-0.5" />
              <div>
                <p className="font-medium">Archive quote <strong>{quote.quoteNumber}</strong>?</p>
                <p className="text-sm text-muted-foreground mt-2">
                  This will mark the quote as cancelled and move it to archived status. The quote will no longer be active but can still be viewed.
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setArchiveDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="outline"
              onClick={handleArchiveQuote}
              disabled={archiveLoading}
            >
              {archiveLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Archive className="h-4 w-4 mr-2" />}
              Archive Quote
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Quote Dialog */}
      <Dialog open={confirmQuoteDialogOpen} onOpenChange={setConfirmQuoteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Quote</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-start gap-3">
              <CheckSquare className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium">Confirm quote <strong>{quote.quoteNumber}</strong>?</p>
                <p className="text-sm text-muted-foreground mt-2">
                  This will create a booking from this quote and mark it as confirmed. This action cannot be undone.
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmQuoteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="default"
              onClick={handleConfirmQuote}
              disabled={confirmLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {confirmLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckSquare className="h-4 w-4 mr-2" />}
              Confirm Quote
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 