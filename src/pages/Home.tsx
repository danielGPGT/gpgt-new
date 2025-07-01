// This is a test comment to see if any edits are being applied.
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/lib/AuthProvider';
import { Link } from 'react-router-dom';
import { Footer } from '@/components/layout/Footer';
import { 
  Sparkles, 
  Globe, 
  Zap, 
  Star, 
  Users, 
  CheckCircle, 
  ArrowRight,
  Plane,
  Heart,
  MessageCircle,
  Phone,
  Mail,
  Building2,
  Calculator,
  BarChart3,
  Shield,
  FileText,
  Calendar,
  DollarSign,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Play,
  GitBranch,
  Code,
  Database,
  Cloud,
  Lock,
  Clock,
  Target,
  Rocket,
  Cpu,
  Network,
  Server,
  Terminal,
  WandSparkles,
  CheckSquare,
  Palette,
  CreditCard,
  Quote
} from 'lucide-react';
import { 
  SiReact, 
  SiVite, 
  SiTypescript, 
  SiTailwindcss, 
  SiSupabase, 
  SiStripe, 
  SiNodedotjs 
} from 'react-icons/si';
import { motion, Variants } from 'framer-motion';
import { useState, useEffect, CSSProperties } from 'react';
import { 
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { 
  UndrawTrip,
  UndrawAnalytics,
  UndrawTeam,
  UndrawSecurityOn,
  UndrawWorking,
  UndrawArtificialIntelligence,
  UndrawRomanticGetaway,
  UndrawDigitalNomad,
} from 'react-undraw-illustrations';

// Import blog posts data
import { posts as blogPosts } from '@/data/blogPosts';

declare module 'react' {
  interface CSSProperties {
    '--glow-color'?: string;
  }
}

export function Home() {
  const { user } = useAuth();

  const solutions = [
    {
      icon: <Building2 className="h-8 w-8" />,
      title: "Create Trip Structure",
      description: "Build comprehensive trip itineraries with destinations, dates, and traveler preferences. Structure complex multi-destination journeys.",
      color: "from-[var(--primary)] to-[var(--primary)]/80"
    },
    {
      icon: <Zap className="h-8 w-8" />,
      title: "Real-Time API Integration",
      description: "Access live pricing and availability from major suppliers through integrated APIs for hotels, flights, events, and activities.",
      color: "from-[var(--secondary)] to-[var(--secondary)]/80"
    },
    {
      icon: <WandSparkles className="h-8 w-8" />,
      title: "AI-Generated Itineraries",
      description: "Our AI creates detailed, personalized itineraries based on your trip structure and real-time pricing, ready for client presentation.",
      color: "from-[var(--primary)] to-[var(--secondary)]"
    },
    {
      icon: <Calculator className="h-8 w-8" />,
      title: "Commission Management",
      description: "Set and track personalized commission rates with automated calculations and real-time profitability analytics.",
      color: "from-[var(--secondary)] to-[var(--primary)]"
    },
    {
      icon: <CheckSquare className="h-8 w-8" />,
      title: "Client Approval & Booking",
      description: "Send quotes to clients and when approved, confirm bookings with a single click. Track all client interactions and booking status.",
      color: "from-[var(--primary)]/80 to-[var(--secondary)]/80"
    },
    {
      icon: <BarChart3 className="h-8 w-8" />,
      title: "Revenue Tracking & Analytics",
      description: "Monitor your business performance with comprehensive analytics, track commissions, and optimize your profitability with detailed insights.",
      color: "from-[var(--secondary)]/80 to-[var(--primary)]/80"
    }
  ];

  const customers = [
    {
      name: "Sarah Johnson",
      logo: "SJ",
      quote: "AItinerary has transformed our business. The real-time API integration saves us hours, and our clients love the professional presentations.",
      role: "Travel Agency Owner",
      company: "Luxe Travel Co.",
      rating: 5
    },
    {
      name: "Michael Chen",
      logo: "MC",
      quote: "The commission management features are a game-changer. We can set different rates and track profitability in real-time. Incredibly powerful.",
      role: "Tour Operator",
      company: "Global Adventures",
      rating: 5
    },
    {
      name: "Emma Rodriguez",
      logo: "ER",
      quote: "From quote to booking in minutes. The AI generates amazing itineraries, and the one-click booking confirmation is incredibly efficient.",
      role: "OTA Manager",
      company: "Dream Destinations",
      rating: 5
    },
    {
      name: "David Lee",
      logo: "DL",
      quote: "The platform's analytics dashboard gives us invaluable insights that help us optimize for profitability and growth. A must-have tool.",
      role: "Head of Operations",
      company: "Prestige Voyages",
      rating: 5
    }
  ];

  const techStack = [
    { name: "React", icon: <SiReact className="h-7 w-7 text-[#61DAFB]" />, glowColor: 'oklch(0.8 0.15 200)' },
    { name: "Vite", icon: <SiVite className="h-7 w-7 text-[#646CFF]" />, glowColor: 'oklch(0.7 0.15 260)' },
    { name: "TypeScript", icon: <SiTypescript className="h-7 w-7 text-[#3178C6]" />, glowColor: 'oklch(0.65 0.1 230)' },
    { name: "Tailwind CSS", icon: <SiTailwindcss className="h-7 w-7 text-[#06B6D4]" />, glowColor: 'oklch(0.8 0.1 190)' },
    { name: "Supabase", icon: <SiSupabase className="h-7 w-7 text-[#3ECF8E]" />, glowColor: 'oklch(0.8 0.2 150)' },
    { name: "Stripe", icon: <SiStripe className="h-7 w-7 text-[#635BFF]" />, glowColor: 'oklch(0.7 0.15 265)' },
    { name: "Node.js", icon: <SiNodedotjs className="h-7 w-7 text-[#5FA04E]" />, glowColor: 'oklch(0.65 0.15 130)' },
    { name: "Gemini AI", icon: <Sparkles className="h-7 w-7 text-purple-500" />, glowColor: 'oklch(0.7 0.15 280)' }
  ];

  const stats = [
    { number: "99.9%", label: "Quote Accuracy", icon: <CheckCircle className="h-8 w-8" /> },
    { number: "10x", label: "Faster Itinerary Generation", icon: <Rocket className="h-8 w-8" /> },
    { number: "50+", label: "Live API Integrations", icon: <Network className="h-8 w-8" /> },
    { number: "24/7", label: "Human Support", icon: <Users className="h-8 w-8" /> }
  ];

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
      },
    },
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-[var(--background)] pt-32 min-h-[80vh]">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 right-20 w-32 h-32 bg-[var(--primary)] rounded-full blur-xl"></div>
          <div className="absolute bottom-40 left-10 w-24 h-24 bg-[var(--secondary)] rounded-full blur-lg"></div>
          <div className="absolute top-1/2 right-1/4 w-16 h-16 bg-[var(--primary)] rounded-full blur-md"></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 container mx-auto px-4 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-center">
            {/* Left Side - Content */}
            <div className="lg:col-span-3 max-w-none">
              {/* Animated Badge */}
              <div className="mb-6 animate-fade-in-up">
                <Badge variant="secondary" className="bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/20 hover:bg-[var(--primary)]/20 transition-all duration-300 group">
                  <Sparkles className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform duration-300" />
                  AI-Powered B2B Platform
                  <Zap className="h-4 w-4 ml-2" />
                </Badge>
              </div>
              
              {/* Main Heading with Animation */}
              <div className="animate-fade-in-up animation-delay-200">
                <h1 className="text-6xl md:text-8xl font-bold mb-6 leading-tight text-[var(--foreground)]">
                  AI-Driven Travel
                  <span className="block text-primary">
                    Platform
                  </span>
                  <span className="block text-3xl md:text-4xl font-light text-[var(--muted-foreground)] mt-2">
                    for Travel Agencies
                  </span>
                </h1>
              </div>
              
              {/* Subtitle with Animation */}
              <div className="animate-fade-in-up animation-delay-400">
                <p className="text-lg md:text-xl text-[var(--muted-foreground)] mb-8 leading-relaxed">
                  Create detailed trip structures, access <span className="text-[var(--foreground)] font-semibold">real-time API integration</span>, 
                  generate <span className="text-[var(--foreground)] font-semibold">AI-powered itineraries</span>, and manage 
                  <span className="text-[var(--foreground)] font-semibold"> commission rates</span> with professional quote generation for your clients.
                </p>
              </div>
              
              {/* CTA Buttons with Animation */}
              <div className="animate-fade-in-up animation-delay-600">
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                  {user ? (
                    <Link to="/new-proposal">
                      <Button size="lg" className="bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-[var(--primary-foreground)] text-lg px-8 py-6 font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 group">
                        Create Your First Quote
                        <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                      </Button>
                    </Link>
                  ) : (
                    <>
                      <Link to="/signup">
                        <Button size="lg" className="bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-[var(--primary-foreground)] text-lg px-8 py-6 font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 group">
                          Start For Free Today!
                          <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                        </Button>
                      </Link>
                      <Link to="/how-it-works">
                        <Button size="lg" variant="outline" className="border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--muted)] text-lg px-8 py-6 hover:border-[var(--border)] transition-all duration-300 hover:scale-105 group">
                          <Play className="mr-2 h-5 w-5 group-hover:animate-pulse" />
                          Book Demo
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              </div>

              {/* Enhanced Quick Stats */}
              <div className="mt-12 animate-fade-in-up animation-delay-800">
                <div className="flex flex-wrap gap-6">
                  <div className="flex items-center gap-3 group cursor-pointer">
                    <div className="w-12 h-12 bg-[var(--primary)]/10 rounded-xl flex items-center justify-center border border-[var(--primary)]/20 group-hover:bg-[var(--primary)]/20 group-hover:scale-110 transition-all duration-300">
                      <CheckCircle className="h-6 w-6 text-[var(--primary)] group-hover:animate-pulse" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold group-hover:text-[var(--primary)] transition-colors duration-300">99.9%</div>
                      <div className="text-sm text-[var(--muted-foreground)] group-hover:text-[var(--foreground)] transition-colors duration-300">Success Rate</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 group cursor-pointer">
                  <div className="w-12 h-12 bg-[var(--primary)]/10 rounded-xl flex items-center justify-center border border-[var(--primary)]/20 group-hover:bg-[var(--primary)]/20 group-hover:scale-110 transition-all duration-300">
                      <Rocket className="h-6 w-6 text-[var(--primary)] group-hover:animate-pulse" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold group-hover:text-[var(--secondary)] transition-colors duration-300">10x</div>
                      <div className="text-sm text-[var(--muted-foreground)] group-hover:text-[var(--foreground)] transition-colors duration-300">Faster Planning</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 group cursor-pointer">
                    <div className="w-12 h-12 bg-[var(--primary)]/10 rounded-xl flex items-center justify-center border border-[var(--primary)]/20 group-hover:bg-[var(--primary)]/20 group-hover:scale-110 transition-all duration-300">
                      <Network className="h-6 w-6 text-[var(--primary)] group-hover:animate-pulse" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold group-hover:text-[var(--primary)] transition-colors duration-300">50+</div>
                      <div className="text-sm text-[var(--muted-foreground)] group-hover:text-[var(--foreground)] transition-colors duration-300">API Integrations</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Illustration */}
            <div className="lg:col-span-2 flex justify-center lg:justify-end animate-fade-in-up animation-delay-400">
              <div className="relative w-full max-w-lg">
                {/* Background shape behind illustration */}
                <div className="absolute bg-[var(--primary)]/10 w-[120%] h-[120%] left-[-10%] top-[-10%] rounded-[70%_30%_40%_60%/50%_60%_30%_70%]"></div>
                
                {/* Main unDraw illustration */}
                <div className="relative w-full h-96 flex items-center justify-center">
                  <UndrawArtificialIntelligence
                    primaryColor="var(--primary)"
                    secondaryColor="var(--secondary)"
                    skinColor="#e2bd95"
                    hairColor="black"
                    accentColor="green"
                    height="400px"
                    width="400px"
                  />
                </div>
                
                {/* Floating elements around illustration */}
                <div className="absolute -top-4 -right-4 w-8 h-8 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20 animate-pulse">
                  <Shield className="h-4 w-4 text-emerald-500" />
                </div>
                <div className="absolute -bottom-4 -left-4 w-8 h-8 bg-blue-500/10 rounded-full flex items-center justify-center border border-blue-500/20 animate-pulse animation-delay-200">
                  <Lock className="h-4 w-4 text-blue-500" />
                </div>
                <div className="absolute top-1/2 -left-8 w-6 h-6 bg-purple-500/10 rounded-full flex items-center justify-center border border-purple-500/20 animate-pulse animation-delay-400">
                  <Heart className="h-3 w-3 text-purple-500" />
                </div>
                <div className="absolute top-1/4 -right-10 w-10 h-10 bg-cyan-500/10 rounded-full flex items-center justify-center border border-cyan-500/20 animate-bounce animation-delay-300">
                    <Plane className="h-5 w-5 text-cyan-500" />
                </div>
                <div className="absolute bottom-1/3 -right-4 w-7 h-7 bg-orange-500/10 rounded-full flex items-center justify-center border border-orange-500/20 animate-bounce animation-delay-500">
                    <Star className="h-4 w-4 text-orange-500" />
                </div>
                <div className="absolute bottom-16 -left-12 w-9 h-9 bg-pink-500/10 rounded-full flex items-center justify-center border border-pink-500/20 animate-bounce animation-delay-700">
                    <Globe className="h-4 w-4 text-pink-500" />
                </div>
                <div className="absolute -top-6 left-1/3 w-8 h-8 bg-indigo-500/10 rounded-full flex items-center justify-center border border-indigo-500/20 animate-pulse animation-delay-600">
                    <Target className="h-4 w-4 text-indigo-500" />
                </div>
                <div className="absolute -bottom-6 right-1/4 w-8 h-8 bg-teal-500/10 rounded-full flex items-center justify-center border border-teal-500/20 animate-pulse animation-delay-800">
                    <Zap className="h-4 w-4 text-teal-500" />
                </div>
              </div>
            </div>
          </div>
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
              className="fill-[var(--muted)]"
            ></path>
          </svg>
        </div>
      </section>



      {/* Stats Section */}
      <section className="py-24 bg-[var(--muted)]">
        <div className="container mx-auto px-4">
           <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
                Powering the Next Generation of Travel
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Our platform is built for speed, reliability, and scale, helping you deliver exceptional experiences.
            </p>
        </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16 mt-20">
            {stats.map((stat, index) => (
              <div 
                key={index} 
                className="relative bg-[var(--card)] pt-12 pb-8 px-8 rounded-2xl border border-border text-center transition-all duration-300 hover:shadow-xl hover:-translate-y-2 group"
              >
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-16 h-16 bg-primary rounded-full flex items-center justify-center text-primary-foreground shadow-lg group-hover:scale-110 group-hover:bg-secondary transition-all duration-300">
                    {stat.icon}
                </div>
                <p className="text-5xl font-bold text-foreground mb-3 mt-4">{stat.number}</p>
                <p className="text-lg text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stop Wrestling Section */}
      <section className="py-24 bg-[var(--background)] relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              A Better Way to Build and Manage Trips
            </h2>
            <p className="text-xl text-[var(--muted-foreground)] max-w-3xl mx-auto">
              Our platform provides all the tools you need to streamline your operations, from initial quote to final booking, so you can focus on delivering exceptional travel experiences.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left side: Illustration */}
            <div className="flex justify-center order-last lg:order-first">
              <div className="relative">
                <UndrawWorking
                    primaryColor="var(--primary)"
                    secondaryColor="var(--secondary)"
                    height="450px"
                />
                
                {/* Floating elements around illustration */}
                <div className="absolute -top-4 -right-4 w-8 h-8 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20 animate-pulse">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                </div>
                <div className="absolute -bottom-4 -left-4 w-8 h-8 bg-blue-500/10 rounded-full flex items-center justify-center border border-blue-500/20 animate-pulse animation-delay-200">
                  <Zap className="h-4 w-4 text-blue-500" />
                </div>
                <div className="absolute top-1/2 -left-8 w-6 h-6 bg-purple-500/10 rounded-full flex items-center justify-center border border-purple-500/20 animate-pulse animation-delay-400">
                  <Star className="h-3 w-3 text-purple-500" />
                </div>
                <div className="absolute top-1/4 -right-10 w-10 h-10 bg-cyan-500/10 rounded-full flex items-center justify-center border border-cyan-500/20 animate-bounce animation-delay-300">
                  <Rocket className="h-5 w-5 text-cyan-500" />
                </div>
                <div className="absolute bottom-1/3 -right-4 w-7 h-7 bg-orange-500/10 rounded-full flex items-center justify-center border border-orange-500/20 animate-bounce animation-delay-500">
                  <Target className="h-4 w-4 text-orange-500" />
                </div>
                <div className="absolute bottom-16 -left-12 w-9 h-9 bg-pink-500/10 rounded-full flex items-center justify-center border border-pink-500/20 animate-bounce animation-delay-700">
                  <TrendingUp className="h-4 w-4 text-pink-500" />
                </div>
                <div className="absolute -top-6 left-1/3 w-8 h-8 bg-indigo-500/10 rounded-full flex items-center justify-center border border-indigo-500/20 animate-pulse animation-delay-600">
                  <WandSparkles className="h-4 w-4 text-indigo-500" />
                </div>
                <div className="absolute -bottom-6 right-1/4 w-8 h-8 bg-teal-500/10 rounded-full flex items-center justify-center border border-teal-500/20 animate-pulse animation-delay-800">
                  <BarChart3 className="h-4 w-4 text-teal-500" />
                </div>
              </div>
            </div>
            {/* Right side: Features list */}
            <div className="space-y-8">
                {solutions.slice(0, 3).map((solution, index) => (
                    <div key={index} className="flex items-start gap-5 group">
                        <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary border border-primary/20 transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/20">
                            {solution.icon}
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold text-foreground mb-2">{solution.title}</h3>
                            <p className="text-muted-foreground text-base">{solution.description}</p>
                        </div>
                    </div>
                ))}
            </div>
          </div>
        </div>
        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none">
            <svg className="relative block w-full h-[75px] md:h-[120px]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
                <path d="M1200,60 C800,150 400,0 0,60 V120 H1200 Z" className="fill-[var(--muted)]"></path>
            </svg>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="py-16 bg-[var(--muted)]">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              An Enterprise-Grade Foundation
            </h2>
            <p className="text-xl text-[var(--muted-foreground)] max-w-3xl mx-auto">
              We use the best and most reliable technologies to build our platform, so you can build your business with confidence.
            </p>
          </div>
          
          <motion.div 
            className="grid grid-cols-2 sm:grid-cols-8 lg:grid-cols-8 gap-4  mx-auto"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            {techStack.map((tech) => (
              <motion.div 
                key={tech.name} 
                className="relative group p-4 bg-[var(--card)]/50 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden"
                variants={itemVariants}
                style={{ '--glow-color': tech.glowColor }}
              >
                <div className="absolute -inset-px bg-[var(--glow-color)] rounded-2xl opacity-0 group-hover:opacity-30 blur-lg transition-opacity duration-300"></div>
                <div className="relative flex flex-col items-center justify-center gap-3">
                  <div className="w-14 h-14 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                    {tech.icon}
                  </div>
                  <p className="font-semibold text-foreground text-center">{tech.name}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Customer Stories */}
      <section className="py-24 bg-[var(--background)] relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-[0.03] [mask-image:radial-gradient(400px_at_center,white,transparent)]">
            <svg aria-hidden="true" className="absolute inset-0 h-full w-full"><defs><pattern id="grid-pattern" width="72" height="72" patternUnits="userSpaceOnUse" x="50%" y="50%"><path d="M.5 71.5V.5H71.5" fill="none" stroke="currentColor"></path></pattern></defs><rect width="100%" height="100%" strokeWidth="0" fill="url(#grid-pattern)"></rect></svg>
        </div>

        <div className="container mx-auto px-4 relative">
            <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
                <div>
                    <h2 className="text-4xl md:text-5xl font-bold mb-4">Loved by Travel Professionals Worldwide</h2>
                    <p className="text-xl text-[var(--muted-foreground)] max-w-xl">
                        Don't just take our word for it - see what our partners have to say about transforming their business with AItinerary.
                    </p>
                </div>
                <div className="hidden lg:flex justify-end">
                  <div className="relative">
                    <UndrawTeam primaryColor="var(--primary)" secondaryColor="var(--secondary)" height="250px" />
                    
                    {/* Floating elements around illustration */}
                    <div className="absolute -top-4 -right-4 w-8 h-8 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20 animate-pulse">
                      <Users className="h-4 w-4 text-emerald-500" />
                    </div>
                    <div className="absolute -bottom-4 -left-4 w-8 h-8 bg-blue-500/10 rounded-full flex items-center justify-center border border-blue-500/20 animate-pulse animation-delay-200">
                      <Heart className="h-4 w-4 text-blue-500" />
                    </div>
                    <div className="absolute top-1/2 -left-8 w-6 h-6 bg-purple-500/10 rounded-full flex items-center justify-center border border-purple-500/20 animate-pulse animation-delay-400">
                      <Star className="h-3 w-3 text-purple-500" />
                    </div>
                    <div className="absolute top-1/4 -right-10 w-10 h-10 bg-cyan-500/10 rounded-full flex items-center justify-center border border-cyan-500/20 animate-bounce animation-delay-300">
                      <MessageCircle className="h-5 w-5 text-cyan-500" />
                    </div>
                    <div className="absolute bottom-1/3 -right-4 w-7 h-7 bg-orange-500/10 rounded-full flex items-center justify-center border border-orange-500/20 animate-bounce animation-delay-500">
                      <TrendingUp className="h-4 w-4 text-orange-500" />
                    </div>
                    <div className="absolute bottom-16 -left-12 w-9 h-9 bg-pink-500/10 rounded-full flex items-center justify-center border border-pink-500/20 animate-bounce animation-delay-700">
                      <CheckCircle className="h-4 w-4 text-pink-500" />
                    </div>
                    <div className="absolute -top-6 left-1/3 w-8 h-8 bg-indigo-500/10 rounded-full flex items-center justify-center border border-indigo-500/20 animate-pulse animation-delay-600">
                      <Quote className="h-4 w-4 text-indigo-500" />
                    </div>
                    <div className="absolute -bottom-6 right-1/4 w-8 h-8 bg-teal-500/10 rounded-full flex items-center justify-center border border-teal-500/20 animate-pulse animation-delay-800">
                      <Globe className="h-4 w-4 text-teal-500" />
                    </div>
                  </div>
                </div>
            </div>
          
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-4">
              {customers.map((customer, index) => (
                <CarouselItem key={index} className="pl-4 md:basis-1/2 lg:basis-1/3">
                  <div className="p-1 h-full">
                    <Card className="h-full pb-0 pt-0 flex flex-col justify-between rounded-2xl bg-muted/50 backdrop-blur-lg border-border/20 shadow-lg hover:shadow-xl transition-shadow duration-300">
                      <CardContent className="p-8 flex-grow relative">
                        <Quote className="absolute top-4 left-4 w-12 h-12 text-primary/10" />
                        <div className="flex mb-4 relative z-10">
                            {[...Array(customer.rating)].map((_, i) => (
                                <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                            ))}
                        </div>
                        <blockquote className="text-foreground text-lg italic mb-6 relative z-10">
                          "{customer.quote}"
                        </blockquote>
                      </CardContent>
                      <div className="p-6 pt-4 bg-[var(--muted)]/50 rounded-b-2xl border-t border-border/20">
                        <div className="flex items-center gap-4">
                            <Avatar className="w-12 h-12 border-2 border-primary/50">
                                <AvatarFallback className="bg-[var(--primary)] text-white font-bold">
                                    {customer.logo}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-semibold text-foreground">{customer.name}</p>
                                <p className="text-sm text-muted-foreground">{customer.role}, {customer.company}</p>
                            </div>
                        </div>
                      </div>
                    </Card>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden sm:flex" />
            <CarouselNext className="hidden sm:flex" />
          </Carousel>
        </div>
      </section>

      {/* Security Section */}
      <section className="py-24 bg-[var(--muted)] relative">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left side: Content */}
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Security you can <span className="italic">trust</span>
              </h2>
              <p className="text-xl text-[var(--muted-foreground)] mb-12">
                AItinerary is ISO 27001 certified and offers you enterprise-grade security. Your travel data and metadata 
                is encrypted in transit and at rest.
              </p>
              <div className="space-y-6">
                <div className="p-6 bg-[var(--card)]/50 backdrop-blur-md rounded-2xl border border-white/10 flex items-center gap-4 hover:border-white/20 transition-colors">
                    <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                        <Lock className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold">ISO 27001 Certified</h3>
                        <p className="text-muted-foreground text-sm">Independently audited for security best practices.</p>
                    </div>
                </div>
                <div className="p-6 bg-[var(--card)]/50 backdrop-blur-md rounded-2xl border border-white/10 flex items-center gap-4 hover:border-white/20 transition-colors">
                    <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                        <Shield className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold">Data Encryption</h3>
                        <p className="text-muted-foreground text-sm">All your data is encrypted in transit and at rest.</p>
                    </div>
                </div>
                <div className="p-6 bg-[var(--card)]/50 backdrop-blur-md rounded-2xl border border-white/10 flex items-center gap-4 hover:border-white/20 transition-colors">
                    <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                        <Cloud className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold">GDPR Compliant</h3>
                        <p className="text-muted-foreground text-sm">Full compliance with data protection regulations.</p>
                    </div>
                </div>
              </div>
            </div>
            {/* Right side: Illustration */}
            <div className="flex justify-center">
              <div className="relative">
                <UndrawSecurityOn 
                  primaryColor="var(--primary)"
                  secondaryColor="var(--secondary)"
                  height="400px"
                />
                
                {/* Floating elements around illustration */}
                <div className="absolute -top-4 -right-4 w-8 h-8 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20 animate-pulse">
                  <Shield className="h-4 w-4 text-emerald-500" />
                </div>
                <div className="absolute -bottom-4 -left-4 w-8 h-8 bg-blue-500/10 rounded-full flex items-center justify-center border border-blue-500/20 animate-pulse animation-delay-200">
                  <Lock className="h-4 w-4 text-blue-500" />
                </div>
                <div className="absolute top-1/2 -left-8 w-6 h-6 bg-purple-500/10 rounded-full flex items-center justify-center border border-purple-500/20 animate-pulse animation-delay-400">
                  <Heart className="h-3 w-3 text-purple-500" />
                </div>
                <div className="absolute top-1/4 -right-10 w-10 h-10 bg-cyan-500/10 rounded-full flex items-center justify-center border border-cyan-500/20 animate-bounce animation-delay-300">
                  <Plane className="h-5 w-5 text-cyan-500" />
                </div>
                <div className="absolute bottom-1/3 -right-4 w-7 h-7 bg-orange-500/10 rounded-full flex items-center justify-center border border-orange-500/20 animate-bounce animation-delay-500">
                  <Star className="h-4 w-4 text-orange-500" />
                </div>
                <div className="absolute bottom-16 -left-12 w-9 h-9 bg-pink-500/10 rounded-full flex items-center justify-center border border-pink-500/20 animate-bounce animation-delay-700">
                  <Globe className="h-4 w-4 text-pink-500" />
                </div>
                <div className="absolute -top-6 left-1/3 w-8 h-8 bg-indigo-500/10 rounded-full flex items-center justify-center border border-indigo-500/20 animate-pulse animation-delay-600">
                  <Target className="h-4 w-4 text-indigo-500" />
                </div>
                <div className="absolute -bottom-6 right-1/4 w-8 h-8 bg-teal-500/10 rounded-full flex items-center justify-center border border-teal-500/20 animate-pulse animation-delay-800">
                  <Zap className="h-4 w-4 text-teal-500" />
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none">
            <svg className="relative block w-full h-[75px] md:h-[120px]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
                <path d="M1200,60 C800,150 400,0 0,60 V120 H1200 Z" className="fill-[var(--background)]"></path>
            </svg>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse animation-delay-400"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-20">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-primary/5 via-transparent to-secondary/5"></div>
          </div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="relative bg-primary rounded-3xl overflow-hidden p-12 shadow-2xl">
            {/* Animated grid background */}
            <div className="absolute inset-0 opacity-10 [mask-image:radial-gradient(600px_at_center,white,transparent)]">
              <svg aria-hidden="true" className="absolute inset-0 h-full w-full animate-pulse">
                <defs>
                  <pattern id="cta-grid" width="72" height="72" patternUnits="userSpaceOnUse" x="50%" y="50%">
                    <path d="M.5 71.5V.5H71.5" fill="none" stroke="currentColor" strokeWidth="0.3"></path>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" strokeWidth="0" fill="url(#cta-grid)"></rect>
              </svg>
            </div>

            {/* Floating elements */}
            <div className="absolute top-8 right-8 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center border border-white/20 animate-bounce">
              <Rocket className="h-6 w-6 text-white" />
            </div>
            <div className="absolute bottom-8 left-8 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center border border-white/20 animate-bounce animation-delay-300">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div className="absolute top-1/2 -left-6 w-8 h-8 bg-white/10 rounded-full flex items-center justify-center border border-white/20 animate-pulse animation-delay-600">
              <Star className="h-4 w-4 text-white" />
            </div>
            <div className="absolute bottom-1/3 -right-6 w-9 h-9 bg-white/10 rounded-full flex items-center justify-center border border-white/20 animate-pulse animation-delay-900">
              <CheckCircle className="h-4 w-4 text-white" />
            </div>
            
            <div className="relative text-center text-white">
              <Badge className="mb-6 bg-white/15 text-white border-white/25 backdrop-blur-sm hover:bg-white/20 transition-all duration-300 group">
                <Sparkles className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform duration-300" />
                Ready to Transform Your Business?
                <Zap className="h-4 w-4 ml-2" />
              </Badge>
              
              <h2 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                Start Your Journey
                <span className="block text-2xl md:text-3xl font-light mt-2 opacity-90">
                  Today
                </span>
              </h2>
              
              <p className="text-xl md:text-2xl text-white/90 mb-10 max-w-3xl mx-auto leading-relaxed">
                Join hundreds of travel professionals who are already revolutionizing their business with AI-powered tools and real-time integrations.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-8">
                {user ? (
                  <Link to="/new-proposal">
                    <Button size="lg" className="bg-white text-primary hover:bg-white/90 text-xl px-10 py-8 font-bold shadow-2xl hover:shadow-white/20 transition-all duration-300 transform hover:scale-105 group">
                      Create Your First Quote
                      <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-2 transition-transform duration-300" />
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link to="/signup">
                      <Button size="lg" className="bg-white text-primary hover:bg-white/90 text-xl px-10 py-8 font-bold shadow-2xl hover:shadow-white/20 transition-all duration-300 transform hover:scale-105 group">
                        Start for Free
                        <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-2 transition-transform duration-300" />
                      </Button>
                    </Link>
                    <Link to="/pricing">
                      <Button size="lg" variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20 text-xl px-10 py-8 font-bold backdrop-blur-md hover:border-white/50 transition-all duration-300 transform hover:scale-105 group">
                        <Play className="mr-3 h-6 w-6" />
                        Book Demo
                      </Button>
                    </Link>
                  </>
                )}
              </div>

              {/* Trust indicators */}
              <div className="flex flex-wrap justify-center gap-8 text-white/80">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-300" />
                  <span className="text-sm font-medium">No Credit Card Required</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-300" />
                  <span className="text-sm font-medium">Free Plan Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-300" />
                  <span className="text-sm font-medium">Cancel Anytime</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Blog Section */}
      <section className="py-24 bg-[var(--muted)]/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Latest Insights & Updates
            </h2>
            <p className="text-xl text-[var(--muted-foreground)] max-w-3xl mx-auto">
              Stay ahead of the curve with our latest articles on travel technology, industry trends, and platform updates.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.slice(0, 3).map((post, index) => (
              <Card key={post.slug} className="group pt-0 pb-0 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                <div className="relative overflow-hidden">
                  <img 
                    src={post.image} 
                    alt={post.title}
                    className="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-4 left-4">
                    <Badge variant="secondary" className="bg-white/90 text-foreground">
                      {post.category}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(post.date).toLocaleDateString()}</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-3 group-hover:text-primary transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-muted-foreground mb-4 line-clamp-3">
                    {post.excerpt}
                  </p>
                  <Link to={`/blog/${post.slug}`} className="inline-flex items-center text-primary hover:text-primary/80 font-medium group/link">
                    Read More
                    <ArrowRight className="ml-2 h-4 w-4 group-hover/link:translate-x-1 transition-transform" />
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link to="/blog">
              <Button variant="outline" size="lg" className="group">
                View All Articles
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
} 