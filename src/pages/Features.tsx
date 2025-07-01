import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Footer } from '@/components/layout/Footer';
import { 
  Sparkles, 
  Globe, 
  Zap, 
  Star, 
  Users, 
  Check, 
  ArrowRight,
  Plane,
  Heart,
  MessageCircle,
  Phone,
  Mail,
  Brain,
  FileText,
  Palette,
  Shield,
  Clock,
  TrendingUp,
  Smartphone,
  Database,
  Lock
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthProvider';
import img1 from "@/assets/imgs/james-donaldson-toPRrcyAIUY-unsplash.jpg";
import img2 from "@/assets/imgs/fredrik-ohlander-fCW1hWq2nq0-unsplash.jpg";
import img3 from "@/assets/imgs/spencer-davis-Ivwyqtw3PzU-unsplash.jpg";
import img4 from "@/assets/imgs/igor-oliyarnik-Uu5aXBI1oLk-unsplash.jpg";

export function Features() {
  const { user } = useAuth();

  const heroFeatures = [
    {
      icon: <Brain className="h-8 w-8" />,
      title: "AI-Powered Intelligence",
      description: "Advanced machine learning creates personalized itineraries based on your preferences and travel style.",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: <Globe className="h-8 w-8" />,
      title: "Global Coverage",
      description: "Access to thousands of destinations worldwide with local expertise and insider knowledge.",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: <Zap className="h-8 w-8" />,
      title: "Lightning Fast",
      description: "Generate complete luxury itineraries with pricing and recommendations in under 60 seconds.",
      color: "from-yellow-500 to-orange-500"
    }
  ];

  const coreFeatures = [
    {
      title: "Smart Itinerary Generation",
      description: "Our AI analyzes your preferences, budget, and travel dates to create perfectly tailored itineraries.",
      icon: <Brain className="h-6 w-6" />,
      image: img1,
      features: [
        "Personalized recommendations",
        "Budget optimization",
        "Seasonal considerations",
        "Local event integration"
      ]
    },
    {
      title: "Professional PDF Export",
      description: "Create stunning, branded presentations that impress your clients and showcase your expertise.",
      icon: <FileText className="h-6 w-6" />,
      image: img2,
      features: [
        "Custom branding options",
        "High-resolution graphics",
        "Multiple layout templates",
        "Client-ready formatting"
      ]
    },
    {
      title: "Real-time Pricing",
      description: "Get accurate, up-to-date pricing for hotels, activities, and transportation in real-time.",
      icon: <TrendingUp className="h-6 w-6" />,
      image: img3,
      features: [
        "Live rate updates",
        "Multiple currency support",
        "Seasonal pricing",
        "Special offer integration"
      ]
    },
    {
      title: "Collaborative Planning",
      description: "Work seamlessly with your team and clients to refine and perfect travel experiences.",
      icon: <Users className="h-6 w-6" />,
      image: img4,
      features: [
        "Team collaboration tools",
        "Client feedback system",
        "Version control",
        "Comment and approval workflow"
      ]
    }
  ];

  const advancedFeatures = [
    {
      title: "White-Label Solutions",
      description: "Customize the platform with your branding for a seamless client experience.",
      icon: <Palette className="h-6 w-6" />
    },
    {
      title: "API Integration",
      description: "Connect with your existing systems and third-party travel platforms.",
      icon: <Database className="h-6 w-6" />
    },
    {
      title: "Advanced Analytics",
      description: "Track performance, client preferences, and business insights.",
      icon: <TrendingUp className="h-6 w-6" />
    },
    {
      title: "Mobile Optimization",
      description: "Access and edit itineraries on any device with our responsive design.",
      icon: <Smartphone className="h-6 w-6" />
    },
    {
      title: "Enterprise Security",
      description: "Bank-level security with SOC 2 compliance and data encryption.",
      icon: <Shield className="h-6 w-6" />
    },
    {
      title: "24/7 Support",
      description: "Round-the-clock support from our travel technology experts.",
      icon: <MessageCircle className="h-6 w-6" />
    }
  ];

  const benefits = [
    {
      title: "Save 80% Time",
      description: "Generate complete itineraries in minutes instead of hours",
      icon: <Clock className="h-8 w-8" />
    },
    {
      title: "Increase Revenue",
      description: "Handle more clients and close deals faster",
      icon: <TrendingUp className="h-8 w-8" />
    },
    {
      title: "Enhance Quality",
      description: "AI-powered recommendations improve client satisfaction",
      icon: <Star className="h-8 w-8" />
    },
    {
      title: "Scale Your Business",
      description: "Grow your travel agency without proportional overhead",
      icon: <Users className="h-8 w-8" />
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[var(--primary)] via-[var(--primary)]/90 to-purple-600 text-white pt-20">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src={img1}
            alt="Luxury travel destination"
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/30 via-[var(--primary)]/25 to-purple-600/30" />
        </div>
        
        <div className="relative z-10 container mx-auto px-4 py-16">
          <div className="text-center max-w-4xl mx-auto">
            <Badge variant="secondary" className="mb-6 bg-white/20 text-white border-white/30">
              <Sparkles className="h-4 w-4 mr-2" />
              Powerful Features
            </Badge>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Everything You Need to
              <span className="block bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                Create Amazing Travel
              </span>
              Experiences
            </h1>
            
            <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-2xl mx-auto">
              Discover the powerful features that make LuxeTripBuilder the ultimate tool for travel professionals.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {user ? (
                <Link to="/dashboard">
                  <Button size="lg" className="bg-white text-[var(--primary)] hover:bg-white/90 text-lg px-8 py-6">
                    Try Features Now
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/login">
                    <Button size="lg" className="bg-white text-[var(--primary)] hover:bg-white/90 text-lg px-8 py-6">
                      Start Free Trial
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Link to="/pricing">
                    <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 text-lg px-8 py-6">
                      View Pricing
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Hero Features */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {heroFeatures.map((feature, index) => (
              <Card key={index} className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-white to-muted/50">
                <CardContent className="p-8 text-center">
                  <div className={`w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-white group-hover:scale-110 transition-transform`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-4">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Core Features</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Powerful tools designed specifically for luxury travel professionals
            </p>
          </div>
          
          <div className="space-y-24">
            {coreFeatures.map((feature, index) => (
              <div key={index} className={`flex flex-col ${index % 2 === 1 ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center gap-12`}>
                <div className="lg:w-1/2">
                  <div className="relative overflow-hidden rounded-2xl shadow-2xl">
                    <img
                      src={feature.image}
                      alt={feature.title}
                      className="w-full h-80 object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    <div className="absolute top-6 right-6">
                      <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white">
                        {feature.icon}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="lg:w-1/2 space-y-6">
                  <h3 className="text-3xl font-bold">{feature.title}</h3>
                  <p className="text-xl text-muted-foreground">{feature.description}</p>
                  <ul className="space-y-3">
                    {feature.features.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-center gap-3">
                        <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Advanced Features */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Advanced Capabilities</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Enterprise-grade features for growing travel businesses
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {advancedFeatures.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="w-12 h-12 mb-4 bg-[var(--primary)]/10 rounded-lg flex items-center justify-center text-[var(--primary)]">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Why Travel Professionals Choose Us</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Real benefits that transform your travel business
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="p-8">
                  <div className="w-16 h-16 mx-auto mb-6 bg-[var(--primary)]/10 rounded-full flex items-center justify-center text-[var(--primary)]">
                    {benefit.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-4">{benefit.title}</h3>
                  <p className="text-muted-foreground">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-[var(--primary)] to-purple-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Transform Your Travel Business?</h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join thousands of travel professionals who are already using LuxeTripBuilder to create amazing experiences.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <Link to="/dashboard">
                <Button size="lg" className="bg-white text-[var(--primary)] hover:bg-white/90 text-lg px-8 py-6">
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/login">
                  <Button size="lg" className="bg-white text-[var(--primary)] hover:bg-white/90 text-lg px-8 py-6">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/pricing">
                  <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 text-lg px-8 py-6">
                    View Pricing
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
} 