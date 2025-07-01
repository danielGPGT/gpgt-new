# HubSpot Integration Setup Guide

This guide will help you set up the HubSpot integration for your AItinerary application, allowing each team to connect their HubSpot account and sync data between the two systems.

## 🎯 Overview

The HubSpot integration provides:
- **OAuth Authentication**: Secure connection to HubSpot accounts
- **Bidirectional Sync**: Sync clients, deals, and interactions
- **Team-based Connections**: Each team can connect their own HubSpot account
- **Configurable Settings**: Customize what data syncs and how
- **Sync Monitoring**: Track sync status and history

## 📋 Prerequisites

1. **HubSpot Developer Account**: You need a HubSpot developer account to create an app
2. **Supabase Database**: The integration uses your existing Supabase setup
3. **Environment Variables**: You'll need to configure HubSpot OAuth credentials

## 🚀 Step-by-Step Setup

### Step 1: Create HubSpot App

1. Go to [HubSpot Developer Portal](https://developers.hubspot.com/)
2. Sign in with your HubSpot account
3. Click "Create app"
4. Fill in the app details:
   - **App name**: `AItinerary CRM Integration`
   - **App description**: `CRM integration for travel agencies`
   - **App type**: Choose "Custom app"
5. Click "Create app"

### Step 2: Configure OAuth Settings

1. In your HubSpot app, go to **Auth** → **OAuth**
2. Add the following redirect URLs:
   - `http://localhost:5173/auth/callback` (for development)
   - `https://yourdomain.com/auth/callback` (for production)
3. Note down your **Client ID** and **Client Secret**

### Step 3: Set Required Scopes

In your HubSpot app, go to **Auth** → **Scopes** and add these scopes:

```
crm.objects.contacts.read
crm.objects.contacts.write
crm.objects.deals.read
crm.objects.deals.write
```

**Optional scopes (for advanced features):**
```
crm.objects.companies.read
crm.objects.companies.write
crm.schemas.contacts.read
crm.schemas.companies.read
crm.schemas.deals.read
```

### Step 4: Environment Variables

Add these variables to your `.env.local` file:

```env
# HubSpot OAuth Configuration
VITE_HUBSPOT_CLIENT_ID=your_hubspot_client_id_here
VITE_HUBSPOT_CLIENT_SECRET=your_hubspot_client_secret_here
```

### Step 5: Database Migration

Run the HubSpot integration migration:

```bash
# If using Supabase CLI
supabase db push

# Or manually run the migration file:
# supabase/migrations/20241227000000_create_hubspot_integration.sql
```

### Step 6: Test the Integration

1. Start your development server: `npm run dev`
2. Navigate to Settings → Integrations
3. Click "Connect HubSpot Account"
4. Complete the OAuth flow
5. Verify the connection is successful

## 🔧 Configuration Options

### Sync Settings

Teams can configure the following sync options:

- **Sync Contacts**: Automatically sync client data with HubSpot contacts
- **Sync Deals**: Automatically sync quotes with HubSpot deals
- **Sync Companies**: Sync company information (optional)
- **Sync Interactions**: Sync client interactions and notes
- **Sync Travel History**: Sync travel history and bookings
- **Auto-create Contacts**: Create HubSpot contacts for new clients
- **Auto-create Deals**: Create HubSpot deals for new quotes
- **Sync Direction**: Choose between one-way or bidirectional sync

### Field Mapping

The integration automatically maps the following fields:

**Client → HubSpot Contact:**
- `firstName` → `firstname`
- `lastName` → `lastname`
- `email` → `email`
- `phone` → `phone`
- `company` → `company`
- `jobTitle` → `jobtitle`
- `status` → `lifecyclestage`
- `source` → `lead_status`

**Quote → HubSpot Deal:**
- `clientName` → `dealname`
- `totalPrice` → `amount`
- `status` → `dealstage`
- `destination` → `description`

## 🔒 Security Features

### OAuth Security
- State parameter validation prevents CSRF attacks
- Secure token storage in database
- Automatic token refresh handling

### Row Level Security (RLS)
- Users can only access their team's HubSpot connections
- Team owners can manage integrations
- Team admins can view integration status

### Data Protection
- Access tokens are encrypted in the database
- Refresh tokens are securely stored
- All API calls use HTTPS

## 📊 Monitoring & Troubleshooting

### Sync Logs
The integration provides detailed sync logs showing:
- Sync type (contacts, deals, companies, full_sync)
- Status (started, completed, failed, partial)
- Records processed, synced, and failed
- Error messages for failed syncs
- Duration and timestamps

### Common Issues

**OAuth Errors:**
- Check redirect URLs in HubSpot app settings
- Verify client ID and secret in environment variables
- Ensure required scopes are configured

**Sync Failures:**
- Check HubSpot API rate limits
- Verify access token hasn't expired
- Review sync logs for specific error messages

**Permission Issues:**
- Ensure user has admin/owner role in team
- Check RLS policies are properly configured
- Verify team membership status

## 🚀 Production Deployment

### Environment Setup
1. Update redirect URLs in HubSpot app for production domain
2. Set production environment variables
3. Run database migrations on production database

### Monitoring
1. Set up alerts for sync failures
2. Monitor API rate limits
3. Track sync performance metrics

### Backup & Recovery
1. Regular backups of HubSpot connection data
2. Document recovery procedures
3. Test integration after database restores

## 🔄 Sync Process

### Automatic Sync
- Daily sync runs automatically for connected accounts
- Syncs only changed records since last sync
- Handles conflicts based on sync direction settings

### Manual Sync
- Users can trigger manual sync from the UI
- Manual sync processes all records
- Useful for initial data migration

### Conflict Resolution
- **To HubSpot**: AItinerary data takes precedence
- **From HubSpot**: HubSpot data takes precedence
- **Bidirectional**: Most recent update wins

## 📈 Performance Optimization

### Batch Processing
- Syncs are processed in batches of 100 records
- Configurable batch sizes for different record types
- Rate limiting to respect HubSpot API limits

### Incremental Sync
- Only syncs records modified since last sync
- Reduces API calls and processing time
- Maintains sync timestamps for tracking

### Error Handling
- Failed records are logged with error details
- Partial syncs continue processing other records
- Retry mechanisms for transient failures

## 🎯 Best Practices

### Data Quality
1. Ensure consistent data formats between systems
2. Validate required fields before sync
3. Handle missing or invalid data gracefully

### User Experience
1. Provide clear feedback during sync operations
2. Show sync status and progress indicators
3. Allow users to configure sync preferences

### Maintenance
1. Regular monitoring of sync performance
2. Periodic review of sync logs
3. Update field mappings as needed

## 🔮 Future Enhancements

### Planned Features
- **Custom Field Mapping**: UI for configuring field mappings
- **Sync Scheduling**: Custom sync frequency settings
- **Advanced Filtering**: Sync only specific record types
- **Bulk Operations**: Import/export large datasets
- **Webhook Support**: Real-time sync triggers

### Integration Extensions
- **HubSpot Workflows**: Trigger HubSpot workflows on sync
- **Custom Properties**: Support for custom HubSpot properties
- **Multi-object Sync**: Sync additional object types
- **Analytics Integration**: Sync analytics and reporting data

## 📞 Support

For issues with the HubSpot integration:

1. Check the sync logs in the UI
2. Review this setup guide
3. Verify HubSpot app configuration
4. Check environment variables
5. Review database migration status

## 🔗 Useful Links

- [HubSpot Developer Documentation](https://developers.hubspot.com/)
- [HubSpot API Reference](https://developers.hubspot.com/docs/api)
- [OAuth 2.0 Guide](https://developers.hubspot.com/docs/api/oauth-quickstart-guide)
- [Supabase Documentation](https://supabase.com/docs)

---

**Note**: This integration is designed for team-based usage, ensuring each team can connect their own HubSpot account independently while maintaining data isolation and security. 