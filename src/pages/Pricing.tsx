import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, X, Star, Zap, Crown, Users, Globe, Shield, Clock, MessageCircle, Loader2, Building2, CheckCircle, AlertCircle, ArrowRight, Sparkles, Target, Rocket, TrendingUp, Heart, Plane, Lock, ChevronUp, Award, Headphones, Globe2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthProvider';
import { useStripeSubscription } from '@/hooks/useStripeSubscription';
import { toast } from 'sonner';
import { Footer } from '@/components/layout/Footer';
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TeamService } from '@/lib/teamService';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase';
import { motion, Variants } from 'framer-motion';
import { 
  UndrawTrip,
  UndrawCreditCard,
  UndrawBusinessDeal,
  UndrawTeam,
  UndrawAnalytics,
  UndrawSecurityOn,
  UndrawArtificialIntelligence
} from 'react-undraw-illustrations';

export function Pricing() {
  const { user } = useAuth();
  const {
    subscription,
    loading,
    processing,
    createSubscription,
    getCurrentPlan,
    isSubscriptionActive,
  } = useStripeSubscription();

  const [agencySeats, setAgencySeats] = useState(5);
  const [userTeamRole, setUserTeamRole] = useState<'owner' | 'admin' | 'member' | null>(null);
  const [isTeamMember, setIsTeamMember] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Check user's team role
  useEffect(() => {
    const checkUserRole = async () => {
      if (user && subscription) {
        try {
          const teamMembership = await TeamService.getCurrentUserTeam();
          if (teamMembership) {
            setUserTeamRole(teamMembership.role);
            setIsTeamMember(true);
          } else {
            // User is not a team member, check if they own the team
            if (subscription.team_id) {
              const { data: team } = await supabase
                .from('teams')
                .select('owner_id')
                .eq('id', subscription.team_id)
                .single();
              
              if (team && team.owner_id === user.id) {
                setUserTeamRole('owner');
                setIsTeamMember(false);
              }
            }
          }
        } catch (error) {
          console.error('Error checking user role:', error);
          // If there's an error, assume user can manage billing (fallback)
          setUserTeamRole('owner');
          setIsTeamMember(false);
        }
      }
    };

    checkUserRole();
  }, [user, subscription]);

  // Back to top functionality
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Check if user can manage billing
  const canManageBilling = userTeamRole === 'owner' || userTeamRole === 'admin';

  const plans = [
    {
      name: "Free (Solo)",
      planType: "free" as const,
      price: "£0",
      period: "/month",
      description: "Perfect for individual travel agents and OTA's",
      popular: false,
      bestFor: "Best for Solo Agents and OTA's",
      features: [
        "Advanced Booking Engine",
        "AI itinerary generator",
        "Custom Price Markup",
        "Unlimited Quotes",
        "Unlimited itineraries",
        "Unlimited PDF downloads",
        "Advanced AI recommendations",
        "Analytics dashboard",
        "Standard templates",
        "Email support",
      ],
      limitations: [
        "No AI Media Library access",
        "No custom branding",
        "No API access",
        "No priority support",
        "No team collaboration"
      ],
      icon: <Users className="h-8 w-8" />,
      color: "from-blue-500 to-cyan-500",
      gradient: "from-blue-500/20 to-cyan-500/20",
      cta: "Start for Free",
      illustration: UndrawArtificialIntelligence
    },
    {
      name: "Pro (White-label)",
      planType: "pro" as const,
      price: "£29",
      period: "/month",
      description: "Ideal for white label OTA's and travel agents",
      popular: true,
      bestFor: "Popular for White-label OTA's and travel agents",
      features: [
        "All Free features",
        "PDF branding & customisation",
        "Logo upload & management",
        "Custom portal branding",
        "Full AI Media Library access",
        "Advanced AI features",
        "Analytics dashboard",
        "Priority support",
        "Bulk operations"
      ],
      limitations: ["No team collaboration", "Book with Third Party Tour Operators",],
      icon: <Crown className="h-8 w-8" />,
      color: "from-purple-500 to-pink-500",
      gradient: "from-purple-500/20 to-pink-500/20",
      cta: "Start Pro",
      illustration: UndrawBusinessDeal
    },
    {
      name: "Agency",
      planType: "agency" as const,
      price: "£79",
      period: "/month",
      description: "For agencies with teams. Up to 10 seats included.",
      popular: false,
      bestFor: "Best for Growing Agencies",
      features: [
        "All Pro features",
        "Multi-seat dashboard (up to 10 seats included)",
        "Team collaboration tools",
        "Role-based permissions",
        "Shared media library",
        "Team analytics & reporting",
        "Bulk team operations",
        "Advanced team management",
        "Dedicated team support"
      ],
      limitations: [
        "Limited to 10 team members",
        "No custom integrations"
      ],
      icon: <Building2 className="h-8 w-8" />,
      color: "from-green-500 to-emerald-500",
      gradient: "from-green-500/20 to-emerald-500/20",
      cta: "Start Agency",
      illustration: UndrawTeam
    },
    {
      name: "Enterprise",
      planType: "enterprise" as const,
      price: "Custom",
      period: "",
      description: "For large travel organizations. Contact us for a custom quote.",
      popular: false,
      bestFor: "Best for Large Organizations",
      features: [
        "All Agency features",
        "Unlimited seats",
        "API access",
        "Premium support",
        "Custom integrations",
        "White-label solution",
        "Dedicated account manager",
        "Training & onboarding",
        "SLA guarantee",
        "Advanced security",
        "Custom AI training",
        "24/7 phone support"
      ],
      limitations: [],
      icon: <Globe className="h-8 w-8" />,
      color: "from-orange-500 to-red-500",
      gradient: "from-orange-500/20 to-red-500/20",
      cta: "Contact Sales",
      illustration: UndrawAnalytics
    }
  ];

  const features = [
    {
      title: "AI-Powered Planning",
      description: "Advanced AI creates personalized luxury itineraries in minutes",
      icon: <Zap className="h-6 w-6" />
    },
    {
      title: "Global Destinations",
      description: "Access to thousands of destinations with insider knowledge",
      icon: <Globe className="h-6 w-6" />
    },
    {
      title: "Professional Presentations",
      description: "Beautiful PDF exports with your branding",
      icon: <Star className="h-6 w-6" />
    },
    {
      title: "24/7 Support",
      description: "Round-the-clock support for all your needs",
      icon: <MessageCircle className="h-6 w-6" />
    },
    {
      title: "Enterprise Security",
      description: "Bank-level security for your sensitive data",
      icon: <Shield className="h-6 w-6" />
    },
    {
      title: "Lightning Fast",
      description: "Generate complete itineraries in seconds",
      icon: <Clock className="h-6 w-6" />
    }
  ];

  const benefits = [
    {
      icon: <Award className="h-8 w-8" />,
      title: "Trusted by 10,000+ Agents",
      description: "Join thousands of travel professionals who trust our platform daily"
    },
    {
      icon: <Headphones className="h-8 w-8" />,
      title: "24/7 Expert Support",
      description: "Get help whenever you need it with our dedicated support team"
    },
    {
      icon: <Globe2 className="h-8 w-8" />,
      title: "Global Coverage",
      description: "Access destinations worldwide with our extensive network"
    },
    {
      icon: <Zap className="h-8 w-8" />,
      title: "Lightning Fast Setup",
      description: "Get started in minutes, not days. No complex onboarding required"
    }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Travel Agency Owner",
      company: "Luxe Travel Co.",
      content: "AItinerary has transformed our business. The AI-powered itineraries save us hours, and our clients love the professional presentations.",
      rating: 5,
      avatar: "SJ"
    },
    {
      name: "Michael Chen",
      role: "Tour Operator",
      company: "Global Adventures",
      content: "The platform's analytics and team management features are game-changers. We can track performance and collaborate seamlessly.",
      rating: 5,
      avatar: "MC"
    },
    {
      name: "Emma Rodriguez",
      role: "OTA Manager",
      company: "Dream Destinations",
      content: "From quote to booking in minutes. The real-time API integration and AI features make us incredibly efficient.",
      rating: 5,
      avatar: "ER"
    }
  ];

  const faqs = [
    {
      question: "Can I change my plan at any time?",
      answer: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately and are prorated."
    },
    {
      question: "Is there a free plan available?",
      answer: "Yes, we offer a free plan that's perfect for individual travel agents. You can start using it immediately with no credit card required."
    },
    {
      question: "How does seat-based billing work for Agency plans?",
      answer: "Agency plans start at £99/month for the base plan plus £10/month per additional seat. You can add or remove seats anytime."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards, PayPal, and bank transfers for Enterprise plans."
    },
    {
      question: "Can I cancel my subscription?",
      answer: "Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your billing period."
    },
    {
      question: "Do you offer discounts for non-profits?",
      answer: "Yes, we offer special pricing for non-profit organizations and educational institutions. Contact us for details."
    }
  ];

  const stats = [
    { number: "99.9%", label: "Uptime Guarantee", icon: <CheckCircle className="h-8 w-8" /> },
    { number: "10x", label: "Faster Planning", icon: <Rocket className="h-8 w-8" /> },
    { number: "50+", label: "API Integrations", icon: <Globe className="h-8 w-8" /> },
    { number: "24/7", label: "Human Support", icon: <Users className="h-8 w-8" /> }
  ];

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  const handleSubscribe = async (planType: 'free' | 'pro' | 'agency' | 'enterprise') => {
    if (!user?.email) {
      toast.error('Please log in to subscribe');
      return;
    }

    // Check if user can manage billing
    if (isTeamMember && !canManageBilling) {
      toast.error('Only team owners and admins can manage billing. Please contact your team administrator.');
      return;
    }

    if (planType === 'enterprise') {
      // For enterprise, redirect to contact form or open email
      window.location.href = 'mailto:sales@luxetripbuilder.com?subject=Enterprise Plan Inquiry';
      return;
    }

    if (planType === 'free') {
      toast.info('Free plan is already active for new users');
      return;
    }

    const result = await createSubscription(
      planType,
      user.email,
      user.user_metadata?.name,
      planType === 'agency' ? { seatCount: agencySeats } : undefined
    );

    if (!result.success) {
      toast.error(result.error || 'Failed to create subscription');
    }
  };

  const getCurrentPlanName = () => {
    if (!subscription) return null;
    return plans.find(plan => plan.planType === subscription.plan_type)?.name;
  };

  const isCurrentPlan = (planType: string) => {
    return subscription?.plan_type === planType;
  };

  const getButtonText = (plan: typeof plans[0]) => {
    if (plan.planType === 'enterprise') {
      return 'Contact Sales';
    }

    if (!user) {
      return plan.cta;
    }

    // Check if user is a team member who can't manage billing
    if (isTeamMember && !canManageBilling) {
      return 'Contact Admin';
    }

    if (!isSubscriptionActive()) {
      return plan.cta;
    }

    if (isCurrentPlan(plan.planType)) {
      return 'Current Plan';
    }

    const currentPlanIndex = plans.findIndex(p => p.planType === getCurrentPlan());
    const thisPlanIndex = plans.findIndex(p => p.planType === plan.planType);
    
    if (thisPlanIndex > currentPlanIndex) {
      return 'Upgrade';
    } else {
      return 'Downgrade';
    }
  };

  const getButtonVariant = (plan: typeof plans[0]) => {
    if (plan.planType === 'enterprise') {
      return 'outline' as const;
    }

    if (isCurrentPlan(plan.planType)) {
      return 'secondary' as const;
    }

    return plan.popular ? 'default' as const : 'outline' as const;
  };

  const isButtonDisabled = (plan: typeof plans[0]) => {
    return processing || (isCurrentPlan(plan.planType) && isSubscriptionActive());
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section with flowing background */}
      <section className="relative bg-primary/10 pt-48 pb-16 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 right-20 w-32 h-32 bg-[var(--primary)]/5 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute bottom-40 left-10 w-24 h-24 bg-[var(--secondary)]/5 rounded-lg blur-lg animate-pulse animation-delay-200"></div>
          <div className="absolute top-1/2 right-1/4 w-16 h-16 bg-[var(--primary)]/5 rounded-full blur-md animate-pulse animation-delay-400"></div>
        </div>

        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge variant="secondary" className="mb-6 bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/20 hover:bg-[var(--primary)]/20 transition-all duration-300 group">
              <Sparkles className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform duration-300" />
              Simple, Transparent Pricing
            </Badge>
          </motion.div>

          <motion.h1 
            className="text-4xl md:text-6xl font-bold mb-6 text-[var(--foreground)]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Choose Your Perfect Plan
          </motion.h1>

          <motion.p 
            className="text-lg md:text-xl text-[var(--muted-foreground)] mb-8 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Start for free. No hidden fees, no surprises. Upgrade anytime as your business grows.
          </motion.p>

          {/* Current Plan Display */}
          {user && isSubscriptionActive() && (
            <motion.div 
              className="bg-[var(--primary)]/10 rounded-lg p-3 inline-block border border-[var(--primary)]/20 mb-4 hover:bg-[var(--primary)]/20 transition-all duration-300"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <span className="text-[var(--foreground)]">
                Current Plan: <span className="font-semibold text-[var(--primary)]">{getCurrentPlanName()}</span>
              </span>
            </motion.div>
          )}

          {/* Warning for team members who can't manage billing */}
          {user && isTeamMember && !canManageBilling && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <Alert className="mt-4 max-w-2xl mx-auto bg-amber-500/20 border-amber-500/30 text-amber-100">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Only team owners and admins can manage billing. Please contact your team administrator to change plans.
                </AlertDescription>
              </Alert>
            </motion.div>
          )}

          {/* Quick stats */}
          <motion.div 
            className="flex flex-wrap justify-center gap-8 mt-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.0 }}
          >
            <div className="flex items-center gap-2 text-[var(--muted-foreground)]">
              <CheckCircle className="h-5 w-5 text-[var(--primary)]" />
              <span className="text-sm">No setup fees</span>
            </div>
            <div className="flex items-center gap-2 text-[var(--muted-foreground)]">
              <CheckCircle className="h-5 w-5 text-[var(--primary)]" />
              <span className="text-sm">Cancel anytime</span>
            </div>
            <div className="flex items-center gap-2 text-[var(--muted-foreground)]">
              <CheckCircle className="h-5 w-5 text-[var(--primary)]" />
              <span className="text-sm">Instant access</span>
            </div>
          </motion.div>
        </div>

        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none">
          <svg
            className="relative block w-full h-[75px] md:h-[120px]"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
          >
            <path
              d="M0,80 C300,200 1000,-100 1200,40 V120 H0 Z"
              className="fill-[var(--background)]"
            ></path>
          </svg>
        </div>
      </section>

      {/* Pricing Cards Section - flows from hero */}
      <section className="relative bg-background pt-8 pb-16">
        <div className="container mx-auto px-4">
          {/* Section header */}
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
          </motion.div>

          <motion.div 
            className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6 max-w-7xl mx-auto"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {plans.map((plan, index) => (
              <motion.div 
                key={index} 
                className="relative group"
                variants={itemVariants}
                whileHover={{ y: -8 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Card className={`relative h-full flex flex-col ${plan.popular ? 'ring-2 ring-[var(--primary)] shadow-xl scale-100' : 'hover:shadow-xl'} transition-all duration-500 border border-[var(--border)] bg-[var(--card)]`}>
                  
                  {/* Hover effect overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  {/* Popular badge */}
                  {plan.popular && (
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-[var(--primary)] text-[var(--primary-foreground)] z-10 shadow-lg">
                      <Star className="h-3 w-3 mr-1" />
                      Most Popular
                    </Badge>
                  )}

                  {/* Current plan badge */}
                  {isCurrentPlan(plan.planType) && isSubscriptionActive() && (
                    <Badge className="absolute -top-3 right-4 bg-green-500 text-white z-10 shadow-lg">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Current Plan
                    </Badge>
                  )}
                  
                  {/* Header */}
                  <CardHeader className="text-center pb-6 pt-8 relative z-10">
                    <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)] group-hover:scale-110 group-hover:bg-[var(--primary)]/20 transition-all duration-300`}>
                      {plan.icon}
                    </div>
                    <CardTitle className="text-xl font-semibold text-[var(--foreground)] mb-2 group-hover:text-[var(--primary)] transition-colors duration-300">{plan.name}</CardTitle>
                    <div className="flex items-baseline justify-center gap-1 mb-3">
                      <span className="text-4xl font-bold text-[var(--foreground)]">{plan.price}</span>
                      <span className="text-[var(--muted-foreground)] text-sm">{plan.period}</span>
                    </div>
                    <p className="text-[var(--muted-foreground)] text-sm">{plan.description}</p>
                  </CardHeader>
                  
                  {/* Content */}
                  <CardContent className="flex-1 flex flex-col pb-6 relative z-10">
                    <div className="space-y-4 flex-1">
                      <div>
                        <h4 className="font-medium text-[var(--foreground)] text-sm mb-3 flex items-center gap-2">
                          <Check className="h-4 w-4 text-[var(--primary)]" />
                          What's included:
                        </h4>
                        <ul className="space-y-2">
                          {plan.features.map((feature: string, featureIndex: number) => (
                            <li key={featureIndex} className="flex items-start gap-3 group/item">
                              <Check className="h-4 w-4 text-[var(--primary)] flex-shrink-0 mt-0.5 group-hover/item:scale-110 transition-transform duration-200" />
                              <span className="text-sm text-[var(--muted-foreground)] group-hover/item:text-[var(--foreground)] transition-colors duration-200">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      {plan.limitations.length > 0 && (
                        <div>
                          <h4 className="font-medium text-[var(--foreground)] text-sm mb-3 flex items-center gap-2">
                            <X className="h-4 w-4 text-[var(--muted-foreground)]" />
                            Not included:
                          </h4>
                          <ul className="space-y-2">
                            {plan.limitations.map((limitation: string, limitationIndex: number) => (
                              <li key={limitationIndex} className="flex items-start gap-3">
                                <X className="h-4 w-4 text-[var(--muted-foreground)] flex-shrink-0 mt-0.5" />
                                <span className="text-sm text-[var(--muted-foreground)]">{limitation}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    
                    {/* Button - positioned at bottom */}
                    <div className="mt-6 pt-4 border-t border-[var(--border)]">
                      {plan.planType === "enterprise" ? (
                        <Button 
                          className="w-full group-hover:scale-105 transition-all duration-300" 
                          variant="outline"
                          onClick={() => handleSubscribe(plan.planType)}
                          disabled={processing}
                        >
                          {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Contact Sales'}
                        </Button>
                      ) : user ? (
                        <Button 
                          className="w-full group-hover:scale-105 transition-all duration-300" 
                          variant={getButtonVariant(plan)}
                          onClick={() => handleSubscribe(plan.planType)}
                          disabled={isButtonDisabled(plan)}
                        >
                          {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : getButtonText(plan)}
                        </Button>
                      ) : (
                        <Link to={`/signup?plan=${plan.planType}`}>
                          <Button className="w-full group-hover:scale-105 transition-all duration-300" variant={plan.popular ? "default" : "outline"}>
                            {getButtonText(plan)}
                          </Button>
                        </Link>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Plan comparison note */}
          <motion.div 
            className="text-center mt-12 p-4 bg-[var(--muted)]/30 rounded-lg max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <p className="text-[var(--muted-foreground)] text-sm">
              <Shield className="h-4 w-4 inline mr-2 text-[var(--primary)]" />
              All plans include our core AI features and 24/7 support. Upgrade or downgrade anytime.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-24 bg-[var(--muted)]/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <motion.h2 
              className="text-4xl font-bold mb-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              Why Choose AItinerary?
            </motion.h2>
            <motion.p 
              className="text-xl text-muted-foreground max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              Built by travel professionals, for travel professionals
            </motion.p>
          </div>
          
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {benefits.map((benefit, index) => (
              <motion.div 
                key={index} 
                className="text-center group"
                variants={itemVariants}
              >
                <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-2 border-0 bg-gradient-to-br from-[var(--card)] to-[var(--card)]/50 backdrop-blur-sm">
                  <CardContent className="p-8">
                    <div className="w-16 h-16 mx-auto mb-4 bg-[var(--primary)]/10 rounded-full flex items-center justify-center text-[var(--primary)] group-hover:scale-110 transition-transform duration-300">
                      {benefit.icon}
                    </div>
                    <h3 className="text-xl font-semibold mb-4">{benefit.title}</h3>
                    <p className="text-muted-foreground">{benefit.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <motion.h2 
              className="text-4xl font-bold mb-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              Loved by Travel Professionals
            </motion.h2>
            <motion.p 
              className="text-xl text-muted-foreground max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              See what our customers have to say about their experience
            </motion.p>
          </div>
          
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {testimonials.map((testimonial, index) => (
              <motion.div 
                key={index} 
                className="group"
                variants={itemVariants}
              >
                <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-2 border-0 bg-gradient-to-br from-[var(--card)] to-[var(--card)]/50 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-muted-foreground mb-4 italic">"{testimonial.content}"</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[var(--primary)]/10 rounded-full flex items-center justify-center text-[var(--primary)] font-semibold">
                        {testimonial.avatar}
                      </div>
                      <div>
                        <div className="font-semibold text-[var(--foreground)]">{testimonial.name}</div>
                        <div className="text-sm text-[var(--muted-foreground)]">{testimonial.role} at {testimonial.company}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-[var(--muted)]/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <motion.h2 
              className="text-4xl font-bold mb-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              Everything You Need to Succeed
            </motion.h2>
            <motion.p 
              className="text-xl text-muted-foreground max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              Powerful features designed to help you create amazing travel experiences
            </motion.p>
          </div>
          
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {features.map((feature, index) => (
              <motion.div 
                key={index} 
                className="text-center group"
                variants={itemVariants}
              >
                <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-2 border-0 bg-gradient-to-br from-[var(--card)] to-[var(--card)]/50 backdrop-blur-sm">
                  <CardContent className="p-8">
                    <div className="w-12 h-12 mx-auto mb-4 bg-[var(--primary)]/10 rounded-full flex items-center justify-center text-[var(--primary)] group-hover:scale-110 transition-transform duration-300">
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-semibold mb-4">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <motion.h2 
              className="text-4xl font-bold mb-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              Frequently Asked Questions
            </motion.h2>
            <motion.p 
              className="text-xl text-muted-foreground"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              Everything you need to know about our pricing and plans
            </motion.p>
          </div>
          
          <motion.div 
            className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {faqs.map((faq, index) => (
              <motion.div 
                key={index} 
                className="group"
                variants={itemVariants}
              >
                <Card className="hover:shadow-md transition-all duration-300 hover:-translate-y-1 border-0 bg-gradient-to-br from-[var(--card)] to-[var(--card)]/50 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-3 group-hover:text-[var(--primary)] transition-colors duration-300">{faq.question}</h3>
                    <p className="text-muted-foreground text-sm">{faq.answer}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-[var(--primary)] to-purple-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <motion.h2 
            className="text-4xl font-bold mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            Ready to Transform Your Travel Business?
          </motion.h2>
          <motion.p 
            className="text-xl text-white/90 mb-8 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            Join thousands of travel professionals who are already using LuxeTripBuilder to create amazing experiences.
          </motion.p>
          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
          >
            {user ? (
              <Link to="/dashboard">
                <Button size="lg" className="bg-white text-[var(--primary)] hover:bg-white/90 text-lg px-8 py-6 group">
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/signup">
                  <Button size="lg" className="bg-white text-[var(--primary)] hover:bg-white/90 text-lg px-8 py-6 group">
                    Start for Free
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                  </Button>
                </Link>
                <Link to="/how-it-works">
                  <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 text-lg px-8 py-6 group">
                    Schedule Demo
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                  </Button>
                </Link>
              </>
            )}
          </motion.div>
        </div>
      </section>

      {/* Back to Top Button */}
      {showBackToTop && (
        <motion.button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-50 w-12 h-12 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 flex items-center justify-center"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
        >
          <ChevronUp className="h-6 w-6" />
        </motion.button>
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
} 