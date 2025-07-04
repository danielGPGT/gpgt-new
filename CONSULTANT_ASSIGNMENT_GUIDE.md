# Consultant Assignment System Guide

## Overview

The consultant assignment system allows **owners and admins** to assign sales consultants to events directly from the event forms. This provides a seamless way to manage event responsibilities and ensure proper client coverage.

## Features

- ✅ **Role-based access control** - Only owners and admins can assign consultants
- ✅ **Compact form integration** - Fits seamlessly into existing event forms
- ✅ **Real-time assignment** - Assign consultants without leaving the form
- ✅ **Notes support** - Add context to consultant assignments
- ✅ **Visual feedback** - See current assignments and available consultants
- ✅ **Remove assignments** - Easily remove consultants from events

## How It Works

### 1. **Access Control**
The consultant selector only appears for users with `owner` or `admin` roles. Regular team members and sales consultants won't see this section.

### 2. **Integration Points**
The `EventConsultantSelector` component is integrated into:
- **Package Manager Event Form** (`src/components/package-manager/EventForm.tsx`)
- **Sports Events Manager** (`src/components/inventory/SportsEventsManager.tsx`)

### 3. **Component Modes**
The component has two display modes:
- **Compact mode** (`compact={true}`) - For inline form integration
- **Full mode** (`compact={false}`) - For standalone use

## Usage

### In Event Forms

When editing an existing event, owners and admins will see a "Assign Consultant" section at the bottom of the form:

```tsx
{/* Consultant Assignment - Only show for existing events */}
{event && (
  <EventConsultantSelector
    eventId={event.id}
    eventName={event.name}
    compact={true}
    onConsultantAssigned={() => {
      // Optional callback when consultant is assigned
      toast.success('Consultant assignment updated');
    }}
  />
)}
```

### Manual Integration

To add the consultant selector to any component:

```tsx
import { EventConsultantSelector } from '@/components/EventConsultantSelector';

// In your component
<EventConsultantSelector
  eventId="your-event-id"
  eventName="Event Name"
  compact={true} // or false for full version
  onConsultantAssigned={() => {
    // Handle assignment callback
  }}
/>
```

## Database Structure

### Core Tables

```sql
-- Links consultants to events
event_consultants (
  id uuid PRIMARY KEY,
  event_id uuid REFERENCES events(id),
  consultant_id uuid REFERENCES team_members(id),
  assigned_by uuid REFERENCES auth.users(id),
  assigned_at timestamp,
  notes text,
  status text DEFAULT 'active'
)

-- Quick lookup for primary consultant
events (
  -- ... other fields
  primary_consultant_id uuid REFERENCES team_members(id)
)
```

### Key Functions

```sql
-- Assign consultant to event
assign_consultant_to_event(p_event_id, p_consultant_id, p_notes)

-- Get team consultants
get_team_consultants(p_team_id)

-- Get consultant's events
get_consultant_events(p_consultant_id)
```

## Security & Permissions

### Row Level Security (RLS)
- Team members can only view consultants from their own team
- Only admins/owners can assign consultants
- Consultants can only view their own assignments

### Validation Rules
- Only team admins/owners can assign consultants
- Only sales role members can be assigned as consultants
- Users can only assign consultants from their own team
- No duplicate assignments (unique constraint)

## Testing

### Run the Test Script
```bash
node test-consultant-assignment.cjs
```

This script will:
1. ✅ Check user authentication and role
2. ✅ Verify access permissions
3. ✅ Get team consultants
4. ✅ Create or use existing test event
5. ✅ Test consultant assignment
6. ✅ Verify assignment was created
7. ✅ Test consultant events retrieval

### Manual Testing Steps

1. **Login as Admin/Owner**
   - Navigate to any event form
   - Verify "Assign Consultant" section appears

2. **Login as Sales Consultant**
   - Navigate to event form
   - Verify "Assign Consultant" section is hidden

3. **Test Assignment**
   - Select a consultant from dropdown
   - Add optional notes
   - Click "Assign"
   - Verify success message
   - Check current assignments list

4. **Test Removal**
   - Click remove button on assigned consultant
   - Confirm removal
   - Verify consultant is removed from list

## Error Handling

### Common Error Messages

- **"Only team admins and owners can assign consultants"**
  - User doesn't have admin/owner role
  - Solution: Contact team owner for permission

- **"Only team members with sales role can be assigned as consultants"**
  - Selected user doesn't have sales role
  - Solution: Update user role to 'sales' in team management

- **"You can only assign consultants from your own team"**
  - Cross-team assignment attempted
  - Solution: Only assign consultants from your team

- **"Consultant not found or inactive"**
  - Consultant was deleted or deactivated
  - Solution: Check team member status

## Best Practices

### 1. **Role Management**
- Assign 'sales' role to team members who will be consultants
- Keep 'admin' role limited to team managers
- Use 'owner' role for full system access

### 2. **Assignment Strategy**
- Assign primary consultants for important events
- Use notes to provide context for assignments
- Regularly review and update assignments

### 3. **Team Communication**
- Inform consultants when they're assigned to events
- Use the notes field to provide specific instructions
- Encourage consultants to use their dashboard

## Troubleshooting

### Component Not Showing
- Check user role (must be 'owner' or 'admin')
- Verify team membership is active
- Check browser console for errors

### Assignment Fails
- Verify consultant has 'sales' role
- Check both users are in same team
- Ensure event exists and is accessible

### Performance Issues
- Large teams may need pagination
- Consider caching consultant lists
- Monitor database query performance

## Future Enhancements

1. **Bulk Assignment** - Assign multiple consultants at once
2. **Assignment Templates** - Predefined assignment patterns
3. **Workload Balancing** - Automatic assignment suggestions
4. **Assignment History** - Track assignment changes over time
5. **Notifications** - Alert consultants of new assignments
6. **Calendar Integration** - Sync with consultant calendars

## Support

For issues or questions:
1. Check the test script output
2. Verify database functions exist
3. Check RLS policies are active
4. Review user roles and permissions
5. Check browser console for errors 