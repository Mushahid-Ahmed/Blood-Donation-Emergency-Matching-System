"use client";

import React, { useState, useEffect } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import RequestStatusBadge from '@/components/shared/RequestStatusBadge';
import EmptyState from '@/components/shared/EmptyState';
import { ClipboardList, PlusCircle, Heart, CheckCircle, Clock, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface BloodRequestItem {
  id: string;
  bloodGroup: any;
  unitsNeeded: number;
  unitsReceived: number;
  hospitalName: string;
  urgency: string;
  status: any;
  createdAt: string;
}

export default function AttendantDashboard() {
  const [requests, setRequests] = useState<BloodRequestItem[]>([]);
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
        console.error('Failed to fetch attendant requests:', err);
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

  // Calculate statistics
  const totalRequested = requests.length;
  const activeCount = requests.filter(r => r.status === 'ACTIVE' || r.status === 'VERIFIED').length;
  const fulfilledCount = requests.filter(r => r.status === 'FULFILLED').length;
  const pendingCount = requests.filter(r => r.status === 'PENDING_VERIFICATION').length;

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Attendant Dashboard" 
        description="Submit emergency blood requests and monitor active donor matching in real-time."
        action={
          <Link
            href="/attendant/new-request"
            className="bg-primary hover:bg-primary/95 text-white font-bold py-2.5 px-4 rounded-xl flex items-center gap-2 shadow-md shadow-primary/10 transition-all text-sm"
          >
            <PlusCircle className="h-4.5 w-4.5" />
            Request Blood
          </Link>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900 border rounded-xl p-6 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-red-50 dark:bg-red-950 flex items-center justify-center text-red-600">
            <ClipboardList className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Total Requests</span>
            <span className="text-2xl font-black text-slate-800 dark:text-slate-100 block mt-0.5">{totalRequested}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border rounded-xl p-6 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-600">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Pending Verify</span>
            <span className="text-2xl font-black text-slate-800 dark:text-slate-100 block mt-0.5">{pendingCount}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border rounded-xl p-6 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-rose-50 dark:bg-rose-950 flex items-center justify-center text-rose-600">
            <Heart className="h-6 w-6 fill-current animate-pulse" />
          </div>
          <div>
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Active Matching</span>
            <span className="text-2xl font-black text-slate-800 dark:text-slate-100 block mt-0.5">{activeCount}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border rounded-xl p-6 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-green-50 dark:bg-green-950 flex items-center justify-center text-green-600">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Fulfilled</span>
            <span className="text-2xl font-black text-slate-800 dark:text-slate-100 block mt-0.5">{fulfilledCount}</span>
          </div>
        </div>
      </div>

      {/* Requests Tracker */}
      <div className="bg-white dark:bg-slate-900 border rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 mb-4">
          Recent Blood Requests
        </h3>

        {requests.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No requests submitted"
            description="You haven't submitted any emergency blood requests yet. Click the 'Request Blood' button to begin matching verified donors."
            action={
              <Link
                href="/attendant/new-request"
                className="bg-primary hover:bg-primary/95 text-white font-semibold py-2 px-4 rounded-lg text-sm shadow-md transition-all"
              >
                Create Request
              </Link>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
              <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-800 dark:text-slate-300">
                <tr>
                  <th scope="col" className="px-6 py-3 font-bold">Request Date</th>
                  <th scope="col" className="px-6 py-3 font-bold">Blood Group</th>
                  <th scope="col" className="px-6 py-3 font-bold">Hospital</th>
                  <th scope="col" className="px-6 py-3 font-bold">Progress</th>
                  <th scope="col" className="px-6 py-3 font-bold">Status</th>
                  <th scope="col" className="px-6 py-3 font-bold rounded-r-lg">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-slate-800">
                {requests.slice(0, 5).map((record) => (
                  <tr key={record.id} className="bg-white dark:bg-slate-900 hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-slate-100">
                      {new Date(record.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 px-2 py-0.5 rounded border border-red-100 dark:border-red-900">
                        {record.bloodGroup.replace('_POS', '+').replace('_NEG', '−')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-800 dark:text-slate-300 font-semibold">
                      {record.hospitalName}
                    </td>
                    <td className="px-6 py-4 text-slate-950 dark:text-slate-50 font-bold">
                      {record.unitsReceived} / {record.unitsNeeded} units
                    </td>
                    <td className="px-6 py-4">
                      <RequestStatusBadge status={record.status} />
                    </td>
                    <td className="px-6 py-4">
                      <Link 
                        href="/attendant/my-requests" 
                        className="text-xs font-bold text-red-600 hover:text-red-700 hover:underline transition-colors"
                      >
                        Track Status
                      </Link>
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
