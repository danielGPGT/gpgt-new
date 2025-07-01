import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Footer } from '@/components/layout/Footer';
import { 
  WandSparkles, 
  Users, 
  MapPin, 
  Palette, 
  CreditCard, 
  FileText, 
  Download, 
  Star,
  ArrowRight,
  CheckCircle,
  Clock,
  Zap,
  Globe,
  MessageCircle,
  Shield,
  TrendingUp,
  Building2,
  Calculator,
  Plane,
  Hotel,
  Calendar,
  DollarSign,
  BarChart3,
  Settings,
  CheckSquare
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthProvider';

export function HowItWorks() {
  const { user } = useAuth();

  const steps = [
    {
      number: "01",
      title: "Create Detailed Trip Structure",
      description: "Build comprehensive trip itineraries with destinations, dates, and traveler preferences. Our platform helps you structure complex multi-destination journeys.",
      icon: <Building2 className="h-8 w-8" />,
      features: [
        "Multi-destination trip planning",
        "Traveler preference capture",
        "Flexible date and duration options",
        "Special requirements tracking"
      ],
      color: "from-blue-500 to-cyan-500"
    },
    {
      number: "02",
      title: "Real-Time API Integration",
      description: "Access live pricing and availability from major suppliers through our integrated APIs for hotels, flights, events, and activities.",
      icon: <Zap className="h-8 w-8" />,
      features: [
        "Live hotel pricing & availability",
        "Real-time flight quotes",
        "Event & activity booking",
        "Instant supplier confirmations"
      ],
      color: "from-purple-500 to-pink-500"
    },
    {
      number: "03",
      title: "AI-Generated Itinerary",
      description: "Our AI creates detailed, personalized itineraries based on your trip structure and real-time pricing, ready for client presentation.",
      icon: <WandSparkles className="h-8 w-8" />,
      features: [
        "AI-powered itinerary generation",
        "Personalized recommendations",
        "Professional presentation format",
        "Detailed day-by-day planning"
      ],
      color: "from-green-500 to-emerald-500"
    },
    {
      number: "04",
      title: "Customize & Quote",
      description: "Edit and refine the AI-generated itinerary, set your commission rates, and create professional quotes for your clients.",
      icon: <Calculator className="h-8 w-8" />,
      features: [
        "Drag & drop itinerary editing",
        "Custom commission rates",
        "Professional quote generation",
        "Client-ready presentations"
      ],
      color: "from-orange-500 to-red-500"
    },
    {
      number: "05",
      title: "Client Approval & Booking",
      description: "Send quotes to clients and when approved, confirm bookings with a single click. Track all client interactions and booking status.",
      icon: <CheckSquare className="h-8 w-8" />,
      features: [
        "One-click booking confirmation",
        "Client communication tracking",
        "Booking status management",
        "Automated supplier notifications"
      ],
      color: "from-indigo-500 to-purple-500"
    },
    {
      number: "06",
      title: "Revenue Tracking & Analytics",
      description: "Monitor your business performance with comprehensive analytics, track commissions, and optimize your profitability with detailed insights.",
      icon: <BarChart3 className="h-8 w-8" />,
      features: [
        "Real-time commission tracking",
        "Performance analytics dashboard",
        "Revenue optimization insights",
        "Client relationship management"
      ],
      color: "from-teal-500 to-cyan-500"
    }
  ];

  const benefits = [
    {
      title: "Real-Time Pricing",
      description: "Access live rates from major suppliers through integrated APIs",
      icon: <DollarSign className="h-6 w-6" />
    },
    {
      title: "Commission Management",
      description: "Set and track personalized commission rates for maximum profit",
      icon: <BarChart3 className="h-6 w-6" />
    },
    {
      title: "AI-Powered Efficiency",
      description: "Generate detailed itineraries in minutes, not hours",
      icon: <Zap className="h-6 w-6" />
    },
    {
      title: "Complete Client Management",
      description: "Track quotes, bookings, and client communications in one place",
      icon: <Users className="h-6 w-6" />
    },
    {
      title: "Professional Presentations",
      description: "Create stunning, branded proposals that impress clients",
      icon: <FileText className="h-6 w-6" />
    },
    {
      title: "Enterprise Security",
      description: "Bank-level security for your sensitive client and financial data",
      icon: <Shield className="h-6 w-6" />
    }
  ];

  const features = [
    {
      title: "Multi-Supplier Integration",
      description: "Connect to major hotel chains, airlines, and activity providers",
      icon: <Plane className="h-6 w-6" />
    },
    {
      title: "Commission Tracking",
      description: "Monitor your earnings with detailed commission reports",
      icon: <Calculator className="h-6 w-6" />
    },
    {
      title: "Client Portal",
      description: "Give clients access to view and approve their itineraries",
      icon: <Users className="h-6 w-6" />
    },
    {
      title: "Booking Management",
      description: "Track all bookings from quote to completion",
      icon: <Calendar className="h-6 w-6" />
    },
    {
      title: "Custom Branding",
      description: "White-label solutions with your company branding",
      icon: <Palette className="h-6 w-6" />
    },
    {
      title: "Analytics Dashboard",
      description: "Comprehensive reporting on sales, performance, and trends",
      icon: <BarChart3 className="h-6 w-6" />
    }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Travel Agency Owner",
      company: "Luxe Travel Co.",
      content: "AItinerary has transformed our business. The real-time API integration saves us hours of manual searching, and our clients love the professional presentations.",
      rating: 5
    },
    {
      name: "Michael Chen",
      role: "Tour Operator",
      company: "Global Adventures",
      content: "The commission management features are game-changing. We can set different rates for different clients and track our profitability in real-time.",
      rating: 5
    },
    {
      name: "Emma Rodriguez",
      role: "OTA Manager",
      company: "Dream Destinations",
      content: "From quote to booking in minutes. The AI generates amazing itineraries, and the one-click booking confirmation is incredibly efficient.",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-br from-[var(--primary)] to-purple-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <Badge className="mb-4 bg-white/20 text-white border-white/30">
            <Building2 className="h-4 w-4 mr-2" />
            B2B Travel Platform
          </Badge>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            How AItinerary
            <span className="block bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
              Works
            </span>
          </h1>
          
          <p className="text-xl text-white/90 mb-8 max-w-3xl mx-auto">
            The complete B2B platform for OTAs and tour operators. Create detailed trip structures, access real-time APIs, generate AI itineraries, and manage your entire booking process with personalized commission rates.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <Link to="/new-proposal">
                <Button size="lg" className="bg-white text-[var(--primary)] hover:bg-white/90 text-lg px-8 py-6">
                  Create Your First Quote
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/signup">
                  <Button size="lg" className="bg-white text-[var(--primary)] hover:bg-white/90 text-lg px-8 py-6">
                    Start Free Trial
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

      {/* Process Steps */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <Badge className="mb-4 bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/20">
              <Building2 className="h-4 w-4 mr-2" />
              Complete Workflow
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">The Complete B2B Workflow</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Six powerful steps to streamline your travel business operations and maximize profitability
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 max-w-8xl mx-auto">
            {steps.map((step, index) => (
              <Card key={index} className="relative group hover:shadow-2xl transition-all duration-500 border-0 bg-gradient-to-br from-white to-muted/30">
                {/* Gradient overlay */}
                <div className={`absolute inset-0 bg-gradient-to-br ${step.color} opacity-5 group-hover:opacity-10 transition-opacity duration-500`} />
                
                <CardHeader className="pb-8 relative z-10">
                  <div className="flex items-start gap-6">
                    <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${step.color} flex items-center justify-center text-white flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-500`}>
                      {step.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-4">
                        <Badge variant="outline" className="text-sm font-mono bg-white/80 backdrop-blur-sm border-2">
                          {step.number}
                        </Badge>
                        <CardTitle className="text-2xl font-bold">{step.title}</CardTitle>
                      </div>
                      <p className="text-muted-foreground text-base leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="relative z-10">
                  <ul className="space-y-3">
                    {step.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center gap-3 p-2 rounded-lg bg-white/50 backdrop-blur-sm hover:bg-white/70 transition-colors duration-300">
                        <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                          <CheckCircle className="h-3 w-3 text-green-600" />
                        </div>
                        <span className="text-sm font-medium">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                {/* Arrow indicators - only show on first 5 steps */}
                {index < steps.length - 1 && index % 3 !== 2 && (
                  <div className="hidden xl:block absolute -right-6 top-1/2 transform -translate-y-1/2 z-20">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--primary)] to-purple-600 flex items-center justify-center shadow-lg">
                      <ArrowRight className="h-6 w-6 text-white" />
                    </div>
                  </div>
                )}
                {/* Arrow indicators for lg screens - only show on first 5 steps */}
                {index < steps.length - 1 && index % 2 === 0 && (
                  <div className="hidden lg:block xl:hidden absolute -bottom-6 left-1/2 transform -translate-x-1/2 z-20">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--primary)] to-purple-600 flex items-center justify-center shadow-lg">
                      <ArrowRight className="h-6 w-6 text-white rotate-90" />
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 bg-gradient-to-br from-muted/20 via-muted/10 to-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <Badge className="mb-4 bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/20">
              <Star className="h-4 w-4 mr-2" />
              Key Benefits
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Why Choose AItinerary?</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Powerful features designed specifically for travel professionals and agencies to maximize efficiency and profitability
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <Card key={index} className="group hover:shadow-2xl transition-all duration-500 border-0 bg-white/80 backdrop-blur-sm overflow-hidden">
                <CardContent className="p-8 text-center relative">
                  <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-[var(--primary)]/10 to-purple-500/10 rounded-2xl flex items-center justify-center text-[var(--primary)] group-hover:scale-110 transition-transform duration-500">
                    {benefit.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-4 group-hover:text-[var(--primary)] transition-colors duration-300">{benefit.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <Badge className="mb-4 bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/20">
              <Settings className="h-4 w-4 mr-2" />
              Enterprise Features
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Everything You Need to Scale</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Comprehensive tools and features designed to help your travel business grow and succeed
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="group hover:shadow-xl transition-all duration-500 border-0 bg-gradient-to-br from-white to-muted/30 overflow-hidden">
                <CardContent className="p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-[var(--primary)]/10 to-purple-500/10 rounded-xl flex items-center justify-center text-[var(--primary)] group-hover:scale-110 transition-transform duration-500">
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-bold group-hover:text-[var(--primary)] transition-colors duration-300">{feature.title}</h3>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-gradient-to-br from-muted/30 via-muted/20 to-muted/40">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <Badge className="mb-4 bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/20">
              <Users className="h-4 w-4 mr-2" />
              Success Stories
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">What Our Partners Say</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Join hundreds of travel agencies and tour operators who trust AItinerary to power their business
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="relative group hover:shadow-xl transition-all duration-500 border-0 bg-white/80 backdrop-blur-sm overflow-hidden">
                <CardContent className="p-8">
                  <div className="flex items-center gap-1 mb-6">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <blockquote className="text-muted-foreground mb-6 italic text-lg leading-relaxed">
                    "{testimonial.content}"
                  </blockquote>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-[var(--primary)]/10 to-purple-500/10 rounded-full flex items-center justify-center">
                      <span className="text-[var(--primary)] font-bold text-lg">
                        {testimonial.name[0]}
                      </span>
                    </div>
                    <div>
                      <p className="font-bold text-lg">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {testimonial.role} at {testimonial.company}
                      </p>
                    </div>
                  </div>
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
            Join the future of B2B travel technology. Start creating professional quotes and managing bookings with ease.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <Link to="/new-proposal">
                <Button size="lg" className="bg-white text-[var(--primary)] hover:bg-white/90 text-lg px-8 py-6">
                  Create Your First Quote
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/signup">
                  <Button size="lg" className="bg-white text-[var(--primary)] hover:bg-white/90 text-lg px-8 py-6">
                    Start Free Trial
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