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
import { downloadQuotePDF } from '@/lib/pdfService';
import { Quote, QuoteDetails, QuoteActivity } from '@/types';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { FlightApiService } from '@/lib/flightApiService';
import { supabase } from '@/lib/supabase';

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
  
  // Transfer data state
  const [circuitTransfers, setCircuitTransfers] = useState<any[]>([]);
  const [airportTransfers, setAirportTransfers] = useState<any[]>([]);
  const [hotels, setHotels] = useState<any[]>([]);

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
      
      // Fetch transfer data if components exist
      if (details.quote.selectedComponents) {
        await fetchTransferData(details.quote.selectedComponents);
      }
    } catch (err) {
      console.error('Error loading quote details:', err);
      setError(err instanceof Error ? err.message : 'Failed to load quote details');
    } finally {
      setLoading(false);
    }
  };

  const fetchTransferData = async (components: any) => {
    try {
      // Fetch circuit transfers
      if (components.circuitTransfers && components.circuitTransfers.length > 0) {
        const circuitIds = components.circuitTransfers.map((t: any) => t.id).filter(Boolean);
        if (circuitIds.length > 0) {
          const { data: circuitData } = await supabase
            .from('circuit_transfers')
            .select('*')
            .in('id', circuitIds);
          setCircuitTransfers(circuitData || []);
        }
      }

      // Fetch airport transfers
      if (components.airportTransfers && components.airportTransfers.length > 0) {
        const airportIds = components.airportTransfers.map((t: any) => t.id).filter(Boolean);
        if (airportIds.length > 0) {
          const { data: airportData } = await supabase
            .from('airport_transfers')
            .select('*')
            .in('id', airportIds);
          setAirportTransfers(airportData || []);
        }
      }

      // Fetch hotels for transfer references
      const hotelIds = new Set([
        ...(components.circuitTransfers || []).map((t: any) => t.hotelId).filter(Boolean),
        ...(components.airportTransfers || []).map((t: any) => t.hotelId).filter(Boolean)
      ]);
      
      if (hotelIds.size > 0) {
        const { data: hotelData } = await supabase
          .from('gpgt_hotels')
          .select('*')
          .in('id', Array.from(hotelIds));
        setHotels(hotelData || []);
      }
    } catch (err) {
      console.error('Error fetching transfer data:', err);
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

  const handleDownloadPDF = async () => {
    if (!quoteDetails?.quote) {
      toast.error('Quote data not available');
      return;
    }
    
    try {
      // Convert Quote to QuoteData format
      const quoteData = {
        quote_number: quoteDetails.quote.quoteNumber,
        created_at: quoteDetails.quote.createdAt,
        status: quoteDetails.quote.status,
        client_name: quoteDetails.quote.clientName,
        client_email: quoteDetails.quote.clientEmail,
        client_phone: quoteDetails.quote.clientPhone,
        event_name: quoteDetails.quote.eventName,
        event_location: quoteDetails.quote.eventLocation,
        event_start_date: quoteDetails.quote.eventStartDate,
        event_end_date: quoteDetails.quote.eventEndDate,
        package_name: quoteDetails.quote.packageName,
        tier_name: quoteDetails.quote.tierName,
        travelers: [], // Convert travelers object to array if needed
        travelers_total: quoteDetails.quote.travelersTotal,
        total_price: quoteDetails.quote.totalPrice,
        currency: quoteDetails.quote.currency,
        payment_deposit: quoteDetails.quote.paymentDeposit,
        payment_second_payment: quoteDetails.quote.paymentSecondPayment,
        payment_final_payment: quoteDetails.quote.paymentFinalPayment,
        payment_deposit_date: quoteDetails.quote.paymentDepositDate,
        payment_second_payment_date: quoteDetails.quote.paymentSecondPaymentDate,
        payment_final_payment_date: quoteDetails.quote.paymentFinalPaymentDate,
        team: quoteDetails.quote.team,
        selected_components: await (async () => {
          const components = [];
          
          if (quoteDetails.quote.selectedComponents?.tickets) {
            components.push(...quoteDetails.quote.selectedComponents.tickets);
          }
          if (quoteDetails.quote.selectedComponents?.hotels) {
            components.push(...quoteDetails.quote.selectedComponents.hotels);
          }
          if (quoteDetails.quote.selectedComponents?.flights) {
            components.push(...quoteDetails.quote.selectedComponents.flights);
          }
          if (quoteDetails.quote.selectedComponents?.loungePass) {
            components.push(quoteDetails.quote.selectedComponents.loungePass);
          }
          
          // Fetch circuit transfer details
          if (quoteDetails.quote.selectedComponents?.circuitTransfers) {
            const circuitIds = quoteDetails.quote.selectedComponents.circuitTransfers.map((t: any) => t.id);
            if (circuitIds.length > 0) {
              const { data: circuitData } = await supabase
                .from('circuit_transfers')
                .select('*')
                .in('id', circuitIds);
              
              const circuitTransfersWithDetails = quoteDetails.quote.selectedComponents.circuitTransfers.map((transfer: any) => {
                const details = circuitData?.find((c: any) => c.id === transfer.id);
                return {
                  ...transfer,
                  component_type: 'circuit_transfer',
                  transfer_type: details?.transfer_type || 'coach',
                  days: details?.days || 1
                };
              });
              components.push(...circuitTransfersWithDetails);
            }
          }
          
          // Fetch airport transfer details
          if (quoteDetails.quote.selectedComponents?.airportTransfers) {
            const airportIds = quoteDetails.quote.selectedComponents.airportTransfers.map((t: any) => t.id);
            if (airportIds.length > 0) {
              const { data: airportData } = await supabase
                .from('airport_transfers')
                .select('*')
                .in('id', airportIds);
              
              const airportTransfersWithDetails = quoteDetails.quote.selectedComponents.airportTransfers.map((transfer: any) => {
                const details = airportData?.find((a: any) => a.id === transfer.id);
                return {
                  ...transfer,
                  component_type: 'airport_transfer',
                  transport_type: details?.transport_type || 'hotel_chauffeur'
                };
              });
              components.push(...airportTransfersWithDetails);
            }
          }
          
          return components.filter(component => component && typeof component === 'object');
        })()
      };
      
      await downloadQuotePDF(quoteData);
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    }
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
                      {quote.selectedComponents.circuitTransfers.map((transfer: any, index: number) => {
                        const transferData = circuitTransfers.find(t => t.id === transfer.id);
                        const hotel = hotels.find(h => h.id === transferData?.hotel_id);
                        
                        return (
                          <div key={index} className="space-y-4 p-4 bg-muted/50 rounded-lg border">
                            {/* Transfer Header */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Car className="h-4 w-4 text-primary" />
                                <span className="font-semibold text-base">
                                  {transferData?.transfer_type?.toUpperCase() || 'Circuit Transfer'}
                                </span>
                                {hotel && (
                                  <span className="text-sm text-muted-foreground">
                                    • {hotel.name}
                                  </span>
                                )}
                        </div>
                              <div className="text-right">
                                <div className="font-bold text-primary">
                                  {formatCurrency(transfer.price || 0, quote.currency)}
                          </div>
                                <div className="text-xs text-muted-foreground">
                                  per seat × {transfer.quantity || 1}
                                </div>
                              </div>
                            </div>

                            {/* Transfer Details */}
                            {transferData && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="text-muted-foreground">Transfer Type:</span>
                                  <span className="ml-2 font-medium capitalize">
                                    {transferData.transfer_type}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Coach Capacity:</span>
                                  <span className="ml-2 font-medium">
                                    {transferData.coach_capacity} passengers
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Days:</span>
                                  <span className="ml-2 font-medium">
                                    {transferData.days} day{transferData.days !== 1 ? 's' : ''}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Expected Hours:</span>
                                  <span className="ml-2 font-medium">
                                    {transferData.expected_hours || transferData.quote_hours || 'TBD'} hours
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Coaches Required:</span>
                                  <span className="ml-2 font-medium">
                                    {transferData.coaches_required || 'Calculated'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Utilisation:</span>
                                  <span className="ml-2 font-medium">
                                    {transferData.utilisation_percent || 100}%
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Guide Included:</span>
                                  <span className="ml-2 font-medium">
                                    {transferData.guide_included ? 'Yes' : 'No'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Supplier:</span>
                                  <span className="ml-2 font-medium">
                                    {transferData.supplier || 'TBD'}
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* Cost Breakdown */}
                            {transferData && (
                              <div className="border-t border-border/30 pt-3">
                                <div className="flex items-center gap-2 mb-2">
                                  <CreditCard className="h-4 w-4 text-purple-600" />
                                  <span className="font-medium text-sm">Cost Breakdown</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                  {transferData.coach_cost_gbp && (
                                    <div>
                                      <span className="text-muted-foreground">Coach Cost (GBP):</span>
                                      <span className="ml-2 font-medium">
                                        £{transferData.coach_cost_gbp.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </span>
                                    </div>
                                  )}
                                  {transferData.guide_cost_gbp && (
                                    <div>
                                      <span className="text-muted-foreground">Guide Cost (GBP):</span>
                                      <span className="ml-2 font-medium">
                                        £{transferData.guide_cost_gbp.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </span>
                                    </div>
                                  )}
                                  {transferData.utilisation_cost_per_seat_gbp && (
                                    <div>
                                      <span className="text-muted-foreground">Cost per Seat (GBP):</span>
                                      <span className="ml-2 font-medium">
                                        £{transferData.utilisation_cost_per_seat_gbp.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </span>
                                    </div>
                                  )}
                                  {transferData.sell_price_per_seat_gbp && (
                                    <div>
                                      <span className="text-muted-foreground">Sell Price per Seat (GBP):</span>
                                      <span className="ml-2 font-medium">
                                        £{transferData.sell_price_per_seat_gbp.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </span>
                                    </div>
                                  )}
                                  {transferData.markup_percent && (
                                    <div>
                                      <span className="text-muted-foreground">Markup:</span>
                                      <span className="ml-2 font-medium">
                                        {transferData.markup_percent}%
                                      </span>
                                    </div>
                                  )}
                                  {transferData.supplier_currency && (
                                    <div>
                                      <span className="text-muted-foreground">Supplier Currency:</span>
                                      <span className="ml-2 font-medium">
                                        {transferData.supplier_currency}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Transfer Summary */}
                            <div className="border-t border-border/30 pt-3">
                              <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-4">
                                  <span className="text-muted-foreground">
                                    Quantity: <span className="font-medium">{transfer.quantity || 1}</span>
                                  </span>
                                  {transferData?.notes && (
                                    <span className="text-muted-foreground">
                                      Notes: <span className="font-medium">{transferData.notes}</span>
                                    </span>
                                  )}
                                </div>
                                <div className="text-right">
                                  <div className="font-semibold">
                                    Total: {formatCurrency((transfer.price || 0) * (transfer.quantity || 1), quote.currency)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Airport Transfers */}
                  {quote.selectedComponents?.airportTransfers?.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-medium flex items-center gap-2 text-lg">
                        <Car className="h-5 w-5 text-primary" />
                        Airport Transfers
                      </h4>
                      {quote.selectedComponents.airportTransfers.map((transfer: any, index: number) => {
                        const transferData = airportTransfers.find(t => t.id === transfer.id);
                        const hotel = hotels.find(h => h.id === transferData?.hotel_id);
                        
                        return (
                          <div key={index} className="space-y-4 p-4 bg-muted/50 rounded-lg border">
                            {/* Transfer Header */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Car className="h-4 w-4 text-primary" />
                                <span className="font-semibold text-base">
                                  {transferData?.transport_type?.replace('_', ' ').toUpperCase() || 'Airport Transfer'}
                                </span>
                                {hotel && (
                                  <span className="text-sm text-muted-foreground">
                                    • {hotel.name}
                                  </span>
                                )}
                            {transfer.transferDirection && (
                                  <Badge variant="outline" className="text-xs">
                                    {transfer.transferDirection}
                                  </Badge>
                            )}
                        </div>
                              <div className="text-right">
                                <div className="font-bold text-primary">
                                  {formatCurrency(transfer.price || 0, quote.currency)}
                          </div>
                                <div className="text-xs text-muted-foreground">
                                  per vehicle × {transfer.quantity || 1}
                                </div>
                              </div>
                            </div>

                            {/* Transfer Details */}
                            {transferData && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="text-muted-foreground">Transport Type:</span>
                                  <span className="ml-2 font-medium capitalize">
                                    {transferData.transport_type?.replace('_', ' ')}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Max Capacity:</span>
                                  <span className="ml-2 font-medium">
                                    {transferData.max_capacity} passengers
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Used Capacity:</span>
                                  <span className="ml-2 font-medium">
                                    {transferData.used || 0} passengers
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Supplier:</span>
                                  <span className="ml-2 font-medium">
                                    {transferData.supplier || 'TBD'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Quote Currency:</span>
                                  <span className="ml-2 font-medium">
                                    {transferData.quote_currency || 'GBP'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Paid to Supplier:</span>
                                  <span className="ml-2 font-medium">
                                    {transferData.paid_to_supplier ? 'Yes' : 'No'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Outstanding:</span>
                                  <span className="ml-2 font-medium">
                                    {transferData.outstanding ? 'Yes' : 'No'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Active:</span>
                                  <span className="ml-2 font-medium">
                                    {transferData.active ? 'Yes' : 'No'}
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* Cost Breakdown */}
                            {transferData && (
                              <div className="border-t border-border/30 pt-3">
                                <div className="flex items-center gap-2 mb-2">
                                  <CreditCard className="h-4 w-4 text-purple-600" />
                                  <span className="font-medium text-sm">Cost Breakdown</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                  {transferData.supplier_quote_per_car_local && (
                                    <div>
                                      <span className="text-muted-foreground">Supplier Quote (Local):</span>
                                      <span className="ml-2 font-medium">
                                        {transferData.supplier_quote_per_car_local.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {transferData.quote_currency || 'GBP'}
                                      </span>
                                    </div>
                                  )}
                                  {transferData.supplier_quote_per_car_gbp && (
                                    <div>
                                      <span className="text-muted-foreground">Supplier Quote (GBP):</span>
                                      <span className="ml-2 font-medium">
                                        £{transferData.supplier_quote_per_car_gbp.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </span>
                                    </div>
                                  )}
                                  {transferData.price_per_car_gbp_markup && (
                                    <div>
                                      <span className="text-muted-foreground">Price with Markup (GBP):</span>
                                      <span className="ml-2 font-medium">
                                        £{transferData.price_per_car_gbp_markup.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </span>
                                    </div>
                                  )}
                                  {transferData.markup && (
                                    <div>
                                      <span className="text-muted-foreground">Markup:</span>
                                      <span className="ml-2 font-medium">
                                        {transferData.markup}%
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Transfer Summary */}
                            <div className="border-t border-border/30 pt-3">
                              <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-4">
                                  <span className="text-muted-foreground">
                                    Quantity: <span className="font-medium">{transfer.quantity || 1}</span>
                                  </span>
                                  {transfer.transferDirection === 'both' && (
                                    <span className="text-muted-foreground">
                                      Direction: <span className="font-medium">Both ways</span>
                                    </span>
                                  )}
                                  {transferData?.notes && (
                                    <span className="text-muted-foreground">
                                      Notes: <span className="font-medium">{transferData.notes}</span>
                                    </span>
                                  )}
                                </div>
                                <div className="text-right">
                                  <div className="font-semibold">
                                    Total: {formatCurrency(
                                      (transfer.price || 0) * (transfer.quantity || 1) * (transfer.transferDirection === 'both' ? 2 : 1), 
                                      quote.currency
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
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
                        <div key={index} className="space-y-4 p-4 bg-muted/50 rounded-lg border">
                          

                          {/* Outbound Flight Details */}
                          <div className="">
                            <div className="flex items-center gap-2 mb-2">
                              <Plane className="h-4 w-4 text-green-600" />
                              <span className="font-medium text-sm">Outbound Flight</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                              <div>
                                <span className="text-muted-foreground">Flight Number:</span>
                                <span className="ml-2 font-medium">
                                  {FlightApiService.formatFlightNumber(
                                    FlightApiService.getAirlineCode(flight),
                                    flight.outboundFlightNumber || flight.flightNumber || ''
                                  ) || 'TBD'}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Route:</span>
                                <span className="ml-2 font-medium">
                                  {flight.outboundDepartureAirportId || flight.origin} → {flight.outboundArrivalAirportId || flight.destination}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Airports:</span>
                                <span className="ml-2 font-medium">
                                  {flight.outboundDepartureAirportName || flight.outboundDepartureAirportId || flight.origin} → {flight.outboundArrivalAirportName || flight.outboundArrivalAirportId || flight.destination}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Departure:</span>
                                <span className="ml-2 font-medium">
                                  {flight.outboundDepartureDateTime ? new Date(flight.outboundDepartureDateTime).toLocaleString('en-GB', {
                                    weekday: 'short',
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  }) : 'TBD'}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Arrival:</span>
                                <span className="ml-2 font-medium">
                                  {flight.outboundArrivalDateTime ? new Date(flight.outboundArrivalDateTime).toLocaleString('en-GB', {
                                    weekday: 'short',
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  }) : 'TBD'}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Duration:</span>
                                <span className="ml-2 font-medium">
                                  {flight.outboundFlightDuration || flight.duration || 'TBD'}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Airline:</span>
                                <span className="ml-2 font-medium">
                                  {flight.outboundMarketingAirlineName || flight.outboundOperatingAirlineName || flight.airline || 'TBD'}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Aircraft:</span>
                                <span className="ml-2 font-medium">
                                  {flight.outboundAircraftType || flight.aircraft || 'TBD'}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Class:</span>
                                <span className="ml-2 font-medium">
                                  {flight.outboundCabinName || flight.outboundCabinId || flight.cabin || 'TBD'}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Terminals:</span>
                                <span className="ml-2 font-medium">
                                  {flight.outboundDepartureTerminal && flight.outboundArrivalTerminal ? 
                                    `${flight.outboundDepartureTerminal} → ${flight.outboundArrivalTerminal}` : 
                                    flight.departureTerminal && flight.arrivalTerminal ? 
                                    `${flight.departureTerminal} → ${flight.arrivalTerminal}` : 'TBD'
                                  }
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Stops:</span>
                                <span className="ml-2 font-medium">
                                  {flight.outboundStops?.length || flight.stops || 0} {flight.outboundStops?.length === 1 || flight.stops === 1 ? 'stop' : 'stops'}
                                </span>
                              </div>
                            </div>

                            {/* Multi-segment outbound flight display */}
                            {flight.outboundFlightSegments && flight.outboundFlightSegments.length > 0 && (
                              <div className="mt-3 p-3 bg-primary/5 rounded-lg">
                                <div className="text-sm font-medium mb-2">Flight Segments:</div>
                                {flight.outboundFlightSegments.map((segment: any, segmentIndex: number) => (
                                  <div key={segmentIndex} className="text-xs space-y-1 mb-2 last:mb-0">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">Segment {segment.segmentIndex || segmentIndex + 1}:</span>
                                      <span>{FlightApiService.formatFlightNumber(segment.marketingAirlineId, segment.flightNumber)}</span>
                                    </div>
                                    <div className="ml-4 text-muted-foreground">
                                      {segment.departureAirportName || segment.departureAirportId} → {segment.arrivalAirportName || segment.arrivalAirportId}
                                    </div>
                                    <div className="ml-4 text-muted-foreground">
                                      {segment.departureDateTime ? new Date(segment.departureDateTime).toLocaleString('en-GB', {
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      }) : ''} - {segment.arrivalDateTime ? new Date(segment.arrivalDateTime).toLocaleString('en-GB', {
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      }) : ''} ({segment.flightDuration})
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Baggage Information */}
                            {(flight.outboundCheckedBaggage || flight.outboundCarryOnBaggage || flight.outboundBaggageAllowance || flight.baggageAllowance) && (
                              <div className="mt-3 p-3 bg-secondary/10 rounded-lg">
                                <div className="text-sm font-medium mb-2">Baggage:</div>
                                <div className="space-y-1 text-xs">
                                  {flight.outboundCheckedBaggage && (
                                    <div className="flex items-center gap-1">
                                      <span className="font-medium">Checked:</span>
                                      {flight.outboundCheckedBaggage.pieces && <span>{flight.outboundCheckedBaggage.pieces} piece{flight.outboundCheckedBaggage.pieces !== 1 ? 's' : ''}</span>}
                                      {flight.outboundCheckedBaggage.weight && <span>{flight.outboundCheckedBaggage.weight} {flight.outboundCheckedBaggage.weightUnit}</span>}
                                      {flight.outboundCheckedBaggage.dimensions && <span>({flight.outboundCheckedBaggage.dimensions})</span>}
                          </div>
                                  )}
                                  {flight.outboundCarryOnBaggage && (
                                    <div className="flex items-center gap-1">
                                      <span className="font-medium">Carry-on:</span>
                                      {flight.outboundCarryOnBaggage.pieces && <span>{flight.outboundCarryOnBaggage.pieces} piece{flight.outboundCarryOnBaggage.pieces !== 1 ? 's' : ''}</span>}
                                      {flight.outboundCarryOnBaggage.weight && <span>{flight.outboundCarryOnBaggage.weight} {flight.outboundCarryOnBaggage.weightUnit}</span>}
                                      {flight.outboundCarryOnBaggage.dimensions && <span>({flight.outboundCarryOnBaggage.dimensions})</span>}
                                    </div>
                                  )}
                                  {flight.outboundBaggageAllowance && !flight.outboundCheckedBaggage && !flight.outboundCarryOnBaggage && (
                                    <div className="flex items-center gap-1">
                                      <span>
                                        {typeof flight.outboundBaggageAllowance === 'string'
                                          ? flight.outboundBaggageAllowance
                                          : flight.outboundBaggageAllowance.pieces
                                            ? `${flight.outboundBaggageAllowance.pieces} pieces`
                                            : flight.outboundBaggageAllowance.weight
                                              ? `${flight.outboundBaggageAllowance.weight}${flight.outboundBaggageAllowance.weightUnit || 'kg'}`
                                              : 'Baggage included'
                                        }
                                      </span>
                                    </div>
                                  )}
                                  {flight.baggageAllowance && !flight.outboundCheckedBaggage && !flight.outboundCarryOnBaggage && !flight.outboundBaggageAllowance && (
                                    <div className="flex items-center gap-1">
                                      <span>
                                        {typeof flight.baggageAllowance === 'string'
                                          ? flight.baggageAllowance
                                          : flight.baggageAllowance.NumberOfPieces
                                            ? `${flight.baggageAllowance.NumberOfPieces} pieces`
                                            : flight.baggageAllowance.WeightInKilograms
                                              ? `${flight.baggageAllowance.WeightInKilograms}kg`
                                              : 'Baggage included'
                                        }
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Inbound Flight Details (if return flight) */}
                          {flight.returnDate && (flight.inboundFlightNumber || flight.returnFlightNumber) && (
                            <div className="border-t border-border/30 pt-3">
                              <div className="flex items-center gap-2 mb-2">
                                <Plane className="h-4 w-4 text-blue-600" />
                                <span className="font-medium text-sm">Return Flight</span>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                <div>
                                  <span className="text-muted-foreground">Flight Number:</span>
                                  <span className="ml-2 font-medium">
                                    {FlightApiService.formatFlightNumber(
                                      FlightApiService.getAirlineCode(flight),
                                      flight.inboundFlightNumber || flight.returnFlightNumber || ''
                                    ) || 'TBD'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Route:</span>
                                  <span className="ml-2 font-medium">
                                    {flight.inboundDepartureAirportId} → {flight.inboundArrivalAirportId}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Airports:</span>
                                  <span className="ml-2 font-medium">
                                    {flight.inboundDepartureAirportName || flight.inboundDepartureAirportId} → {flight.inboundArrivalAirportName || flight.inboundArrivalAirportId}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Departure:</span>
                                  <span className="ml-2 font-medium">
                                    {flight.inboundDepartureDateTime ? new Date(flight.inboundDepartureDateTime).toLocaleString('en-GB', {
                                      weekday: 'short',
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    }) : 'TBD'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Arrival:</span>
                                  <span className="ml-2 font-medium">
                                    {flight.inboundArrivalDateTime ? new Date(flight.inboundArrivalDateTime).toLocaleString('en-GB', {
                                      weekday: 'short',
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    }) : 'TBD'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Duration:</span>
                                  <span className="ml-2 font-medium">
                                    {flight.inboundFlightDuration || flight.returnDuration || 'TBD'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Airline:</span>
                                  <span className="ml-2 font-medium">
                                    {flight.inboundMarketingAirlineName || flight.inboundOperatingAirlineName || 'TBD'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Aircraft:</span>
                                  <span className="ml-2 font-medium">
                                    {flight.inboundAircraftType || flight.returnAircraft || 'TBD'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Class:</span>
                                  <span className="ml-2 font-medium">
                                    {flight.inboundCabinName || flight.inboundCabinId || 'TBD'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Terminals:</span>
                                  <span className="ml-2 font-medium">
                                    {flight.inboundDepartureTerminal && flight.inboundArrivalTerminal ? 
                                      `${flight.inboundDepartureTerminal} → ${flight.inboundArrivalTerminal}` : 
                                      flight.returnDepartureTerminal && flight.returnArrivalTerminal ? 
                                      `${flight.returnDepartureTerminal} → ${flight.returnArrivalTerminal}` : 'TBD'
                                    }
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Stops:</span>
                                  <span className="ml-2 font-medium">
                                    {flight.inboundStops?.length || flight.returnStops || 0} {flight.inboundStops?.length === 1 || flight.returnStops === 1 ? 'stop' : 'stops'}
                                  </span>
                                </div>
                              </div>

                              {/* Multi-segment return flight display */}
                              {flight.returnFlightSegments && flight.returnFlightSegments.length > 0 && (
                                <div className="mt-3 p-3 bg-primary/5 rounded-lg">
                                  <div className="text-sm font-medium mb-2">Flight Segments:</div>
                                  {flight.returnFlightSegments.map((segment: any, segmentIndex: number) => (
                                    <div key={segmentIndex} className="text-xs space-y-1 mb-2 last:mb-0">
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium">Segment {segment.segmentIndex || segmentIndex + 1}:</span>
                                        <span>{FlightApiService.formatFlightNumber(segment.marketingAirlineId, segment.flightNumber)}</span>
                                      </div>
                                      <div className="ml-4 text-muted-foreground">
                                        {segment.departureAirportName || segment.departureAirportId} → {segment.arrivalAirportName || segment.arrivalAirportId}
                                      </div>
                                      <div className="ml-4 text-muted-foreground">
                                        {segment.departureDateTime ? new Date(segment.departureDateTime).toLocaleString('en-GB', {
                                          month: 'short',
                                          day: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        }) : ''} - {segment.arrivalDateTime ? new Date(segment.arrivalDateTime).toLocaleString('en-GB', {
                                          month: 'short',
                                          day: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        }) : ''} ({segment.flightDuration})
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Baggage Information for Return Flight */}
                              {(flight.inboundCheckedBaggage || flight.inboundCarryOnBaggage || flight.inboundBaggageAllowance) && (
                                <div className="mt-3 p-3 bg-secondary/10 rounded-lg">
                                  <div className="text-sm font-medium mb-2">Baggage:</div>
                                  <div className="space-y-1 text-xs">
                                    {flight.inboundCheckedBaggage && (
                                      <div className="flex items-center gap-1">
                                        <span className="font-medium">Checked:</span>
                                        {flight.inboundCheckedBaggage.pieces && <span>{flight.inboundCheckedBaggage.pieces} piece{flight.inboundCheckedBaggage.pieces !== 1 ? 's' : ''}</span>}
                                        {flight.inboundCheckedBaggage.weight && <span>{flight.inboundCheckedBaggage.weight} {flight.inboundCheckedBaggage.weightUnit}</span>}
                                        {flight.inboundCheckedBaggage.dimensions && <span>({flight.inboundCheckedBaggage.dimensions})</span>}
                                      </div>
                                    )}
                                    {flight.inboundCarryOnBaggage && (
                                      <div className="flex items-center gap-1">
                                        <span className="font-medium">Carry-on:</span>
                                        {flight.inboundCarryOnBaggage.pieces && <span>{flight.inboundCarryOnBaggage.pieces} piece{flight.inboundCarryOnBaggage.pieces !== 1 ? 's' : ''}</span>}
                                        {flight.inboundCarryOnBaggage.weight && <span>{flight.inboundCarryOnBaggage.weight} {flight.inboundCarryOnBaggage.weightUnit}</span>}
                                        {flight.inboundCarryOnBaggage.dimensions && <span>({flight.inboundCarryOnBaggage.dimensions})</span>}
                                      </div>
                                    )}
                                    {flight.inboundBaggageAllowance && !flight.inboundCheckedBaggage && !flight.inboundCarryOnBaggage && (
                                      <div className="flex items-center gap-1">
                                        <span>
                                          {typeof flight.inboundBaggageAllowance === 'string'
                                            ? flight.inboundBaggageAllowance
                                            : flight.inboundBaggageAllowance.pieces
                                              ? `${flight.inboundBaggageAllowance.pieces} pieces`
                                              : flight.inboundBaggageAllowance.weight
                                                ? `${flight.inboundBaggageAllowance.weight}${flight.inboundBaggageAllowance.weightUnit || 'kg'}`
                                                : 'Baggage included'
                                          }
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Fare and Pricing Details */}
                          {(flight.fareTypeName || flight.fareSubTypeName || flight.revenueStreamName || flight.baseFare || flight.taxes || flight.fees) && (
                            <div className="border-t border-border/30 pt-3">
                              <div className="flex items-center gap-2 mb-2">
                                <CreditCard className="h-4 w-4 text-purple-600" />
                                <span className="font-medium text-sm">Fare Details</span>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                {flight.fareTypeName && (
                                  <div>
                                    <span className="text-muted-foreground">Fare Type:</span>
                                    <span className="ml-2 font-medium">{flight.fareTypeName}</span>
                                  </div>
                                )}
                                {flight.fareSubTypeName && (
                                  <div>
                                    <span className="text-muted-foreground">Fare Sub-Type:</span>
                                    <span className="ml-2 font-medium">{flight.fareSubTypeName}</span>
                                  </div>
                                )}
                                {flight.revenueStreamName && (
                                  <div>
                                    <span className="text-muted-foreground">Revenue Stream:</span>
                                    <span className="ml-2 font-medium">{flight.revenueStreamName}</span>
                                  </div>
                                )}
                                {flight.baseFare && (
                                  <div>
                                    <span className="text-muted-foreground">Base Fare:</span>
                                    <span className="ml-2 font-medium">
                                      {flight.currencySymbol || flight.currencyId || '£'}{flight.baseFare.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                  </div>
                                )}
                                {flight.taxes && (
                                  <div>
                                    <span className="text-muted-foreground">Taxes:</span>
                                    <span className="ml-2 font-medium">
                                      {flight.currencySymbol || flight.currencyId || '£'}{flight.taxes.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                  </div>
                                )}
                                {flight.fees && (
                                  <div>
                                    <span className="text-muted-foreground">Fees:</span>
                                    <span className="ml-2 font-medium">
                                      {flight.currencySymbol || flight.currencyId || '£'}{flight.fees.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                  </div>
                                )}
                                {flight.ticketingDeadline && (
                                  <div>
                                    <span className="text-muted-foreground">Ticketing Deadline:</span>
                                    <span className="ml-2 font-medium">
                                      {new Date(flight.ticketingDeadline).toLocaleDateString('en-GB')}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Flight Summary */}
                          <div className="border-t border-border/30 pt-3 mt-3">
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-4">
                                <span className="text-muted-foreground">
                                  Passengers: <span className="font-medium">{flight.passengers || 1}</span>
                                </span>
                                {flight.refundable !== undefined && (
                                  <span className="text-muted-foreground">
                                    Refundable: <span className="font-medium">{flight.refundable ? 'Yes' : 'No'}</span>
                                  </span>
                                )}
                                {flight.validatingAirlineName && (
                                  <span className="text-muted-foreground">
                                    Validating: <span className="font-medium">{flight.validatingAirlineName}</span>
                                  </span>
                                )}
                                {flight.skytraxRating && (
                                  <span className="text-muted-foreground">
                                    Rating: <span className="font-medium">{flight.skytraxRating}/5</span>
                                  </span>
                                )}
                              </div>
                              <div className="text-right">
                                <div className="font-semibold">
                                  Total: {formatCurrency((flight.price || 0) * (flight.passengers || 1), quote.currency)}
                                </div>
                              </div>
                            </div>
                          </div>
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