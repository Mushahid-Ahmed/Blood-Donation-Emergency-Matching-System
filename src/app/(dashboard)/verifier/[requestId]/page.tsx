"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/shared/PageHeader';
import BloodGroupBadge from '@/components/shared/BloodGroupBadge';
import { Check, X, Phone, User, Loader2, ShieldAlert, Sparkles, MessageSquare } from 'lucide-react';

export default function RequestReviewPage({
  params,
}: {
  params: { requestId: string };
}) {
  const router = useRouter();
  const { requestId } = params;

  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState(false);
  const [note, setNote] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRequest = async () => {
      try {
        const res = await fetch(`/api/requests/${requestId}`);
        if (res.ok) {
          const data = await res.json();
          setRequest(data);
        } else {
          setError('Failed to fetch request details.');
        }
      } catch (err) {
        console.error('Failed to load request:', err);
        setError('Something went wrong.');
      } finally {
        setLoading(false);
      }
    };

    fetchRequest();
  }, [requestId]);

  const handleVerify = async () => {
    setActioning(true);
    setError(null);
    try {
      const res = await fetch(`/api/requests/${requestId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'VERIFY',
          note,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to verify request.');
      }

      router.push('/verifier');
    } catch (err: any) {
      setError(err.message);
      setActioning(false);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      setError('Rejection reason is required.');
      return;
    }

    setActioning(true);
    setError(null);
    try {
      const res = await fetch(`/api/requests/${requestId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'REJECT',
          rejectionReason,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to reject request.');
      }

      router.push('/verifier');
    } catch (err: any) {
      setError(err.message);
      setActioning(false);
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

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader 
        title="Review Blood Request" 
        description={`Request ID: ${request.id.slice(-8).toUpperCase()} · Submitted: ${new Date(request.createdAt).toLocaleString()}`}
      />

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm font-semibold text-red-700 dark:bg-red-950/20 dark:border-red-900/50 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Grid: Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Patient and Hospital Details */}
        <div className="md:col-span-2 space-y-6">
          {/* Main Info */}
          <div className="bg-white dark:bg-slate-900 border rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 border-b pb-3">
              <ShieldAlert className="h-5 w-5 text-red-600" />
              Patient & Hospital Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Required Type</span>
                <div className="mt-1">
                  <BloodGroupBadge group={request.bloodGroup} />
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Units Requested</span>
                <span className="text-lg font-black text-slate-800 dark:text-slate-200 block mt-0.5">{request.unitsNeeded} Units</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Hospital name</span>
                <span className="text-sm font-bold text-slate-850 dark:text-slate-200 block mt-0.5">{request.hospitalName}</span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Location (Area, City)</span>
                <span className="text-sm font-semibold text-slate-850 dark:text-slate-200 block mt-0.5">{request.hospitalArea}, {request.hospitalCity}</span>
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Urgency Level</span>
              <span className={`inline-block px-2.5 py-0.5 text-xs font-bold rounded mt-1.5 uppercase ${
                request.urgency === 'CRITICAL' 
                  ? 'bg-red-100 text-red-800' 
                  : request.urgency === 'URGENT' 
                    ? 'bg-orange-100 text-orange-800' 
                    : 'bg-slate-100 text-slate-800'
              }`}>
                {request.urgency}
              </span>
            </div>

            {/* Description / Diagnosis */}
            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Description / Notes</span>
              <p className="text-sm text-slate-700 dark:text-slate-300 bg-muted/20 p-4 border rounded-xl mt-1.5 leading-relaxed italic">
                "{request.description}"
              </p>
            </div>
          </div>

          {/* Verification Actions Panel */}
          <div className="bg-white dark:bg-slate-900 border rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 border-b pb-3">
              <MessageSquare className="h-5 w-5 text-primary" />
              Reviewer Decision Panel
            </h3>

            {!showRejectForm ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    Verification Notes (Optional)
                  </label>
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="e.g. Confirmed with room 302, patient admitted."
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 text-sm"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowRejectForm(true)}
                    disabled={actioning}
                    className="flex-1 border border-red-200 hover:bg-red-50/50 text-red-600 font-bold py-2.5 px-4 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <X className="h-4 w-4" /> Reject Request
                  </button>
                  <button
                    onClick={handleVerify}
                    disabled={actioning}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-4 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-green-500/10 disabled:opacity-50"
                  >
                    {actioning ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    Verify & Match Donors
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleReject} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    Rejection Reason
                  </label>
                  <textarea
                    required
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Provide a reason (e.g. Duplicate submission, fake contact details, case already closed)."
                    rows={3}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 text-sm"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowRejectForm(false)}
                    className="flex-1 border hover:bg-slate-50 dark:hover:bg-slate-850 font-bold py-2 px-4 rounded-lg text-xs text-slate-600 dark:text-slate-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actioning}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all shadow-md"
                  >
                    {actioning ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                    Confirm Rejection
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Attendant & AI Suggestions sidebar */}
        <div className="space-y-6">
          {/* Attendant info */}
          <div className="bg-white dark:bg-slate-900 border rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 border-b pb-2">
              Attendant Information
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <User className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>Submitted by: <span className="font-bold text-slate-800 dark:text-slate-200">{request.attendant.name}</span></span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>Phone: <a href={`tel:${request.attendant.phone}`} className="font-bold text-red-600 hover:underline">{request.attendant.phone || 'N/A'}</a></span>
              </div>
            </div>
          </div>

          {/* AI Helper Info */}
          {request.aiUrgencyLabel && (
            <div className="bg-gradient-to-br from-indigo-50 to-rose-50/30 border border-indigo-100 rounded-xl p-6 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-indigo-700 font-extrabold text-sm">
                <Sparkles className="h-5 w-5 fill-current" />
                AI Assistant Recommendation
              </div>

              <div className="text-xs text-slate-600 leading-relaxed">
                We analyzed the medical context description using our natural language urgency classifier model:
                <div className="mt-3 p-3 bg-white dark:bg-slate-800 border rounded-lg">
                  <div className="text-[10px] uppercase font-bold text-muted-foreground">Classified Urgency</div>
                  <div className="text-sm font-black text-indigo-600 mt-0.5">{request.aiUrgencyLabel}</div>
                </div>
                <p className="mt-3 text-[10px] text-indigo-500 font-semibold">
                  * Note: AI recommendations are advisory and never final. Hospital Verifier details override system decisions.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
