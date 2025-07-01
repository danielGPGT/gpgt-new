import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { User, Lock, Mail, CheckCircle, ArrowRight, Loader2, Crown, Users, Globe, Building2, Sparkles, Phone, Shield, Zap, Star, Rocket, Eye, EyeOff, AlertCircle, TrendingUp, Clock, Award } from 'lucide-react';
import { auth } from '@/lib/auth';
import { useAuth } from '@/lib/AuthProvider';
import { StripeService } from '@/lib/stripeService';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

const planInfo = {
  free: {
    name: 'Free (Solo)',
    price: '£0',
    description: 'Perfect for individual travel agents',
    icon: <Users className="h-5 w-5" />,
    color: 'from-blue-500 to-cyan-500',
    features: [
      'Basic booking tools with markup',
      'AI itinerary generator',
      '5 itineraries per month',
      '10 PDF downloads per month',
      'Basic AI recommendations',
      'Standard templates',
      'Email support'
    ]
  },
  pro: {
    name: 'Pro (White-label)',
    price: '£39',
    description: 'Ideal for growing travel agencies',
    icon: <Crown className="h-5 w-5" />,
    color: 'from-purple-500 to-pink-500',
    features: [
      'All Free features',
      'PDF branding & customization',
      'Logo upload & management',
      'Custom portal branding',
      'Unlimited itineraries',
      'Unlimited PDF downloads',
      'Full Media Library access',
      'Advanced AI features',
      'Analytics dashboard (1 year)',
      'API access (1000 calls/month)',
      'Priority support',
      'Bulk operations'
    ]
  },
  agency: {
    name: 'Agency',
    price: '£99+',
    description: 'For travel agencies with multiple agents',
    icon: <Building2 className="h-5 w-5" />,
    color: 'from-green-500 to-emerald-500',
    features: [
      'All Pro features',
      'Multi-seat dashboard (up to 10 seats)',
      'Team collaboration tools',
      'Role-based permissions',
      'Shared media library',
      'Team analytics & reporting',
      'Bulk team operations',
      'Advanced team management',
      'Dedicated team support'
    ]
  },
  enterprise: {
    name: 'Enterprise',
    price: 'Custom',
    description: 'For large travel organizations',
    icon: <Globe className="h-5 w-5" />,
    color: 'from-orange-500 to-red-500',
    features: [
      'All Agency features',
      'Unlimited seats',
      'API access',
      'Premium support',
      'Custom integrations',
      'White-label solution',
      'Dedicated account manager',
      'Training & onboarding',
      'SLA guarantee',
      'Advanced security',
      'Custom AI training',
      '24/7 phone support'
    ]
  }
};

