import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { BookingService, Booking } from '@/lib/bookingService';
import { ArrowLeft, Save, X } from 'lucide-react';
import { toast } from 'sonner';

interface BookingWithDetails extends Booking {
  quote?: {
    client_name: string;
    event_name?: string;
    event_location?: string;
  };
}

export default function EditBooking() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<BookingWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    status: '',
    booking_notes: '',
    internal_notes: '',
    special_requests: ''
  });

  useEffect(() => {
    if (bookingId) {
      loadBooking();
    }
  }, [bookingId]);

  const loadBooking = async () => {
    try {
      setIsLoading(true);
      
      const { data: bookingData, error } = await supabase
        .from('bookings')
        .select(`
          *,
          quote:quotes!bookings_quote_id_fkey(
            client_name,
            event_name,
            event_location
          )
        `)
        .eq('id', bookingId)
        .single();

      if (error) {
        throw new Error(`Failed to fetch booking: ${error.message}`);
      }

      setBooking(bookingData);
      setFormData({
        status: bookingData.status,
        booking_notes: bookingData.booking_notes || '',
        internal_notes: bookingData.internal_notes || '',
        special_requests: bookingData.special_requests || ''
      });
    } catch (error) {
      console.error('Failed to load booking:', error);
      toast.error('Failed to load booking details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!booking) return;

    try {
      setIsSaving(true);
      
      const { error } = await supabase
        .from('bookings')
        .update({
          status: formData.status,
          booking_notes: formData.booking_notes,
          internal_notes: formData.internal_notes,
          special_requests: formData.special_requests,
          updated_at: new Date().toISOString()
        })
        .eq('id', booking.id);

      if (error) throw error;

      toast.success('Booking updated successfully');
      navigate(`/booking/${booking.id}`);
    } catch (error) {
      console.error('Failed to update booking:', error);
      toast.error('Failed to update booking');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(`/booking/${bookingId}`);
  };

  if (isLoading) {
    return (
      <div className="mx-auto px-8 py-8">
        <div className="text-center py-16">
          <div className="mx-auto w-16 h-16 bg-muted rounded-xl flex items-center justify-center mb-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
          <h3 className="text-lg font-semibold mb-3">Loading booking...</h3>
          <p className="text-muted-foreground">Please wait while we fetch the booking details</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="mx-auto px-8 py-8">
        <div className="text-center py-16">
          <div className="mx-auto w-16 h-16 bg-muted rounded-xl flex items-center justify-center mb-6">
            <X className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-3">Booking not found</h3>
          <p className="text-muted-foreground mb-6">The booking you're looking for doesn't exist or you don't have permission to edit it.</p>
          <Button asChild>
            <Link to="/bookings">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Bookings
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link to={`/booking/${booking.id}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Edit Booking</h1>
            <p className="text-muted-foreground">
              {booking.booking_reference} • {booking.quote?.event_name}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleCancel}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Edit Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="bookingReference">Booking Reference</Label>
              <Input
                id="bookingReference"
                value={booking.booking_reference}
                disabled
                className="bg-muted"
              />
            </div>
            
            <div>
              <Label htmlFor="clientName">Client Name</Label>
              <Input
                id="clientName"
                value={booking.quote?.client_name || ''}
                disabled
                className="bg-muted"
              />
            </div>
            
            <div>
              <Label htmlFor="eventName">Event</Label>
              <Input
                id="eventName"
                value={booking.quote?.event_name || ''}
                disabled
                className="bg-muted"
              />
            </div>
            
            <div>
              <Label htmlFor="totalPrice">Total Price</Label>
              <Input
                id="totalPrice"
                value={`${booking.currency} ${booking.total_price}`}
                disabled
                className="bg-muted"
              />
            </div>
          </CardContent>
        </Card>

        {/* Booking Details */}
        <Card>
          <CardHeader>
            <CardTitle>Booking Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="provisional">Provisional</SelectItem>
                  <SelectItem value="pending_payment">Pending Payment</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="bookingNotes">Booking Notes</Label>
              <Textarea
                id="bookingNotes"
                value={formData.booking_notes}
                onChange={(e) => setFormData({...formData, booking_notes: e.target.value})}
                placeholder="Notes for the client..."
                rows={4}
              />
            </div>
            
            <div>
              <Label htmlFor="internalNotes">Internal Notes</Label>
              <Textarea
                id="internalNotes"
                value={formData.internal_notes}
                onChange={(e) => setFormData({...formData, internal_notes: e.target.value})}
                placeholder="Internal notes..."
                rows={4}
              />
            </div>
            
            <div>
              <Label htmlFor="specialRequests">Special Requests</Label>
              <Textarea
                id="specialRequests"
                value={formData.special_requests}
                onChange={(e) => setFormData({...formData, special_requests: e.target.value})}
                placeholder="Special requests..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timestamps */}
      <Card>
        <CardHeader>
          <CardTitle>Timestamps</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Created</Label>
              <p className="text-sm text-muted-foreground">
                {new Date(booking.created_at).toLocaleString()}
              </p>
            </div>
            <div>
              <Label>Last Updated</Label>
              <p className="text-sm text-muted-foreground">
                {new Date(booking.updated_at).toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 