import React, { useEffect, useState } from 'react';
import { useForm, useFieldArray, FormProvider } from 'react-hook-form';
import { extractBookingDataFromQuote } from '@/lib/bookingService';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

// Placeholder for API call
async function createBooking(data: any) {
  // TODO: Implement backend call
  return new Promise((resolve) => setTimeout(() => resolve('booking-id'), 1000));
}

export function CreateBookingFromQuote({ quote }: { quote: any }) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bookingData, setBookingData] = useState<any | null>(null);

  // Extract initial data from quote
  useEffect(() => {
    if (quote) {
      setBookingData(extractBookingDataFromQuote(quote));
    }
  }, [quote]);

  // Set up react-hook-form
  const methods = useForm({
    defaultValues: bookingData || {},
    mode: 'onBlur',
  });
  const { register, handleSubmit, control, setValue, watch, reset, formState: { errors } } = methods;

  // Update form when quote changes: robustly prefill lead traveler fields from quote
  useEffect(() => {
    if (quote) {
      // Prefer camelCase, fallback to snake_case
      const clientName = quote.clientName || quote.client_name || '';
      const [firstName, ...lastNameParts] = clientName.split(' ');
      const lastName = lastNameParts.join(' ');
      const clientEmail = quote.clientEmail || quote.client_email || '';
      const clientPhone = quote.clientPhone || quote.client_phone || '';
      const clientAddress = quote.clientAddress || quote.client_address || '';

      // Guest count logic (adults - 1 for lead, plus children)
      let guestCount = 0;
      if (quote.travelers && typeof quote.travelers === 'object') {
        guestCount = (quote.travelers.adults || 1) - 1 + (quote.travelers.children || 0);
      } else if (quote.travelersAdults || quote.travelers_adults) {
        guestCount = (parseInt(quote.travelersAdults || quote.travelers_adults) || 1) - 1 + (parseInt(quote.travelersChildren || quote.travelers_children) || 0);
      }

      // Payments logic (show all 3 fields, even if zero)
      const payments = [
        {
          paymentType: 'deposit',
          amount: Number(quote.paymentDeposit || quote.payment_deposit) || 0,
          dueDate: quote.paymentDepositDate || quote.payment_deposit_date || format(new Date(), 'yyyy-MM-dd'),
        },
        {
          paymentType: 'second_payment',
          amount: Number(quote.paymentSecondPayment || quote.payment_second_payment) || 0,
          dueDate: quote.paymentSecondPaymentDate || quote.payment_second_payment_date || '',
        },
        {
          paymentType: 'final_payment',
          amount: Number(quote.paymentFinalPayment || quote.payment_final_payment) || 0,
          dueDate: quote.paymentFinalPaymentDate || quote.payment_final_payment_date || '',
        },
      ];

      // Components logic (fallback to [] if missing or not an array)
      let components: any[] = [];
      try {
        const raw = quote.selectedComponents || quote.selected_components || [];
        if (Array.isArray(raw)) {
          components = raw;
        } else if (raw && typeof raw === 'object') {
          // If it's an object (grouped by type), flatten to array
          components = Object.values(raw).flat().filter(Boolean);
        } else {
          components = [];
        }
      } catch {
        components = [];
      }

      // Reset form with robust mapping
      reset({
        leadTraveler: {
          firstName: firstName || '',
          lastName: lastName || '',
          email: clientEmail,
          phone: clientPhone,
          address: clientAddress,
        },
        guestTravelers: Array.from({ length: guestCount }).map(() => ({ firstName: '', lastName: '' })),
        components: components.map((c: any) => ({ ...c, bookingRef: '' })),
        payments,
        internalNotes: quote.internalNotes || quote.internal_notes || '',
        specialRequests: '',
      }, { keepDefaultValues: false });
    }
  }, [quote, reset]);

  // Guest travelers field array
  const { fields: guestFields } = useFieldArray({
    control,
    name: 'guestTravelers',
  });

  // Components field array
  const { fields: componentFields } = useFieldArray({
    control,
    name: 'components',
  });

  // Payments field array
  const { fields: paymentFields } = useFieldArray({
    control,
    name: 'payments',
  });

  // Submit handler
  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      // Validate required fields (lead traveler, guests, booking refs, payments)
      if (!data.leadTraveler.firstName || !data.leadTraveler.lastName || !data.leadTraveler.email || !data.leadTraveler.phone) {
        toast.error('Lead traveler first name, last name, email, and phone are required.');
        setLoading(false);
        return;
      }
      for (const guest of data.guestTravelers) {
        if (!guest.firstName || !guest.lastName) {
          toast.error('All guest travelers must have first and last names.');
          setLoading(false);
          return;
        }
      }
      for (const comp of data.components) {
        if (comp.type === 'flight' && !comp.bookingRef) {
          toast.error('Flight booking reference is required.');
          setLoading(false);
          return;
        }
        if (comp.type === 'lounge_pass' && !comp.bookingRef) {
          toast.error('Lounge pass booking reference is required.');
          setLoading(false);
          return;
        }
      }
      for (const pay of data.payments) {
        if (!pay.amount || !pay.dueDate) {
          toast.error('All payments must have an amount and due date.');
          setLoading(false);
          return;
        }
      }
      // Call backend (placeholder)
      await createBooking(data);
      toast.success('Booking created successfully!');
      // Optionally reset or redirect
    } catch (err) {
      toast.error('Failed to create booking.');
    } finally {
      setLoading(false);
    }
  };

  if (!bookingData) return <div>Loading quote data...</div>;

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Quote Summary Card */}
        <Card className="max-w-2xl mx-auto my-8 mb-4 border-primary border-2 bg-gradient-to-b from-primary/5 to-background/10">
          <CardHeader>
            <CardTitle>Quote Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex flex-wrap gap-4">
              <div>
                <span className="font-semibold">Quote #:</span> {quote.quote_number || quote.quoteNumber}
              </div>
              <div>
                <span className="font-semibold">Client:</span> {quote.client_name || quote.clientName}
              </div>
              <div>
                <span className="font-semibold">Event:</span> {quote.event_name || quote.eventName}
              </div>
              <div>
                <span className="font-semibold">Dates:</span> {quote.event_start_date || quote.eventStartDate} - {quote.event_end_date || quote.eventEndDate}
              </div>
              <div>
                <span className="font-semibold">Total:</span> {quote.currency} {quote.total_price || quote.totalPrice}
              </div>
              <div>
                <span className="font-semibold">Status:</span> {quote.status}
              </div>
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              <span className="font-semibold">Package:</span> {quote.package_name || quote.packageName} | <span className="font-semibold">Tier:</span> {quote.tier_name || quote.tierName}
            </div>
            {quote.internal_notes && (
              <div className="text-xs text-muted-foreground mt-1">
                <span className="font-semibold">Notes:</span> {quote.internal_notes}
              </div>
            )}
          </CardContent>
        </Card>
        {/* End Quote Summary Card */}
        <Card className="max-w-2xl mx-auto my-8">
          <CardHeader>
            <CardTitle>Create Booking from Quote</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Lead Traveler Section */}
            <div>
              <h3 className="font-semibold mb-2">Lead Traveler</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="leadTraveler.firstName">First Name</Label>
                  <Input id="leadTraveler.firstName" {...register('leadTraveler.firstName', { required: true })} />
                </div>
                <div>
                  <Label htmlFor="leadTraveler.lastName">Last Name</Label>
                  <Input id="leadTraveler.lastName" {...register('leadTraveler.lastName', { required: true })} />
                </div>
                <div>
                  <Label htmlFor="leadTraveler.email">Email</Label>
                  <Input id="leadTraveler.email" type="email" {...register('leadTraveler.email', { required: true })} />
                </div>
                <div>
                  <Label htmlFor="leadTraveler.phone">Phone</Label>
                  <Input id="leadTraveler.phone" {...register('leadTraveler.phone', { required: true })} />
                </div>
              </div>
              <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => setShowAdvanced((v) => !v)}>
                {showAdvanced ? 'Hide Advanced' : 'Show Advanced'}
              </Button>
              {showAdvanced && (
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <Label htmlFor="leadTraveler.dateOfBirth">Date of Birth</Label>
                    <Input id="leadTraveler.dateOfBirth" type="date" {...register('leadTraveler.dateOfBirth')} />
                  </div>
                  <div>
                    <Label htmlFor="leadTraveler.passportNumber">Passport Number</Label>
                    <Input id="leadTraveler.passportNumber" {...register('leadTraveler.passportNumber')} />
                  </div>
                  <div>
                    <Label htmlFor="leadTraveler.nationality">Nationality</Label>
                    <Input id="leadTraveler.nationality" {...register('leadTraveler.nationality')} />
                  </div>
                  <div>
                    <Label htmlFor="leadTraveler.dietaryRestrictions">Dietary Requirements</Label>
                    <Input id="leadTraveler.dietaryRestrictions" {...register('leadTraveler.dietaryRestrictions')} />
                  </div>
                  <div>
                    <Label htmlFor="leadTraveler.accessibilityNeeds">Accessibility Needs</Label>
                    <Input id="leadTraveler.accessibilityNeeds" {...register('leadTraveler.accessibilityNeeds')} />
                  </div>
                  <div>
                    <Label htmlFor="leadTraveler.specialRequests">Special Requests</Label>
                    <Input id="leadTraveler.specialRequests" {...register('leadTraveler.specialRequests')} />
                  </div>
                </div>
              )}
            </div>
            <Separator />
            {/* Guest Travelers Section */}
            <div>
              <h3 className="font-semibold mb-2">Guest Travelers</h3>
              {guestFields.length === 0 && <div className="text-muted-foreground text-sm">No guests</div>}
              <div className="grid grid-cols-2 gap-4">
                {guestFields.map((field, i) => (
                  <React.Fragment key={field.id}>
                    <div>
                      <Label htmlFor={`guestTravelers.${i}.firstName`}>{`Guest ${i + 1} First Name`}</Label>
                      <Input id={`guestTravelers.${i}.firstName`} {...register(`guestTravelers.${i}.firstName`, { required: true })} />
                    </div>
                    <div>
                      <Label htmlFor={`guestTravelers.${i}.lastName`}>{`Guest ${i + 1} Last Name`}</Label>
                      <Input id={`guestTravelers.${i}.lastName`} {...register(`guestTravelers.${i}.lastName`, { required: true })} />
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </div>
            <Separator />
            {/* Components Section */}
            <div>
              <h3 className="font-semibold mb-2">Components</h3>
              {componentFields.map((field, i) => {
                // Type guard for expected component field shape
                const comp = field as any;
                return (
                  <div key={field.id} className="mb-4 border rounded p-3">
                    <div className="font-medium mb-1">{comp && typeof comp === 'object' && 'name' in comp ? comp.name : ''} ({comp && typeof comp === 'object' && 'type' in comp ? comp.type : ''})</div>
                    <div className="text-xs text-muted-foreground mb-2">{comp && typeof comp === 'object' && 'description' in comp ? comp.description : ''}</div>
                    {comp && comp.type === 'flight' && (
                      <div>
                        <Label htmlFor={`components.${i}.bookingRef`}>Flight Booking Reference (PNR)</Label>
                        <Input id={`components.${i}.bookingRef`} {...register(`components.${i}.bookingRef`, { required: true })} />
                      </div>
                    )}
                    {comp && comp.type === 'lounge_pass' && (
                      <div>
                        <Label htmlFor={`components.${i}.bookingRef`}>Lounge Pass Booking Reference</Label>
                        <Input id={`components.${i}.bookingRef`} {...register(`components.${i}.bookingRef`, { required: true })} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <Separator />
            {/* Payments Section */}
            <div>
              <h3 className="font-semibold mb-2">Payment Schedule</h3>
              <div className="grid grid-cols-2 gap-4">
                {paymentFields.map((field, i) => {
                  const pay = field as any;
                  return (
                    <React.Fragment key={field.id}>
                      <div>
                        <Label htmlFor={`payments.${i}.amount`}>{`Amount (${pay && typeof pay === 'object' && 'paymentType' in pay ? pay.paymentType : ''})`}</Label>
                        <Input id={`payments.${i}.amount`} type="number" step="0.01" {...register(`payments.${i}.amount`, { required: true })} />
                      </div>
                      <div>
                        <Label htmlFor={`payments.${i}.dueDate`}>{`Due Date (${pay && typeof pay === 'object' && 'paymentType' in pay ? pay.paymentType : ''})`}</Label>
                        <Input id={`payments.${i}.dueDate`} type="date" {...register(`payments.${i}.dueDate`, { required: true })} />
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
            <Separator />
            {/* Other Section */}
            <div>
              <h3 className="font-semibold mb-2">Other</h3>
              <div>
                <Label htmlFor="internalNotes">Internal Notes</Label>
                <Textarea id="internalNotes" {...register('internalNotes')} />
              </div>
              <div>
                <Label htmlFor="specialRequests">Special Requests</Label>
                <Textarea id="specialRequests" {...register('specialRequests')} />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Creating Booking...' : 'Create Booking'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </FormProvider>
  );
} 