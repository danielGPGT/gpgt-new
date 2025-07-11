import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Home,
  FilePlus2,
  Calendar,
  User,
  Users,
  ChevronLeft,
  ChevronRight,
  FileText,
  CheckCircle,
  Image,
  Trophy,
  Crown,
  Settings as SettingsIcon,
  HelpCircle,
  Search as SearchIcon,
  Moon,
  MoreVertical,
  LogOut,
  Bell,
  CreditCard,
  BarChart3,
  Building2,
  Package as PackageIcon,
} from "lucide-react";
import { useAuth } from "@/lib/AuthProvider";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import gpgtLogoDark from "@/assets/imgs/gpgt_logo_dark.svg";
import gpgtLogoLight from "@/assets/imgs/gpgt_logo_light.svg";
import { useTheme } from "@/components/ThemeProvider";

// Logo Component
const Logo = ({ className, darkMode }: { className?: string; darkMode?: boolean }) => (
  <img
    src={darkMode ? gpgtLogoLight : gpgtLogoDark}
    alt="GPGT Logo"
    className={className}
  />
);

interface SidebarProps {
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

export function Sidebar({ collapsed = false, onCollapsedChange }: SidebarProps) {
  const { user } = useAuth();
  const location = useLocation();
  const { theme } = useTheme();

  const handleToggleCollapse = () => {
    if (onCollapsedChange) {
      onCollapsedChange(!collapsed);
    }
  };

  // Main navigation
  const navItems = [
    { label: "Dashboard", icon: Home, href: "/dashboard" },
    { label: "Analytics", icon: BarChart3, href: "/analytics" },
    { label: "New Proposal", icon: FilePlus2, href: "/package-intake-test" },
    { label: "Quotes", icon: FileText, href: "/quotes" },
    { label: "Bookings", icon: CheckCircle, href: "/bookings" },
    { label: "Itineraries", icon: Calendar, href: "/itineraries" },
    {
      label: "Media Library",
      icon: Image,
      href: "/media-library",
      premium: true,
    },
  ];

  // CRM section
  const crmItems = [
    { label: "Clients", icon: Users, href: "/crm" },
    { label: "Integrations", icon: Building2, href: "/integrations" },
  ];

  // Documents section
  // Bottom section
  const bottomItems = [
    { label: "Settings", icon: SettingsIcon, href: "/settings" },
    { label: "Get Help", icon: HelpCircle, href: "/help" },
    { label: "Search", icon: SearchIcon, href: "/search" },
  ];

  return (
    <aside
      className={`fixed left-0 top-0 h-screen z-40 flex flex-col transition-all duration-300 ${
        collapsed ? "w-20" : "w-72"
      } bg-[var(--sidebar)] border-r border-[var(--sidebar-border)]`}
    >
      {/* Branding & Collapse */}
      <div className="flex items-center justify-between h-16 px-4 border-[var(--sidebar-border)]">
        <Link to="/" className="flex items-center gap-2">
          <Logo className="h-8" darkMode={theme === "dark"} />
        </Link>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-2 py-4">
        <div className="space-y-1">
          {navItems.map((item) => {
            const active = location.pathname === item.href;
            return (
              <Link to={item.href} key={item.href} tabIndex={collapsed ? -1 : 0}>
                <Button
                  variant="ghost"
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    active
                      ? "bg-[var(--sidebar-accent)] text-[var(--sidebar-accent-foreground)] font-semibold"
                      : "text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)]over:text-[var(--sidebar-pryccentoreground)]"
                  } ${collapsed ? "justify-center px-2" : "justif)]y-start"}`}
                >
                  <item.icon className="w-5 h-5" />
                  {!collapsed && <span className="truncate flex-1 text-left">{item.label}</span>}
                  {item.premium && !collapsed && (
                    <Crown className="w-4 h-4 text-yellow-500 ml-1" />
                  )}
                </Button>
              </Link>
            );
          })}
        </div>

        {/* CRM Section */}
        <div className="mt-6">
          {!collapsed && (
            <div className="px-3 py-1 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
              CRM
            </div>
          )}
          <div className="space-y-1 mt-1">
            {crmItems.map((item) => {
              const active = location.pathname === item.href;
              return (
                <Link to={item.href} key={item.href} tabIndex={collapsed ? -1 : 0}>
                  <Button
                    variant="ghost"
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      active
                        ? "bg-[var(--sidebar-accent)] text-[var(--sidebar-accent-foreground)] font-semibold"
                        : "text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)] hover:text-[var(--sidebar-accent-foreground)]"
                    } ${collapsed ? "justify-center px-2" : "justify-start"}`}
                  >
                    <item.icon className="w-5 h-5" />
                    {!collapsed && <span className="truncate flex-1 text-left">{item.label}</span>}
                  </Button>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Inventory Section */}
        <div className="mt-6">
          {!collapsed && (
            <div className="px-3 py-1 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
              Inventory
            </div>
          )}
          <div className="space-y-1 mt-1">
            <Link to="/inventory" tabIndex={collapsed ? -1 : 0}>
              <Button
                variant="ghost"
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  location.pathname.startsWith('/inventory')
                    ? "bg-[var(--sidebar-accent)] text-[var(--sidebar-accent-foreground)] font-semibold"
                    : "text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)] hover:text-[var(--sidebar-accent-foreground)]"
                } ${collapsed ? "justify-center px-2" : "justify-start"}`}
              >
                <PackageIcon className="w-5 h-5" />
                {!collapsed && <span className="truncate flex-1 text-left">Inventory</span>}
              </Button>
            </Link>
            <Link to="/package-manager" tabIndex={collapsed ? -1 : 0}>
              <Button
                variant="ghost"
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  location.pathname.startsWith('/package-manager')
                    ? "bg-[var(--sidebar-accent)] text-[var(--sidebar-accent-foreground)] font-semibold"
                    : "text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)] hover:text-[var(--sidebar-accent-foreground)]"
                } ${collapsed ? "justify-center px-2" : "justify-start"}`}
              >
                <Trophy className="w-5 h-5" />
                {!collapsed && <span className="truncate flex-1 text-left">Package Manager</span>}
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Bottom Section */}
      <div className="mt-auto w-full px-2 py-4 flex flex-col gap-2">
        {bottomItems.map((item) => (
          <Link to={item.href} key={item.href} tabIndex={collapsed ? -1 : 0}>
            <Button
              variant="ghost"
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                location.pathname === item.href
                  ? "bg-[var(--sidebar-accent)] text-[var(--sidebar-accent-foreground)] font-semibold"
                  : "text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)] hover:text-[var(--sidebar-accent-foreground)]"
              } ${collapsed ? "justify-center px-2" : "justify-start"}`}
            >
              <item.icon className="w-5 h-5" />
              {!collapsed && <span className="truncate flex-1 text-left">{item.label}</span>}
            </Button>
          </Link>
        ))}
        {/* User Info */}
        <div className={`flex items-center mt-4 ${collapsed ? "justify-center" : "justify-start gap-3"}`}>
          <Avatar>
            <AvatarImage src={user?.user_metadata?.avatar_url} />
            <AvatarFallback>
              {user?.user_metadata?.name?.[0] || user?.email?.[0]}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-[var(--sidebar-foreground)] truncate">
                  {user?.user_metadata?.name || user?.email || "User Name"}
                </div>
                <div className="text-xs text-[var(--muted-foreground)] truncate">
                  {user?.email || "user@email.com"}
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="ml-auto">
                    <MoreVertical className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={user?.user_metadata?.avatar_url} />
                        <AvatarFallback>
                          {user?.user_metadata?.name?.[0] || user?.email?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold text-sm truncate">
                          {user?.user_metadata?.name || "User Name"}
                        </div>
                        <div className="text-xs text-[var(--muted-foreground)] truncate">
                          {user?.email || "user@email.com"}
                        </div>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User className="w-4 h-4 mr-2" /> Account
                  </DropdownMenuItem>

                  <DropdownMenuItem>
                    <Bell className="w-4 h-4 mr-2" /> Notifications
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <LogOut className="w-4 h-4 mr-2" /> Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
