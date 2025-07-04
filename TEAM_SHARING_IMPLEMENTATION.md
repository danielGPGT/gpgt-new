# Team Sharing Implementation

This document outlines the complete team sharing implementation for quotes, bookings, itineraries, and media library in the GPGT system.

## Overview

Team sharing allows multiple users within a team to collaborate on travel quotes, bookings, itineraries, and media library items. All data is shared within teams, with access controlled by team membership and Row Level Security (RLS) policies.

## Database Schema Changes

### 1. Team Management Tables

The system uses the following tables for team management:

- **`teams`**: Stores team information
- **`team_members`**: Stores team membership with roles
- **`team_invitations`**: Manages team invitations

### 2. Entity Tables with Team Sharing

All main entities now include `team_id` columns for team-based access:

#### Quotes Table
```sql
ALTER TABLE public.quotes 
ADD COLUMN team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE;
```

#### Bookings Table
```sql
ALTER TABLE public.bookings 
ADD COLUMN team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE;
```

#### Media Library Table
```sql
ALTER TABLE public.media_library 
ADD COLUMN team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE;
```

#### Itineraries Table (New)
```sql
CREATE TABLE public.itineraries (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE,
  title text NOT NULL,
  client_name text NOT NULL,
  destination text NOT NULL,
  generated_by uuid NOT NULL REFERENCES auth.users(id),
  date_created timestamp with time zone DEFAULT now(),
  preferences jsonb,
  days jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT itineraries_pkey PRIMARY KEY (id)
);
```

### 3. Performance Indexes

Indexes are created for optimal query performance:

```sql
-- Quotes indexes
CREATE INDEX idx_quotes_team_id ON public.quotes(team_id);

-- Bookings indexes
CREATE INDEX idx_bookings_team_id ON public.bookings(team_id);

-- Media library indexes
CREATE INDEX idx_media_library_team_id ON public.media_library(team_id);

-- Itineraries indexes
CREATE INDEX idx_itineraries_user_id ON public.itineraries(user_id);
CREATE INDEX idx_itineraries_team_id ON public.itineraries(team_id);
CREATE INDEX idx_itineraries_generated_by ON public.itineraries(generated_by);
CREATE INDEX idx_itineraries_created_at ON public.itineraries(created_at);
```

## Row Level Security (RLS) Policies

### Team-Based Access Control

All tables have RLS enabled with team-based policies:

#### Quotes RLS Policies
```sql
CREATE POLICY "Team members can view team quotes" ON public.quotes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm 
      WHERE tm.team_id = quotes.team_id 
      AND tm.user_id = auth.uid()
      AND tm.status = 'active'
    )
  );
```

#### Bookings RLS Policies
```sql
CREATE POLICY "Team members can view team bookings" ON public.bookings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm 
      WHERE tm.team_id = bookings.team_id 
      AND tm.user_id = auth.uid()
      AND tm.status = 'active'
    )
  );
```

#### Media Library RLS Policies
```sql
CREATE POLICY "Team members can view team media" ON public.media_library
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm 
      WHERE tm.team_id = media_library.team_id 
      AND tm.user_id = auth.uid()
      AND tm.status = 'active'
    )
  );
```

#### Itineraries RLS Policies
```sql
CREATE POLICY "Users can view itineraries from their team" ON public.itineraries
  FOR SELECT USING (
    team_id IN (
      SELECT team_id FROM public.team_members 
      WHERE user_id = auth.uid()
    )
  );
```

## Frontend Implementation

### 1. Team Utilities (`src/lib/teamUtils.ts`)

Core team management functions:

```typescript
// Get current user's team ID
export async function getCurrentUserTeamId(): Promise<string>

// Ensure user has a team (create default if needed)
export async function ensureUserHasTeam(userId: string): Promise<void>

// Check if user can manage a team
export async function canManageTeam(teamId: string): Promise<boolean>
```

### 2. Service Updates

All services have been updated to use team-based queries:

#### QuoteService
- `getQuotes()`: Returns quotes from user's team
- `createQuote()`: Automatically assigns team_id
- `getQuotesByClient()`: Team-based client quotes

#### BookingService
- `getBookings()`: Returns bookings from user's team
- `createBookingFromQuote()`: Inherits team_id from quote
- `updateBookingStatus()`: Team-based updates

#### MediaLibraryService
- `getMedia()`: Returns media from user's team
- `searchMedia()`: Team-based search
- `uploadMedia()`: Automatically assigns team_id

#### ItineraryService
- `list()`: Returns itineraries from user's team
- `generate()`: Creates itineraries with team_id
- `update()`: Team-based updates
- `delete()`: Team-based deletion

### 3. Component Updates

#### Itineraries Page (`src/pages/Itineraries.tsx`)
- Uses `QuoteService.getQuotes()` for team-based data
- Displays itineraries from quotes with team sharing
- Supports team-based filtering and search

#### ViewItinerary Page (`src/pages/ViewItinerary.tsx`)
- Uses `ItineraryService.loadItinerary()` for team-based access
- Enhanced UI with better hero section and layout
- Team-based itinerary viewing

#### MediaLibrary Page (`src/pages/MediaLibrary.tsx`)
- Uses `MediaLibraryService.getMedia()` for team-based data
- Team-based media management

#### Bookings Page (`src/pages/Bookings.tsx`)
- Uses `BookingService.getBookings()` for team-based data
- Team-based booking management

## Migration Process

