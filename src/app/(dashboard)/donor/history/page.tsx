"use client";

import React, { useState, useEffect } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import { Calendar, MapPin, History, CheckCircle, Loader2 } from 'lucide-react';

interface DonationRecordItem {
  id: string;
  donatedAt: string;
  units: number;
  hospital: string;
  notes: string | null;
  request: {
    bloodGroup: string;
  };
}

export default function DonationHistoryPage() {
  const [records, setRecords] = useState<DonationRecordItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const sessionRes = await fetch('/api/auth/session');
        const session = await sessionRes.json();
        if (!session?.user?.id) return;

        // Fetch donor profile to get database profile id
        const profileRes = await fetch(`/api/donors/${session.user.id}`);
        if (profileRes.ok) {
          const donorData = await profileRes.json();
          
          // Query donor matches to extract completed donation records
          const requestsRes = await fetch('/api/requests');
          if (requestsRes.ok) {
            const requestsData = await requestsRes.json();
            const list: DonationRecordItem[] = [];

            for (const req of requestsData) {
              const detailRes = await fetch(`/api/requests/${req.id}`);
              if (detailRes.ok) {
                const detailData = await detailRes.json();
                
                // If there are matches, look for this donor's completed donations
                if (detailData.donorMatches) {
                  const myMatches = detailData.donorMatches.filter(
                    (m: any) => m.donor.id === donorData.id && m.fulfillmentStatus === 'DONATED'
                  );
                  
                  myMatches.forEach((m: any) => {
                    list.push({
                      id: m.id,
                      donatedAt: m.updatedAt, // Using match update timestamp as donation date
                      units: 1,
                      hospital: detailData.hospitalName,
                      notes: m.coordinatorNotes,
                      request: {
                        bloodGroup: detailData.bloodGroup,
                      }
                    });
                  });
                }
              }
            }
            setRecords(list);
          }
        }
      } catch (err) {
        console.error('Failed to load donation history:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
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
        title="Donation History" 
        description="A permanent log of your successful blood donations. Thank you for saving lives!"
      />

      <div className="bg-white dark:bg-slate-900 border rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 mb-4 flex items-center gap-2">
          <History className="h-5 w-5 text-red-600" />
          Your Donation Log
        </h3>

        {records.length === 0 ? (
          <EmptyState
            icon={CheckCircle}
            title="Start your saving journey!"
            description="You haven't logged any completed donations yet. When you accept an emergency match and complete the donation at the hospital, the coordinator will mark it here."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
              <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-800 dark:text-slate-300">
                <tr>
                  <th scope="col" className="px-6 py-3 font-bold rounded-l-lg">Date</th>
                  <th scope="col" className="px-6 py-3 font-bold">Hospital</th>
                  <th scope="col" className="px-6 py-3 font-bold">Blood Group</th>
                  <th scope="col" className="px-6 py-3 font-bold">Units Donated</th>
                  <th scope="col" className="px-6 py-3 font-bold rounded-r-lg">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-slate-800">
                {records.map((record) => (
                  <tr key={record.id} className="bg-white dark:bg-slate-900 hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {new Date(record.donatedAt).toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 text-slate-800 dark:text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                        {record.hospital}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 px-2 py-0.5 rounded border border-red-100 dark:border-red-900">
                        {record.request.bloodGroup.replace('_POS', '+').replace('_NEG', '−')}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-extrabold text-slate-950 dark:text-slate-50">
                      {record.units} Unit
                    </td>
                    <td className="px-6 py-4 text-xs italic text-muted-foreground">
                      {record.notes || 'No coordinator comments'}
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
