# Consultant System Testing Guide

## 🚀 **Step-by-Step Testing Process**

### **Phase 1: Database Migration Testing**

#### 1.1 Run the Migration
```bash
# Apply the consultant system migration
supabase db push
```

#### 1.2 Run Database Tests
```bash
# Run the automated test script
node test-consultant-system.cjs
```

**Expected Results:**
- ✅ Team members table accessible
- ✅ event_consultants table exists
- ✅ events table has primary_consultant_id column
- ✅ Database functions work
- ✅ RLS policies are active

### **Phase 2: Manual Database Testing**

#### 2.1 Check Database Structure
```sql
-- Check if new roles are available
SELECT DISTINCT role FROM team_members;

-- Check if event_consultants table exists
SELECT * FROM event_consultants LIMIT 1;

-- Check if events table has the new column
SELECT primary_consultant_id FROM events LIMIT 1;
```

#### 2.2 Test Database Functions
```sql
-- Test get_team_consultants function
SELECT * FROM get_team_consultants('your-team-id');

-- Test get_consultant_events function
SELECT * FROM get_consultant_events('consultant-id');
```

### **Phase 3: UI Component Testing**

#### 3.1 Test Team Management (Settings Page)

1. **Navigate to Settings → Team Management**
2. **Test Role Selection:**
   - Click "Invite Team Member"
   - Verify dropdown shows: Member, Admin, Sales Consultant, Operations
   - Select "Sales Consultant" role
   - Send invitation

3. **Test Role Display:**
   - Check if existing team members show correct roles
   - Verify role badges have appropriate colors

#### 3.2 Test Event Consultant Manager

1. **Create a Test Event:**
   ```sql
   INSERT INTO events (name, location, start_date, end_date) 
   VALUES ('Test Event', 'Test Location', '2024-12-25', '2024-12-26');
   ```

2. **Add EventConsultantManager to Event Page:**
   ```tsx
   import { EventConsultantManager } from '@/components/EventConsultantManager';
   
   // In your event page component
   <EventConsultantManager 
     event={eventData} 
     onConsultantAssigned={() => console.log('Consultant assigned')} 
   />
   ```

3. **Test Assignment Flow:**
   - Log in as admin/owner
   - Navigate to event page
   - Use EventConsultantManager to assign a consultant
   - Verify assignment appears in the list

#### 3.3 Test Consultant Dashboard

1. **Add ConsultantDashboard to Routes:**
   ```tsx
   // In your App.tsx or router
   import { ConsultantDashboard } from '@/components/ConsultantDashboard';
   
   // Add route for consultants
   <Route path="/consultant-dashboard" element={<ConsultantDashboard />} />
   ```

2. **Test Dashboard Access:**
   - Log in as a user with 'sales' role
   - Navigate to `/consultant-dashboard`
   - Verify dashboard loads with assigned events

### **Phase 4: End-to-End Testing**

#### 4.1 Complete Workflow Test

1. **Setup Test Data:**
   ```sql
   -- Create a test team
   INSERT INTO teams (name, owner_id) VALUES ('Test Team', 'user-id');
   
   -- Create a sales consultant
   INSERT INTO team_members (team_id, user_id, email, name, role, status)
   VALUES ('team-id', 'consultant-user-id', 'consultant@test.com', 'Test Consultant', 'sales', 'active');
   
   -- Create a test event
   INSERT INTO events (name, location, start_date, end_date)
   VALUES ('Test Event', 'Test Location', '2024-12-25', '2024-12-26');
   ```

2. **Test Assignment Process:**
   - Log in as team admin/owner
   - Assign consultant to event using EventConsultantManager
   - Verify assignment is created in database

3. **Test Consultant View:**
   - Log in as the assigned consultant
   - Access consultant dashboard
   - Verify assigned event appears

#### 4.2 Permission Testing

1. **Test Admin Permissions:**
   - Log in as admin/owner
   - Verify can assign consultants
   - Verify can remove consultants
   - Verify can view all team consultants

2. **Test Consultant Permissions:**
   - Log in as sales consultant
   - Verify can view assigned events
   - Verify cannot assign other consultants
   - Verify cannot access admin features

3. **Test Member Permissions:**
   - Log in as regular member
   - Verify cannot assign consultants
   - Verify can view team consultants (read-only)

### **Phase 5: Error Handling Testing**

#### 5.1 Test Edge Cases

1. **Invalid Role Assignment:**
   - Try to assign a non-sales user as consultant
   - Verify error message appears

2. **Cross-Team Assignment:**
   - Try to assign consultant from different team
   - Verify error message appears

