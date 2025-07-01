import { MessageCircle, Phone, Mail } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="relative overflow-hidden pt-1 bg-gradient-to-br from-[var(--muted)]/80 to-[var(--background)]/90 backdrop-blur-xl">
      {/* Top Gradient Border */}
      <div className="h-1 w-full bg-gradient-to-r from-[var(--primary)] via-[var(--accent)] to-[var(--primary)] opacity-80" />
      {/* Glassmorphism background */}
      <div className="absolute inset-0 pointer-events-none bg-white/40 dark:bg-black/20 backdrop-blur-xl" style={{ zIndex: 0 }} />
      <div className="relative z-10 container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">
          {/* Brand & Social */}
          <div>
            <h3 className="text-2xl font-extrabold mb-4 tracking-tight bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] bg-clip-text text-transparent">AItinerary</h3>
            <p className="text-[var(--muted-foreground)] mb-6 max-w-xs leading-relaxed">
              AI-powered B2B travel platform for OTAs and tour operators.
            </p>
            <div className="flex gap-4 mt-2">
              <a href="mailto:hello@aitinerary.com" className="group p-2 rounded-full bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20 transition-colors" aria-label="Email">
                <Mail className="h-5 w-5 text-[var(--primary)] group-hover:scale-110 transition-transform" />
              </a>
              <a href="tel:+15551234567" className="group p-2 rounded-full bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20 transition-colors" aria-label="Phone">
                <Phone className="h-5 w-5 text-[var(--primary)] group-hover:scale-110 transition-transform" />
              </a>
              <a href="/contact" className="group p-2 rounded-full bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20 transition-colors" aria-label="Contact">
                <MessageCircle className="h-5 w-5 text-[var(--primary)] group-hover:scale-110 transition-transform" />
              </a>
            </div>
          </div>
          {/* Product */}
          <div>
            <h4 className="font-semibold mb-4 text-[var(--foreground)] tracking-wide">Product</h4>
            <ul className="space-y-2 text-[var(--muted-foreground)]">
              <li><Link to="/how-it-works" className="hover:text-[var(--primary)] transition-colors">How It Works</Link></li>
              <li><Link to="/features" className="hover:text-[var(--primary)] transition-colors">Features</Link></li>
              <li><Link to="/pricing" className="hover:text-[var(--primary)] transition-colors">Pricing</Link></li>
              <li className="opacity-70">API</li>
              <li className="opacity-70">Integrations</li>
            </ul>
          </div>
          {/* Company */}
          <div>
            <h4 className="font-semibold mb-4 text-[var(--foreground)] tracking-wide">Company</h4>
            <ul className="space-y-2 text-[var(--muted-foreground)]">
              <li><Link to="/about" className="hover:text-[var(--primary)] transition-colors">About</Link></li>
              <li className="opacity-70">Blog</li>
              <li className="opacity-70">Careers</li>
              <li className="opacity-70">Contact</li>
            </ul>
          </div>
          {/* Support */}
          <div>
            <h4 className="font-semibold mb-4 text-[var(--foreground)] tracking-wide">Support</h4>
            <ul className="space-y-2 text-[var(--muted-foreground)]">
              <li className="opacity-70">Help Center</li>
              <li className="opacity-70">Documentation</li>
              <li className="opacity-70">Status</li>
              <li className="opacity-70">Security</li>
            </ul>
          </div>
        </div>
        <Separator className="my-10 bg-gradient-to-r from-[var(--primary)]/30 via-[var(--muted)] to-[var(--primary)]/30" />
        <div className="flex flex-col sm:flex-row justify-between items-center text-[var(--muted-foreground)] gap-4 text-sm">
          <p>&copy; {new Date().getFullYear()} AItinerary. All rights reserved.</p>
          <div className="flex gap-4">
            <Link to="#" className="hover:text-[var(--primary)] transition-colors">Privacy Policy</Link>
            <Link to="#" className="hover:text-[var(--primary)] transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
} 