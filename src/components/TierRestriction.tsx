import React from 'react';

interface TierRestrictionProps {
  type: 'custom_branding' | 'media_library' | 'team_collaboration' | 'api_access' | 'white_label' | 'advanced_ai';
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgradePrompt?: boolean;
}

export function TierRestriction({ 
  type, 
  children, 
  fallback,
  showUpgradePrompt = true 
}: TierRestrictionProps) {
  // All features are now available to all users
  return <>{children}</>;
} 