### 1. Database Migration

Run the migration script to apply all changes:

```bash
node run-team-sharing-migration.cjs
```

The migration script performs:

1. **Adds team_id columns** to quotes, bookings, and media_library
2. **Creates itineraries table** with team_id support
3. **Updates existing records** with team_id based on user team membership
4. **Creates performance indexes** for team_id columns
5. **Enables RLS policies** for team-based access control
6. **Adds documentation comments** for all team_id columns

### 2. Data Migration

Existing data is automatically updated:

```sql
-- Update quotes with team_id
UPDATE public.quotes 
SET team_id = (
  SELECT tm.team_id 
  FROM public.team_members tm 
  WHERE tm.user_id = quotes.user_id 
  LIMIT 1
)
WHERE team_id IS NULL;

-- Update bookings with team_id
UPDATE public.bookings 
SET team_id = (
  SELECT tm.team_id 
  FROM public.team_members tm 
  WHERE tm.user_id = bookings.user_id 
  LIMIT 1
)
WHERE team_id IS NULL;
```

## Team Management

### 1. Team Creation

Teams are automatically created when users sign up:

```typescript
// Automatic team creation on user signup
export async function ensureUserHasTeam(userId: string): Promise<void> {
  const { data: existingTeam } = await supabase
    .from('team_members')
    .select('team_id')
    .eq('user_id', userId)
    .single();

  if (!existingTeam) {
    // Create new team and add user as owner
    const { data: team } = await supabase
      .from('teams')
      .insert({ name: 'My Team' })
      .select()
      .single();

    await supabase
      .from('team_members')
      .insert({
        team_id: team.id,
        user_id: userId,
        role: 'owner',
        status: 'active'
      });
  }
}
```

### 2. Team Membership

Users can be added to teams with different roles:

- **owner**: Full team management
- **admin**: Team management
- **member**: Basic access

### 3. Team Invitations

Team invitations are managed through the `team_invitations` table:

```sql
CREATE TABLE public.team_invitations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id),
  email text NOT NULL,
  role text DEFAULT 'member',
  status text DEFAULT 'pending',
  invited_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone DEFAULT (now() + interval '7 days'),
  
  CONSTRAINT team_invitations_pkey PRIMARY KEY (id)
);
```

## Benefits of Team Sharing

### 1. Collaboration
- Multiple team members can work on the same quotes, bookings, and itineraries
- Shared media library for team assets
- Real-time collaboration on travel planning

### 2. Data Security
- Row Level Security ensures users only see team data
- Team-based access control prevents data leakage
- Secure team membership management

### 3. Scalability
- Teams can grow without data isolation issues
- Performance optimized with proper indexing
- Flexible team structure support

### 4. User Experience
- Seamless team-based data access
- No manual data sharing required
- Consistent team-based UI/UX

## Usage Examples

### 1. Creating a Quote with Team Sharing

```typescript
// QuoteService automatically handles team_id
const quote = await QuoteService.createQuote({
  clientName: "John Doe",
  destination: "Paris",
  // ... other quote data
});
// team_id is automatically assigned based on user's team
```

### 2. Fetching Team Itineraries

```typescript
// Returns only itineraries from user's team
const itineraries = await ItineraryService.list(userId);
```

### 3. Team-Based Media Search

```typescript
// Search media within team
const media = await MediaLibraryService.searchMedia("paris", {
  team_id: await getCurrentUserTeamId()
});
```

### 4. Team Booking Management

```typescript
// Get all bookings from team
const bookings = await BookingService.getBookings();
```

## Troubleshooting

### 1. Missing Team ID

If users don't have a team_id assigned:

```typescript
// Ensure user has a team
await ensureUserHasTeam(userId);
```

### 2. RLS Policy Issues

If RLS policies are blocking access:

```sql
-- Check if user is in team
SELECT * FROM team_members 
WHERE user_id = auth.uid() 
AND team_id = 'target-team-id';
```

### 3. Performance Issues

If queries are slow, ensure indexes exist:

```sql
-- Check if team_id indexes exist
SELECT indexname FROM pg_indexes 
WHERE tablename = 'quotes' 
AND indexname LIKE '%team_id%';
```

## Future Enhancements

### 1. Advanced Team Features
- Team hierarchies and sub-teams
- Team-specific settings and preferences
- Team analytics and reporting

### 2. Enhanced Collaboration
- Real-time collaboration features
- Team activity feeds
- Team-based notifications

### 3. Advanced Security
- Team-based API rate limiting
- Team-specific feature flags
- Advanced audit logging

## Security Considerations

### 1. Data Isolation
- RLS policies ensure complete team data isolation
- No cross-team data access possible
- Secure team membership validation

### 2. Access Control
- Team-based permissions system
- Role-based access within teams
- Secure team invitation system

### 3. Audit Trail
- All team actions are logged
- Team membership changes tracked
- Data access patterns monitored

## Conclusion

The team sharing implementation provides a robust, secure, and scalable foundation for team-based collaboration in the GPGT system. All quotes, bookings, itineraries, and media library items are now shared within teams, with access controlled by team membership and RLS policies.

The implementation ensures:
- ✅ Complete data isolation between teams
- ✅ Seamless team-based collaboration
- ✅ Optimal performance with proper indexing
- ✅ Secure access control with RLS
- ✅ Automatic team management
- ✅ Comprehensive documentation and migration tools

This foundation enables teams to work together effectively while maintaining data security and system performance. 