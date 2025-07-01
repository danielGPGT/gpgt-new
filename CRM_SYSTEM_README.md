# CRM System for Travel Agents

This document outlines the comprehensive CRM (Customer Relationship Management) system built for travel agents to manage clients, track interactions, and integrate with the quote/proposal system.

## 🏗️ System Architecture

### Database Schema

The CRM system consists of three main tables:

1. **`clients`** - Central client management
2. **`client_interactions`** - Communication and interaction tracking
3. **`client_travel_history`** - Travel history and trip records

### Key Features

- ✅ **Client Management**: Create, edit, and manage client profiles
- ✅ **Client Search & Filtering**: Advanced search and filtering capabilities
- ✅ **Interaction Tracking**: Log all client communications
- ✅ **Travel History**: Track client trips and spending
- ✅ **CRM Integration**: Seamless integration with quote/proposal system
- ✅ **Team Support**: Multi-user and team-based access
- ✅ **Client Statistics**: Analytics and reporting

## 📊 Database Structure

### Clients Table
```sql
CREATE TABLE public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL, -- Travel agent who owns this client
  team_id uuid, -- For team-based access
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text,
  phone text,
  company text,
  job_title text,
  date_of_birth date,
  passport_number text,
  nationality text,
  preferred_language text DEFAULT 'English',
  address jsonb, -- { street, city, state, zip_code, country }
  preferences jsonb, -- Travel preferences and restrictions
  notes text,
  status text DEFAULT 'active', -- 'active', 'inactive', 'prospect', 'vip'
  source text, -- How they found you
  tags text[] DEFAULT '{}',
  budget_preference jsonb, -- { min: 1000, max: 5000, currency: 'USD' }
  payment_preference text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  last_contact_at timestamp with time zone
);
```

### Client Interactions Table
```sql
CREATE TABLE public.client_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  user_id uuid NOT NULL, -- Agent who made the interaction
  interaction_type text NOT NULL, -- 'email', 'phone', 'meeting', 'quote_sent', etc.
  subject text,
  content text,
  outcome text,
  next_action text,
  scheduled_follow_up timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);
```

### Client Travel History Table
```sql
CREATE TABLE public.client_travel_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  quote_id uuid REFERENCES quotes(id) ON DELETE SET NULL,
  destination text NOT NULL,
  start_date date,
  end_date date,
  trip_type text, -- 'leisure', 'business', 'honeymoon', etc.
  total_spent numeric,
  currency text DEFAULT 'USD',
  status text DEFAULT 'completed', -- 'planned', 'completed', 'cancelled'
  notes text,
  created_at timestamp with time zone DEFAULT now()
);
```

## 🔗 Integration with Existing System

### Quote System Integration

The CRM system integrates seamlessly with the existing quote/proposal system:

1. **Client Selection in Intake Form**: Users can select existing clients from the CRM when creating quotes
2. **Automatic Client Creation**: New clients are automatically created when quotes are generated for unknown clients
3. **Quote Linking**: All quotes are linked to client records via `client_id`
4. **Interaction Tracking**: Quote creation automatically creates interaction records

### Updated Quote Flow

1. **Client Selection**: In Step 1 of the intake form, users can select existing clients
2. **Auto-fill**: Client information is automatically populated in the form
3. **Quote Creation**: When creating a quote, the system:
   - Links the quote to the selected client
   - Creates an interaction record
   - Updates client's last contact date
4. **Travel History**: When quotes are confirmed, travel history records are created

## 🎯 Key Components

### 1. CRM Service (`src/lib/crmService.ts`)
Comprehensive service for all CRM operations:
- Client CRUD operations
- Interaction management
- Travel history tracking
- Client statistics and analytics
- Search and filtering

### 2. CRM Pages
- **`/crm`** - Main CRM dashboard with client list and statistics
- **`/crm/new-client`** - Create new client form
- **`/crm/client/:id`** - Client detail page with interactions and travel history
- **`/crm/client/:id/edit`** - Edit client form

### 3. Client Selector Component (`src/components/crm/ClientSelector.tsx`)
Reusable component for selecting clients in forms:
- Search functionality
- Client preview with status and budget
- Auto-fill form data
- Quick add new client option

### 4. Client Form Component (`src/components/crm/ClientForm.tsx`)
Comprehensive form for creating and editing clients:
- Tabbed interface (Basic Info, Contact, Preferences, Financial)
- Validation and error handling
- Tag management
- Preference tracking

## 🚀 Usage Guide

