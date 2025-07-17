import { supabase } from './supabase';
import { useEffect, useState } from 'react';

export interface TeamInfo {
  id: string;
  name: string;
  role: string;
}

/**
 * Get the current user's team information
 */
export async function getCurrentUserTeam(): Promise<TeamInfo | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // First check if user is a team member
    const { data: teamMember, error: memberError } = await supabase
      .from('team_members')
      .select(`
        team_id,
        role,
        teams!team_members_team_id_fkey(name)
      `)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (memberError) {
      console.error('Error getting team membership:', memberError);
      return null;
    }

    if (teamMember) {
      return {
        id: teamMember.team_id,
        name: teamMember.teams?.name || 'Unknown Team',
        role: teamMember.role
      };
    }

    // If no team membership found, check if user owns any teams
    const { data: ownedTeam, error: ownedError } = await supabase
      .from('teams')
      .select('id, name')
      .eq('owner_id', user.id)
      .single();

    if (ownedError) {
      console.error('Error checking owned teams:', ownedError);
      return null;
    }

    if (ownedTeam) {
      return {
        id: ownedTeam.id,
        name: ownedTeam.name,
        role: 'owner'
      };
    }

    return null;
  } catch (error) {
    console.error('Error getting current user team:', error);
    return null;
  }
}

/**
 * Get the current user's team ID
 */
export async function getCurrentUserTeamId(): Promise<string> {
  try {
    const teamInfo = await getCurrentUserTeam();
    if (teamInfo?.id) {
      return teamInfo.id;
    }
    
    // If no team found, ensure user has a team
    return await ensureUserHasTeam();
  } catch (error) {
    console.error('Error getting current user team ID:', error);
    throw error;
  }
}

/**
 * Create a team for the current user if they don't have one
 */
export async function ensureUserHasTeam(): Promise<string> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Check if user already has a team
    const existingTeam = await getCurrentUserTeam();
    if (existingTeam) {
      return existingTeam.id;
    }

    // Create a new team
    const { data: newTeam, error: createTeamError } = await supabase
      .from('teams')
      .insert({
        name: user.user_metadata?.agency_name || user.user_metadata?.name || 'My Team',
        owner_id: user.id,
        max_members: 10
      })
      .select('id')
      .single();

    if (createTeamError) {
      console.error('Error creating team:', createTeamError);
      throw new Error('Failed to create team');
    }

    // Add user as team member with owner role
    const { error: addMemberError } = await supabase
      .from('team_members')
      .insert({
        team_id: newTeam.id,
        user_id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.email,
        role: 'owner',
        status: 'active',
        joined_at: new Date().toISOString()
      });

    if (addMemberError) {
      console.error('Error adding user to team:', addMemberError);
      throw new Error('Failed to add user to team');
    }

    return newTeam.id;
  } catch (error) {
    console.error('Error ensuring user has team:', error);
    throw error;
  }
}

/**
 * Check if the current user can manage the given team
 */
export async function canManageTeam(teamId: string): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    // Check if user is the team owner
    const { data: team } = await supabase
      .from('teams')
      .select('owner_id')
      .eq('id', teamId)
      .single();

    if (team && team.owner_id === user.id) {
      return true;
    }

    // Check if user is an admin on this team
    const { data: teamMember } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', teamId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    return teamMember?.role === 'admin';
  } catch (error) {
    console.error('Error checking team management permissions:', error);
    return false;
  }
} 

/**
 * Check if the current user's team has a specific feature enabled
 */
export async function hasTeamFeature(featureName: string): Promise<boolean> {
  try {
    const team = await getCurrentUserTeam();
    if (!team?.id) return false;
    const { data, error } = await supabase
      .from('team_features')
      .select('enabled')
      .eq('team_id', team.id)
      .eq('feature_name', featureName)
      .single();
    if (error) {
      console.error('Error checking team feature:', error);
      return false;
    }
    return !!data?.enabled;
  } catch (error) {
    console.error('Error in hasTeamFeature:', error);
    return false;
  }
} 

export function useTeamFeature(featureName: string) {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  useEffect(() => {
    (async () => {
      setEnabled(await hasTeamFeature(featureName));
    })();
  }, [featureName]);
  return enabled;
} 