import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Package, 
  MapPin, 
  Plane, 
  Car, 
  Calendar,
  DollarSign,
  FileText,
  Share,
  Download,
  Eye
} from 'lucide-react';
import { Package as PackageType } from '@/types/packages';

interface StepReviewProps {
  form: UseFormReturn<PackageType>;
}

export function StepReview({ form }: StepReviewProps) {
  const { watch } = form;
  const packageData = watch();

  const formatCurrency = (amount: number, currency: string) => {
    return `${amount} ${currency}`;
  };

  const renderDestinations = () => {
    return packageData.destinations?.map((dest, index) => (
      <div key={index} className="border rounded-lg p-4 space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="font-medium">{dest.name}</h4>
          <Badge variant="outline">{dest.stayLength} nights</Badge>
        </div>
        {dest.country && <p className="text-sm text-muted-foreground">{dest.country}</p>}
        {dest.hotel && (
          <div className="text-sm">
            <strong>Hotel:</strong> {dest.hotel.type === 'api' ? dest.hotel.apiHotel?.name : dest.hotel.manualHotel?.name}
          </div>
        )}
      </div>
    ));
  };

  const renderFlights = () => {
    if (!packageData.flights?.enabled) return <p className="text-muted-foreground">No flights included</p>;
    
    return (
      <div className="space-y-2">
        <div className="flex justify-between">
          <span>Route:</span>
          <span>{packageData.flights.fromCity} → {packageData.flights.toCity}</span>
        </div>
        {packageData.flights.cabinClass && (
          <div className="flex justify-between">
            <span>Cabin:</span>
            <span className="capitalize">{packageData.flights.cabinClass.replace('_', ' ')}</span>
          </div>
        )}
        {packageData.flights.estimatedCost && (
          <div className="flex justify-between">
            <span>Estimated Cost:</span>
            <span>{formatCurrency(packageData.flights.estimatedCost, packageData.pricing.currency)}</span>
          </div>
        )}
        {packageData.flights.quoteSeparately && (
          <Badge variant="secondary">Quote separately</Badge>
        )}
      </div>
    );
  };

  const renderTransfers = () => {
    if (!packageData.transfers?.length) return <p className="text-muted-foreground">No transfers included</p>;
    
    return packageData.transfers.map((transfer, index) => (
      <div key={index} className="border rounded-lg p-3 space-y-1">
        <div className="flex justify-between items-center">
          <span className="font-medium capitalize">{transfer.type.replace('_', ' ')}</span>
          <Badge variant="outline">{transfer.vehicle}</Badge>
        </div>
        <div className="text-sm text-muted-foreground">
          {transfer.fromLocation} → {transfer.toLocation}
        </div>
        {transfer.estimatedCost && (
          <div className="text-sm">
            Est. Cost: {formatCurrency(transfer.estimatedCost, packageData.pricing.currency)}
          </div>
        )}
      </div>
    ));
  };

  const renderEvents = () => {
    if (!packageData.events?.length) return <p className="text-muted-foreground">No events included</p>;
    
    return packageData.events.map((event, index) => (
      <div key={index} className="border rounded-lg p-3 space-y-1">
        <div className="flex justify-between items-start">
          <h4 className="font-medium">{event.name}</h4>
          {event.isAddOn && <Badge variant="secondary">Add-on</Badge>}
        </div>
        {event.location && <p className="text-sm text-muted-foreground">{event.location}</p>}
        {event.cost && (
          <div className="text-sm">
            Cost: {formatCurrency(event.cost, packageData.pricing.currency)}
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Review Your Package</h2>
        <p className="text-muted-foreground">
          Review all the details before publishing your package
        </p>
      </div>

      {/* Package Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Package Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold text-lg">{packageData.name}</h3>
              {packageData.description && (
                <p className="text-muted-foreground mt-1">{packageData.description}</p>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Duration:</span>
                <span>{packageData.durationDays} days</span>
              </div>
              <div className="flex justify-between">
                <span>Travelers:</span>
                <span>
                  {packageData.minTravelers}
                  {packageData.maxTravelers && `-${packageData.maxTravelers}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <Badge variant={packageData.isPublic ? "default" : "secondary"}>
                  {packageData.isPublic ? "Public" : "Private"}
                </Badge>
              </div>
            </div>
          </div>
          
          {packageData.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {packageData.tags.map((tag) => (
                <Badge key={tag} variant="outline">{tag}</Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Destinations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Destinations & Hotels
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {renderDestinations()}
          </div>
        </CardContent>
      </Card>

      {/* Flights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plane className="w-5 h-5" />
            Flights
          </CardTitle>
        </CardHeader>
        <CardContent>
          {renderFlights()}
        </CardContent>
      </Card>

      {/* Transfers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="w-5 h-5" />
            Transfers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {renderTransfers()}
          </div>
        </CardContent>
      </Card>

      {/* Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Events & Activities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {renderEvents()}
          </div>
        </CardContent>
      </Card>

      {/* Pricing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Pricing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Base Price:</span>
                <span className="font-medium">
                  {formatCurrency(packageData.pricing.basePrice, packageData.pricing.currency)}
                  {packageData.pricing.pricingType === 'per_person' && ' per person'}
                  {packageData.pricing.pricingType === 'per_group' && ' per group'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Pricing Type:</span>
                <span className="capitalize">{packageData.pricing.pricingType.replace('_', ' ')}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Margin:</span>
                <span className="font-medium">
                  {packageData.pricing.marginValue}
                  {packageData.pricing.marginType === 'percentage' ? '%' : ` ${packageData.pricing.currency}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Margin Type:</span>
                <span className="capitalize">{packageData.pricing.marginType}</span>
              </div>
            </div>
          </div>
          
          {packageData.pricing.internalNotes && (
            <div className="pt-2 border-t">
              <p className="text-sm text-muted-foreground">
                <strong>Internal Notes:</strong> {packageData.pricing.internalNotes}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Itinerary Text */}
      {packageData.itineraryText && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Generated Itinerary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{packageData.itineraryText}</p>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 justify-center">
        <Button variant="outline">
          <Eye className="w-4 h-4 mr-2" />
          Preview
        </Button>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export as Quote
        </Button>
        <Button variant="outline">
          <FileText className="w-4 h-4 mr-2" />
          Load into Quote Builder
        </Button>
        <Button variant="outline">
          <Share className="w-4 h-4 mr-2" />
          Generate Shareable Link
        </Button>
      </div>
    </div>
  );
} 