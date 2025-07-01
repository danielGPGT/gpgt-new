import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TripIntake } from '@/types/trip';
import { Calendar, MapPin, Users, DollarSign, Heart, Clock } from 'lucide-react';

interface LivePreviewProps {
  data: Partial<TripIntake>;
}

export function LivePreview({ data }: LivePreviewProps) {
  const { travelerInfo, destinations, style, experience, budget } = data;

  // Helper: check if a step is completed
  const isTravelerInfoComplete = travelerInfo && travelerInfo.name && travelerInfo.startDate && travelerInfo.endDate;
  const isDestinationsComplete = destinations && destinations.primary;
  const isStyleComplete = style && style.tone;
  const isExperienceComplete = experience && experience.pace;
  const isBudgetComplete = budget && budget.amount;

  return (
    <Card className="w-full md:w-80 max-w-xs md:max-w-xs rounded-3xl shadow-2xl bg-[var(--card)]/80 backdrop-blur-lg border-0 sticky top-8">
      <CardHeader className="pb-2 pt-6 px-6">
        <CardTitle className="text-xl font-sans font-bold text-[var(--primary)] tracking-wide">Live Preview</CardTitle>
      </CardHeader>
      <CardContent className="px-6 pb-6 pt-0">
        <ScrollArea className="h-[calc(100vh-8rem)]">
          <div className="space-y-8">
            {isTravelerInfoComplete && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-5 w-5 text-[var(--accent)]" />
                  <h3 className="text-lg font-sans font-semibold text-[var(--foreground)]">Traveler Details</h3>
                </div>
                <div className="text-sm text-[var(--foreground)] space-y-1 pl-7">
                  <div><span className="text-[var(--muted-foreground)]">Name:</span> {travelerInfo.name}</div>
                  <div><span className="text-[var(--muted-foreground)]">Type:</span> {travelerInfo.travelType}</div>
                  <div><span className="text-[var(--muted-foreground)]">Travelers:</span> {travelerInfo.travelers?.adults} Adults, {travelerInfo.travelers?.children} Children</div>
                  <div><span className="text-[var(--muted-foreground)]">Dates:</span> {travelerInfo.startDate} - {travelerInfo.endDate}</div>
                </div>
              </div>
            )}
            {isDestinationsComplete && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-5 w-5 text-[var(--accent)]" />
                  <h3 className="text-lg font-sans font-semibold text-[var(--foreground)]">Destinations</h3>
                </div>
                <div className="text-sm text-[var(--foreground)] space-y-1 pl-7">
                  <div><span className="text-[var(--muted-foreground)]">Primary:</span> {destinations.primary}</div>
                  {destinations.additional?.length > 0 && (
                    <div><span className="text-[var(--muted-foreground)]">Additional:</span> {destinations.additional.join(', ')}</div>
                  )}
                  {destinations.duration && (
                    <div><span className="text-[var(--muted-foreground)]">Duration:</span> {destinations.duration} days</div>
                  )}
                </div>
              </div>
            )}
            {isStyleComplete && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="h-5 w-5 text-[var(--accent)]" />
                  <h3 className="text-lg font-sans font-semibold text-[var(--foreground)]">Trip Style</h3>
                </div>
                <div className="text-sm text-[var(--foreground)] space-y-1 pl-7">
                  <div><span className="text-[var(--muted-foreground)]">Tone:</span> {style.tone}</div>
                  {style.interests?.length > 0 && (
                    <div><span className="text-[var(--muted-foreground)]">Interests:</span> {style.interests.join(', ')}</div>
                  )}
                </div>
              </div>
            )}
            {isExperienceComplete && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-5 w-5 text-[var(--accent)]" />
                  <h3 className="text-lg font-sans font-semibold text-[var(--foreground)]">Experience</h3>
                </div>
                <div className="text-sm text-[var(--foreground)] space-y-1 pl-7">
                  <div><span className="text-[var(--muted-foreground)]">Pace:</span> {experience.pace}</div>
                  <div><span className="text-[var(--muted-foreground)]">Accommodation:</span> {experience.accommodation}</div>
                  {experience.specialRequests && (
                    <div><span className="text-[var(--muted-foreground)]">Special Requests:</span> {experience.specialRequests}</div>
                  )}
                </div>
              </div>
            )}
            {isBudgetComplete && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-5 w-5 text-[var(--accent)]" />
                  <h3 className="text-lg font-sans font-semibold text-[var(--foreground)]">Budget</h3>
                </div>
                <div className="text-sm text-[var(--foreground)] space-y-1 pl-7">
                  <div><span className="text-[var(--muted-foreground)]">Amount:</span> {budget.currency} {budget.amount}</div>
                  <div><span className="text-[var(--muted-foreground)]">Experience Type:</span> {budget.experienceType}</div>
                  <div><span className="text-[var(--muted-foreground)]">Travel Class:</span> {budget.travelClass}</div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
} 