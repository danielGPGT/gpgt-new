import { IntegrationConfig } from '@/components/integrations/IntegrationCard';

export const INTEGRATION_CONFIGS: Record<string, IntegrationConfig> = {
  hubspot: {
    id: 'hubspot',
    name: 'HubSpot',
    description: 'Sync contacts, deals, and companies from HubSpot CRM',
    logo: '',
    color: '#FF7A59',
    features: [
      'Contact synchronization',
      'Deal tracking',
      'Company data sync',
      'Automated workflows',
      'Real-time updates'
    ],
    syncTypes: ['contacts', 'deals', 'companies', 'full']
  },
  salesforce: {
    id: 'salesforce',
    name: 'Salesforce',
    description: 'Connect with Salesforce CRM for lead and opportunity management',
    logo: '',
    color: '#00A1E0',
    features: [
      'Lead management',
      'Opportunity tracking',
      'Account sync',
      'Custom fields',
      'Bidirectional sync'
    ],
    syncTypes: ['leads', 'opportunities', 'accounts', 'full']
  },
  pipedrive: {
    id: 'pipedrive',
    name: 'Pipedrive',
    description: 'Sync deals and contacts from Pipedrive CRM',
    logo: '',
    color: '#FF6B35',
    features: [
      'Deal pipeline sync',
      'Contact management',
      'Activity tracking',
      'Custom fields',
      'Webhook support'
    ],
    syncTypes: ['deals', 'contacts', 'activities', 'full']
  },
  zoho: {
    id: 'zoho',
    name: 'Zoho CRM',
    description: 'Integrate with Zoho CRM for comprehensive customer management',
    logo: '',
    color: '#E60023',
    features: [
      'Lead management',
      'Contact sync',
      'Deal tracking',
      'Custom modules',
      'Multi-currency support'
    ],
    syncTypes: ['leads', 'contacts', 'deals', 'full']
  }
};

export const getIntegrationConfig = (integrationId: string): IntegrationConfig | null => {
  return INTEGRATION_CONFIGS[integrationId] || null;
};

export const getAllIntegrationConfigs = (): IntegrationConfig[] => {
  return Object.values(INTEGRATION_CONFIGS);
}; 