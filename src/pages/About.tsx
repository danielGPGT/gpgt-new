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
  Heart,
  MessageCircle,
  Award,
  Target,
  Lightbulb,
  Shield,
  Clock,
  TrendingUp,
  MapPin,
  Mail,
  Phone,
  Linkedin,
  Twitter,
  Instagram
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthProvider';
import { useEffect, useState } from 'react';
import img1 from "@/assets/imgs/james-donaldson-toPRrcyAIUY-unsplash.jpg";
import img2 from "@/assets/imgs/fredrik-ohlander-fCW1hWq2nq0-unsplash.jpg";
import img3 from "@/assets/imgs/spencer-davis-Ivwyqtw3PzU-unsplash.jpg";
import img4 from "@/assets/imgs/igor-oliyarnik-Uu5aXBI1oLk-unsplash.jpg";

export function About() {
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const values = [
    {
      icon: <Heart className="h-8 w-8" />,
      title: "Passion for Travel",
      description: "We believe travel has the power to transform lives and create unforgettable memories.",
      color: "from-red-500 to-pink-500"
    },
    {
      icon: <Target className="h-8 w-8" />,
      title: "Innovation First",
      description: "We constantly push the boundaries of technology to deliver cutting-edge solutions.",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Trust & Security",
      description: "Your data and your clients' information are protected with enterprise-grade security.",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "Customer Success",
      description: "Your success is our success. We're here to support you every step of the way.",
      color: "from-purple-500 to-pink-500"
    }
  ];

  const achievements = [
    {
      number: "10,000+",
      label: "Itineraries Created",
      description: "Travel professionals have used our platform to create amazing experiences"
    },
    {
      number: "500+",
      label: "Happy Clients",
      description: "Travel agencies trust us with their business and their clients"
    },
    {
      number: "98%",
      label: "Satisfaction Rate",
      description: "Our customers consistently rate us as excellent or outstanding"
    },
    {
      number: "50+",
      label: "Countries Covered",
      description: "Global reach with local expertise and insider knowledge"
    }
  ];

  const milestones = [
    {
      year: "2020",
      title: "Company Founded",
      description: "Started with a vision to revolutionize luxury travel planning through AI"
    },
    {
      year: "2021",
      title: "First AI Model",
      description: "Developed and launched our first AI-powered itinerary generator"
    },
    {
      year: "2022",
      title: "100+ Clients",
      description: "Reached our first major milestone with 100+ travel agency clients"
    },
    {
      year: "2023",
      title: "Platform Expansion",
      description: "Launched advanced features including white-label solutions and API access"
    },
    {
      year: "2024",
      title: "Global Growth",
      description: "Expanded to serve travel professionals in over 50 countries worldwide"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[var(--primary)] via-[var(--primary)]/90 to-purple-600 text-white pt-20">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src={img2}
            alt="Luxury travel destination"
            className="w-full h-full object-cover opacity-20 animate-pulse"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/30 via-[var(--primary)]/25 to-purple-600/30" />
        </div>
        
        <div className="relative z-10 container mx-auto px-4 py-16">
          <div className={`text-center max-w-4xl mx-auto transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <Badge variant="secondary" className="mb-6 bg-white/20 text-white border-white/30 animate-bounce">
              <Sparkles className="h-4 w-4 mr-2" />
              Our Story
            </Badge>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight animate-fade-in">
              Revolutionizing
              <span className="block bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent animate-pulse">
                Luxury Travel
              </span>
              Through AI
            </h1>
            
            <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-2xl mx-auto animate-fade-in-delay">
              We're on a mission to empower travel professionals with cutting-edge AI technology that creates extraordinary experiences.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-delay-2">
              {user ? (
                <Link to="/dashboard">
                  <Button size="lg" className="bg-white text-[var(--primary)] hover:bg-white/90 text-lg px-8 py-6 transform hover:scale-105 transition-all duration-300">
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/login">
                    <Button size="lg" className="bg-white text-[var(--primary)] hover:bg-white/90 text-lg px-8 py-6 transform hover:scale-105 transition-all duration-300">
                      Start Free Trial
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Link to="/features">
                    <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 text-lg px-8 py-6 transform hover:scale-105 transition-all duration-300">
                      Learn More
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className={`space-y-6 transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
              <Badge variant="secondary" className="bg-[var(--primary)]/10 text-[var(--primary)] animate-pulse">
                <Target className="h-4 w-4 mr-2" />
                Our Mission
              </Badge>
              <h2 className="text-4xl font-bold">Empowering Travel Professionals with AI Innovation</h2>
              <p className="text-xl text-muted-foreground">
                We believe that every travel professional deserves access to the most advanced tools and technology. 
                Our AI-powered platform transforms how luxury itineraries are created, making it faster, more personalized, 
                and more profitable for travel agencies worldwide.
              </p>
              <p className="text-lg text-muted-foreground">
                From individual travel consultants to large agencies, we're helping travel professionals 
                focus on what they do best: creating amazing experiences for their clients.
              </p>
            </div>
            <div className={`relative transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
              <div className="relative overflow-hidden rounded-2xl shadow-2xl transform hover:scale-105 transition-all duration-500">
                <img
                  src={img1}
                  alt="Travel professionals working"
                  className="w-full h-96 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className={`text-center mb-16 transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h2 className="text-4xl font-bold mb-4">Our Values</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              The principles that guide everything we do
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <Card key={index} className={`group hover:shadow-xl transition-all duration-500 border-0 bg-gradient-to-br from-white to-muted/50 transform hover:-translate-y-2 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{ transitionDelay: `${index * 200}ms` }}>
                <CardContent className="p-8 text-center">
                  <div className={`w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${value.color} flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300`}>
                    {value.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-4">{value.title}</h3>
                  <p className="text-muted-foreground">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Achievements Section */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className={`text-center mb-16 transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h2 className="text-4xl font-bold mb-4">Our Achievements</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Milestones that demonstrate our commitment to excellence
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {achievements.map((achievement, index) => (
              <Card key={index} className={`text-center hover:shadow-lg transition-all duration-500 transform hover:scale-105 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{ transitionDelay: `${index * 150}ms` }}>
                <CardContent className="p-8">
                  <div className="text-4xl font-bold text-[var(--primary)] mb-2 animate-pulse">{achievement.number}</div>
                  <h3 className="text-xl font-semibold mb-4">{achievement.label}</h3>
                  <p className="text-muted-foreground text-sm">{achievement.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className={`text-center mb-16 transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h2 className="text-4xl font-bold mb-4">Our Journey</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Key milestones in our company's growth and development
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="space-y-8">
              {milestones.map((milestone, index) => (
                <div key={index} className={`flex items-center gap-8 ${index % 2 === 1 ? 'flex-row-reverse' : ''} transition-all duration-1000 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`} style={{ transitionDelay: `${index * 300}ms` }}>
                  <div className="flex-1">
                    <div className="bg-[var(--primary)]/10 rounded-lg p-6 transform hover:scale-105 transition-all duration-300 hover:shadow-lg">
                      <div className="text-2xl font-bold text-[var(--primary)] mb-2">{milestone.year}</div>
                      <h3 className="text-xl font-semibold mb-2">{milestone.title}</h3>
                      <p className="text-muted-foreground">{milestone.description}</p>
                    </div>
                  </div>
                  <div className="w-4 h-4 bg-[var(--primary)] rounded-full flex-shrink-0 animate-pulse"></div>
                  <div className="flex-1"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-24 bg-gradient-to-br from-[var(--primary)] to-purple-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <div className={`transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h2 className="text-4xl font-bold mb-4">Get in Touch</h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Ready to learn more about how we can help transform your travel business?
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <div className="flex items-center gap-2 hover:scale-105 transition-transform duration-300">
                <Mail className="h-5 w-5" />
                <span>hello@luxetripbuilder.com</span>
              </div>
              <div className="flex items-center gap-2 hover:scale-105 transition-transform duration-300">
                <Phone className="h-5 w-5" />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center gap-2 hover:scale-105 transition-transform duration-300">
                <MapPin className="h-5 w-5" />
                <span>San Francisco, CA</span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <Link to="/dashboard">
                  <Button size="lg" className="bg-white text-[var(--primary)] hover:bg-white/90 text-lg px-8 py-6 transform hover:scale-105 transition-all duration-300">
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/login">
                    <Button size="lg" className="bg-white text-[var(--primary)] hover:bg-white/90 text-lg px-8 py-6 transform hover:scale-105 transition-all duration-300">
                      Start Free Trial
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Link to="/pricing">
                    <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 text-lg px-8 py-6 transform hover:scale-105 transition-all duration-300">
                      View Pricing
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
} 