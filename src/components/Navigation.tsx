import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, Home, Calendar, Settings, PlaneTakeoff, FileText, Users } from "lucide-react";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { cn } from "@/lib/utils";
import { useTeamFeature } from '@/lib/teamUtils';

export function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isNotB2B = useTeamFeature('is_not_b2b');

  // Add restricted items
  const allNavigationItems = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'New Trip', href: '/new-trip', icon: PlaneTakeoff },
    { name: 'Itineraries', href: '/itineraries', icon: Calendar },
    { name: 'Quotes', href: '/quotes', icon: FileText },
    { name: 'Bookings', href: '/bookings', icon: Calendar },
    { name: 'CRM', href: '/crm', icon: Users },
    { name: 'Dashboard', href: '/dashboard', icon: Settings },
    { name: 'Analytics', href: '/analytics', icon: Settings },
    { name: 'Integrations', href: '/integrations', icon: Settings },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  // Only show restricted items if isNotB2B === true
  const navigationItems = allNavigationItems.filter(item => {
    const restricted = ['Quotes', 'Bookings', 'CRM', 'Dashboard', 'Analytics', 'Integrations'];
    if (restricted.includes(item.name)) {
      return isNotB2B === true;
    }
    return true;
  });

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6 pb-4">
          <div className="flex h-16 shrink-0 items-center">
            <h1 className="text-2xl font-bold text-gray-900">LuxeTripBuilder</h1>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigationItems.length === 0 ? null : navigationItems.map((item) => (
                    <li key={item.name}>
                      <Link
                        to={item.href}
                        className={cn(
                          "group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold",
                          "hover:bg-gray-50 hover:text-gray-900",
                          "text-gray-700"
                        )}
                      >
                        <item.icon className="h-6 w-6 shrink-0" />
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Mobile Menu */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetTrigger asChild className="lg:hidden">
          <Button
            variant="ghost"
            className="px-2 text-gray-700"
            aria-label="Open navigation menu"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <div className="flex h-16 shrink-0 items-center px-6">
            <h1 className="text-2xl font-bold text-gray-900">LuxeTripBuilder</h1>
            <Button
              variant="ghost"
              className="ml-auto px-2 text-gray-700"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-label="Close navigation menu"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
          <nav className="flex flex-1 flex-col px-6">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigationItems.length === 0 ? null : navigationItems.map((item) => (
                    <li key={item.name}>
                      <Link
                        to={item.href}
                        className={cn(
                          "group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold",
                          "hover:bg-gray-50 hover:text-gray-900",
                          "text-gray-700"
                        )}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <item.icon className="h-6 w-6 shrink-0" />
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            </ul>
          </nav>
        </SheetContent>
      </Sheet>
    </>
  );
} 