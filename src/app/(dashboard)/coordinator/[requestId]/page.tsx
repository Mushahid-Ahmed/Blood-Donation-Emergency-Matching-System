"use client";

import React, { useState, useEffect } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import BloodGroupBadge from '@/components/shared/BloodGroupBadge';
import EmptyState from '@/components/shared/EmptyState';
import { formatBloodGroup } from '@/lib/blood-compatibility';
import { 
  Users, 
  MapPin, 
  Sparkles, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Phone, 
  Mail, 
  MessageSquare,
  ChevronDown,
  Loader2,
  Calendar
} from 'lucide-react';

interface DonorMatchItem {
  id: string;
  matchScore: number;
  consentStatus: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  fulfillmentStatus: 'NOTIFIED' | 'CONTACTED' | 'COMMITTED' | 'DONATED' | 'NO_SHOW' | 'CANCELLED';
  noShowRiskScore: number | null;
  coordinatorNotes: string | null;
  donor: {
    id: string;
    bloodGroup: any;
    city: string;
    area: string;
    totalDonations: number;
    user: {
      name: string;
      email: string;
      phone: string;
    };
  };
}

export default function FulfillmentTrackingPage({
  params,
}: {
  params: { requestId: string };
}) {
  const { requestId } = params;

  const [request, setRequest] = useState<any>(null);
  const [matches, setMatches] = useState<DonorMatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [matchingLoading, setMatchingLoading] = useState(false);
  const [riskLoadingId, setRiskLoadingId] = useState<string | null>(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Note entry local states
  const [activeNoteMatchId, setActiveNoteMatchId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');

  const fetchDetails = async () => {
    try {
      const res = await fetch(`/api/requests/${requestId}`);
      if (res.ok) {
        const data = await res.json();
        setRequest(data);
        setMatches(data.donorMatches || []);
      } else {
        setError('Failed to fetch tracking details.');
      }
    } catch (err) {
      console.error('Failed to load tracking view:', err);
      setError('Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [requestId]);

  const handleReRunMatching = async () => {
    setMatchingLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/requests/${requestId}/match`, {
        method: 'POST',
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to trigger matching engine.');
      }

      await fetchDetails();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setMatchingLoading(false);
    }
  };

  const handleAnalyzeRisk = async (matchId: string) => {
    setRiskLoadingId(matchId);
    try {
      const res = await fetch('/api/ai/no-show-risk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId }),
      });

      if (res.ok) {
        await fetchDetails();
      }
    } catch (err) {
      console.error('Failed to evaluate risk score:', err);
    } finally {
      setRiskLoadingId(null);
    }
  };

  const handleUpdateStatus = async (matchId: string, status: string, note?: string) => {
    setStatusUpdatingId(matchId);
    try {
      const res = await fetch(`/api/matches/${matchId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, note }),
      });

      if (res.ok) {
        await fetchDetails();
        setActiveNoteMatchId(null);
        setNoteText('');
      }
    } catch (err) {
      console.error('Failed to update match status:', err);
    } finally {
      setStatusUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error && !request) {
    return (
      <div className="text-center p-8 bg-white border rounded-xl shadow-sm">
        <p className="text-red-500 font-semibold">{error}</p>
      </div>
    );
  }

  const progressPercentage = Math.min((request.unitsReceived / request.unitsNeeded) * 100, 100);

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Fulfillment Tracker" 
        description={`Track matches for ${request.hospitalName} (${formatBloodGroup(request.bloodGroup)} Request)`}
        action={
          <button
            onClick={handleReRunMatching}
            disabled={matchingLoading}
            className="border hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold py-2 px-4 rounded-xl text-sm flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            {matchingLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh Match Queue
          </button>
        }
      />

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm font-semibold text-red-700 dark:bg-red-950/20 dark:border-red-900/50 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Grid: Case Details & Progress */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Progress Card */}
        <div className="bg-white dark:bg-slate-900 border rounded-xl p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
              Units Collected
            </span>
            <span className="text-3xl font-black text-slate-900 dark:text-slate-100 mt-1 block">
              {request.unitsReceived} / {request.unitsNeeded} Bottles
            </span>
          </div>

          <div className="w-full bg-slate-100 dark:bg-slate-850 rounded-full h-3 overflow-hidden">
            <div 
              className="bg-green-600 h-3 rounded-full transition-all duration-500" 
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          <div className="text-[10px] font-semibold text-muted-foreground leading-normal border-t pt-3">
            Status: <span className="font-extrabold text-slate-800 dark:text-slate-200">{request.status}</span> · City: {request.hospitalCity}
          </div>
        </div>

        {/* Medical Context */}
        <div className="md:col-span-2 bg-white dark:bg-slate-900 border rounded-xl p-6 shadow-sm space-y-2">
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Medical Diagnosis Case Details
          </h4>
          <p className="text-sm text-slate-700 dark:text-slate-350 italic">
            "{request.description}"
          </p>
          <div className="text-xs text-slate-500 pt-2 flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            Hospital: <span className="font-bold">{request.hospitalName}</span> ({request.hospitalArea})
          </div>
        </div>
      </div>

      {/* Matches List */}
      <div className="bg-white dark:bg-slate-900 border rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Matched Donor List ({matches.length})
        </h3>

        {matches.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No matches found"
            description="The matching engine has not generated donor lists for this request yet. Click the 'Refresh Match Queue' button above to find compatible available donors."
          />
        ) : (
          <div className="space-y-4">
            {matches.map((item) => {
              const hasConsent = item.consentStatus === 'ACCEPTED';
              const isPending = item.consentStatus === 'PENDING';
              const isDeclined = item.consentStatus === 'DECLINED';
              
              // No-show risk scoring class
              const riskText = item.noShowRiskScore !== null
                ? `${Math.round(item.noShowRiskScore * 100)}%`
                : 'Analyze';

              const riskBadgeClass = item.noShowRiskScore === null
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                : item.noShowRiskScore > 0.4
                  ? 'bg-red-100 text-red-800'
                  : item.noShowRiskScore > 0.2
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-green-100 text-green-800';

              return (
                <div 
                  key={item.id} 
                  className={`border rounded-xl p-5 transition-all flex flex-col md:flex-row md:items-start md:justify-between gap-5 bg-card ${
                    hasConsent ? 'border-l-4 border-l-green-600' : isDeclined ? 'opacity-60 bg-muted/10' : ''
                  }`}
                >
                  {/* Donor details */}
                  <div className="space-y-2 flex-grow">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                        {item.donor.user.name}
                      </h4>
                      <BloodGroupBadge group={item.donor.bloodGroup} size="sm" />
                      
                      <span className={`px-2 py-0.5 text-[10px] font-black rounded uppercase tracking-wider ${
                        hasConsent 
                          ? 'bg-green-100 text-green-800' 
                          : isDeclined 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-yellow-100 text-yellow-800 animate-pulse'
                      }`}>
                        {item.consentStatus}
                      </span>
                    </div>

                    <div className="text-xs text-muted-foreground flex items-center gap-4 flex-wrap">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {item.donor.area}, {item.donor.city}
                      </span>
                      <span>Total Donations: {item.donor.totalDonations} units</span>
                    </div>

                    {/* Revealed Contacts (Consent Gated) */}
                    {hasConsent ? (
                      <div className="mt-3 p-3.5 bg-green-50/20 border border-green-100 rounded-xl space-y-1.5 text-xs max-w-md">
                        <div className="font-extrabold text-green-800 mb-1 flex items-center gap-1">
                          <CheckCircle className="h-4.5 w-4.5 fill-current" /> Contact Shared
                        </div>
                        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-350">
                          <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span>Phone: <a href={`tel:${item.donor.user.phone}`} className="font-bold text-slate-800 dark:text-slate-200 hover:underline">{item.donor.user.phone}</a></span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-350">
                          <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span>Email: <span className="font-semibold">{item.donor.user.email}</span></span>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 text-[10px] text-yellow-600 font-bold bg-yellow-50 dark:bg-yellow-950/20 px-2 py-1.5 rounded-lg w-fit">
                        ⚠ Phone number hidden. Awaiting donor consent.
                      </div>
                    )}

                    {/* Coordinator notes view */}
                    {item.coordinatorNotes && (
                      <p className="text-xs text-slate-500 leading-normal italic bg-muted/10 p-2 rounded">
                        Note: "{item.coordinatorNotes}"
                      </p>
                    )}
                  </div>

                  {/* AI Risk Score, Status Update drop down */}
                  <div className="flex flex-row md:flex-col lg:flex-row items-center gap-3 shrink-0 self-center md:self-auto">
                    {/* AI Risk Column */}
                    <div className="text-center shrink-0">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                        AI Risk Score
                      </span>
                      <button
                        onClick={() => handleAnalyzeRisk(item.id)}
                        disabled={riskLoadingId !== null}
                        className={`px-3 py-1 text-xs font-bold rounded-lg border transition-colors flex items-center gap-1 ${riskBadgeClass}`}
                      >
                        {riskLoadingId === item.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <>
                            <Sparkles className="h-3.5 w-3.5" />
                            {riskText}
                          </>
                        )}
                      </button>
                    </div>

                    {/* Status update selector */}
                    {hasConsent && (
                      <div className="relative">
                        <div className="flex items-center gap-1.5">
                          <select
                            value={item.fulfillmentStatus}
                            onChange={(e) => {
                              const nextStatus = e.target.value;
                              if (nextStatus === 'DONATED' || nextStatus === 'NO_SHOW') {
                                // Prompt notes textbox modal
                                setActiveNoteMatchId(item.id);
                                setNoteText('');
                              } else {
                                handleUpdateStatus(item.id, nextStatus);
                              }
                            }}
                            className="bg-slate-50 border rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer"
                          >
                            <option value="CONTACTED">Contacted</option>
                            <option value="COMMITTED">Committed</option>
                            <option value="DONATED">Donated</option>
                            <option value="NO_SHOW">No Show</option>
                            <option value="CANCELLED">Cancelled</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Note input popup modal */}
                  {activeNoteMatchId === item.id && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center">
                      <div className="fixed inset-0 bg-black/55 backdrop-blur-sm" onClick={() => setActiveNoteMatchId(null)} />
                      <div className="relative z-50 w-full max-w-sm scale-100 rounded-xl border bg-card p-5 shadow-xl text-card-foreground">
                        <h4 className="text-sm font-bold border-b pb-2 mb-3">Add Tracking Notes</h4>
                        <p className="text-xs text-muted-foreground mb-3 leading-normal">
                          Please enter donation details (e.g. 1 unit logged, blood bank slip #2031, no-show comments).
                        </p>
                        <textarea
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                          placeholder="Donation complete. Blood bag #1032 verified."
                          rows={3}
                          className="w-full px-3 py-2 border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-red-500 mb-4"
                        />
                        <div className="flex justify-end gap-2 text-xs font-semibold">
                          <button 
                            onClick={() => setActiveNoteMatchId(null)} 
                            className="border hover:bg-slate-50 px-3 py-1.5 rounded-lg"
                          >
                            Cancel
                          </button>
                          <button 
                            onClick={() => handleUpdateStatus(item.id, 'DONATED', noteText)} 
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg"
                          >
                            Confirm Donation
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
