"use client";

import React, { useState, useEffect } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import BloodGroupBadge from '@/components/shared/BloodGroupBadge';
import EmptyState from '@/components/shared/EmptyState';
import { ShieldAlert, MapPin, Clock, ArrowRight, Sparkles, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface PendingRequest {
  id: string;
  bloodGroup: any;
  unitsNeeded: number;
  hospitalName: string;
  hospitalCity: string;
  hospitalArea: string;
  urgency: string;
  description: string;
  aiUrgencyLabel: string | null;
  createdAt: string;
}

export default function VerifierQueuePage() {
  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQueue = async () => {
      try {
        const res = await fetch('/api/requests?status=PENDING_VERIFICATION');
        if (res.ok) {
          const data = await res.json();
          setRequests(data);
        }
      } catch (err) {
        console.error('Failed to load verifier queue:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchQueue();
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
        title="Verification Queue" 
        description="Review incoming emergency blood requests, verify hospital legitimacy, and initiate donor matching."
      />

      <div className="bg-white dark:bg-slate-900 border rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 mb-4 flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-red-600" />
          Pending Verification Queue ({requests.length})
        </h3>

        {requests.length === 0 ? (
          <EmptyState
            icon={ShieldAlert}
            title="Queue is empty!"
            description="Good job! All emergency blood requests have been reviewed. Awaiting new attendant submissions."
          />
        ) : (
          <div className="space-y-4">
            {requests.map((req) => (
              <div 
                key={req.id} 
                className={`border rounded-xl p-5 transition-all flex flex-col md:flex-row md:items-center md:justify-between gap-4 hover:border-red-300 hover:shadow-md ${
                  req.urgency === 'CRITICAL' ? 'border-l-4 border-l-red-600' : ''
                }`}
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <BloodGroupBadge group={req.bloodGroup} />
                    <span className={`px-2.5 py-0.5 text-[10px] font-black rounded uppercase tracking-wider ${
                      req.urgency === 'CRITICAL' 
                        ? 'bg-red-100 text-red-800' 
                        : req.urgency === 'URGENT' 
                          ? 'bg-orange-100 text-orange-800' 
                          : 'bg-slate-100 text-slate-800'
                    }`}>
                      {req.urgency} Urgency
                    </span>

                    {/* AI Tag */}
                    {req.aiUrgencyLabel && (
                      <span className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 text-indigo-700 dark:text-indigo-400 text-[10px] font-extrabold px-2 py-0.5 rounded flex items-center gap-0.5">
                        <Sparkles className="h-3 w-3" /> AI suggested: {req.aiUrgencyLabel}
                      </span>
                    )}
                  </div>

                  <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {req.hospitalName}
                  </h4>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                    {req.hospitalArea}, {req.hospitalCity} (Requested: {req.unitsNeeded} units)
                  </p>
                  <p className="text-xs text-slate-500 line-clamp-1 italic bg-muted/10 p-2 rounded">
                    "{req.description}"
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right text-xs text-muted-foreground hidden lg:block">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  <Link
                    href={`/verifier/${req.id}`}
                    className="bg-primary hover:bg-primary/95 text-white font-bold py-2 px-4 rounded-lg text-xs flex items-center gap-1.5 transition-all shadow-md shadow-primary/5 hover:translate-x-0.5"
                  >
                    Review Request
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
