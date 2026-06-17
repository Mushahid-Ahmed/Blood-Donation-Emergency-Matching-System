"use client";

import React, { useState, useEffect } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import BloodGroupBadge from '@/components/shared/BloodGroupBadge';
import RequestStatusBadge from '@/components/shared/RequestStatusBadge';
import EmptyState from '@/components/shared/EmptyState';
import { ClipboardList, MapPin, Check, X, Ban, Loader2 } from 'lucide-react';

interface BloodRequestItem {
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
}

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<BloodRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);

  const fetchRequests = async () => {
    try {
      const res = await fetch('/api/requests');
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      }
    } catch (err) {
      console.error('Failed to load admin requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleVerifyOverride = async (requestId: string) => {
    setActioningId(requestId);
    try {
      const res = await fetch(`/api/requests/${requestId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'VERIFY', note: 'Admin verification override' }),
      });
      if (res.ok) await fetchRequests();
    } catch (err) {
      console.error('Failed to verify request:', err);
    } finally {
      setActioningId(null);
    }
  };

  const handleCloseOverride = async (requestId: string, status: 'FULFILLED' | 'EXPIRED') => {
    setActioningId(requestId);
    try {
      const res = await fetch(`/api/requests/${requestId}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) await fetchRequests();
    } catch (err) {
      console.error('Failed to close request:', err);
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

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Override Requests" 
        description="Monitor request pipelines, verify pending cases, and close expired requests manually."
      />

      <div className="bg-white dark:bg-slate-900 border rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 mb-4 flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-primary" />
          Active Pipeline Requests ({requests.length})
        </h3>

        {requests.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No requests in system"
            description="There are currently no active or pending requests logged in the database."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
              <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-800 dark:text-slate-300">
                <tr>
                  <th scope="col" className="px-6 py-3 font-bold rounded-l-lg">Date</th>
                  <th scope="col" className="px-6 py-3 font-bold">Blood Type</th>
                  <th scope="col" className="px-6 py-3 font-bold">Hospital Location</th>
                  <th scope="col" className="px-6 py-3 font-bold">Progress</th>
                  <th scope="col" className="px-6 py-3 font-bold">Status</th>
                  <th scope="col" className="px-6 py-3 font-bold rounded-r-lg text-right">Overrides</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-slate-800">
                {requests.map((record) => (
                  <tr key={record.id} className="bg-white dark:bg-slate-900 hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-slate-100">
                      {new Date(record.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4">
                      <BloodGroupBadge group={record.bloodGroup} size="sm" />
                    </td>
                    <td className="px-6 py-4 text-slate-800 dark:text-slate-300">
                      <div className="font-bold">{record.hospitalName}</div>
                      <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3" /> {record.hospitalArea}, {record.hospitalCity}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-extrabold text-slate-950 dark:text-slate-50">
                      {record.unitsReceived} / {record.unitsNeeded} units
                    </td>
                    <td className="px-6 py-4">
                      <RequestStatusBadge status={record.status} />
                    </td>
                    <td className="px-6 py-4 text-right shrink-0">
                      <div className="flex justify-end gap-1.5">
                        {record.status === 'PENDING_VERIFICATION' && (
                          <button
                            onClick={() => handleVerifyOverride(record.id)}
                            disabled={actioningId !== null}
                            className="bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-2.5 rounded text-[10px] flex items-center gap-1 transition-colors disabled:opacity-50"
                          >
                            <Check className="h-3 w-3" /> Verify
                          </button>
                        )}
                        {(record.status === 'ACTIVE' || record.status === 'VERIFIED') && (
                          <>
                            <button
                              onClick={() => handleCloseOverride(record.id, 'FULFILLED')}
                              disabled={actioningId !== null}
                              className="bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-2.5 rounded text-[10px] flex items-center gap-1 transition-colors disabled:opacity-50"
                            >
                              <Check className="h-3 w-3" /> Fulfill
                            </button>
                            <button
                              onClick={() => handleCloseOverride(record.id, 'EXPIRED')}
                              disabled={actioningId !== null}
                              className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-2.5 rounded text-[10px] flex items-center gap-1 transition-colors disabled:opacity-50"
                            >
                              <Ban className="h-3 w-3" /> Expire
                            </button>
                          </>
                        )}
                        {record.status !== 'PENDING_VERIFICATION' && record.status !== 'ACTIVE' && record.status !== 'VERIFIED' && (
                          <span className="text-muted-foreground text-xs italic">Closed</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