export default function Signup() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedPlan = searchParams.get('plan') as 'free' | 'pro' | 'agency' | 'enterprise' | null;
  const nameInputRef = useRef<HTMLInputElement>(null);
  
  // Form data
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [agencyName, setAgencyName] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoUrl, setLogoUrl] = useState("");
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [localSelectedPlan, setLocalSelectedPlan] = useState<'free' | 'pro' | 'agency' | 'enterprise'>(
    selectedPlan || 'free'
  );
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [animationStep, setAnimationStep] = useState(0);

  // Validation states
  const [touched, setTouched] = useState({
    name: false,
    email: false,
    phone: false,
    password: false,
    confirmPassword: false
  });

  // Auto-focus on first field
  useEffect(() => {
    if (nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, []);

  // Staggered animations
  useEffect(() => {
    const timer = setTimeout(() => setAnimationStep(1), 100);
    return () => clearTimeout(timer);
  }, []);

  // Plan recommendation logic
  const getRecommendedPlan = () => {
    // Simple logic - could be enhanced with user behavior analysis
    if (email.includes('agency') || email.includes('travel')) {
      return 'agency';
    } else if (email.includes('pro') || email.includes('business')) {
      return 'pro';
    }
    return 'free';
  };

  const recommendedPlan = getRecommendedPlan();

  // Password strength calculation
  const getPasswordStrength = (password: string) => {
    if (!password) return { score: 0, label: '', color: '' };
    
    let score = 0;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    
    const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
    const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];
    
    return {
      score: Math.min(score, 4),
      label: labels[score],
      color: colors[score]
    };
  };

  // Real-time validation
  const getFieldError = (field: string, value: string) => {
    if (!touched[field as keyof typeof touched]) return '';
    
    switch (field) {
      case 'name':
        return !value.trim() ? 'Name is required' : '';
      case 'email':
        if (!value.trim()) return 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please enter a valid email';
        return '';
      case 'phone':
        return !value.trim() ? 'Phone number is required' : '';
      case 'password':
        if (!value) return 'Password is required';
        if (value.length < 6) return 'Password must be at least 6 characters';
        return '';
      case 'confirmPassword':
        if (!value) return 'Please confirm your password';
        if (value !== password) return 'Passwords do not match';
        return '';
      default:
        return '';
    }
  };

  const handleFieldBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const isFormValid = () => {
    return name.trim() && 
           email.trim() && 
           /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
           phone.trim() && 
           password.length >= 6 && 
           password === confirmPassword &&
           privacyAccepted;
  };

  // Redirect if already signed in
  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  async function uploadLogo(file: File, userEmail: string): Promise<string | null> {
    // Only attempt upload if userEmail is present and bucket exists
    if (!userEmail) {
      setError('Cannot upload logo: missing user email');
      return null;
    }
    const fileExt = file.name.split('.').pop();
    const filePath = `${userEmail}-${Date.now()}.${fileExt}`;
    try {
      // Check if bucket exists (optional: skip if you know it exists)
      // const { data: buckets } = await supabase.storage.listBuckets();
      // if (!buckets?.find(b => b.id === 'logos')) {
      //   setError('Logo upload bucket does not exist');
      //   return null;
      // }
      const { data, error } = await supabase.storage
        .from('logos')
        .upload(filePath, file);
      if (error) {
        setError('Logo upload failed: ' + error.message);
        return null;
      }
      const { data: publicUrlData } = supabase.storage
        .from('logos')
        .getPublicUrl(filePath);
      const publicUrl = publicUrlData?.publicUrl;
      if (!publicUrl) {
        setError('Failed to get public URL for uploaded logo');
        return null;
      }
      console.log('Logo uploaded successfully:', publicUrl);
      return publicUrl;
    } catch (err: any) {
      setError('Logo upload error: ' + (err.message || err.toString()));
      return null;
    }
  }

  const handleFreeSignup = async (logoUrlParam?: string) => {
    try {
      // 1. Create the user
      const { user, error } = await auth.signUp(email, password, name, phone, agencyName, logoUrlParam || "");
      if (error) {
        throw error;
      }
      if (!user) {
        setError('Signup failed: No user returned');
        return;
      }
      // 2. Wait for the team to be created (poll for up to 5 seconds)
      let team = null;
      for (let i = 0; i < 10; i++) {
        const { data: foundTeam } = await supabase
          .from('teams')
          .select('id')
          .eq('owner_id', user.id)
          .single();
        if (foundTeam && foundTeam.id) {
          team = foundTeam;
          break;
        }
        await new Promise(res => setTimeout(res, 500));
      }
      if (!team) {
        setError('Signup failed: Team was not created. Please try again.');
        return;
      }
      // 3. Create a free subscription for the team
      const { data: subscription, error: subError } = await supabase
        .from('subscriptions')
        .insert({
          team_id: team.id,
          user_id: user.id,
          plan_type: 'free',
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          cancel_at_period_end: false
        })
        .select()
        .single();
      if (subError || !subscription) {
        setError('Signup failed: Could not create subscription.');
        return;
      }
      // 4. Link the team to the subscription
      await supabase
        .from('teams')
        .update({ subscription_id: subscription.id })
        .eq('id', team.id);
      // 5. Link the subscription to the team (redundant, but ensures both are set)
      await supabase
        .from('subscriptions')
        .update({ team_id: team.id })
        .eq('id', subscription.id);
      toast.success("Account created successfully! Welcome to AItinerary.");
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Signup failed");
    }
  };

  const handlePaidSignup = async (logoUrlParam?: string) => {
    try {
      const result = await StripeService.createSubscription(
        null,
        localSelectedPlan,
        email,
        name,
        undefined,
        { email, password, name, phone, agency_name: agencyName, logo_url: logoUrlParam || "" }
      );
      if (result.success) {
        if (result.error && result.error.includes('Redirect failed')) {
          // If redirect failed but session was created, try manual redirect
          toast.success('Payment session created. Redirecting to checkout...');
          // Try to redirect manually using the session ID
          const stripe = await import('@stripe/stripe-js').then(m => m.loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY));
          if (stripe && result.subscriptionId) {
            const { error } = await stripe.redirectToCheckout({
              sessionId: result.subscriptionId,
            });
            if (error) {
              // If redirect still fails, try direct URL
              const urlResult = await StripeService.getCheckoutSessionUrl(result.subscriptionId);
              if (urlResult.success && urlResult.url) {
                window.location.href = urlResult.url;
              } else {
                toast.error(`Redirect failed: ${error.message}. Please try again.`);
              }
            }
          }
        } else {
          toast.success("Redirecting to secure payment...");
        }
      } else {
        setError(result.error || 'Failed to create subscription');
      }
    } catch (err: any) {
      setError(err.message || "Signup failed");
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid()) return;
    setIsLoading(true);
    setError("");
    let finalLogoUrl = "";
    try {
      if (logoFile) {
        setLogoUploading(true);
        // Only upload logo if email is present
        if (!email) {
          setError('Please enter your email before uploading a logo.');
          setLogoUploading(false);
          setIsLoading(false);
          return;
        }
        const uploadedUrl = await uploadLogo(logoFile, email);
        if (uploadedUrl) {
          setLogoUrl(uploadedUrl);
          finalLogoUrl = uploadedUrl;
        }
        setLogoUploading(false);
      }
      // For free plan, handle signup and subscription creation
      if (localSelectedPlan === 'free') {
        await handleFreeSignup(finalLogoUrl);
        return;
      } else if (localSelectedPlan === 'enterprise') {
        window.location.href = 'mailto:sales@luxetripbuilder.com?subject=Enterprise Plan Inquiry&body=Name: ' + name + '%0D%0AEmail: ' + email + '%0D%0APhone: ' + phone;
        return;
      } else {
        // For paid plans, do NOT run any team/subscription queries here
        // Only redirect to Stripe for payment, let webhook handle team/subscription creation
        await handlePaidSignup(finalLogoUrl);
        // handlePaidSignup should handle redirect to Stripe
        return;
      }
    } catch (err: any) {
      setError(err.message || "Signup failed");
    } finally {
      setIsLoading(false);
      setLogoUploading(false);
    }
  };

  const getButtonText = () => {
    if (localSelectedPlan === 'free') {
      return 'Start for Free';
    } else if (localSelectedPlan === 'enterprise') {
      return 'Contact Sales';
    } else {
      return 'Subscribe Now';
    }
  };

  const isEnterprise = localSelectedPlan === 'enterprise';

  return (
    <div className="min-h-screen bg-background relative overflow-hidden pt-20">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 right-20 w-32 h-32 bg-primary rounded-full blur-xl"></div>
        <div className="absolute bottom-40 left-10 w-24 h-24 bg-secondary rounded-full blur-lg"></div>
        <div className="absolute top-1/2 right-1/4 w-16 h-16 bg-primary rounded-full blur-md"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start min-h-screen">
          {/* Left Side - Plan Selector */}
          <div className={`flex flex-col justify-center transition-all duration-700 ${
            animationStep >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            {/* Header */}
            <div className="text-center lg:text-left mb-8">
              <Badge variant="secondary" className="mb-4 bg-primary/10 text-primary border-primary/20">
                <Sparkles className="h-4 w-4 mr-2" />
                Join AItinerary Today
              </Badge>
              
              <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
                Start Your Journey
                <span className="block text-primary">with AI-Powered Travel</span>
              </h1>
              
              <p className="text-lg text-muted-foreground max-w-lg">
                Create stunning itineraries, manage bookings, and grow your travel business with our comprehensive platform.
              </p>
            </div>

            {/* Plan Recommendation */}
            {recommendedPlan !== 'free' && (
              <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <Award className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="font-medium text-blue-900">Recommended for you</div>
                    <div className="text-sm text-blue-700">
                      Based on your email, we recommend the <strong>{planInfo[recommendedPlan].name}</strong> plan
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Plan Selector */}
            <div>
              <h3 className="font-medium text-lg text-foreground mb-4">Choose Your Plan</h3>
              <div className="space-y-3">
                {Object.entries(planInfo).map(([planKey, plan], index) => (
                  <button
                    key={planKey}
                    type="button"
                    className={`relative w-full p-4 rounded-xl border transition-all duration-300 text-left hover:shadow-lg transform hover:scale-[1.02] ${
                      localSelectedPlan === planKey 
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20 shadow-lg scale-[1.02]' 
                        : 'border-border bg-background hover:border-primary/50'
                    } ${planKey === recommendedPlan ? 'ring-2 ring-blue-200 bg-blue-50/50' : ''}`}
                    onClick={() => {
                      setLocalSelectedPlan(planKey as 'free' | 'pro' | 'agency' | 'enterprise');
                    }}
                    style={{
                      animationDelay: `${index * 100}ms`,
                      animation: animationStep >= 1 ? 'slideInUp 0.5s ease-out forwards' : 'none'
                    }}
                  >
                    {planKey === recommendedPlan && (
                      <div className="absolute -top-2 -left-2">
                        <Badge className="bg-blue-600 text-white text-xs">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          Recommended
                        </Badge>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${plan.color} flex items-center justify-center text-white transition-transform duration-300 ${localSelectedPlan === planKey ? 'scale-110' : ''}`}>
                        {plan.icon}
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-base">{plan.name}</div>
                        <div className="text-sm text-muted-foreground">{plan.description}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg">{plan.price}/mo</div>
                        {planKey === 'free' ? (
                          <div className="text-xs text-green-600 font-medium">No credit card required</div>
                        ) : planKey === 'enterprise' ? (
                          <div className="text-xs text-blue-600 font-medium">Contact sales</div>
                        ) : (
                          <div className="text-xs text-blue-600 font-medium">Paid immediately</div>
                        )}
                      </div>
                    </div>
                    
                    {/* Plan features - more compact */}
                    <div className="text-sm text-muted-foreground">
                      {plan.features.slice(0, 3).join(' • ')}
                      {plan.features.length > 3 && ' • ...'}
                    </div>
                    
                    {/* Selection indicator */}
                    {localSelectedPlan === planKey && (
                      <div className="absolute top-2 right-2">
                        <div className="w-4 h-4 bg-primary/80 rounded-full flex items-center justify-center">
                          <CheckCircle className="h-3 w-3 text-white" />
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Trust indicators */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-6 text-muted-foreground mt-6">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm font-medium">No Credit Card Required</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm font-medium">Free Plan Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm font-medium">Cancel Anytime</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Signup Form */}
          <div className={`w-full transition-all duration-700 ${
            animationStep >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            <Card className="w-full shadow-2xl border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-6">
                {/* Subtle Form Header */}
                <div className="text-center">
                  <div className="mx-auto w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <CardTitle className="text-lg font-semibold">Create Your Account</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">Fill in your details to get started</p>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <form onSubmit={handleSignup} className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div style={{ animationDelay: '100ms', animation: animationStep >= 1 ? 'slideInRight 0.5s ease-out forwards' : 'none' }}>
                    <label htmlFor="name" className="block text-sm font-medium mb-2">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        ref={nameInputRef}
                        id="name"
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className={`pl-10 h-11 ${getFieldError('name', name) ? 'border-red-500 focus:border-red-500' : ''}`}
                        placeholder="Enter your full name"
                        required
                        onBlur={() => handleFieldBlur('name')}
                      />
                    </div>
                    {getFieldError('name', name) && (
                      <div className="flex items-center gap-1 mt-1 text-red-500 text-sm">
                        <AlertCircle className="h-3 w-3" />
                        {getFieldError('name', name)}
                      </div>
                    )}
                  </div>
                  
                  <div style={{ animationDelay: '200ms', animation: animationStep >= 1 ? 'slideInRight 0.5s ease-out forwards' : 'none' }}>
                    <label htmlFor="email" className="block text-sm font-medium mb-2">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className={`pl-10 h-11 ${getFieldError('email', email) ? 'border-red-500 focus:border-red-500' : ''}`}
                        placeholder="Enter your email"
                        required
                        onBlur={() => handleFieldBlur('email')}
                      />
                    </div>
                    {getFieldError('email', email) && (
                      <div className="flex items-center gap-1 mt-1 text-red-500 text-sm">
                        <AlertCircle className="h-3 w-3" />
                        {getFieldError('email', email)}
                      </div>
                    )}
                  </div>

                  <div style={{ animationDelay: '300ms', animation: animationStep >= 1 ? 'slideInRight 0.5s ease-out forwards' : 'none' }}>
                    <label htmlFor="phone" className="block text-sm font-medium mb-2">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="text"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        className={`pl-10 h-11 ${getFieldError('phone', phone) ? 'border-red-500 focus:border-red-500' : ''}`}
                        placeholder="Enter your phone number"
                        required
                        onBlur={() => handleFieldBlur('phone')}
                      />
                    </div>
                    {getFieldError('phone', phone) && (
                      <div className="flex items-center gap-1 mt-1 text-red-500 text-sm">
                        <AlertCircle className="h-3 w-3" />
                        {getFieldError('phone', phone)}
                      </div>
                    )}
                  </div>
                  
                  <div style={{ animationDelay: '350ms', animation: animationStep >= 1 ? 'slideInRight 0.5s ease-out forwards' : 'none' }}>
                    <label htmlFor="agencyName" className="block text-sm font-medium mb-2">Agency Name (optional)</label>
                    <Input
                      id="agencyName"
                      type="text"
                      value={agencyName}
                      onChange={e => setAgencyName(e.target.value)}
                      className="h-11"
                      placeholder="Enter your agency name"
                    />
                  </div>
                  
                  <div style={{ animationDelay: '360ms', animation: animationStep >= 1 ? 'slideInRight 0.5s ease-out forwards' : 'none' }}>
                    <label htmlFor="logo" className="block text-sm font-medium mb-2">Agency Logo (optional)</label>
                    <input
                      id="logo"
                      type="file"
                      accept="image/*"
                      onChange={e => setLogoFile(e.target.files?.[0] || null)}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                    />
                    {logoUploading && <div className="text-xs text-muted-foreground mt-1">Uploading logo...</div>}
                    {logoUrl && <img src={logoUrl} alt="Logo preview" className="mt-2 h-12" />}
                  </div>
                  
                  <div style={{ animationDelay: '400ms', animation: animationStep >= 1 ? 'slideInRight 0.5s ease-out forwards' : 'none' }}>
                    <label htmlFor="password" className="block text-sm font-medium mb-2">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className={`pl-10 pr-10 h-11 ${getFieldError('password', password) ? 'border-red-500 focus:border-red-500' : ''}`}
                        placeholder="Create a password"
                        required
                        onBlur={() => handleFieldBlur('password')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    
                    {/* Password strength indicator */}
                    {password && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                          <span>Password strength:</span>
                          <span className={`font-medium ${getPasswordStrength(password).color ? getPasswordStrength(password).color.replace('bg-', 'text-') : 'text-muted-foreground'}`}>
                            {getPasswordStrength(password).label}
                          </span>
                        </div>
                        <Progress 
                          value={(getPasswordStrength(password).score / 4) * 100} 
                          className="h-1"
                        />
                        <div className="flex gap-1 mt-1">
                          {[1, 2, 3, 4].map((level) => (
                            <div
                              key={level}
                              className={`h-1 flex-1 rounded-full transition-colors ${
                                level <= getPasswordStrength(password).score 
                                  ? getPasswordStrength(password).color 
                                  : 'bg-gray-200'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {getFieldError('password', password) && (
                      <div className="flex items-center gap-1 mt-1 text-red-500 text-sm">
                        <AlertCircle className="h-3 w-3" />
                        {getFieldError('password', password)}
                      </div>
                    )}
                  </div>
                  
                  <div style={{ animationDelay: '500ms', animation: animationStep >= 1 ? 'slideInRight 0.5s ease-out forwards' : 'none' }}>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        className={`pl-10 pr-10 h-11 ${getFieldError('confirmPassword', confirmPassword) ? 'border-red-500 focus:border-red-500' : ''}`}
                        placeholder="Confirm your password"
                        required
                        onBlur={() => handleFieldBlur('confirmPassword')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {getFieldError('confirmPassword', confirmPassword) && (
                      <div className="flex items-center gap-1 mt-1 text-red-500 text-sm">
                        <AlertCircle className="h-3 w-3" />
                        {getFieldError('confirmPassword', confirmPassword)}
                      </div>
                    )}
                  </div>

                  {/* Privacy Policy Checkbox */}
                  <div style={{ animationDelay: '600ms', animation: animationStep >= 1 ? 'slideInRight 0.5s ease-out forwards' : 'none' }} className="flex items-start space-x-2">
                    <Checkbox
                      id="privacy"
                      checked={privacyAccepted}
                      onCheckedChange={(checked) => setPrivacyAccepted(checked as boolean)}
                      className="mt-1"
                    />
                    <div className="grid gap-1.5 leading-none">
                      <label
                        htmlFor="privacy"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        I agree to the terms and conditions
                      </label>
                      <p className="text-xs text-muted-foreground">
                        By creating an account, you agree to our{' '}
                        <a href="/terms" className="text-primary hover:underline">Terms of Service</a>
                        {' '}and{' '}
                        <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>
                      </p>
                    </div>
                  </div>

                  {/* Plan-specific messaging */}
                  {localSelectedPlan === 'free' && (
                    <Alert className="border-green-200 bg-green-50">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        Start using AItinerary immediately with our free plan. No credit card required.
                      </AlertDescription>
                    </Alert>
                  )}

                  {localSelectedPlan === 'enterprise' && (
                    <Alert className="border-blue-200 bg-blue-50">
                      <Sparkles className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-blue-800">
                        For enterprise plans, we'll contact you to discuss your specific needs and provide a custom quote.
                      </AlertDescription>
                    </Alert>
                  )}

                  {localSelectedPlan !== 'free' && localSelectedPlan !== 'enterprise' && (
                    <Alert className="border-blue-200 bg-blue-50">
                      <Crown className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-blue-800">
                        You'll be redirected to our secure payment processor to complete your subscription.
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full h-11 text-base font-semibold" 
                    disabled={isLoading || isEnterprise || !isFormValid()}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        {isEnterprise ? 'Opening Email...' : 'Creating Account...'}
                      </>
                    ) : (
                      <>
                        {getButtonText()}
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>

                  {/* Social proof */}
                  <div className="text-center mt-4">
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-2">
                      <div className="flex -space-x-2">
                        <div className="w-6 h-6 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold">J</div>
                        <div className="w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold">S</div>
                        <div className="w-6 h-6 bg-purple-500 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold">M</div>
                        <div className="w-6 h-6 bg-orange-500 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold">A</div>
                      </div>
                      <span>Join 10,000+ travel agents</span>
                    </div>
                    <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Shield className="h-3 w-3 text-green-500" />
                        <span>SSL Secured</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        <span>GDPR Compliant</span>
                      </div>
                    </div>
                  </div>
                </form>

                <div className="mt-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Already have an account?{' '}
                    <a href="/login" className="text-primary hover:text-primary/80 font-medium">
                      Sign in
                    </a>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 