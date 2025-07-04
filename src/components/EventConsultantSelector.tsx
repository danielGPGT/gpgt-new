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
  const [eventConsultants, setEventConsultants] = useState<EventConsultant[]>([]);
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
          console.log('🔍 Loading consultants for team:', teamMember.team_id);
          
          // Load team consultants
          const teamConsultants = await TeamService.getTeamConsultants(teamMember.team_id);
          console.log('📋 Found consultants:', teamConsultants.length, teamConsultants);
          setConsultants(teamConsultants);

          // Load event consultants
          const eventConsultants = await TeamService.getEventConsultants(eventId);
          console.log('🎯 Event consultants:', eventConsultants.length, eventConsultants);
          setEventConsultants(eventConsultants);
        } else {
          console.log('❌ User cannot manage consultants. Role:', teamMember.role);
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
      await TeamService.assignConsultantToEvent(eventId, selectedConsultant, notes);
      
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
      await TeamService.removeConsultantFromEvent(eventId, consultantId);
      
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

  // Debug logging
  console.log('🎯 EventConsultantSelector render:', {
    canManage,
    consultantsCount: consultants.length,
    eventConsultantsCount: eventConsultants.length,
    eventId,
    loading
  });

  // If user can't manage consultants, don't show anything
  if (!canManage) {
    console.log('❌ Component hidden - user cannot manage consultants');
    return null;
  }

  // Compact version for inline forms
  if (compact) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          <Label className="text-sm font-medium">Assign Consultant</Label>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
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
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes (optional)..."
              rows={1}
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={handleAssignConsultant}
            disabled={!selectedConsultant || loading}
            size="sm"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Assign
          </Button>
        </div>

        {/* Current Assignments */}
        {eventConsultants.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Current Consultants</Label>
            <div className="space-y-2">
              {eventConsultants.map((assignment) => (
                <div key={assignment.id} className="flex items-center justify-between p-2 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Avatar className="w-6 h-6">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                        {assignment.consultant?.name?.charAt(0).toUpperCase() || 
                         assignment.consultant?.email.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm">
                        {assignment.consultant?.name || assignment.consultant?.email}
                      </span>
                      {assignment.consultant?.phone && (
                        <span className="text-xs text-muted-foreground">📞 {assignment.consultant.phone}</span>
                      )}
                      {assignment.notes && (
                        <span className="text-xs text-muted-foreground">"{assignment.notes}"</span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveConsultant(assignment.consultant_id)}
                    className="text-red-600 hover:text-red-700 h-6 px-2"
                  >
                    <UserMinus className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Full version
  return (
    <Card className="bg-gradient-to-b from-card/95 to-background/20 border border-border rounded-2xl shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="h-5 w-5 text-primary" />
          Event Consultants
        </CardTitle>
        <CardDescription>
          Assign sales consultants to manage this event
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Assign New Consultant */}
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

        {/* Current Consultants */}
        {eventConsultants.length > 0 && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">Assigned Consultants ({eventConsultants.length})</Label>
            {eventConsultants.map((assignment) => (
              <div key={assignment.id} className="flex items-center justify-between p-3 border rounded-xl">
                <div className="flex items-center gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {assignment.consultant?.name?.charAt(0).toUpperCase() || 
                       assignment.consultant?.email.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">
                      {assignment.consultant?.name || assignment.consultant?.email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Assigned {new Date(assignment.assigned_at).toLocaleDateString()}
                    </p>
                    {assignment.consultant?.phone && (
                      <p className="text-xs text-muted-foreground">
                        📞 {assignment.consultant.phone}
                      </p>
                    )}
                    {assignment.notes && (
                      <p className="text-xs text-muted-foreground mt-1">
                        "{assignment.notes}"
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={getRoleBadgeColor(assignment.consultant?.role || '')}>
                    {assignment.consultant?.role}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveConsultant(assignment.consultant_id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <UserMinus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Available Consultants */}
        {consultants.length > 0 && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">Available Consultants ({consultants.length})</Label>
            <div className="space-y-2">
              {consultants.map((consultant) => {
                const isAssigned = eventConsultants.some(ec => ec.consultant_id === consultant.id);
                return (
                  <div key={consultant.id} className="flex items-center justify-between p-2 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Avatar className="w-6 h-6">
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                          {consultant.name?.charAt(0).toUpperCase() || consultant.email.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">
                          {consultant.name || consultant.email}
                        </p>
                        <p className="text-xs text-muted-foreground">{consultant.email}</p>
                        {consultant.phone && (
                          <p className="text-xs text-muted-foreground">📞 {consultant.phone}</p>
                        )}
                      </div>
                    </div>
                    {isAssigned && (
                      <Badge variant="outline" className="text-xs">
                        Assigned
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 