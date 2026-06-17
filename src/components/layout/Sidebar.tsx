"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Role } from '@prisma/client';
import { 
  Home, 
  User, 
  ListPlus, 
  ClipboardList, 
  Activity, 
  ShieldAlert, 
  Users, 
  Settings, 
  History, 
  Heart,
  HeartHandshake
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  role: Role;
}

interface NavItem {
  label: string;
  href: string;
  icon: any;
}

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();

  // Navigation configurations based on user role
  const NAVIGATION_MAP: Record<Role, NavItem[]> = {
    [Role.DONOR]: [
      { label: 'Dashboard', href: '/donor', icon: Home },
      { label: 'Profile Settings', href: '/donor/profile', icon: User },
      { label: 'Consent Requests', href: '/donor/requests', icon: HeartHandshake },
      { label: 'Donation History', href: '/donor/history', icon: History },
    ],
    [Role.ATTENDANT]: [
      { label: 'Attendant Home', href: '/attendant', icon: Home },
      { label: 'Request Blood', href: '/attendant/new-request', icon: ListPlus },
      { label: 'My Requests', href: '/attendant/my-requests', icon: ClipboardList },
    ],
    [Role.VERIFIER]: [
      { label: 'Verification Queue', href: '/verifier', icon: ShieldAlert },
    ],
    [Role.COORDINATOR]: [
      { label: 'Active Matches', href: '/coordinator', icon: Activity },
    ],
    [Role.ADMIN]: [
      { label: 'Admin Dashboard', href: '/admin', icon: Home },
      { label: 'Manage Users', href: '/admin/users', icon: Users },
      { label: 'All Requests', href: '/admin/requests', icon: ClipboardList },
      { label: 'System Settings', href: '/admin/settings', icon: Settings },
    ],
  };

  const navItems = NAVIGATION_MAP[role] || [];

  return (
    <aside className="w-64 border-r bg-card text-card-foreground flex flex-col h-full shrink-0">
      {/* Brand Header */}
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <Heart className="h-6 w-6 text-red-600 fill-current" />
        <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-red-600 to-rose-500 bg-clip-text text-transparent">
          BLOOD MATCH
        </span>
      </div>

      {/* Role Indicator Banner */}
      <div className="px-6 py-4 bg-muted/30 border-b">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block">
          Access Mode
        </span>
        <span className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 mt-0.5">
          <span className="h-2 w-2 rounded-full bg-red-600" />
          {role}
        </span>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 space-y-1.5 px-4 py-6 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 text-sm font-semibold rounded-lg transition-all",
                isActive
                  ? "bg-primary text-white shadow-md shadow-primary/10"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className={cn("h-4 w-4", isActive ? "text-white" : "text-muted-foreground")} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      
      {/* Footer Info */}
      <div className="p-4 border-t text-[11px] text-muted-foreground text-center">
        MAJU Codecraft Hackathon 2026
      </div>
    </aside>
  );
}
