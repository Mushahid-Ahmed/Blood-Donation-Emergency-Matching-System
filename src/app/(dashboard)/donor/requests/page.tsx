"use client";

import React, { useState, useEffect } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import BloodGroupBadge from '@/components/shared/BloodGroupBadge';
import EmptyState from '@/components/shared/EmptyState';
import { HeartHandshake, MapPin, Check, X, Phone, User, Loader2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

interface MatchRequest {
  id: string;
  matchScore: number;
  consentStatus: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  fulfillmentStatus: string;
  requestId: string;
  request: {
    bloodGroup: any;
    unitsNeeded: number;
    hospitalName: string;
    hospitalCity: string;
    hospitalArea: string;
    urgency: string;
    description: string;
    contactName: string; // Will show "Protected" unless accepted
    contactPhone: string; // Will show "Protected" unless accepted
  };
}

export default function ConsentRequestsPage() {
  const [matches, setMatches] = useState<MatchRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);
  
  const searchParams = useSearchParams();
  const highlightedMatchId = searchParams.get('matchId');

  const fetchMatches = async () => {
    try {
      const sessionRes = await fetch('/api/auth/session');
      const session = await sessionRes.json();
      if (!session?.user?.id) return;

      const profileRes = await fetch(`/api/donors/${session.user.id}`);
      if (profileRes.ok) {
        const donorData = await profileRes.json();
        
        // Fetch all active requests to retrieve match configurations
        const reqsRes = await fetch('/api/requests');
        if (reqsRes.ok) {
          const reqsData = await reqsRes.json();
          
          // Map matching requests having match entries for this donor
          const list: MatchRequest[] = [];
          
          for (const req of reqsData) {
            // Find request details with matches
            const detailRes = await fetch(`/api/requests/${req.id}`);
            if (detailRes.ok) {
              const detailData = await detailRes.json();
              if (detailData.myMatch) {
                list.push({
                  id: detailData.myMatch.id,
                  matchScore: detailData.myMatch.matchScore,
                  consentStatus: detailData.myMatch.consentStatus,
                  fulfillmentStatus: detailData.myMatch.fulfillmentStatus,
                  requestId: detailData.id,
                  request: {
                    bloodGroup: detailData.bloodGroup,
                    unitsNeeded: detailData.unitsNeeded,
                    hospitalName: detailData.hospitalName,
                    hospitalCity: detailData.hospitalCity,
                    hospitalArea: detailData.hospitalArea,
                    urgency: detailData.urgency,
                    description: detailData.description,
                    contactName: detailData.contactName,
                    contactPhone: detailData.contactPhone,
                  }
                });
              }
            }
          }
          
          setMatches(list);
        }
      }
    } catch (err) {
      console.error('Failed to load consent matches:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  const handleConsent = async (matchId: string, action: 'ACCEPT' | 'DECLINE') => {
    setActioningId(matchId);
    try {
      const res = await fetch(`/api/matches/${matchId}/consent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (res.ok) {
        // Reload list to update status and reveal details if accepted
        await fetchMatches();
      }
    } catch (err) {
      console.error('Failed to save consent response:', err);
    } finally {
      setActioningId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Pending matches
  const pendingMatches = matches.filter(m => m.consentStatus === 'PENDING');
  // Accepted matches (revealing contacts)
  const acceptedMatches = matches.filter(m => m.consentStatus === 'ACCEPTED');

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Consent Requests" 
        description="Emergency cases that require your compatible blood group. Your contact info is private until you accept."
      />

      {/* 1. Pending Matching Queue */}
      <div className="bg-white dark:bg-slate-900 border rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 mb-4 flex items-center gap-2">
          <HeartHandshake className="h-5 w-5 text-red-600" />
          Pending Consent Requests
        </h3>

        {pendingMatches.length === 0 ? (
          <EmptyState
            icon={HeartHandshake}
            title="All caught up!"
            description="You don't have any pending emergency requests awaiting your consent. We will notify you if a matching request gets verified."
          />
        ) : (
          <div className="space-y-4">
            {pendingMatches.map((item) => {
              const isHighlighted = item.id === highlightedMatchId;
              
              return (
                <div 
                  key={item.id} 
                  className={`border rounded-xl p-5 hover:border-red-200 transition-all flex flex-col md:flex-row md:items-center md:justify-between gap-4 ${
                    isHighlighted ? 'border-red-500 ring-2 ring-red-500/10 bg-red-50/5' : ''
                  }`}
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <BloodGroupBadge group={item.request.bloodGroup} />
                      <span className={`px-2.5 py-0.5 text-[10px] font-black rounded uppercase tracking-wider ${
                        item.request.urgency === 'CRITICAL' 
                          ? 'bg-red-100 text-red-800' 
                          : item.request.urgency === 'URGENT' 
                            ? 'bg-orange-100 text-orange-800' 
                            : 'bg-slate-100 text-slate-800'
                      }`}>
                        {item.request.urgency} Urgency
                      </span>
                      <span className="text-xs font-semibold text-muted-foreground">
                        Match Score: {item.matchScore} pts
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">
                      {item.request.hospitalName}
                    </h4>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {item.request.hospitalArea}, {item.request.hospitalCity} (Required Units: {item.request.unitsNeeded})
                    </p>
                    <p className="text-xs text-slate-500 bg-muted/30 p-3 rounded-lg leading-relaxed max-w-2xl italic">
                      "{item.request.description}"
                    </p>
                    <p className="text-[11px] text-yellow-600 font-bold bg-yellow-50 dark:bg-yellow-950/20 px-2 py-1 rounded w-fit">
                      ⚠ Contact name and phone number are hidden to protect privacy until you accept.
                    </p>
                  </div>

                  <div className="flex md:flex-col lg:flex-row gap-2 shrink-0">
                    <button
                      onClick={() => handleConsent(item.id, 'DECLINE')}
                      disabled={actioningId !== null}
                      className="flex-1 min-w-[100px] border hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-1 transition-colors disabled:opacity-50"
                    >
                      <X className="h-3.5 w-3.5" /> Decline
                    </button>
                    <button
                      onClick={() => handleConsent(item.id, 'ACCEPT')}
                      disabled={actioningId !== null}
                      className="flex-1 min-w-[100px] bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg text-xs flex items-center justify-center gap-1 transition-all shadow-md hover:shadow-red-500/10 disabled:opacity-50"
                    >
                      {actioningId === item.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Check className="h-3.5 w-3.5" />
                      )}
                      Accept Consent
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Accepted Matches List (Revealed Contacts) */}
      <div className="bg-white dark:bg-slate-900 border rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 mb-4 flex items-center gap-2">
          <Check className="h-5 w-5 text-green-600" />
          Accepted Requests & Coordinator Details
        </h3>

        {acceptedMatches.length === 0 ? (
          <EmptyState
            icon={HeartHandshake}
            title="No accepted requests yet"
            description="When you accept an emergency consent request, the hospital attendant's and coordinator's contact details will be displayed here so you can coordinate."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {acceptedMatches.map((item) => (
              <div key={item.id} className="border rounded-xl p-5 bg-green-50/5 border-green-100 hover:border-green-200 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <BloodGroupBadge group={item.request.bloodGroup} />
                    <span className="text-xs font-semibold text-green-600 bg-green-50 px-2.5 py-0.5 rounded border border-green-100">
                      Consent Shared
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">
                    {item.request.hospitalName}
                  </h4>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mb-3">
                    <MapPin className="h-3.5 w-3.5" />
                    {item.request.hospitalArea}, {item.request.hospitalCity}
                  </p>

                  <div className="bg-white dark:bg-slate-800 p-4 border rounded-lg space-y-2 text-xs">
                    <p className="font-extrabold text-slate-800 dark:text-slate-100 mb-2 border-b pb-1">
                      Attendant Contact Information
                    </p>
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>Name: <span className="font-bold text-slate-800 dark:text-slate-200">{item.request.contactName}</span></span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>Phone: <a href={`tel:${item.request.contactPhone}`} className="font-bold text-red-600 hover:underline">{item.request.contactPhone}</a></span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 text-[10px] text-muted-foreground text-center bg-muted/20 p-2 rounded">
                  Fulfillment Status: <span className="font-bold text-slate-800 dark:text-slate-200">{item.fulfillmentStatus}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
