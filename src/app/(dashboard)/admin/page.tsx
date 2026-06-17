"use client";

import React, { useState, useEffect } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import { 
  Users, 
  ClipboardList, 
  Heart, 
  Activity,
  CheckCircle,
  Clock,
  Sparkles,
  Loader2
} from 'lucide-react';
import Link from 'next/link';

interface AdminStats {
  totalUsers: number;
  totalDonors: number;
  totalRequests: number;
  totalDonationsCount: number;
  activeRequestsCount: number;
  fulfilledRequestsCount: number;
}

export default function AdminOverviewDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Query users
        const usersRes = await fetch('/api/admin/users');
        const usersData = await usersRes.json();
        
        // Query requests
        const reqsRes = await fetch('/api/requests?status=');
        const reqsData = await reqsRes.json();

        // Calculate metrics
        const totalUsers = usersData.length;
        const totalDonors = usersData.filter((u: any) => u.role === 'DONOR').length;
        const totalRequests = reqsData.length;
        const activeRequestsCount = reqsData.filter((r: any) => r.status === 'ACTIVE').length;
        const fulfilledRequestsCount = reqsData.filter((r: any) => r.status === 'FULFILLED').length;
        
        let totalDonationsCount = 0;
        reqsData.forEach((r: any) => {
          totalDonationsCount += r.unitsReceived;
        });

        setStats({
          totalUsers,
          totalDonors,
          totalRequests,
          totalDonationsCount,
          activeRequestsCount,
          fulfilledRequestsCount,
        });
      } catch (err) {
        console.error('Failed to fetch admin stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!stats) return null;

  // Calculate fulfillment rate percentage
  const fulfillmentRate = stats.totalRequests > 0
    ? Math.round((stats.fulfilledRequestsCount / stats.totalRequests) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <PageHeader 
        title="System Admin Panel" 
        description="Monitor system health, manage configurations, regulate accounts, and audit matching metrics."
      />

      {/* Grid: Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Total Users */}
        <div className="bg-white dark:bg-slate-900 border rounded-xl p-6 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-600">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Total Users</span>
            <span className="text-2xl font-black text-slate-800 dark:text-slate-100 block mt-0.5">{stats.totalUsers}</span>
          </div>
        </div>

        {/* Total Donors */}
        <div className="bg-white dark:bg-slate-900 border rounded-xl p-6 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-red-50 dark:bg-red-950 flex items-center justify-center text-red-600">
            <Heart className="h-6 w-6 fill-current" />
          </div>
          <div>
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Registered Donors</span>
            <span className="text-2xl font-black text-slate-800 dark:text-slate-100 block mt-0.5">{stats.totalDonors}</span>
          </div>
        </div>

        {/* Requests */}
        <div className="bg-white dark:bg-slate-900 border rounded-xl p-6 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-600">
            <ClipboardList className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Total Requests</span>
            <span className="text-2xl font-black text-slate-800 dark:text-slate-100 block mt-0.5">{stats.totalRequests}</span>
          </div>
        </div>

        {/* Total Donations */}
        <div className="bg-white dark:bg-slate-900 border rounded-xl p-6 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-green-50 dark:bg-green-950 flex items-center justify-center text-green-600">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Total Donations</span>
            <span className="text-2xl font-black text-slate-800 dark:text-slate-100 block mt-0.5">{stats.totalDonationsCount} units</span>
          </div>
        </div>
      </div>

      {/* Matching metrics, configuration shortcuts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Fulfillment Rate chart block */}
        <div className="bg-white dark:bg-slate-900 border rounded-xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 border-b pb-2">
            Match Fulfillment Success
          </h4>
          <div className="flex flex-col items-center justify-center py-4 space-y-2">
            <span className="text-4xl font-black text-green-600">{fulfillmentRate}%</span>
            <span className="text-xs font-semibold text-muted-foreground">Verified cases resolved</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-850 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-green-600 h-2 rounded-full" 
              style={{ width: `${fulfillmentRate}%` }}
            />
          </div>
        </div>

        {/* Quick configuration links */}
        <div className="bg-white dark:bg-slate-900 border rounded-xl p-6 shadow-sm space-y-4">
          <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 border-b pb-2">
            Quick Actions
          </h4>
          <div className="space-y-2 text-xs flex flex-col font-bold">
            <Link 
              href="/admin/users" 
              className="p-3 bg-muted/30 border hover:bg-muted/50 rounded-lg transition-colors flex justify-between items-center"
            >
              <span>Regulate User accounts</span>
              <Users className="h-4 w-4 text-muted-foreground" />
            </Link>
            <Link 
              href="/admin/requests" 
              className="p-3 bg-muted/30 border hover:bg-muted/50 rounded-lg transition-colors flex justify-between items-center"
            >
              <span>Override Emergency Requests</span>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </Link>
            <Link 
              href="/admin/settings" 
              className="p-3 bg-muted/30 border hover:bg-muted/50 rounded-lg transition-colors flex justify-between items-center"
            >
              <span>Configure Cooldown rules</span>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </Link>
          </div>
        </div>

        {/* System parameters logs summary */}
        <div className="bg-white dark:bg-slate-900 border rounded-xl p-6 shadow-sm space-y-3">
          <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 border-b pb-2">
            Audit Parameter Metrics
          </h4>
          <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-350">
            <div className="flex justify-between">
              <span>Active matching cases:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{stats.activeRequestsCount}</span>
            </div>
            <div className="flex justify-between">
              <span>Requests fulfilled:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{stats.fulfilledRequestsCount}</span>
            </div>
            <div className="flex justify-between">
              <span>Admin status overrides:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
