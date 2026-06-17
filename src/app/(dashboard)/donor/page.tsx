"use client";

import React, { useState, useEffect } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import BloodGroupBadge from '@/components/shared/BloodGroupBadge';
import EligibilityBadge from '@/components/shared/EligibilityBadge';
import EmptyState from '@/components/shared/EmptyState';
import { Heart, Activity, Calendar, MapPin, Loader2, Sparkles } from 'lucide-react';
import Link from 'next/link';

interface DonorProfileData {
  id: string;
  userId: string;
  bloodGroup: any;
  city: string;
  area: string;
  isAvailable: boolean;
  lastDonationDate: string | null;
  isEligible: boolean;
  totalDonations: number;
  notes: string | null;
  user: {
    name: string;
    email: string;
    phone: string | null;
  };
}

interface ActiveRequestItem {
  id: string;
  bloodGroup: any;
  unitsNeeded: number;
  hospitalName: string;
  hospitalCity: string;
  hospitalArea: string;
  urgency: string;
  createdAt: string;
  donorMatches: Array<{
    id: string;
    consentStatus: string;
  }>;
}

export default function DonorDashboard() {
  const [profile, setProfile] = useState<DonorProfileData | null>(null);
  const [activeRequests, setActiveRequests] = useState<ActiveRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingAvailability, setUpdatingAvailability] = useState(false);

  const fetchData = async () => {
    try {
      // 1. Fetch current session user info to get userId
      const sessionRes = await fetch('/api/auth/session');
      const session = await sessionRes.json();
      if (!session?.user?.id) return;

      // 2. Fetch donor profile
      const profileRes = await fetch(`/api/donors/${session.user.id}`);
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setProfile(profileData);
        
        // 3. Fetch requests matching their blood group
        const requestsRes = await fetch(`/api/requests`);
        if (requestsRes.ok) {
          const requestsData = await requestsRes.json();
          // Filter matching requests: active requests in their city
          const filtered = requestsData.filter((r: any) => 
            r.status === 'ACTIVE' && 
            r.hospitalCity.toLowerCase() === profileData.city.toLowerCase()
          );
          setActiveRequests(filtered);
        }
      }
    } catch (err) {
      console.error('Failed to load donor dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleAvailability = async () => {
    if (!profile) return;
    setUpdatingAvailability(true);

    try {
      const res = await fetch(`/api/donors/${profile.userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: !profile.isAvailable }),
      });

      if (res.ok) {
        const updated = await res.json();
        setProfile((prev) => prev ? { ...prev, isAvailable: updated.isAvailable } : null);
      }
    } catch (err) {
      console.error('Failed to toggle availability:', err);
    } finally {
      setUpdatingAvailability(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center p-8">
        <p className="text-red-500 font-semibold">Error: Failed to load donor profile.</p>
      </div>
    );
  }

  // Calculate cooldown days remaining
  let cooldownDaysLeft = 0;
  if (profile.lastDonationDate) {
    const lastDate = new Date(profile.lastDonationDate);
    const now = new Date();
    const diffDays = Math.ceil((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 56) {
      cooldownDaysLeft = 56 - diffDays;
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title={`Assalam-o-Alaikum, ${profile.user.name}`} 
        description="Here is your current donation eligibility and matches in your region."
        action={
          <div className="flex items-center gap-3 bg-white dark:bg-slate-900 px-4 py-2 border rounded-xl shadow-sm">
            <span className="text-sm font-semibold text-muted-foreground">Availability Mode:</span>
            <button
              onClick={handleToggleAvailability}
              disabled={updatingAvailability}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                profile.isAvailable ? 'bg-red-600' : 'bg-slate-200 dark:bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  profile.isAvailable ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
            <span className={`text-xs font-bold ${profile.isAvailable ? 'text-red-600' : 'text-slate-400'}`}>
              {profile.isAvailable ? 'AVAILABLE' : 'OFFLINE'}
            </span>
          </div>
        }
      />

      {/* Grid: Profile Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Blood Group */}
        <div className="bg-white dark:bg-slate-900 border rounded-xl p-6 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-red-50 dark:bg-red-950 flex items-center justify-center text-red-600">
            <Heart className="h-6 w-6 fill-current" />
          </div>
          <div>
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Blood Group</span>
            <BloodGroupBadge group={profile.bloodGroup} className="mt-1" />
          </div>
        </div>

        {/* Eligibility Card */}
        <div className="bg-white dark:bg-slate-900 border rounded-xl p-6 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-emerald-600">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Eligibility</span>
            <EligibilityBadge 
              isEligible={profile.isEligible} 
              daysRemaining={cooldownDaysLeft} 
              className="mt-1" 
            />
          </div>
        </div>

        {/* Total Donations */}
        <div className="bg-white dark:bg-slate-900 border rounded-xl p-6 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-600">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Total Donations</span>
            <span className="text-2xl font-black text-slate-800 dark:text-slate-100 block mt-0.5">
              {profile.totalDonations} units
            </span>
          </div>
        </div>

        {/* Location Info */}
        <div className="bg-white dark:bg-slate-900 border rounded-xl p-6 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-orange-50 dark:bg-orange-950 flex items-center justify-center text-orange-600">
            <MapPin className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Location</span>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-100 block mt-0.5 truncate">
              {profile.area}, {profile.city}
            </span>
          </div>
        </div>
      </div>

      {/* Main Panel: Matching Requests */}
      <div className="bg-white dark:bg-slate-900 border rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5 text-red-600" />
          Active Matching Requests
        </h3>

        {!profile.isAvailable ? (
          <EmptyState
            icon={Activity}
            title="Availability is Offline"
            description="Toggle your availability status to 'AVAILABLE' in the header to receive match requests and appear in coordinator queues."
          />
        ) : !profile.isEligible ? (
          <EmptyState
            icon={Calendar}
            title="In Cooldown Period"
            description={`You recently donated blood! Please wait another ${cooldownDaysLeft} days before you become eligible for matching requests again.`}
          />
        ) : activeRequests.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="No Active Matches"
            description={`Great! There are currently no active emergency blood requests matching your type in ${profile.city}. We will notify you if a match occurs.`}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeRequests.map((request) => (
              <div 
                key={request.id} 
                className="border rounded-xl p-5 hover:border-red-200 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <BloodGroupBadge group={request.bloodGroup} />
                    <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded uppercase tracking-wider ${
                      request.urgency === 'CRITICAL' 
                        ? 'bg-red-100 text-red-800' 
                        : request.urgency === 'URGENT' 
                          ? 'bg-orange-100 text-orange-800' 
                          : 'bg-slate-100 text-slate-800'
                    }`}>
                      {request.urgency}
                    </span>
                  </div>

                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
                    {request.hospitalName}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                    <MapPin className="h-3.5 w-3.5" />
                    {request.hospitalArea}, {request.hospitalCity}
                  </p>
                  <p className="text-xs text-slate-500 line-clamp-2 bg-muted/20 p-2 rounded-lg mb-4">
                    Units Needed: <span className="font-semibold">{request.unitsNeeded}</span>
                  </p>
                </div>

                <Link 
                  href="/donor/requests"
                  className="w-full text-center bg-red-50 hover:bg-red-100 text-red-600 font-bold py-2 rounded-lg text-xs transition-colors"
                >
                  View Consent Request
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
