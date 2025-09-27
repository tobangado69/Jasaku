"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  LayoutDashboard,
  Users,
  Calendar,
  DollarSign,
  Settings,
  Bell,
  Search,
  Menu,
  X,
  Home,
  Star,
  MessageSquare,
  BarChart3,
  Shield,
  Heart,
  Package,
  CreditCard,
  TrendingUp,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SidebarConfig, NavItem } from "@/lib/types";

const sidebarConfig: SidebarConfig = {
  provider: [
    {
      id: "overview",
      label: "Overview",
      href: "/provider",
      icon: LayoutDashboard,
    },
    {
      id: "bookings",
      label: "Bookings",
      href: "/provider/bookings",
      icon: Calendar,
    },
    {
      id: "earnings",
      label: "Earnings",
      href: "/provider/earnings",
      icon: DollarSign,
    },
    {
      id: "services",
      label: "Services",
      href: "/provider/services",
      icon: Package,
    },
    {
      id: "messages",
      label: "Messages",
      href: "/provider/messages",
      icon: MessageSquare,
    },
    {
      id: "analytics",
      label: "Analytics",
      href: "/provider/analytics",
      icon: BarChart3,
    },
  ],
  seeker: [
    {
      id: "overview",
      label: "Overview",
      href: "/seeker",
      icon: LayoutDashboard,
    },
    {
      id: "find-services",
      label: "Find Services",
      href: "/seeker/find-services",
      icon: Search,
    },
    {
      id: "bookings",
      label: "My Bookings",
      href: "/seeker/bookings",
      icon: Calendar,
    },
    {
      id: "favorites",
      label: "Favorites",
      href: "/seeker/favorites",
      icon: Heart,
    },
  ],
  admin: [
    {
      id: "overview",
      label: "Overview",
      href: "/admin",
      icon: LayoutDashboard,
    },
    { id: "users", label: "Users", href: "/admin/users", icon: Users },
    {
      id: "services",
      label: "Services",
      href: "/admin/services",
      icon: Package,
    },
    {
      id: "payments",
      label: "Payments",
      href: "/admin/payments",
      icon: CreditCard,
    },
    {
      id: "analytics",
      label: "Analytics",
      href: "/admin/analytics",
      icon: TrendingUp,
    },
    {
      id: "support",
      label: "Support",
      href: "/admin/support",
      icon: HelpCircle,
    },
  ],
};

interface SidebarProps {
  userRole: "provider" | "seeker" | "admin";
  user?: any;
  className?: string;
}

export function Sidebar({ userRole, user, className }: SidebarProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const navItems = sidebarConfig[userRole] || [];

  const isActive = (href: string) => {
    if (href === `/${userRole}`) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile sidebar toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? (
            <X className="h-4 w-4" />
          ) : (
            <Menu className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          className
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">J</span>
              </div>
              <span className="text-xl font-bold">Jasaku</span>
            </div>
          </div>

          {/* User Profile */}
          {user && (
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.image} />
                  <AvatarFallback>
                    {user.name
                      ?.split(" ")
                      .map((n: string) => n[0])
                      .join("") || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">{userRole}</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="ml-auto bg-red-600 text-white text-xs rounded-full px-2 py-1">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </div>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </>
  );
}