### For Travel Agents

#### 1. Managing Clients

**View All Clients:**
- Navigate to `/crm`
- Use search and filters to find specific clients
- View client statistics and recent activity

**Add New Client:**
- Click "Add New Client" button
- Fill out the comprehensive form with client details
- Add tags, preferences, and budget information

**Edit Client:**
- Click on any client card to view details
- Click "Edit Client" to modify information
- Update preferences, contact info, or status

#### 2. Creating Quotes with CRM Integration

**Select Existing Client:**
- Start creating a new quote/proposal
- In Step 1, use the client selector to choose an existing client
- Client information will auto-fill the form

**Create Quote for New Client:**
- Leave client selector empty
- Fill out client information manually
- System will automatically create a new client record

#### 3. Tracking Interactions

**Log Communications:**
- View client detail page
- Add new interactions (calls, emails, meetings)
- Set follow-up reminders
- Track outcomes and next actions

**View Travel History:**
- See all client trips and spending
- Track quote status and conversions
- Monitor client value over time

### For Developers

#### 1. Adding CRM Features

**Create New Client:**
```typescript
import { CRMService } from '@/lib/crmService';

const newClient = await CRMService.createClient({
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  phone: '+1234567890',
  status: 'active',
  source: 'website'
});
```

**Search Clients:**
```typescript
const clients = await CRMService.getClients({
  search: 'john',
  status: 'active',
  hasEmail: true
});
```

**Add Interaction:**
```typescript
await CRMService.createInteraction({
  clientId: 'client-uuid',
  interactionType: 'phone',
  subject: 'Follow-up call',
  content: 'Discussed upcoming trip to Paris',
  outcome: 'Client interested in luxury package',
  nextAction: 'Send detailed proposal by Friday'
});
```

#### 2. Integrating with Forms

**Use Client Selector:**
```typescript
import ClientSelector from '@/components/crm/ClientSelector';

<ClientSelector
  selectedClientId={selectedClientId}
  onClientSelect={(client) => {
    // Handle client selection
    if (client) {
      // Auto-fill form with client data
      form.setValue('name', `${client.firstName} ${client.lastName}`);
      form.setValue('email', client.email);
    }
  }}
/>
```

#### 3. Quote Integration

**Link Quote to Client:**
```typescript
// In quote creation
const quote = await QuoteService.createQuote({
  clientId: selectedClientId, // From CRM
  tripDetails: { ... },
  // ... other quote data
});
```

## 📈 Analytics and Reporting

The CRM system provides comprehensive analytics:

### Client Statistics
- Total clients by status
- New clients this month
- Clients with quotes
- Average quotes per client
- Total revenue and average revenue per client

### Client Insights
- Last contact date
- Interaction frequency
- Travel history and spending patterns
- Quote conversion rates
- Client lifetime value

## 🔒 Security and Permissions

### Row Level Security (RLS)
- Users can only access their own clients
- Team members can access team clients
- Proper authentication and authorization

### Data Privacy
- Client data is protected by RLS policies
- Audit trails for all changes
- Secure data transmission

## 🛠️ Technical Implementation

### TypeScript Types
All CRM entities are fully typed:
```typescript
interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  // ... complete type definition
}
```

### Error Handling
- Comprehensive error handling in all operations
- User-friendly error messages
- Graceful fallbacks

### Performance
- Optimized database queries
- Proper indexing for search and filtering
- Efficient data loading and caching

## 🔄 Migration and Setup

### Database Migration
Run the migration to create CRM tables:
```bash
# Apply the CRM migration
supabase db push
```

### Initial Setup
1. Apply the database migration
2. Verify RLS policies are active
3. Test client creation and management
4. Verify quote integration works

## 🎯 Future Enhancements

### Planned Features
- **Email Integration**: Direct email tracking and management
- **Calendar Integration**: Schedule meetings and follow-ups
- **Advanced Analytics**: More detailed reporting and insights
- **Client Portal**: Self-service client portal
- **Automation**: Automated follow-up reminders and workflows
- **Mobile App**: Mobile CRM access

### API Extensions
- REST API for external integrations
- Webhook support for real-time updates
- Third-party CRM integrations

## 📞 Support

For questions or issues with the CRM system:
1. Check the database migration logs
2. Verify RLS policies are correctly applied
3. Test with sample data
4. Review error logs in the browser console

The CRM system is designed to be robust, scalable, and user-friendly for travel agents to effectively manage their client relationships and grow their business. 