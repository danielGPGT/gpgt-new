# Consultant System Setup Guide

## Overview

The consultant system allows teams to assign sales consultants to events, enabling better client management and event coordination. Consultants (team members with the 'sales' role) can be assigned to specific events and track their responsibilities.

## Database Changes

### New Tables

1. **event_consultants** - Links consultants to events
   - `id` - Primary key
   - `event_id` - Reference to events table
   - `consultant_id` - Reference to team_members table (must have 'sales' role)
   - `assigned_by` - User who assigned the consultant
   - `assigned_at` - When the assignment was made
   - `notes` - Optional notes about the assignment
   - `status` - 'active', 'inactive', or 'completed'

2. **Updated events table**
   - Added `primary_consultant_id` for quick lookup of the main consultant

### Updated Tables

1. **team_members** - Added new roles
   - Updated role constraint to include 'sales' and 'operations'
   - Roles: 'owner', 'admin', 'member', 'sales', 'operations'

2. **team_invitations** - Added new roles
   - Updated role constraint to include 'sales' and 'operations'

## Role Definitions

### Sales Consultant ('sales')
- Can be assigned to events as consultants
- Can view their assigned events
- Can manage client relationships for their events
- Access to consultant dashboard

### Operations ('operations')
- Focus on operational tasks
- Can manage inventory and logistics
- Access to operations-specific features

### Admin ('admin')
- Can assign consultants to events
- Can manage team members
- Full access to team management

### Owner ('owner')
- Full system access
- Can manage all team aspects
- Can assign and remove consultants

### Member ('member')
- Basic team member access
- View-only access to most features

## Key Features

### 1. Event Consultant Assignment
- Team admins/owners can assign sales consultants to events
- Multiple consultants can be assigned to the same event
- Assignment includes optional notes
- Consultants can be removed from events

### 2. Consultant Dashboard
- View all assigned events
- Track event status (active, upcoming, completed)
- See event details and notes
- Performance statistics

### 3. Team Management
- Invite team members with specific roles
- Update existing member roles
- View team consultants

## Components

### EventConsultantManager
- Manages consultant assignments for a specific event
- Allows admins to assign/remove consultants
- Shows current assignments and available consultants

### ConsultantDashboard
- Dashboard for sales consultants
- Shows assigned events and statistics
- Quick access to common tasks

## Database Functions

### assign_consultant_to_event(p_event_id, p_consultant_id, p_notes)
- Assigns a consultant to an event
- Validates permissions and consultant role
- Updates event's primary consultant if not set

### get_team_consultants(p_team_id)
- Returns all sales consultants for a team
- Used for assignment dropdowns

### get_consultant_events(p_consultant_id)
- Returns all events assigned to a consultant
- Used for consultant dashboard

## Usage Examples

### Assigning a Consultant
```typescript
// In EventConsultantManager component
await TeamService.assignConsultantToEvent(
  eventId,
  consultantId,
  "Primary consultant for VIP clients"
);
```

### Getting Consultant's Events
```typescript
// In ConsultantDashboard component
const myEvents = await TeamService.getMyConsultantEvents();
```

### Getting Team Consultants
```typescript
// For assignment dropdown
const consultants = await TeamService.getTeamConsultants(teamId);
```

## Migration Steps

1. **Run the migration**
   ```bash
   # Apply the consultant system migration
   supabase db push
   ```

2. **Update existing team members**
   - Existing members will keep their current roles
   - New roles can be assigned through team management

3. **Test the system**
   - Create a sales consultant
   - Assign them to an event
   - Verify the consultant dashboard works

## Security & Permissions

### Row Level Security (RLS)
- Team members can only view consultants from their own team
- Only admins/owners can assign consultants
- Consultants can only view their own assignments

### Function Security
- Database functions validate permissions
- Only team admins/owners can assign consultants
- Only sales role members can be assigned as consultants

## UI Integration

### Settings Page
- Updated team management to include new roles
- Role selection dropdown in invitation form
- Role badges with appropriate colors

### Event Pages
- EventConsultantManager component can be integrated
- Shows assigned consultants
- Allows assignment management

### Dashboard
- ConsultantDashboard for sales team members
- Shows assigned events and statistics
- Quick access to common tasks

## Best Practices

1. **Role Assignment**
   - Assign 'sales' role to team members who will be consultants
   - Use 'operations' role for logistics and operational staff
   - Keep 'admin' role limited to team managers

2. **Event Assignment**
   - Assign primary consultants for important events
   - Use notes to provide context for assignments
   - Regularly review and update assignments

3. **Dashboard Usage**
   - Encourage consultants to use their dashboard
   - Monitor event assignments and performance
   - Provide training on the new system

## Troubleshooting

### Common Issues

1. **"Only team members with sales role can be assigned as consultants"**
   - Ensure the team member has the 'sales' role
   - Update their role in team management

2. **"You can only assign consultants from your own team"**
   - Verify you're in the same team as the consultant
   - Check team membership status

3. **"Only team admins and owners can assign consultants"**
   - Ensure you have admin or owner role
   - Contact team owner for permission

### Database Queries

Check consultant assignments:
```sql
SELECT 
  e.name as event_name,
  tm.name as consultant_name,
  ec.assigned_at,
  ec.notes
FROM event_consultants ec
JOIN events e ON e.id = ec.event_id
JOIN team_members tm ON tm.id = ec.consultant_id
WHERE ec.status = 'active'
ORDER BY e.start_date;
```

Check team consultants:
```sql
SELECT name, email, role, status
FROM team_members
WHERE team_id = 'your-team-id'
AND role = 'sales'
AND status = 'active';
```

## Future Enhancements

1. **Consultant Performance Tracking**
   - Track client conversions
   - Measure event success rates
   - Performance analytics

2. **Automated Assignment**
   - Workload balancing
   - Skill-based assignment
   - Availability scheduling

3. **Client Management**
   - Client assignment to consultants
   - Communication tracking
   - Relationship management

4. **Reporting**
   - Consultant performance reports
   - Event assignment reports
   - Team utilization reports 