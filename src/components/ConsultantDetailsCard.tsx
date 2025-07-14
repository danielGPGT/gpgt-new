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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) return;
    setLoading(true);
    setError(null);
    supabase
      .from('events')
      .select('*, team_member:primary_consultant_id(*)')
      .eq('id', eventId)
      .single()
      .then(({ data, error }) => {
        if (error) {
          setError('Failed to load consultant details');
          setConsultant(null);
        } else if (data && data.team_member) {
          setConsultant(data.team_member);
        } else {
          setConsultant(null);
        }
      })
      .catch(() => {
        setError('Failed to load consultant details');
        setConsultant(null);
      })
      .finally(() => setLoading(false));
  }, [eventId]);

  return (
    <Card className="bg-gradient-to-b from-card/95 to-background/20 border border-border rounded-2xl shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCheck className="h-5 w-5 text-primary" />
          Consultant Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="animate-spin h-5 w-5" /> Loading consultant...</div>
        ) : error ? (
          <div className="text-destructive text-sm">{error}</div>
        ) : consultant ? (
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-lg text-foreground">{consultant.name || consultant.email}</span>
              <Badge variant="secondary" className="ml-2 text-xs capitalize">{consultant.role}</Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              <a
                href={`mailto:${consultant.email}`}
                className="hover:underline text-foreground"
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
                  className="hover:underline text-foreground"
                  aria-label={`Call ${consultant.name || consultant.email}`}
                >
                  {consultant.phone}
                </a>
              </div>
            )}
          </div>
        ) : (
          <div className="text-muted-foreground text-sm">No consultant assigned to this event.</div>
        )}
      </CardContent>
    </Card>
  );
}

export default ConsultantDetailsCard; 