3. **Duplicate Assignment:**
   - Try to assign same consultant to same event twice
   - Verify no duplicate entries

4. **Invalid Permissions:**
   - Try to assign consultant as regular member
   - Verify access denied

### **Phase 6: Performance Testing**

#### 6.1 Load Testing

1. **Multiple Consultants:**
   - Create 10+ consultants
   - Assign them to various events
   - Test dashboard performance

2. **Multiple Events:**
   - Create 50+ events
   - Assign consultants to events
   - Test query performance

#### 6.2 Database Performance

```sql
-- Test query performance
EXPLAIN ANALYZE SELECT * FROM get_team_consultants('team-id');
EXPLAIN ANALYZE SELECT * FROM get_consultant_events('consultant-id');
```

### **Phase 7: Integration Testing**

#### 7.1 API Integration

1. **Test TeamService Methods:**
   ```typescript
   // Test in browser console or component
   import { TeamService } from '@/lib/teamService';
   
   // Test getting team consultants
   const consultants = await TeamService.getTeamConsultants(teamId);
   console.log('Consultants:', consultants);
   
   // Test assigning consultant
   const result = await TeamService.assignConsultantToEvent(eventId, consultantId, 'Test assignment');
   console.log('Assignment result:', result);
   ```

2. **Test Event Integration:**
   - Verify EventConsultantManager integrates with existing event pages
   - Test real-time updates when consultants are assigned

### **Phase 8: User Acceptance Testing**

#### 8.1 Admin User Testing

1. **Team Management:**
   - [ ] Can invite users with sales role
   - [ ] Can assign consultants to events
   - [ ] Can remove consultants from events
   - [ ] Can view all team consultants

2. **Event Management:**
   - [ ] Can see consultant assignments on events
   - [ ] Can manage multiple consultants per event
   - [ ] Can add notes to assignments

#### 8.2 Consultant User Testing

1. **Dashboard:**
   - [ ] Can view assigned events
   - [ ] Can see event details and dates
   - [ ] Can see assignment notes
   - [ ] Dashboard shows correct statistics

2. **Event Access:**
   - [ ] Can access assigned events
   - [ ] Cannot access unassigned events
   - [ ] Can see assignment information

#### 8.3 Regular User Testing

1. **Permissions:**
   - [ ] Cannot assign consultants
   - [ ] Can view team consultants (read-only)
   - [ ] Cannot access consultant dashboard

## 🐛 **Troubleshooting Common Issues**

### **Migration Issues**

**Error: "cannot change name of input parameter"**
- Solution: Drop existing function first (already fixed in migration)

**Error: "table does not exist"**
- Solution: Check if migration ran successfully
- Run: `supabase db push`

### **Permission Issues**

**Error: "Only team admins and owners can assign consultants"**
- Solution: Ensure user has admin/owner role
- Check team membership status

**Error: "Only team members with sales role can be assigned as consultants"**
- Solution: Update team member role to 'sales'

### **UI Issues**

**Role dropdown not showing new options**
- Solution: Check if migration applied correctly
- Verify team_invitations table has updated constraint

**EventConsultantManager not loading**
- Solution: Check component imports
- Verify event data is passed correctly

## 📋 **Testing Checklist**

### **Database**
- [ ] Migration runs without errors
- [ ] New tables created successfully
- [ ] Role constraints updated
- [ ] Database functions work
- [ ] RLS policies active

### **UI Components**
- [ ] Settings page shows new roles
- [ ] EventConsultantManager loads
- [ ] ConsultantDashboard loads
- [ ] Role badges display correctly

### **Functionality**
- [ ] Can invite sales consultants
- [ ] Can assign consultants to events
- [ ] Consultants can view their dashboard
- [ ] Permissions work correctly

### **Integration**
- [ ] Components integrate with existing pages
- [ ] Real-time updates work
- [ ] Error handling works
- [ ] Performance is acceptable

## 🎯 **Success Criteria**

The consultant system is working correctly when:

1. ✅ **Database migration completes successfully**
2. ✅ **All UI components load without errors**
3. ✅ **Role-based permissions work correctly**
4. ✅ **Consultants can be assigned to events**
5. ✅ **Consultant dashboard shows assigned events**
6. ✅ **Admin can manage consultant assignments**
7. ✅ **Error handling works for edge cases**
8. ✅ **Performance is acceptable with multiple users/events**

## 🚀 **Next Steps After Testing**

1. **Deploy to Production** (if testing passes)
2. **Train Users** on the new system
3. **Monitor Performance** in production
4. **Gather Feedback** from users
5. **Plan Future Enhancements** based on usage 