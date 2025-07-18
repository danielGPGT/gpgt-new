import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Users, UserPlus, UserMinus, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { TeamService, TeamMember, EventConsultant } from '@/lib/teamService';
import { useAuth } from '@/lib/AuthProvider';

interface EventConsultantSelectorProps {
  eventId: string;
  eventName?: string;
  onConsultantAssigned?: () => void;
  compact?: boolean; // For inline form integration
}

export const EventConsultantSelector: React.FC<EventConsultantSelectorProps> = ({
  eventId,
  eventName,
  onConsultantAssigned,
  compact = false
}) => {
  const { user } = useAuth();
  const [consultants, setConsultants] = useState<TeamMember[]>([]);
  const [assignedConsultant, setAssignedConsultant] = useState<TeamMember | null>(null);
  const [selectedConsultant, setSelectedConsultant] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [userTeamId, setUserTeamId] = useState<string | null>(null);
  const [canManage, setCanManage] = useState(false);

  useEffect(() => {
    loadData();
  }, [eventId]);

  const loadData = async () => {
    try {
      setLoading(true);
      // Get user's team
      const { data: teamMember } = await supabase
        .from('team_members')
        .select('team_id, role')
        .eq('user_id', user?.id)
        .eq('status', 'active')
        .single();
      if (teamMember) {
        setUserTeamId(teamMember.team_id);
        const canManageConsultants = ['owner', 'admin'].includes(teamMember.role);
        setCanManage(canManageConsultants);
        if (canManageConsultants) {
          // Load team consultants
          const teamConsultants = await TeamService.getTeamConsultants(teamMember.team_id);
          setConsultants(teamConsultants);
          // Load event and its primary consultant
          const { data: eventData } = await supabase
            .from('events')
            .select('*, team_member:primary_consultant_id(*)')
            .eq('id', eventId)
            .single();
          setAssignedConsultant(eventData?.team_member || null);
        }
      }
    } catch (error) {
      console.error('Error loading consultant data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignConsultant = async () => {
    if (!selectedConsultant) {
      toast.error('Please select a consultant');
      return;
    }
    try {
      setLoading(true);
      await supabase
        .from('events')
        .update({ primary_consultant_id: selectedConsultant })
        .eq('id', eventId);
      toast.success('Consultant assigned successfully');
      setSelectedConsultant('');
      setNotes('');
      await loadData();
      if (onConsultantAssigned) {
        onConsultantAssigned();
      }
    } catch (error: any) {
      console.error('Error assigning consultant:', error);
      toast.error(error.message || 'Failed to assign consultant');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveConsultant = async () => {
    try {
      setLoading(true);
      await supabase
        .from('events')
        .update({ primary_consultant_id: null })
        .eq('id', eventId);
      toast.success('Consultant removed successfully');
      await loadData();
    } catch (error: any) {
      console.error('Error removing consultant:', error);
      toast.error(error.message || 'Failed to remove consultant');
    } finally {
      setLoading(false);
    }
  };

  if (!canManage) return null;

  return (
    <Card className="bg-gradient-to-b from-card/95 to-background/20 border border-border rounded-2xl shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="h-5 w-5 text-primary" />
          Event Consultant
        </CardTitle>
        <CardDescription>
          Assign a sales consultant to manage this event
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {assignedConsultant ? (
          <div className="space-y-3">
            <Label className="text-sm font-medium">Assigned Consultant</Label>
            <div className="flex items-center justify-between p-3 border rounded-xl">
              <div className="flex items-center gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {assignedConsultant.name?.charAt(0).toUpperCase() || assignedConsultant.email.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-sm">
                    {assignedConsultant.name || assignedConsultant.email}
                  </p>
                  {assignedConsultant.phone && (
                    <p className="text-xs text-muted-foreground">
                      📞 {assignedConsultant.phone}
                    </p>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRemoveConsultant}
                className="text-red-600 hover:text-red-700"
                disabled={loading}
              >
                <UserMinus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="consultant-select">Select Consultant</Label>
                <Select value={selectedConsultant} onValueChange={setSelectedConsultant} disabled={loading}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a consultant..." />
                  </SelectTrigger>
                  <SelectContent>
                    {consultants.map((consultant) => (
                      <SelectItem key={consultant.id} value={consultant.id}>
                        {consultant.name || consultant.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes about this assignment..."
                  rows={2}
                  disabled={loading}
                />
              </div>
            </div>
            <Button
              onClick={handleAssignConsultant}
              disabled={!selectedConsultant || loading}
              className="w-full"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Assign Consultant
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}; 