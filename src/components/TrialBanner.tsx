import { useStripeSubscription } from '@/hooks/useStripeSubscription';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, Crown, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function TrialBanner() {
  // Trial banner is no longer needed since we removed trial logic
  // Users now start with a free plan automatically
  return null;
} 