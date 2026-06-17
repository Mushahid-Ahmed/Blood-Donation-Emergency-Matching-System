"use client";

import React, { useState, useEffect } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import RequestStatusBadge from '@/components/shared/RequestStatusBadge';
import BloodGroupBadge from '@/components/shared/BloodGroupBadge';
import EmptyState from '@/components/shared/EmptyState';
import { ClipboardList, MapPin, Calendar, Clock, AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface RequestDetail {
  id: string;
  bloodGroup: any;
  unitsNeeded: number;
  unitsReceived: number;
  hospitalName: string;
  hospitalCity: string;
  hospitalArea: string;
  urgency: string;
  description: string;
  status: any;
  rejectionReason: string | null;
  aiUrgencyLabel: string | null;
  createdAt: string;
}

export default function MyRequestsPage() {
  const [requests, setRequests] = useState<RequestDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const res = await fetch('/api/requests');
        if (res.ok) {
          const data = await res.json();
          setRequests(data);
        }
      } catch (err) {
        console.error('Failed to load attendant requests:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
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
        title="My Requests" 
        description="Track the real-time matching, verification status, and fulfillment progress of your submitted blood requests."
      />

      {requests.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No requests yet"
          description="You haven't submitted any emergency blood requests. Once submitted, they will appear here with active tracking parameters."
          action={
            <Link
              href="/attendant/new-request"
              className="bg-primary hover:bg-primary/95 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-all"
            >
              Submit Request
            </Link>
          }
        />
      ) : (
        <div className="space-y-6">
          {requests.map((req) => (
            <div key={req.id} className="bg-white dark:bg-slate-900 border rounded-xl shadow-sm p-6 space-y-4 hover:border-slate-300 transition-all">
              {/* Header block */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b pb-4">
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
                  
                  {/* AI suggestion label */}
                  {req.aiUrgencyLabel && req.aiUrgencyLabel !== req.urgency && (
                    <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                      ⭐ AI classified: {req.aiUrgencyLabel}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <RequestStatusBadge status={req.status} />
                </div>
              </div>

              {/* Grid Content */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Details Column */}
                <div className="md:col-span-2 space-y-3">
                  <div>
                    <h4 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                      {req.hospitalName}
                    </h4>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                      {req.hospitalArea}, {req.hospitalCity}
                    </p>
                  </div>
                  
                  <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-xl text-xs space-y-2">
                    <p className="font-bold text-slate-700 dark:text-slate-300">Case Context Details</p>
                    <p className="text-slate-600 dark:text-slate-400 italic">"{req.description}"</p>
                  </div>

                  {/* Rejection Notification */}
                  {req.status === 'REJECTED' && req.rejectionReason && (
                    <div className="bg-red-50 border border-red-100 text-red-800 text-xs p-3 rounded-lg flex items-start gap-2">
                      <AlertCircle className="h-4.5 w-4.5 text-red-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-extrabold">Rejection Reason:</span> {req.rejectionReason}
                      </div>
                    </div>
                  )}
                </div>

                {/* Progress Column */}
                <div className="bg-muted/10 border p-5 rounded-xl flex flex-col justify-center space-y-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                      Donation Progress
                    </span>
                    <span className="text-2xl font-black text-slate-900 dark:text-slate-50 mt-0.5 block">
                      {req.unitsReceived} / {req.unitsNeeded} Units
                    </span>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                    <div 
                      className="bg-green-600 h-2.5 rounded-full transition-all duration-500" 
                      style={{ width: `${Math.min((req.unitsReceived / req.unitsNeeded) * 100, 100)}%` }}
                    />
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Submitted: {new Date(req.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
