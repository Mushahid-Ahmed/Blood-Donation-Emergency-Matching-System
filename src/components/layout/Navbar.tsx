"use client";

import React from 'react';
import { signOut } from 'next-auth/react';
import { LogOut, User } from 'lucide-react';
import NotificationBell from '@/components/shared/NotificationBell';

interface NavbarProps {
  userName: string;
}

export default function Navbar({ userName }: NavbarProps) {
  const handleLogout = () => {
    signOut({ callbackUrl: '/login' });
  };

  return (
    <header className="h-16 border-b bg-card text-card-foreground flex items-center justify-between px-6 z-10 shrink-0">
      {/* Search / Brand placeholder */}
      <div className="text-sm font-semibold text-muted-foreground hidden sm:block">
        Emergency Blood Matching Platform
      </div>

      {/* Actions Section */}
      <div className="flex items-center gap-4 ml-auto">
        {/* Notification Bell Dropdown */}
        <NotificationBell />

        {/* Vertical Divider */}
        <span className="h-5 w-px bg-border" />

        {/* User Profile Info */}
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-muted border flex items-center justify-center text-muted-foreground">
            <User className="h-4 w-4" />
          </div>
          <span className="text-sm font-bold text-slate-800 dark:text-slate-200 hidden md:block">
            {userName}
          </span>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="p-2 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-full transition-colors focus:outline-none"
          aria-label="Sign out"
          title="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
