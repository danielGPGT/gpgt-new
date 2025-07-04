import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Users, UserPlus, UserMinus, Calendar, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { TeamService, TeamMember, EventConsultant } from '@/lib/teamService';
import { useAuth } from '@/lib/AuthProvider';

interface Event {
  id: string;
  name: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  primary_consultant_id?: string;
}

interface EventConsultantManagerProps {
  event: Event;
  onConsultantAssigned?: () => void;
}

export const EventConsultantManager: React.FC<EventConsultantManagerProps> = ({
  event,
  onConsultantAssigned
}) => {
  const { user } = useAuth();
  const [consultants, setConsultants] = useState<TeamMember[]>([]);
  const [eventConsultants, setEventConsultants] = useState<EventConsultant[]>([]);
  const [selectedConsultant, setSelectedConsultant] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [userTeamId, setUserTeamId] = useState<string | null>(null);
  const [canManage, setCanManage] = useState(false);

  useEffect(() => {
    loadData();
  }, [event.id]);

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
        setCanManage(['owner', 'admin'].includes(teamMember.role));

        // Load team consultants
        const teamConsultants = await TeamService.getTeamConsultants(teamMember.team_id);
        setConsultants(teamConsultants);

        // Load event consultants
        const eventConsultants = await TeamService.getEventConsultants(event.id);
        setEventConsultants(eventConsultants);
      }
    } catch (error) {
      console.error('Error loading consultant data:', error);
      toast.error('Failed to load consultant data');
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
      await TeamService.assignConsultantToEvent(event.id, selectedConsultant, notes);
      
      toast.success('Consultant assigned successfully');
      setSelectedConsultant('');
      setNotes('');
      
      // Reload data
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

  const handleRemoveConsultant = async (consultantId: string) => {
    if (!confirm('Are you sure you want to remove this consultant from the event?')) {
      return;
    }

    try {
      setLoading(true);
      await TeamService.removeConsultantFromEvent(event.id, consultantId);
      
      toast.success('Consultant removed successfully');
      await loadData();
    } catch (error: any) {
      console.error('Error removing consultant:', error);
      toast.error(error.message || 'Failed to remove consultant');
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'admin': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'sales': return 'bg-green-100 text-green-800 border-green-200';
      case 'operations': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'member': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'TBD';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Event Info */}
      <Card className="bg-gradient-to-b from-card/95 to-background/20 border border-border rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5 text-primary" />
            {event.name}
          </CardTitle>
          <CardDescription className="flex items-center gap-4">
            {event.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {event.location}
              </span>
            )}
            <span>
              {formatDate(event.start_date)} - {formatDate(event.end_date)}
            </span>
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Assign Consultant */}
      {canManage && (
        <Card className="bg-gradient-to-b from-card/95 to-background/20 border border-border rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <UserPlus className="h-5 w-5 text-primary" />
              Assign Consultant
            </CardTitle>
            <CardDescription>
              Assign a sales consultant to this event
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="consultant-select">Select Consultant</Label>
                <Select value={selectedConsultant} onValueChange={setSelectedConsultant}>
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
          </CardContent>
        </Card>
      )}

      {/* Current Consultants */}
      <Card className="bg-gradient-to-b from-card/95 to-background/20 border border-border rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-primary" />
            Assigned Consultants ({eventConsultants.length})
          </CardTitle>
          <CardDescription>
            Consultants currently assigned to this event
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <span className="ml-2">Loading consultants...</span>
            </div>
          ) : eventConsultants.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2" />
              <p>No consultants assigned yet</p>
              {!canManage && (
                <p className="text-sm mt-2">Contact your team admin to assign consultants</p>
              )}
            </div>
          ) : (
            eventConsultants.map((assignment) => (
              <div key={assignment.id} className="flex items-center justify-between p-4 border rounded-xl">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {assignment.consultant?.name?.charAt(0).toUpperCase() || 
                       assignment.consultant?.email.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {assignment.consultant?.name || assignment.consultant?.email}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Assigned {new Date(assignment.assigned_at).toLocaleDateString()}
                    </p>
                    {assignment.notes && (
                      <p className="text-sm text-muted-foreground mt-1">
                        "{assignment.notes}"
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={getRoleBadgeColor(assignment.consultant?.role || '')}>
                    {assignment.consultant?.role}
                  </Badge>
                  {canManage && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveConsultant(assignment.consultant_id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <UserMinus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Available Consultants */}
      {canManage && consultants.length > 0 && (
        <Card className="bg-gradient-to-b from-card/95 to-background/20 border border-border rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-primary" />
              Available Consultants ({consultants.length})
            </CardTitle>
            <CardDescription>
              Sales consultants available for assignment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {consultants.map((consultant) => {
              const isAssigned = eventConsultants.some(ec => ec.consultant_id === consultant.id);
              return (
                <div key={consultant.id} className="flex items-center justify-between p-3 border rounded-xl">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                        {consultant.name?.charAt(0).toUpperCase() || consultant.email.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">
                        {consultant.name || consultant.email}
                      </p>
                      <p className="text-xs text-muted-foreground">{consultant.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={getRoleBadgeColor(consultant.role)}>
                      {consultant.role}
                    </Badge>
                    {isAssigned && (
                      <Badge variant="secondary" className="text-xs">
                        Assigned
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}; 