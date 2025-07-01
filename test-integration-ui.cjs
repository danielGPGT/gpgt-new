const { createClient } = require('@supabase/supabase-js');

// Test the integration UI components
async function testIntegrationUI() {
  console.log('🧪 Testing Integration UI Components...\n');

  // Test 1: Check if HubSpot logo exists
  const fs = require('fs');
  const path = require('path');
  
  const hubspotLogoPath = path.join(__dirname, 'src/assets/hubspot-logo.svg');
  if (fs.existsSync(hubspotLogoPath)) {
    console.log('✅ HubSpot logo file exists');
  } else {
    console.log('❌ HubSpot logo file missing');
  }

  // Test 2: Check integration configuration
  const configPath = path.join(__dirname, 'src/lib/integrations/config.ts');
  if (fs.existsSync(configPath)) {
    console.log('✅ Integration config file exists');
    
    const configContent = fs.readFileSync(configPath, 'utf8');
    if (configContent.includes('hubspot')) {
      console.log('✅ HubSpot configuration found');
    } else {
      console.log('❌ HubSpot configuration missing');
    }
  } else {
    console.log('❌ Integration config file missing');
  }

  // Test 3: Check integration components
  const components = [
    'src/components/integrations/IntegrationCard.tsx',
    'src/components/integrations/SyncLogs.tsx',
    'src/components/integrations/HubSpotIntegration.tsx'
  ];

  components.forEach(component => {
    const componentPath = path.join(__dirname, component);
    if (fs.existsSync(componentPath)) {
      console.log(`✅ ${component} exists`);
    } else {
      console.log(`❌ ${component} missing`);
    }
  });

  // Test 4: Check pages
  const pages = [
    'src/pages/Integrations.tsx'
  ];

  pages.forEach(page => {
    const pagePath = path.join(__dirname, page);
    if (fs.existsSync(pagePath)) {
      console.log(`✅ ${page} exists`);
    } else {
      console.log(`❌ ${page} missing`);
    }
  });

  // Test 5: Check App.tsx has integrations route
  const appPath = path.join(__dirname, 'src/App.tsx');
  if (fs.existsSync(appPath)) {
    const appContent = fs.readFileSync(appPath, 'utf8');
    if (appContent.includes('/integrations')) {
      console.log('✅ Integrations route found in App.tsx');
    } else {
      console.log('❌ Integrations route missing from App.tsx');
    }
  }

  // Test 6: Check Sidebar has integrations link
  const sidebarPath = path.join(__dirname, 'src/components/layout/Sidebar.tsx');
  if (fs.existsSync(sidebarPath)) {
    const sidebarContent = fs.readFileSync(sidebarPath, 'utf8');
    if (sidebarContent.includes('Integrations') && sidebarContent.includes('/integrations')) {
      console.log('✅ Integrations link found in Sidebar');
    } else {
      console.log('❌ Integrations link missing from Sidebar');
    }
  }

  console.log('\n🎉 Integration UI Test Complete!');
  console.log('\n📋 Next Steps:');
  console.log('1. Start your development server: npm run dev');
  console.log('2. Navigate to /integrations in your browser');
  console.log('3. Test the HubSpot integration connection flow');
  console.log('4. Verify sync logs display correctly');
  console.log('5. Test error handling and UI feedback');
}

testIntegrationUI().catch(console.error); 