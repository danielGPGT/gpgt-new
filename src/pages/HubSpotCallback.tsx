import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { HubSpotService } from '@/lib/hubspotService';
import { toast } from 'sonner';

export default function HubSpotCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    handleOAuthCallback();
  }, []);

  const handleOAuthCallback = async () => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    console.log('🔍 OAuth callback started:', { hasCode: !!code, hasState: !!state, hasError: !!error });

    // Check for OAuth errors
    if (error) {
      setStatus('error');
      setErrorMessage(`OAuth error: ${error}`);
      return;
    }

    // Validate required parameters
    if (!code || !state) {
      setStatus('error');
      setErrorMessage('Missing required OAuth parameters');
      return;
    }

    // Verify state parameter for security
    const storedState = localStorage.getItem('hubspot_oauth_state');
    const storedTeamId = localStorage.getItem('hubspot_team_id');
    
    if (!storedState || !storedTeamId || state !== storedState) {
      setStatus('error');
      setErrorMessage('Invalid OAuth state parameter');
      return;
    }

    // Prevent double execution using localStorage
    const processingKey = `hubspot_oauth_processing_${code}`;
    const isAlreadyProcessing = localStorage.getItem(processingKey);
    
    if (isAlreadyProcessing) {
      console.log('🔄 OAuth callback already in progress for this code, skipping...');
      return;
    }

    // Set processing flag
    localStorage.setItem(processingKey, 'true');

    try {
      console.log('✅ OAuth parameters validated, exchanging code for token...');

      // Exchange code for access token
      const tokenResponse = await HubSpotService.exchangeCodeForToken(code);
      
      console.log('✅ Token exchange successful, getting portal info...');
      
      // Get portal info to extract portal ID
      const portalInfo = await HubSpotService.getPortalInfo(tokenResponse.access_token);
      
      console.log('✅ Portal info retrieved, creating connection...');
      
      // Create HubSpot connection
      await HubSpotService.createConnection(
        storedTeamId,
        portalInfo.id.toString(),
        tokenResponse.access_token,
        tokenResponse.refresh_token,
        tokenResponse.expires_in
      );

      console.log('✅ HubSpot connection created successfully');

      // Clean up stored OAuth data
      localStorage.removeItem('hubspot_oauth_state');
      localStorage.removeItem('hubspot_team_id');
      localStorage.removeItem(processingKey);

      setStatus('success');
      toast.success('HubSpot connected successfully!');
      
      // Redirect to settings page after a short delay
      setTimeout(() => {
        navigate('/integrations');
      }, 2000);

    } catch (error: any) {
      console.error('HubSpot OAuth callback error:', error);
      setStatus('error');
      setErrorMessage(error.message || 'Failed to connect HubSpot account');
      
      // Clean up stored OAuth data on error
      localStorage.removeItem('hubspot_oauth_state');
      localStorage.removeItem('hubspot_team_id');
      localStorage.removeItem(processingKey);
    }
  };

  const handleRetry = () => {
    setStatus('loading');
    setErrorMessage('');
    handleOAuthCallback();
  };

  const handleGoToIntegrations = () => {
    navigate('/integrations');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Building2 className="h-12 w-12 text-primary" />
          </div>
          <CardTitle>HubSpot Connection</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {status === 'loading' && (
            <>
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="text-muted-foreground">
                Connecting your HubSpot account...
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="h-8 w-8 mx-auto text-success" />
              <p className="text-success font-medium">
                HubSpot Connected Successfully!
              </p>
              <p className="text-sm text-muted-foreground">
                Your HubSpot account is now connected and ready to sync data.
              </p>
              <Button onClick={handleGoToIntegrations} className="w-full">
                Back to Integrations
              </Button>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="h-8 w-8 mx-auto text-destructive" />
              <p className="text-destructive font-medium">
                Connection Failed
              </p>
              <p className="text-sm text-muted-foreground">
                {errorMessage}
              </p>
              <div className="space-y-2">
                <Button onClick={handleRetry} className="w-full">
                  Try Again
                </Button>
                <Button onClick={handleGoToIntegrations} variant="outline" className="w-full">
                  Back to Integrations
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 