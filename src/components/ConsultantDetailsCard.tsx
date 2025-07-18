import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { Loader2, User, Mail, Phone, UserCheck } from 'lucide-react';

interface ConsultantDetailsCardProps {
  eventId?: string;
}

export function ConsultantDetailsCard({ eventId }: ConsultantDetailsCardProps) {
  const [consultant, setConsultant] = useState<any | null>(null);
  const [event, setEvent] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) return;
    setLoading(true);
    setError(null);
    const fetchData = async () => {
      try {
        const { data, error } = await supabase
          .from('events')
          .select('*, team_member:primary_consultant_id(*), venue:venue_id(*)')
          .eq('id', eventId)
          .single();
        if (error) {
          setError('Failed to load consultant details');
          setConsultant(null);
          setEvent(null);
        } else {
          setEvent(data);
          setConsultant(data?.team_member || null);
        }
      } catch (err) {
        setError('Failed to load consultant details');
        setConsultant(null);
        setEvent(null);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [eventId]);

  return (
    <Card className="bg-gradient-to-b from-card/95 to-background/20 border border-border rounded-2xl shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCheck className="h-5 w-5 text-primary" />
          Consultant & Event Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Event Details */}
        {event && (
          <div className="space-y-1 border-b pb-4">
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-foreground">{event.name || 'Event'}</span>
              
            </div>
            {event.venue?.name && <Badge variant="outline" className="text-xs mb-4">{event.venue.name}</Badge>}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {event.start_date && event.end_date && (
                <span>
                  {new Date(event.start_date).toLocaleDateString()} - {new Date(event.end_date).toLocaleDateString()}
                </span>
              )}
              {event.location && <span>• {event.location}</span>}
            </div>
            {event.description && (
              <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{event.description}</div>
            )}
          </div>
        )}
        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="animate-spin h-5 w-5" /> Loading consultant...</div>
        ) : error ? (
          <div className="text-destructive text-sm">{error}</div>
        ) : consultant ? (
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-lg">
                {consultant.name?.charAt(0).toUpperCase() || consultant.email?.charAt(0).toUpperCase() || <User className="h-6 w-6" />}
              </div>
              <div>
                <span className="font-semibold text-lg text-foreground">{consultant.name || consultant.email}</span>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs capitalize">Sales Consultant</Badge>
                  {consultant.languages && <Badge variant="outline" className="text-xs">{consultant.languages}</Badge>}
                </div>
                {consultant.title && <div className="text-xs text-muted-foreground mt-1">{consultant.title}</div>}
              </div>
            </div>
            <div className="flex items-center gap-2 mt-6 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              <a
                href={`mailto:${consultant.email}`}
                className="hover:underline text-primary"
                aria-label={`Email ${consultant.name || consultant.email}`}
              >
                {consultant.email}
              </a>
            </div>
            {consultant.phone && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                <a
                  href={`tel:${consultant.phone}`}
                  className="hover:underline text-primary"
                  aria-label={`Call ${consultant.name || consultant.email}`}
                >
                  {consultant.phone}
                </a>
              </div>
            )}
            {consultant.bio && (
              <div className="text-xs text-muted-foreground mt-2 line-clamp-3">{consultant.bio}</div>
            )}
            {consultant.availability && (
              <div className="text-xs text-muted-foreground mt-1">Availability: {consultant.availability}</div>
            )}
            {consultant.languages && (
              <div className="text-xs text-muted-foreground mt-1">Languages: {consultant.languages}</div>
            )}
                  {/* Add informational message */}
      <div className="mt-6 text-sm text-muted-foreground">
        If you would like more details, please contact our event consultant.<br/><br/>
        Alternatively, you can visit <a href="https://grandprixgrandtours.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">grandprixgrandtours.com</a> for more information.
      </div>
          </div>
        ) : (
          <div className="text-muted-foreground text-sm">No consultant assigned to this event.</div>
        )}
      </CardContent>

    </Card>
  );
}

export default ConsultantDetailsCard; 