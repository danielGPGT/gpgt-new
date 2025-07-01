import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Users, 
  Calendar, 
  MapPin, 
  DollarSign, 
  Heart, 
  Plane, 
  Hotel, 
  Car, 
  Calendar as CalendarIcon,
  CheckCircle,
  Clock,
  Building2,
  Mail,
  Phone
} from 'lucide-react';

import { NewIntake } from '@/types/newIntake';

interface NewIntakePreviewProps {
  data: Partial<NewIntake>;
}

export function NewIntakePreview({ data }: NewIntakePreviewProps) {
  const { client, tripDetails, preferences, flights, hotels, transfers, events } = data;

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'GBP',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Card className="w-full h-fit sticky top-8">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <CheckCircle className="w-5 h-5 text-green-600" />
          Quote Preview
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-12rem)]">
          <div className="space-y-6 p-6">
            {/* Client Information */}
            {client && (client.firstName || client.email) && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-4 h-4 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">Client</h3>
                </div>
                <div className="space-y-2 text-sm">
                  {client.firstName && client.lastName && (
                    <div className="font-medium">
                      {client.firstName} {client.lastName}
                    </div>
                  )}
                  {client.email && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="w-3 h-3" />
                      {client.email}
                    </div>
                  )}
                  {client.phone && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="w-3 h-3" />
                      {client.phone}
                    </div>
                  )}
                  {client.company && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Building2 className="w-3 h-3" />
                      {client.company}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Trip Details */}
            {tripDetails && tripDetails.tripName && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4 text-green-600" />
                  <h3 className="font-semibold text-gray-900">Trip Details</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="font-medium">{tripDetails.tripName}</div>
                  {tripDetails.primaryDestination && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="w-3 h-3" />
                      {tripDetails.primaryDestination}
                    </div>
                  )}
                  {tripDetails.startDate && tripDetails.endDate && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="w-3 h-3" />
                      {formatDate(tripDetails.startDate)} - {formatDate(tripDetails.endDate)}
                      {tripDetails.duration && (
                        <span className="text-gray-500">({tripDetails.duration} days)</span>
                      )}
                    </div>
                  )}
                  {tripDetails.purpose && (
                    <Badge variant="outline" className="capitalize">
                      {tripDetails.purpose}
                    </Badge>
                  )}
                  {tripDetails.totalTravelers && (
                    <div className="text-gray-600">
                      {tripDetails.totalTravelers.adults} Adults, {tripDetails.totalTravelers.children} Children
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Preferences */}
            {preferences && (preferences.tone || preferences.budget?.amount) && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Heart className="w-4 h-4 text-red-600" />
                  <h3 className="font-semibold text-gray-900">Preferences</h3>
                </div>
                <div className="space-y-2 text-sm">
                  {preferences.tone && (
                    <Badge variant="outline" className="capitalize">
                      {preferences.tone}
                    </Badge>
                  )}
                  {preferences.budget?.amount && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <DollarSign className="w-3 h-3" />
                      {formatCurrency(preferences.budget.amount, preferences.currency || 'GBP')}
                      <span className="text-gray-500">
                        ({preferences.budget.type === 'per-person' ? 'per person' : 'total'})
                      </span>
                    </div>
                  )}
                  {preferences.travelPriorities && preferences.travelPriorities.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {preferences.travelPriorities.map((priority) => (
                        <Badge key={priority} variant="secondary" className="text-xs capitalize">
                          {priority}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Services Summary */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-4 h-4 text-purple-600" />
                <h3 className="font-semibold text-gray-900">Services</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Plane className="w-3 h-3" />
                  <span className={flights?.enabled ? 'text-green-600' : 'text-gray-400'}>
                    Flights {flights?.enabled ? '✓' : '✗'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Hotel className="w-3 h-3" />
                  <span className={hotels?.enabled ? 'text-green-600' : 'text-gray-400'}>
                    Hotels {hotels?.enabled ? '✓' : '✗'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Car className="w-3 h-3" />
                  <span className={transfers?.enabled ? 'text-green-600' : 'text-gray-400'}>
                    Transfers {transfers?.enabled ? '✓' : '✗'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-3 h-3" />
                  <span className={events?.enabled ? 'text-green-600' : 'text-gray-400'}>
                    Events {events?.enabled ? '✓' : '✗'}
                  </span>
                </div>
              </div>
            </div>

            {/* Groups Summary */}
            {tripDetails?.useSubgroups && tripDetails.groups && tripDetails.groups.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <h3 className="font-semibold text-gray-900">Groups</h3>
                </div>
                <div className="space-y-2 text-sm">
                  {tripDetails.groups.map((group) => (
                    <div key={group.id} className="p-2 bg-gray-50 rounded">
                      <div className="font-medium">{group.name}</div>
                      <div className="text-gray-600">
                        {group.adults} Adults, {group.children} Children
                      </div>
                      {group.notes && (
                        <div className="text-gray-500 text-xs mt-1">{group.notes}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Events Summary */}
            {events?.enabled && events.events && events.events.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <CalendarIcon className="w-4 h-4 text-orange-600" />
                  <h3 className="font-semibold text-gray-900">Events</h3>
                </div>
                <div className="space-y-2 text-sm">
                  {events.events.map((event) => (
                    <div key={event.id} className="p-2 bg-orange-50 rounded">
                      <div className="font-medium">{event.name}</div>
                      <div className="text-gray-600">
                        {event.type} • {formatDate(event.date)}
                      </div>
                      {event.venue && (
                        <div className="text-gray-500 text-xs">{event.venue}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Special Requests */}
            {preferences?.specialRequests && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">Special Requests</h3>
                </div>
                <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
                  {preferences.specialRequests}
                </div>
              </div>
            )}

            {/* Quick Stats */}
            <Separator />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Travelers:</span>
                <span className="font-medium">
                  {tripDetails?.totalTravelers ? 
                    tripDetails.totalTravelers.adults + tripDetails.totalTravelers.children : 
                    0
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Trip Duration:</span>
                <span className="font-medium">
                  {tripDetails?.duration ? `${tripDetails.duration} days` : 'Not set'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Services:</span>
                <span className="font-medium">
                  {[
                    flights?.enabled,
                    hotels?.enabled,
                    transfers?.enabled,
                    events?.enabled
                  ].filter(Boolean).length} selected
                </span>
              </div>
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
} 