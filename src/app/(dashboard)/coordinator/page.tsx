"use client";

import React, { useState, useEffect } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import BloodGroupBadge from '@/components/shared/BloodGroupBadge';
import RequestStatusBadge from '@/components/shared/RequestStatusBadge';
import EmptyState from '@/components/shared/EmptyState';
import { Activity, MapPin, Users, HeartHandshake, CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface ActiveRequest {
  id: string;
  bloodGroup: any;
  unitsNeeded: number;
  unitsReceived: number;
  hospitalName: string;
  hospitalCity: string;
  hospitalArea: string;
  urgency: string;
  status: any;
  createdAt: string;
  _count?: {
    donorMatches: number;
  };
}

export default function CoordinatorDashboard() {
  const [requests, setRequests] = useState<ActiveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActive = async () => {
      try {
        const res = await fetch('/api/requests?status=ACTIVE');
        if (res.ok) {
          const data = await res.json();
          setRequests(data);
        }
      } catch (err) {
        console.error('Failed to load coordinator requests:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchActive();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Volunteer Coordinator Board" 
        description="Monitor active requests, coordinate with committed donors, and manage donation completions."
      />

      <div className="bg-white dark:bg-slate-900 border rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5 text-red-600" />
          Active Emergency Requests ({requests.length})
        </h3>

        {requests.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="No active cases"
            description="There are currently no active emergency requests in the matching phase. Check back when a request gets verified."
          />
        ) : (
          <div className="space-y-4">
            {requests.map((req) => {
              // Fetch detailed matches count if needed (or mock for now using basic list length)
              const unitsProgress = Math.min((req.unitsReceived / req.unitsNeeded) * 100, 100);
              
              return (
                <div 
                  key={req.id} 
                  className="border rounded-xl p-5 hover:border-red-200 transition-all flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 hover:shadow-md bg-card"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <BloodGroupBadge group={req.bloodGroup} />
                      <span className={`px-2.5 py-0.5 text-[10px] font-black rounded uppercase tracking-wider ${
                        req.urgency === 'CRITICAL' 
                          ? 'bg-red-100 text-red-800 animate-pulse' 
                          : req.urgency === 'URGENT' 
                            ? 'bg-orange-100 text-orange-800' 
                            : 'bg-slate-100 text-slate-800'
                      }`}>
                        {req.urgency} Urgency
                      </span>
                      <RequestStatusBadge status={req.status} />
                    </div>

                    <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      {req.hospitalName}
                    </h4>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                      {req.hospitalArea}, {req.hospitalCity}
                    </p>
                  </div>

                  {/* Progress panel */}
                  <div className="w-full lg:w-48 space-y-1.5 shrink-0">
                    <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-350">
                      <span>Donations</span>
                      <span>{req.unitsReceived} / {req.unitsNeeded} units</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${unitsProgress}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <Link
                      href={`/coordinator/${req.id}`}
                      className="bg-primary hover:bg-primary/95 text-white font-bold py-2 px-4 rounded-lg text-xs flex items-center gap-1.5 transition-all shadow-md shadow-primary/5 hover:translate-x-0.5"
                    >
                      Track Matches
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
