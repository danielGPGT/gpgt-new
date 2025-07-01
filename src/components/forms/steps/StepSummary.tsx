import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { 
  FileText, 
  Users, 
  Calendar, 
  MapPin, 
  DollarSign, 
  Plane, 
  Hotel, 
  Car, 
  Calendar as CalendarIcon,
  CheckCircle,
  Clock,
  Building2,
  Mail,
  Phone,
  MessageSquare
} from 'lucide-react';

import { NewIntake } from '@/types/newIntake';

interface StepSummaryProps {
  disabled?: boolean;
}

export function StepSummary({ disabled }: StepSummaryProps) {
  const form = useFormContext<NewIntake>();
  const formData = form.watch();

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

  const getServicesCount = () => {
    const services = [
      formData.flights?.enabled,
      formData.hotels?.enabled,
      formData.transfers?.enabled,
      formData.events?.enabled
    ];
    return services.filter(Boolean).length;
  };

  return (
    <div className="space-y-6">
      {/* Quote Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Quote Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Client Information */}
          {formData.client && (formData.client.firstName || formData.client.email) && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Client Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {formData.client.firstName && formData.client.lastName && (
                  <div>
                    <span className="text-gray-600">Name:</span>
                    <span className="ml-2 font-medium">
                      {formData.client.firstName} {formData.client.lastName}
                    </span>
                  </div>
                )}
                {formData.client.email && (
                  <div>
                    <span className="text-gray-600">Email:</span>
                    <span className="ml-2 font-medium">{formData.client.email}</span>
                  </div>
                )}
                {formData.client.phone && (
                  <div>
                    <span className="text-gray-600">Phone:</span>
                    <span className="ml-2 font-medium">{formData.client.phone}</span>
                  </div>
                )}
                {formData.client.company && (
                  <div>
                    <span className="text-gray-600">Company:</span>
                    <span className="ml-2 font-medium">{formData.client.company}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Trip Details */}
          {formData.tripDetails && formData.tripDetails.tripName && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-green-600" />
                <h3 className="font-semibold text-gray-900">Trip Details</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Trip Name:</span>
                  <span className="ml-2 font-medium">{formData.tripDetails.tripName}</span>
                </div>
                {formData.tripDetails.primaryDestination && (
                  <div>
                    <span className="text-gray-600">Destination:</span>
                    <span className="ml-2 font-medium">{formData.tripDetails.primaryDestination}</span>
                  </div>
                )}
                {formData.tripDetails.startDate && formData.tripDetails.endDate && (
                  <div>
                    <span className="text-gray-600">Dates:</span>
                    <span className="ml-2 font-medium">
                      {formatDate(formData.tripDetails.startDate)} - {formatDate(formData.tripDetails.endDate)}
                    </span>
                  </div>
                )}
                {formData.tripDetails.duration && (
                  <div>
                    <span className="text-gray-600">Duration:</span>
                    <span className="ml-2 font-medium">{formData.tripDetails.duration} days</span>
                  </div>
                )}
                {formData.tripDetails.purpose && (
                  <div>
                    <span className="text-gray-600">Purpose:</span>
                    <Badge variant="outline" className="ml-2 capitalize">
                      {formData.tripDetails.purpose}
                    </Badge>
                  </div>
                )}
                {formData.tripDetails.totalTravelers && (
                  <div>
                    <span className="text-gray-600">Travelers:</span>
                    <span className="ml-2 font-medium">
                      {formData.tripDetails.totalTravelers.adults} Adults, {formData.tripDetails.totalTravelers.children} Children
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Preferences */}
          {formData.preferences && (formData.preferences.tone || formData.preferences.budget?.amount) && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="w-4 h-4 text-red-600" />
                <h3 className="font-semibold text-gray-900">Preferences</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {formData.preferences.tone && (
                  <div>
                    <span className="text-gray-600">Tone:</span>
                    <Badge variant="outline" className="ml-2 capitalize">
                      {formData.preferences.tone}
                    </Badge>
                  </div>
                )}
                {formData.preferences.budget?.amount && (
                  <div>
                    <span className="text-gray-600">Budget:</span>
                    <span className="ml-2 font-medium">
                      {formatCurrency(formData.preferences.budget.amount, formData.preferences.currency || 'GBP')}
                      <span className="text-gray-500 ml-1">
                        ({formData.preferences.budget.type})
                      </span>
                    </span>
                  </div>
                )}
                {formData.preferences.travelPriorities && formData.preferences.travelPriorities.length > 0 && (
                  <div>
                    <span className="text-gray-600">Priorities:</span>
                    <div className="ml-2 mt-1">
                      {formData.preferences.travelPriorities.map((priority) => (
                        <Badge key={priority} variant="secondary" className="text-xs capitalize mr-1">
                          {priority}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Services */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-4 h-4 text-purple-600" />
              <h3 className="font-semibold text-gray-900">Services</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Plane className="w-4 h-4" />
                <span className={formData.flights?.enabled ? 'text-green-600' : 'text-gray-400'}>
                  Flights {formData.flights?.enabled ? '✓' : '✗'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Hotel className="w-4 h-4" />
                <span className={formData.hotels?.enabled ? 'text-green-600' : 'text-gray-400'}>
                  Hotels {formData.hotels?.enabled ? '✓' : '✗'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Car className="w-4 h-4" />
                <span className={formData.transfers?.enabled ? 'text-green-600' : 'text-gray-400'}>
                  Transfers {formData.transfers?.enabled ? '✓' : '✗'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" />
                <span className={formData.events?.enabled ? 'text-green-600' : 'text-gray-400'}>
                  Events {formData.events?.enabled ? '✓' : '✗'}
                </span>
              </div>
            </div>
          </div>

          {/* Groups Summary */}
          {formData.tripDetails?.useSubgroups && formData.tripDetails.groups && formData.tripDetails.groups.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-indigo-600" />
                <h3 className="font-semibold text-gray-900">Traveler Groups</h3>
              </div>
              <div className="space-y-2">
                {formData.tripDetails.groups.map((group) => (
                  <div key={group.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{group.name}</span>
                      <Badge variant="outline">
                        {group.adults} Adults, {group.children} Children
                      </Badge>
                    </div>
                    {group.notes && (
                      <p className="text-sm text-gray-600 mt-1">{group.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Final Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Final Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="quoteReference">Quote Reference</Label>
            <Controller
              name="summary.quoteReference"
              control={form.control}
              render={({ field }) => (
                <Input
                  {...field}
                  id="quoteReference"
                  placeholder="e.g., Q-2024-001"
                  disabled={disabled}
                />
              )}
            />
          </div>

          <div>
            <Label htmlFor="internalNotes">Internal Notes</Label>
            <Controller
              name="summary.internalNotes"
              control={form.control}
              render={({ field }) => (
                <Textarea
                  {...field}
                  id="internalNotes"
                  placeholder="Any internal notes or special instructions for this quote..."
                  rows={3}
                  disabled={disabled}
                />
              )}
            />
          </div>
        </CardContent>
      </Card>

      {/* Final Summary */}
      <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-green-900">Ready to Submit</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-green-700">Total Travelers:</span>
              <span className="ml-2 font-medium">
                {formData.tripDetails?.totalTravelers ? 
                  formData.tripDetails.totalTravelers.adults + formData.tripDetails.totalTravelers.children : 
                  0
                }
              </span>
            </div>
            <div>
              <span className="text-green-700">Trip Duration:</span>
              <span className="ml-2 font-medium">
                {formData.tripDetails?.duration ? `${formData.tripDetails.duration} days` : 'Not set'}
              </span>
            </div>
            <div>
              <span className="text-green-700">Services:</span>
              <span className="ml-2 font-medium">{getServicesCount()} selected</span>
            </div>
            <div>
              <span className="text-green-700">Groups:</span>
              <span className="ml-2 font-medium">
                {formData.tripDetails?.useSubgroups ? formData.tripDetails.groups?.length || 0 : 1}
              </span>
            </div>
          </div>
          
          <Separator className="my-4" />
          
          <div className="text-center">
            <p className="text-sm text-green-700 font-medium">
              All information has been collected. You can now generate a quote, create an AI itinerary, or export a PDF proposal.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 